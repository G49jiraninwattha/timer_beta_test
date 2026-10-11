/**
 * Picture-in-Picture (PiP) Floating Mini-Window & Dynamic Tab Favicon Engine
 * Keeps the study timer always visible while studying across PDFs, Word, or other apps.
 */

class PipEngine {
  constructor() {
    this.pipCanvas = document.createElement('canvas');
    this.pipCanvas.width = 360;
    this.pipCanvas.height = 200;
    this.ctx = this.pipCanvas.getContext('2d');

    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.style.display = 'none';
    document.body.appendChild(this.video);

    this.stream = null;
    this.isPipActive = false;

    // Favicon canvas
    this.favCanvas = document.createElement('canvas');
    this.favCanvas.width = 32;
    this.favCanvas.height = 32;
    this.favCtx = this.favCanvas.getContext('2d');
    this.faviconLink = document.querySelector("link[rel*='icon']") || document.createElement('link');
    this.faviconLink.type = 'image/png';
    this.faviconLink.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(this.faviconLink);

    // Listen to PiP events
    this.video.addEventListener('leavepictureinpicture', () => {
      this.isPipActive = false;
      if (this.onPipToggle) this.onPipToggle(false);
    });

    this.onPipToggle = null;
  }

  isSupported() {
    return document.pictureInPictureEnabled && typeof this.pipCanvas.captureStream === 'function';
  }

  async togglePip() {
    if (!this.isSupported()) {
      alert('เบราว์เซอร์ของคุณยังไม่รองรับ Picture-in-Picture สำหรับ Canvas');
      return false;
    }

    if (this.isPipActive && document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      this.isPipActive = false;
      if (this.onPipToggle) this.onPipToggle(false);
      return false;
    } else {
      try {
        if (!this.stream) {
          this.stream = this.pipCanvas.captureStream(20); // 20 fps is smooth and light
          this.video.srcObject = this.stream;
        }
        await this.video.play();
        await this.video.requestPictureInPicture();
        this.isPipActive = true;
        if (this.onPipToggle) this.onPipToggle(true);
        return true;
      } catch (err) {
        console.warn('PiP error:', err);
        return false;
      }
    }
  }

  renderPipFrame(timerData, activeTask) {
    // 1. Always update dynamic favicon
    this.updateFavicon(timerData.progress, timerData.mode);

    // 2. Render PiP canvas if active
    if (!this.isPipActive && !this.stream) return;

    const ctx = this.ctx;
    const w = this.pipCanvas.width;
    const h = this.pipCanvas.height;

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0c0e17');
    bgGrad.addColorStop(1, '#151928');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Mode Pill Badge
    let badgeColor = '#6366f1';
    let modeText = `🍅 FOCUS • รอบที่ ${timerData.cycle}/${timerData.totalCycles}`;
    if (timerData.mode === 'shortBreak') {
      badgeColor = '#10b981';
      modeText = '☕ SHORT BREAK';
    } else if (timerData.mode === 'longBreak') {
      badgeColor = '#06b6d4';
      modeText = '🛋️ LONG BREAK';
    } else if (timerData.mode === 'flow') {
      badgeColor = '#f59e0b';
      modeText = '⏱️ FLOW STATE';
    }

    ctx.fillStyle = badgeColor;
    ctx.beginPath();
    ctx.roundRect(20, 18, 140, 26, 13);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(modeText, 90, 35);

    // Giant Timer Digits
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.shadowColor = badgeColor;
    ctx.shadowBlur = 12;
    ctx.fillText(timerData.formattedTime, 20, 102);
    ctx.shadowBlur = 0;

    // Active Task Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 13px Outfit, sans-serif';
    const taskName = activeTask ? activeTask.title : 'TEMPO Deep Work';
    const truncatedTask = taskName.length > 30 ? taskName.substring(0, 30) + '...' : taskName;
    ctx.fillText(truncatedTask, 20, 140);

    // Bottom Progress Bar
    const barY = 168;
    const barH = 8;
    const barW = w - 40;

    // Track background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(20, barY, barW, barH, 4);
    ctx.fill();

    // Fill
    const fillW = Math.max(8, barW * timerData.progress);
    const fillGrad = ctx.createLinearGradient(20, 0, 20 + fillW, 0);
    fillGrad.addColorStop(0, badgeColor);
    fillGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = fillGrad;
    ctx.beginPath();
    ctx.roundRect(20, barY, fillW, barH, 4);
    ctx.fill();
  }

  updateFavicon(progress, mode) {
    const ctx = this.favCtx;
    ctx.clearRect(0, 0, 32, 32);

    const cx = 16;
    const cy = 16;
    const r = 13;

    // Background circle
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();

    // Progress Arc Track
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Progress Arc
    let strokeColor = '#6366f1';
    if (mode === 'shortBreak') strokeColor = '#10b981';
    else if (mode === 'longBreak') strokeColor = '#06b6d4';
    else if (mode === 'flow') strokeColor = '#f59e0b';

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * progress);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.stroke();

    // Center icon
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();

    this.faviconLink.href = this.favCanvas.toDataURL('image/png');
  }
}

// Global instance
window.pipEngine = new PipEngine();
