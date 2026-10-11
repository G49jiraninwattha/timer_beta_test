/**
 * Drift-Compensated High Precision Timer Engine
 * Handles Focus, Short Break, Long Break, and Unbounded Flow (Stopwatch)
 */

class StudyTimer {
  constructor() {
    this.mode = 'pomodoro'; // 'pomodoro' | 'shortBreak' | 'longBreak' | 'flow'
    this.state = 'idle';    // 'idle' | 'running' | 'paused' | 'completed'

    // Durations in seconds
    this.durations = {
      pomodoro: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60
    };

    this.currentCycle = 1;
    this.totalCycles = 4;
    this.totalPomodorosCompleted = 0;

    // Time tracking (in seconds)
    this.remainingSeconds = this.durations.pomodoro;
    this.targetDuration = this.durations.pomodoro;
    this.flowElapsedSeconds = 0; // For stopwatch mode

    // Timestamp delta tracking to prevent tab throttling drift
    this.targetEndTime = null;
    this.intervalId = null;

    // Settings
    this.autoStartBreaks = false;
    this.autoStartPomodoros = false;
    this.tickingSoundEnabled = false;
    this.halfwayChimeEnabled = true;
    this.halfwayTriggered = false;
    this.chimeSound = 'singing_bowl'; // 'singing_bowl' | 'crystal_bell' | 'zen_gong' | 'digital_soft'

    // Callbacks
    this.callbacks = {
      onTick: null,
      onStateChange: null,
      onModeChange: null,
      onSessionComplete: null,
      onHalfwayPassed: null
    };

    // Load persisted settings
    this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('study_timer_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pomodoroDuration) this.durations.pomodoro = parsed.pomodoroDuration * 60;
        if (parsed.shortBreakDuration) this.durations.shortBreak = parsed.shortBreakDuration * 60;
        if (parsed.longBreakDuration) this.durations.longBreak = parsed.longBreakDuration * 60;
        if (parsed.totalCycles) this.totalCycles = parsed.totalCycles;
        if (parsed.autoStartBreaks !== undefined) this.autoStartBreaks = parsed.autoStartBreaks;
        if (parsed.autoStartPomodoros !== undefined) this.autoStartPomodoros = parsed.autoStartPomodoros;
        if (parsed.tickingSoundEnabled !== undefined) this.tickingSoundEnabled = parsed.tickingSoundEnabled;
        if (parsed.halfwayChimeEnabled !== undefined) this.halfwayChimeEnabled = parsed.halfwayChimeEnabled;
        if (parsed.chimeSound) this.chimeSound = parsed.chimeSound;
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }

    if (this.mode !== 'flow') {
      this.remainingSeconds = this.durations[this.mode];
      this.targetDuration = this.durations[this.mode];
    }
  }

  saveSettings(newSettings) {
    try {
      if (newSettings.pomodoroDuration) this.durations.pomodoro = newSettings.pomodoroDuration * 60;
      if (newSettings.shortBreakDuration) this.durations.shortBreak = newSettings.shortBreakDuration * 60;
      if (newSettings.longBreakDuration) this.durations.longBreak = newSettings.longBreakDuration * 60;
      if (newSettings.totalCycles) this.totalCycles = newSettings.totalCycles;
      if (newSettings.autoStartBreaks !== undefined) this.autoStartBreaks = newSettings.autoStartBreaks;
      if (newSettings.autoStartPomodoros !== undefined) this.autoStartPomodoros = newSettings.autoStartPomodoros;
      if (newSettings.tickingSoundEnabled !== undefined) this.tickingSoundEnabled = newSettings.tickingSoundEnabled;
      if (newSettings.halfwayChimeEnabled !== undefined) this.halfwayChimeEnabled = newSettings.halfwayChimeEnabled;
      if (newSettings.chimeSound) this.chimeSound = newSettings.chimeSound;

      localStorage.setItem('study_timer_settings', JSON.stringify({
        pomodoroDuration: Math.round(this.durations.pomodoro / 60),
        shortBreakDuration: Math.round(this.durations.shortBreak / 60),
        longBreakDuration: Math.round(this.durations.longBreak / 60),
        totalCycles: this.totalCycles,
        autoStartBreaks: this.autoStartBreaks,
        autoStartPomodoros: this.autoStartPomodoros,
        tickingSoundEnabled: this.tickingSoundEnabled,
        halfwayChimeEnabled: this.halfwayChimeEnabled,
        chimeSound: this.chimeSound
      }));

      // Update current remaining if idle
      if (this.state === 'idle' && this.mode !== 'flow') {
        this.remainingSeconds = this.durations[this.mode];
        this.targetDuration = this.durations[this.mode];
        this.notifyTick();
      }
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  setMode(newMode) {
    if (this.mode === newMode && this.state !== 'completed') return;
    this.stopTickInterval();
    this.mode = newMode;
    this.state = 'idle';
    this.halfwayTriggered = false;

    if (newMode === 'flow') {
      this.flowElapsedSeconds = 0;
      this.targetDuration = 0;
      this.remainingSeconds = 0;
    } else {
      this.targetDuration = this.durations[newMode];
      this.remainingSeconds = this.durations[newMode];
    }

    this.notifyModeChange();
    this.notifyStateChange();
    this.notifyTick();
  }

  start() {
    if (this.state === 'running') return;

    if (this.mode === 'flow') {
      // Flow mode counts upward
      this.flowStartTime = Date.now() - (this.flowElapsedSeconds * 1000);
    } else {
      // Countdown mode
      if (this.remainingSeconds <= 0) {
        this.remainingSeconds = this.durations[this.mode];
        this.targetDuration = this.durations[this.mode];
      }
      this.targetEndTime = Date.now() + (this.remainingSeconds * 1000);
    }

    this.state = 'running';
    this.startTickInterval();
    this.notifyStateChange();
  }

  pause() {
    if (this.state !== 'running') return;
    this.stopTickInterval();
    this.state = 'paused';

    if (this.mode === 'flow') {
      this.flowElapsedSeconds = Math.floor((Date.now() - this.flowStartTime) / 1000);
    } else {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((this.targetEndTime - now) / 1000));
      this.remainingSeconds = left;
    }

    this.notifyStateChange();
    this.notifyTick();
  }

  reset() {
    this.stopTickInterval();
    this.state = 'idle';
    this.halfwayTriggered = false;

    if (this.mode === 'flow') {
      this.flowElapsedSeconds = 0;
      this.remainingSeconds = 0;
    } else {
      this.remainingSeconds = this.durations[this.mode];
      this.targetDuration = this.durations[this.mode];
    }

    this.notifyStateChange();
    this.notifyTick();
  }

  skip() {
    this.stopTickInterval();
    this.handleCycleProgression(true);
  }

  addTime(seconds = 300) {
    if (this.mode === 'flow') return;
    this.remainingSeconds += seconds;
    this.targetDuration += seconds;
    if (this.state === 'running') {
      this.targetEndTime += (seconds * 1000);
    }
    this.notifyTick();
  }

  startTickInterval() {
    this.stopTickInterval();
    this.intervalId = setInterval(() => {
      this.tick();
    }, 250); // High frequency check ensures zero drift
  }

  stopTickInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  tick() {
    if (this.state !== 'running') return;

    if (this.mode === 'flow') {
      const elapsed = Math.floor((Date.now() - this.flowStartTime) / 1000);
      if (elapsed !== this.flowElapsedSeconds) {
        this.flowElapsedSeconds = elapsed;
        this.remainingSeconds = elapsed;
        if (this.tickingSoundEnabled && window.soundEngine) {
          window.soundEngine.playSoftTick();
        }
        this.notifyTick();
      }
      return;
    }

    const now = Date.now();
    const diff = Math.max(0, Math.ceil((this.targetEndTime - now) / 1000));

    if (diff !== this.remainingSeconds) {
      this.remainingSeconds = diff;

      // Halfway Milestone Check (at 50% time elapsed)
      if (this.mode === 'pomodoro' && !this.halfwayTriggered && this.targetDuration >= 120) {
        const halfPoint = Math.floor(this.targetDuration / 2);
        if (this.remainingSeconds <= halfPoint) {
          this.halfwayTriggered = true;
          if (this.halfwayChimeEnabled && window.soundEngine) {
            window.soundEngine.playChime('digital_soft');
          }
          if (this.callbacks.onHalfwayPassed) {
            this.callbacks.onHalfwayPassed();
          }
        }
      }

      if (this.tickingSoundEnabled && this.remainingSeconds > 0 && window.soundEngine) {
        window.soundEngine.playSoftTick();
      }
      this.notifyTick();
    }

    if (this.remainingSeconds <= 0) {
      this.completeSession();
    }
  }

  completeSession() {
    this.stopTickInterval();
    this.state = 'completed';

    // Play soothing chime
    if (window.soundEngine) {
      window.soundEngine.playChime(this.chimeSound);
    }

    // Trigger notification
    this.sendNotification();

    // Trigger complete callback
    if (this.callbacks.onSessionComplete) {
      this.callbacks.onSessionComplete({
        mode: this.mode,
        duration: this.targetDuration,
        cycle: this.currentCycle
      });
    }

    this.notifyStateChange();
    this.handleCycleProgression(false);
  }

  handleCycleProgression(wasSkipped = false) {
    if (this.mode === 'pomodoro') {
      if (!wasSkipped) {
        this.totalPomodorosCompleted++;
      }

      if (this.currentCycle >= this.totalCycles) {
        // Move to Long Break
        this.currentCycle = 1;
        this.setMode('longBreak');
      } else {
        // Move to Short Break
        this.currentCycle++;
        this.setMode('shortBreak');
      }

      if (this.autoStartBreaks && !wasSkipped) {
        setTimeout(() => this.start(), 1000);
      }
    } else if (this.mode === 'shortBreak' || this.mode === 'longBreak') {
      // Break finished, go back to Focus
      this.setMode('pomodoro');
      if (this.autoStartPomodoros && !wasSkipped) {
        setTimeout(() => this.start(), 1000);
      }
    }
  }

  sendNotification() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      let title = '🎉 Focus Session Complete!';
      let body = 'Great job! Time to take a short, refreshing break.';
      if (this.mode === 'shortBreak' || this.mode === 'longBreak') {
        title = '⚡ Break Finished!';
        body = 'Ready to dive back into deep focus mode?';
      }

      try {
        new Notification(title, {
          body,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%236366f1"/><text x="50" y="65" font-size="50" text-anchor="middle" fill="white">🍅</text></svg>'
        });
      } catch (e) {
        console.warn('Notification error:', e);
      }
    }
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // --- Helpers for Display ---

  getFormattedTime() {
    const totalSecs = this.remainingSeconds;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  getProgressFraction() {
    if (this.mode === 'flow') {
      // Cyclic 1-hour visual progress
      return (this.flowElapsedSeconds % 3600) / 3600;
    }
    if (this.targetDuration <= 0) return 0;
    const progress = (this.targetDuration - this.remainingSeconds) / this.targetDuration;
    return Math.max(0, Math.min(1, progress));
  }

  notifyTick() {
    if (this.callbacks.onTick) {
      this.callbacks.onTick({
        formattedTime: this.getFormattedTime(),
        remainingSeconds: this.remainingSeconds,
        targetDuration: this.targetDuration,
        progress: this.getProgressFraction(),
        mode: this.mode,
        cycle: this.currentCycle,
        totalCycles: this.totalCycles
      });
    }
  }

  notifyStateChange() {
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.state);
    }
  }

  notifyModeChange() {
    if (this.callbacks.onModeChange) {
      this.callbacks.onModeChange(this.mode);
    }
  }
}

// Global instance
window.studyTimer = new StudyTimer();
