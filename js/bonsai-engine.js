/**
 * The Zen Bonsai Engine (Study Companion & Visual Growth Gamification)
 * Generates an aesthetic Japanese Zen Bonsai that sprouts, grows branches,
 * and blooms with sakura blossoms as the user completes study sessions today.
 */

class BonsaiEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.level = 0; // 0 to 4+
    this.dailyGoal = 4;
    this.petals = [];
    this.animFrame = null;
  }

  setLevel(completedPomodoros, dailyGoal = 4) {
    this.level = Math.max(0, completedPomodoros);
    this.dailyGoal = Math.max(1, dailyGoal);
    this.render();
  }

  render() {
    if (!this.container) return;

    const lvl = Math.min(4, this.level);
    const isBlooming = this.level >= this.dailyGoal;

    // Growth state text
    const growthStages = [
      '🌱 เพิ่งเริ่มวันใหม่ (กล้าอ่อนกำลังตั้งตัว)',
      '🌿 กิ่งแรกผลิใบ (สมาธิเริ่มหยั่งราก)',
      '🪴 ลำต้นแตกกิ่งก้าน (เข้าสู่ความลื่นไหล)',
      '🌸 พุ่มใบแน่นหนา ดอกตูมเริ่มแต้มสี',
      '✨ ดอกซากุระบานสะพรั่งเต็มต้น! บรรลุเป้าหมายสำเร็จ 🎉'
    ];
    const statusText = growthStages[lvl] || growthStages[4];

    // Trunk opacity & branches based on level
    const trunkColor = '#8b5a2b';
    const trunkGrad = 'url(#bonsaiTrunkGrad)';

    // Foliage opacity
    const f1Opacity = lvl >= 1 ? 1 : 0.15;
    const f2Opacity = lvl >= 2 ? 1 : 0;
    const f3Opacity = lvl >= 3 ? 1 : 0;
    const f4Opacity = lvl >= 4 ? 1 : 0;

    // Blossoms visibility
    const bloomOpacity = isBlooming ? 1 : (lvl >= 3 ? 0.4 : 0);

    const svg = `
      <svg class="bonsai-svg" viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bonsaiTrunkGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#4a2f13" />
            <stop offset="100%" stop-color="#8a5a36" />
          </linearGradient>

          <linearGradient id="foliageGrad1" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#14532d" />
            <stop offset="100%" stop-color="#22c55e" />
          </linearGradient>

          <linearGradient id="foliageGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#166534" />
            <stop offset="100%" stop-color="#4ade80" />
          </linearGradient>

          <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e2235" />
            <stop offset="100%" stop-color="#111420" />
          </linearGradient>

          <radialGradient id="blossomGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#f472b6" stop-opacity="0.9" />
            <stop offset="60%" stop-color="#ec4899" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#db2777" stop-opacity="0" />
          </radialGradient>

          <filter id="zenGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Pot Stand & Ceramic Pot -->
        <g id="bonsaiPot">
          <!-- Shadow -->
          <ellipse cx="140" cy="172" rx="72" ry="6" fill="rgba(0,0,0,0.4)" />
          <!-- Stand legs -->
          <rect x="88" y="166" width="14" height="4" rx="2" fill="#2d334a" />
          <rect x="178" y="166" width="14" height="4" rx="2" fill="#2d334a" />
          <!-- Pot body -->
          <path d="M 75 152 L 205 152 L 195 167 L 85 167 Z" fill="url(#potGrad)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
          <!-- Pot rim -->
          <rect x="70" y="148" width="140" height="5" rx="2.5" fill="#2a3047" stroke="rgba(255,255,255,0.18)" stroke-width="1" />
          <!-- Soil / Moss -->
          <ellipse cx="140" cy="151" rx="60" ry="4" fill="#1b4329" />
          <ellipse cx="140" cy="150" rx="48" ry="3" fill="#22c55e" opacity="0.6" />
        </g>

        <!-- Bonsai Tree Trunk & Branches -->
        <g id="bonsaiTree">
          <!-- Main curved trunk -->
          <path d="M 138 150 Q 148 128 135 110 T 115 80 Q 110 65 125 50" 
                fill="none" stroke="${trunkGrad}" stroke-width="${lvl >= 1 ? 8 : 4}" stroke-linecap="round" />

          <!-- Branch 1 (Right) -->
          ${lvl >= 1 ? `
            <path d="M 135 112 Q 165 105 180 92" 
                  fill="none" stroke="${trunkGrad}" stroke-width="5" stroke-linecap="round" />
          ` : ''}

          <!-- Branch 2 (Left Low) -->
          ${lvl >= 2 ? `
            <path d="M 125 90 Q 95 86 80 75" 
                  fill="none" stroke="${trunkGrad}" stroke-width="4.5" stroke-linecap="round" />
          ` : ''}

          <!-- Branch 3 (Right High) -->
          ${lvl >= 3 ? `
            <path d="M 118 72 Q 148 60 162 48" 
                  fill="none" stroke="${trunkGrad}" stroke-width="3.5" stroke-linecap="round" />
          ` : ''}

          <!-- Crown Branch -->
          ${lvl >= 1 ? `
            <path d="M 125 50 Q 120 38 130 28" 
                  fill="none" stroke="${trunkGrad}" stroke-width="3" stroke-linecap="round" />
          ` : ''}
        </g>

        <!-- Foliage Clusters (Lush Clouds) -->
        <g id="bonsaiFoliage">
          <!-- Cluster 1: Right Branch -->
          <g opacity="${f1Opacity}" style="transition: opacity 0.5s ease;">
            <circle cx="180" cy="90" r="16" fill="url(#foliageGrad1)" />
            <circle cx="192" cy="85" r="13" fill="url(#foliageGrad2)" />
            <circle cx="170" cy="86" r="12" fill="url(#foliageGrad1)" />
            <circle cx="184" cy="78" r="11" fill="url(#foliageGrad2)" />
          </g>

          <!-- Cluster 2: Left Branch -->
          <g opacity="${f2Opacity}" style="transition: opacity 0.5s ease;">
            <circle cx="80" cy="72" r="15" fill="url(#foliageGrad1)" />
            <circle cx="68" cy="68" r="12" fill="url(#foliageGrad2)" />
            <circle cx="90" cy="67" r="12" fill="url(#foliageGrad1)" />
            <circle cx="78" cy="60" r="11" fill="url(#foliageGrad2)" />
          </g>

          <!-- Cluster 3: High Right -->
          <g opacity="${f3Opacity}" style="transition: opacity 0.5s ease;">
            <circle cx="162" cy="46" r="15" fill="url(#foliageGrad1)" />
            <circle cx="174" cy="42" r="12" fill="url(#foliageGrad2)" />
            <circle cx="152" cy="42" r="11" fill="url(#foliageGrad1)" />
            <circle cx="164" cy="35" r="11" fill="url(#foliageGrad2)" />
          </g>

          <!-- Cluster 4: Crown -->
          <g opacity="${f4Opacity}" style="transition: opacity 0.5s ease;">
            <circle cx="130" cy="26" r="18" fill="url(#foliageGrad1)" />
            <circle cx="116" cy="22" r="14" fill="url(#foliageGrad2)" />
            <circle cx="144" cy="22" r="14" fill="url(#foliageGrad2)" />
            <circle cx="130" cy="14" r="13" fill="url(#foliageGrad1)" />
          </g>
        </g>

        <!-- Sakura Blooms & Glowing Aura (Appears as sessions increase) -->
        <g id="bonsaiBlooms" opacity="${bloomOpacity}" style="transition: opacity 0.6s ease;" filter="${isBlooming ? 'url(#zenGlow)' : ''}">
          <!-- Blossom Petals -->
          <circle cx="182" cy="82" r="5" fill="#f472b6" />
          <circle cx="194" cy="80" r="4.5" fill="#fb7185" />
          <circle cx="172" cy="88" r="4" fill="#f472b6" />

          <circle cx="78" cy="66" r="5" fill="#f472b6" />
          <circle cx="66" cy="64" r="4.5" fill="#fb7185" />
          <circle cx="86" cy="62" r="4" fill="#f472b6" />

          <circle cx="164" cy="40" r="5.5" fill="#fb7185" />
          <circle cx="174" cy="38" r="4.5" fill="#f472b6" />

          <circle cx="130" cy="20" r="6" fill="#f472b6" />
          <circle cx="118" cy="18" r="5" fill="#fb7185" />
          <circle cx="142" cy="18" r="5" fill="#f472b6" />
          <circle cx="130" cy="10" r="4.5" fill="#fb7185" />

          <!-- Center Pistil Gold Dots -->
          <circle cx="182" cy="82" r="1.5" fill="#fef08a" />
          <circle cx="78" cy="66" r="1.5" fill="#fef08a" />
          <circle cx="164" cy="40" r="1.5" fill="#fef08a" />
          <circle cx="130" cy="20" r="1.8" fill="#fef08a" />
        </g>
      </svg>
      <div class="bonsai-caption">
        <span class="bonsai-badge">🪴 FOCUS BONSAI</span>
        <span class="bonsai-status">${statusText}</span>
      </div>
    `;

    this.container.innerHTML = svg;
  }
}

// Global instance
window.bonsaiEngine = new BonsaiEngine('bonsaiGardenWidget');
