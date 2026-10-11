/**
 * Ambient Visual Engine & Canvas Effects
 * Provides relaxing dynamic atmospheres (Cosmos, Rain, Dust Motes, Breathing Aura, Confetti)
 */

class VisualEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.mode = 'dust'; // 'dust' | 'stars' | 'rain' | 'breathing' | 'none'
    this.particles = [];
    this.confetti = [];
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.animationFrame = null;
    this.isTabActive = true;

    // Breathing circle state (4s in, 4s out)
    this.breathCycle = 0;

    this.init();
  }

  init() {
    if (!this.canvas) return;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    document.addEventListener('visibilitychange', () => {
      this.isTabActive = !document.hidden;
      if (this.isTabActive && !this.animationFrame) {
        this.loop();
      }
    });

    this.initParticles();
    this.loop();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
    this.initParticles();
  }

  setVisualMode(mode) {
    this.mode = mode;
    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    const count = this.mode === 'rain' ? 90 : (this.mode === 'stars' ? 80 : 45);

    for (let i = 0; i < count; i++) {
      if (this.mode === 'dust') {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 2.2 + 0.8,
          alpha: Math.random() * 0.45 + 0.15,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -Math.random() * 0.35 - 0.1,
          hue: Math.random() * 40 + 20 // warm golden dust
        });
      } else if (this.mode === 'stars') {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.7 + 0.2,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          twinkleVal: Math.random() * Math.PI
        });
      } else if (this.mode === 'rain') {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          len: Math.random() * 20 + 10,
          vy: Math.random() * 7 + 9,
          alpha: Math.random() * 0.35 + 0.1
        });
      }
    }
  }

  triggerConfetti(x = this.width / 2, y = this.height / 2) {
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 4;
      this.confetti.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        life: 0
      });
    }
  }

  loop() {
    if (!this.isTabActive) {
      this.animationFrame = null;
      return;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.mode !== 'none') {
      this.renderAtmosphere();
    }

    if (this.confetti.length > 0) {
      this.renderConfetti();
    }

    this.animationFrame = requestAnimationFrame(() => this.loop());
  }

  renderAtmosphere() {
    const ctx = this.ctx;

    if (this.mode === 'dust') {
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) { p.y = this.height + 10; p.x = Math.random() * this.width; }
        if (p.x < -10) p.x = this.width + 10;
        if (p.x > this.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(${p.hue}, 80%, 75%, 0.4)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    } else if (this.mode === 'stars') {
      this.particles.forEach(p => {
        p.twinkleVal += p.twinkleSpeed;
        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.twinkleVal));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.fill();
      });
    } else if (this.mode === 'rain') {
      ctx.strokeStyle = 'rgba(165, 210, 255, 0.28)';
      ctx.lineWidth = 1.2;
      this.particles.forEach(p => {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 2, p.y + p.len);
        ctx.stroke();

        p.y += p.vy;
        p.x -= 0.5;

        if (p.y > this.height) {
          p.y = -20;
          p.x = Math.random() * this.width;
        }
      });
    } else if (this.mode === 'breathing') {
      // 8-second breathing loop: 4s inhale, 4s exhale
      this.breathCycle = (this.breathCycle + 0.015) % (Math.PI * 2);
      const breathProgress = (Math.sin(this.breathCycle) + 1) / 2; // 0 to 1
      const minRadius = Math.min(this.width, this.height) * 0.16;
      const maxRadius = Math.min(this.width, this.height) * 0.28;
      const radius = minRadius + (maxRadius - minRadius) * breathProgress;

      const cx = this.width / 2;
      const cy = this.height / 2;

      // Outer aura ring
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius * 1.35);
      grad.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
      grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.04)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Subtle guideline stroke
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.12 + breathProgress * 0.18})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  renderConfetti() {
    const ctx = this.ctx;
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.35; // gravity
      c.rotation += c.rotSpeed;
      c.alpha -= 0.018;

      if (c.alpha <= 0 || c.y > this.height) {
        this.confetti.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate((c.rotation * Math.PI) / 180);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = Math.max(0, c.alpha);
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
      ctx.restore();
    }
  }
}

// Global instance helper
window.VisualEngine = VisualEngine;
