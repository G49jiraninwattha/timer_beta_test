/**
 * Procedural Web Audio API Sound Engine for Study Timer
 * Zero external dependencies, 100% offline, crystal clear audio.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.soundscapes = {};
    this.isMuted = false;
    this.masterVolume = 0.7;

    // Default soundscape volumes
    this.volumes = {
      rain: 0,
      campfire: 0,
      wind: 0,
      waves: 0,
      binaural: 0,
      brownNoise: 0,
      cafe: 0,
      vinyl: 0,
      lofiChords: 0
    };

    // Pre-allocated noise buffers
    this.buffers = {};
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.generateNoiseBuffers();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  generateNoiseBuffers() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const duration = 5; // 5 seconds loopable
    const frameCount = sampleRate * duration;

    // 1. White Noise
    const whiteBuffer = this.ctx.createBuffer(1, frameCount, sampleRate);
    const whiteData = whiteBuffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      whiteData[i] = Math.random() * 2 - 1;
    }
    this.buffers.white = whiteBuffer;

    // 2. Pink Noise (Paul Kellet's filtered white noise algorithm)
    const pinkBuffer = this.ctx.createBuffer(2, frameCount, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const pinkData = pinkBuffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < frameCount; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    this.buffers.pink = pinkBuffer;

    // 3. Brown / Brownian Noise
    const brownBuffer = this.ctx.createBuffer(2, frameCount, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const brownData = brownBuffer.getChannelData(ch);
      let lastOut = 0.0;
      for (let i = 0; i < frameCount; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        brownData[i] = lastOut * 3.5;
      }
    }
    this.buffers.brown = brownBuffer;

    // 4. Fire Crackle Buffer (sparse impulsive clicks)
    const crackleBuffer = this.ctx.createBuffer(2, frameCount, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const cData = crackleBuffer.getChannelData(ch);
      for (let i = 0; i < frameCount; i++) {
        // Random sparse impulse
        if (Math.random() < 0.00045) {
          cData[i] = (Math.random() * 2 - 1) * 0.8;
          // small damping tail
          if (i + 1 < frameCount) cData[i+1] = cData[i] * -0.5;
          if (i + 2 < frameCount) cData[i+2] = cData[i] * 0.25;
        } else {
          cData[i] = 0;
        }
      }
    }
    this.buffers.crackle = crackleBuffer;
  }

  // --- Ambient Soundscapes ---

  setSoundscapeVolume(type, volume) {
    this.ensureContext();
    this.volumes[type] = Math.max(0, Math.min(1, volume));

    if (this.volumes[type] > 0) {
      if (!this.soundscapes[type]) {
        this.startSoundscape(type);
      }
      if (this.soundscapes[type] && this.soundscapes[type].gainNode) {
        this.soundscapes[type].gainNode.gain.setTargetAtTime(
          this.volumes[type],
          this.ctx.currentTime,
          0.05
        );
      }
    } else {
      if (this.soundscapes[type]) {
        this.stopSoundscape(type);
      }
    }
  }

  startSoundscape(type) {
    if (!this.ctx) return;
    if (this.soundscapes[type]) return; // already active

    const t = this.ctx.currentTime;

    switch (type) {
      case 'rain': {
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffers.pink;
        src.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t);

        const highpass = this.ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(450, t);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.setTargetAtTime(this.volumes.rain, t, 0.1);

        src.connect(highpass);
        highpass.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        src.start();
        this.soundscapes.rain = { src, gainNode, filter, highpass };
        break;
      }

      case 'campfire': {
        // Base low rumble (burning wood)
        const srcRumble = this.ctx.createBufferSource();
        srcRumble.buffer = this.buffers.brown;
        srcRumble.loop = true;

        const rumbleFilter = this.ctx.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.setValueAtTime(320, t);

        const rumbleGain = this.ctx.createGain();
        rumbleGain.gain.setValueAtTime(0.35, t);

        srcRumble.connect(rumbleFilter);
        rumbleFilter.connect(rumbleGain);

        // Crackles
        const srcCrackle = this.ctx.createBufferSource();
        srcCrackle.buffer = this.buffers.crackle;
        srcCrackle.loop = true;

        const crackleFilter = this.ctx.createBiquadFilter();
        crackleFilter.type = 'bandpass';
        crackleFilter.frequency.setValueAtTime(2500, t);
        crackleFilter.Q.setValueAtTime(3, t);

        const crackleGain = this.ctx.createGain();
        crackleGain.gain.setValueAtTime(0.85, t);

        srcCrackle.connect(crackleFilter);
        crackleFilter.connect(crackleGain);

        // Combined gain
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.setTargetAtTime(this.volumes.campfire, t, 0.1);

        rumbleGain.connect(gainNode);
        crackleGain.connect(gainNode);
        gainNode.connect(this.masterGain);

        srcRumble.start();
        srcCrackle.start();

        this.soundscapes.campfire = {
          sources: [srcRumble, srcCrackle],
          gainNode
        };
        break;
      }

      case 'wind': {
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffers.pink;
        src.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, t);
        filter.Q.setValueAtTime(2.5, t);

        // LFO for swaying wind breeze
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.12, t); // gentle swell every 8s

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(280, t); // swing +/- 280Hz
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.setTargetAtTime(this.volumes.wind, t, 0.1);

        src.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        src.start();
        lfo.start();

        this.soundscapes.wind = { src, lfo, gainNode };
        break;
      }

      case 'waves': {
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffers.pink;
        src.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, t);

        // Swell gain modulated by slow LFO
        const swellGain = this.ctx.createGain();
        swellGain.gain.setValueAtTime(0.5, t);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.08, t); // ~12 second wave cycle

        const lfoAmp = this.ctx.createGain();
        lfoAmp.gain.setValueAtTime(0.4, t);
        lfo.connect(lfoAmp);
        lfoAmp.connect(swellGain.gain);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.setTargetAtTime(this.volumes.waves, t, 0.1);

        src.connect(filter);
        filter.connect(swellGain);
        swellGain.connect(gainNode);
        gainNode.connect(this.masterGain);

        src.start();
        lfo.start();

        this.soundscapes.waves = { src, lfo, gainNode };
        break;
      }

      case 'binaural': {
        // Gamma 40Hz focus frequency: Left ear 200Hz, Right ear 240Hz
        const baseFreq = 216;
        const beatOffset = 40; // 40Hz gamma focus state

        const merger = this.ctx.createChannelMerger(2);

        const oscL = this.ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(baseFreq, t);

        const oscR = this.ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(baseFreq + beatOffset, t);

        const gainL = this.ctx.createGain();
        gainL.gain.setValueAtTime(0.2, t);
        const gainR = this.ctx.createGain();
        gainR.gain.setValueAtTime(0.2, t);

        oscL.connect(gainL);
        gainL.connect(merger, 0, 0); // left channel

        oscR.connect(gainR);
        gainR.connect(merger, 0, 1); // right channel

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.setTargetAtTime(this.volumes.binaural, t, 0.1);

        merger.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscL.start();
        oscR.start();

        this.soundscapes.binaural = { oscL, oscR, gainNode };
        break;
      }

      case 'brownNoise': {
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffers.brown;
        src.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, t);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.setTargetAtTime(this.volumes.brownNoise, t, 0.1);

        src.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        src.start();
        this.soundscapes.brownNoise = { src, gainNode };
        break;
      }

      case 'cafe': {
        // Warm murmur: pink noise filtered with gentle resonance + low rumble
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffers.pink;
        src.loop = true;

        const filter1 = this.ctx.createBiquadFilter();
        filter1.type = 'bandpass';
        filter1.frequency.setValueAtTime(550, t);
        filter1.Q.setValueAtTime(1.2, t);

        const filter2 = this.ctx.createBiquadFilter();
        filter2.type = 'lowpass';
        filter2.frequency.setValueAtTime(1200, t);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.setTargetAtTime(this.volumes.cafe, t, 0.1);

        src.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(gainNode);
        gainNode.connect(this.masterGain);

        src.start();
        this.soundscapes.cafe = { src, gainNode };
        break;
      }

      case 'vinyl': {
        // 1. Surface noise / hiss
        const srcHiss = this.ctx.createBufferSource();
        srcHiss.buffer = this.buffers.pink;
        srcHiss.loop = true;

        const hissFilter = this.ctx.createBiquadFilter();
        hissFilter.type = 'highpass';
        hissFilter.frequency.setValueAtTime(2200, t);

        const hissGain = this.ctx.createGain();
        hissGain.gain.setValueAtTime(0.25, t);
        srcHiss.connect(hissFilter);
        hissFilter.connect(hissGain);

        // 2. Vinyl crackles / pops
        const srcPops = this.ctx.createBufferSource();
        srcPops.buffer = this.buffers.crackle;
        srcPops.loop = true;

        const popFilter = this.ctx.createBiquadFilter();
        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(3200, t);
        popFilter.Q.setValueAtTime(2.5, t);

        const popGain = this.ctx.createGain();
        popGain.gain.setValueAtTime(0.7, t);
        srcPops.connect(popFilter);
        popFilter.connect(popGain);

        // 3. Turntable motor hum (50Hz)
        const humOsc = this.ctx.createOscillator();
        humOsc.type = 'sine';
        humOsc.frequency.setValueAtTime(50, t);

        const humGain = this.ctx.createGain();
        humGain.gain.setValueAtTime(0.08, t);
        humOsc.connect(humGain);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.setTargetAtTime(this.volumes.vinyl, t, 0.1);

        hissGain.connect(gainNode);
        popGain.connect(gainNode);
        humGain.connect(gainNode);
        gainNode.connect(this.masterGain);

        srcHiss.start();
        srcPops.start();
        humOsc.start();

        this.soundscapes.vinyl = {
          sources: [srcHiss, srcPops, humOsc],
          gainNode
        };
        break;
      }

      case 'lofiChords': {
        // Procedural Lo-Fi Electric Piano (Rhodes) ambient chords
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.setTargetAtTime(this.volumes.lofiChords, t, 0.1);
        gainNode.connect(this.masterGain);

        const chords = [
          [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
          [98.00, 174.61, 246.94, 329.63],          // G13
          [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
          [110.00, 196.00, 261.63, 329.63]          // Am9
        ];
        let chordIdx = 0;
        const activeOscs = [];

        const playNextChord = () => {
          if (!this.soundscapes.lofiChords) return;
          const now = this.ctx.currentTime;
          const chord = chords[chordIdx];
          chordIdx = (chordIdx + 1) % chords.length;

          chord.forEach((freq, i) => {
            const noteStart = now + (i * 0.08); // gentle arpeggio spread
            const noteDuration = 5.2;

            // Warm sine + subtle octave harmonic
            const osc1 = this.ctx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(freq, noteStart);

            const osc2 = this.ctx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(freq, noteStart);

            const noteGain = this.ctx.createGain();
            noteGain.gain.setValueAtTime(0.001, noteStart);
            noteGain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.1);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteDuration);

            // Warm lowpass filter for lo-fi character
            const noteFilter = this.ctx.createBiquadFilter();
            noteFilter.type = 'lowpass';
            noteFilter.frequency.setValueAtTime(750, noteStart);

            osc1.connect(noteFilter);
            osc2.connect(noteFilter);
            noteFilter.connect(noteGain);
            noteGain.connect(gainNode);

            osc1.start(noteStart);
            osc2.start(noteStart);
            osc1.stop(noteStart + noteDuration + 0.1);
            osc2.stop(noteStart + noteDuration + 0.1);

            activeOscs.push(osc1, osc2);
          });
        };

        // Play initial chord immediately, then every 6.5s
        playNextChord();
        const chordTimer = setInterval(playNextChord, 6500);

        this.soundscapes.lofiChords = {
          gainNode,
          chordTimer,
          activeOscs
        };
        break;
      }
    }
  }

  stopSoundscape(type) {
    const sc = this.soundscapes[type];
    if (!sc) return;

    if (sc.chordTimer) {
      clearInterval(sc.chordTimer);
    }

    if (sc.gainNode && this.ctx) {
      sc.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      setTimeout(() => {
        try {
          if (sc.src) sc.src.stop();
          if (sc.lfo) sc.lfo.stop();
          if (sc.oscL) sc.oscL.stop();
          if (sc.oscR) sc.oscR.stop();
          if (sc.sources) sc.sources.forEach(s => s.stop());
          if (sc.activeOscs) sc.activeOscs.forEach(o => { try { o.stop(); } catch(e){} });
        } catch (e) {
          // ignore already stopped
        }
        delete this.soundscapes[type];
      }, 200);
    } else {
      delete this.soundscapes[type];
    }
  }

  stopAllSoundscapes() {
    for (const key of Object.keys(this.soundscapes)) {
      this.stopSoundscape(key);
      this.volumes[key] = 0;
    }
  }

  // --- Sound Effects & Chimes ---

  playChime(type = 'singing_bowl') {
    this.ensureContext();
    if (this.isMuted) return;

    const t = this.ctx.currentTime;

    switch (type) {
      case 'singing_bowl': {
        // Tibetan Singing Bowl with rich resonant harmonics (528 Hz Solfeggio Love/Focus Tone)
        const fundamental = 528;
        const harmonics = [
          { freq: fundamental * 1.0, gain: 0.5, decay: 4.8 },
          { freq: fundamental * 2.76, gain: 0.22, decay: 3.8 },
          { freq: fundamental * 5.40, gain: 0.08, decay: 2.5 },
          { freq: fundamental * 8.92, gain: 0.03, decay: 1.5 }
        ];

        harmonics.forEach(h => {
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator(); // slight detune for shimmering beating
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(h.freq, t);
          osc2.frequency.setValueAtTime(h.freq + 0.8, t);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.exponentialRampToValueAtTime(h.gain * this.masterVolume, t + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + h.decay);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.masterGain);

          osc1.start(t);
          osc2.start(t);
          osc1.stop(t + h.decay + 0.1);
          osc2.stop(t + h.decay + 0.1);
        });
        break;
      }

      case 'crystal_bell': {
        // Bright clear bell
        const freqs = [880, 1760, 2640];
        freqs.forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, t);

          const gain = this.ctx.createGain();
          const vol = (0.4 / (idx + 1)) * this.masterVolume;
          gain.gain.setValueAtTime(vol, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);

          osc.connect(gain);
          gain.connect(this.masterGain);

          osc.start(t);
          osc.stop(t + 2.3);
        });
        break;
      }

      case 'zen_gong': {
        // Deep resonant bass gong
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(95, t + 3.0);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.6 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 4.0);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 4.1);
        break;
      }

      case 'digital_soft': {
        // Gentle double marimba blip
        [660, 880].forEach((freq, idx) => {
          const startT = t + (idx * 0.12);
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startT);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.3 * this.masterVolume, startT);
          gain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.4);

          osc.connect(gain);
          gain.connect(this.masterGain);

          osc.start(startT);
          osc.stop(startT + 0.45);
        });
        break;
      }
    }
  }

  // Soft wooden tick for countdown (optional)
  playSoftTick() {
    this.ensureContext();
    if (this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.015);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.02);
  }

  // Task completed celebratory pop sound
  playSuccessPop() {
    this.ensureContext();
    if (this.isMuted) return;

    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const startT = t + i * 0.06;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startT);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25 * this.masterVolume, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startT);
      osc.stop(startT + 0.25);
    });
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

// Global instance
window.soundEngine = new SoundEngine();
