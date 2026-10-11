/**
 * Main Application Controller (TEMPO // Study OS)
 * Handles UI interactions, keyboard shortcuts, modals, and synchronizing modules.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Visual Engine
  const canvas = document.getElementById('ambientCanvas');
  const visualEngine = new VisualEngine(canvas);

  // 2. DOM Elements
  const themeSelect = document.getElementById('themeSelect');
  const visualModeSelect = document.getElementById('visualModeSelect');
  const clockStyleSelect = document.getElementById('clockStyleSelect');
  const toggleHalfwayChime = document.getElementById('toggleHalfwayChime');

  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnPlayPauseText = document.getElementById('btnPlayPauseText');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const btnSkip = document.getElementById('btnSkip');
  const btnReset = document.getElementById('btnReset');
  const btnAddFive = document.getElementById('btnAddFive');

  const timerDigits = document.getElementById('timerDigits');
  const timerCycleStatus = document.getElementById('timerCycleStatus');
  const timerProgressCircle = document.getElementById('timerProgressCircle');
  const modeTabs = document.querySelectorAll('.mode-tab');

  const activeTaskBanner = document.getElementById('activeTaskBanner');
  const activeTaskTitleText = document.getElementById('activeTaskTitleText');
  const activeTaskPomBadge = document.getElementById('activeTaskPomBadge');

  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const taskEstSelect = document.getElementById('taskEstSelect');
  const taskList = document.getElementById('taskList');
  const taskCountText = document.getElementById('taskCountText');

  const brainDumpNote = document.getElementById('brainDumpNote');

  // Stats in Sidebar
  const statTodayTime = document.getElementById('statTodayTime');
  const statTodayPoms = document.getElementById('statTodayPoms');
  const statStreakDays = document.getElementById('statStreakDays');
  const goalText = document.getElementById('goalText');
  const goalPercentText = document.getElementById('goalPercentText');
  const goalBarFill = document.getElementById('goalBarFill');

  // Break Coach Card
  const breakCoachCard = document.getElementById('breakCoachCard');
  const breakCoachText = document.getElementById('breakCoachText');
  const btnShuffleBreak = document.getElementById('btnShuffleBreak');

  // Picture-in-Picture Trigger
  const btnPip = document.getElementById('btnPip');

  // Sound Mixer Drawer
  const btnSoundMixer = document.getElementById('btnSoundMixer');
  const ambientMixerDrawer = document.getElementById('ambientMixerDrawer');
  const btnCloseMixer = document.getElementById('btnCloseMixer');
  const soundBadge = document.getElementById('soundBadge');
  const soundSliders = document.querySelectorAll('.sound-slider[data-sound]');
  const masterVolumeSlider = document.getElementById('masterVolumeSlider');
  const presetChips = document.querySelectorAll('.chip-btn[data-preset]');

  // Modals
  const btnSettings = document.getElementById('btnSettings');
  const settingsModal = document.getElementById('settingsModal');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const btnTestChime = document.getElementById('btnTestChime');
  const btnReqNotify = document.getElementById('btnReqNotify');

  const btnStats = document.getElementById('btnStats');
  const statsModal = document.getElementById('statsModal');
  const btnCloseStats = document.getElementById('btnCloseStats');
  const weeklyChartCanvas = document.getElementById('weeklyChartCanvas');
  const sessionHistoryList = document.getElementById('sessionHistoryList');
  const btnExportData = document.getElementById('btnExportData');
  const btnClearStats = document.getElementById('btnClearStats');

  // Zen Mode
  const btnZen = document.getElementById('btnZen');
  const btnExitZen = document.getElementById('btnExitZen');

  // Circumference for SVG Progress Circle (r = 140)
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 140; // ~879.64
  timerProgressCircle.style.strokeDasharray = CIRCLE_CIRCUMFERENCE;

  // Quotes pool
  const focusQuotes = [
    '"สมาธิที่ต่อเนื่องเพียง 25 นาที ทรงพลังกว่าการนั่งอ่านทั้งวันแบบใจลอย"',
    '"การเริ่มทำยากที่สุดเสมอ เมื่อเริ่มแล้ว ทุกอย่างจะไหลลื่นขึ้นเอง"',
    '"อย่ารอให้อารมณ์ดีแล้วค่อยเรียน แต่จงเริ่มทำ แล้วอารมณ์สมาธิจะตามมา"',
    '"ความสำเร็จสร้างจากรอบเวลาเล็กๆ ที่สะสมอย่างสม่ำเสมอ"',
    '"พักให้เต็มที่เมื่อถึงเวลาพัก แล้วกลับมาลุยต่อด้วยพลังเต็มร้อย"'
  ];

  // -------------------------------------------------------------
  // Theme & Visual Atmosphere Management
  // -------------------------------------------------------------
  const savedTheme = localStorage.getItem('study_timer_theme') || 'midnight';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeSelect.value = savedTheme;

  themeSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    document.documentElement.setAttribute('data-theme', val);
    localStorage.setItem('study_timer_theme', val);
  });

  const savedVisual = localStorage.getItem('study_timer_visual_mode') || 'dust';
  visualModeSelect.value = savedVisual;
  visualEngine.setVisualMode(savedVisual);

  visualModeSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    visualEngine.setVisualMode(val);
    localStorage.setItem('study_timer_visual_mode', val);
  });

  const savedClock = localStorage.getItem('study_timer_clock_style') || 'dial';
  document.documentElement.setAttribute('data-clock', savedClock);
  if (clockStyleSelect) clockStyleSelect.value = savedClock;

  if (clockStyleSelect) {
    clockStyleSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      document.documentElement.setAttribute('data-clock', val);
      localStorage.setItem('study_timer_clock_style', val);
    });
  }

  // -------------------------------------------------------------
  // Brain Dump Notepad Auto-save
  // -------------------------------------------------------------
  brainDumpNote.value = localStorage.getItem('study_timer_braindump') || '';
  brainDumpNote.addEventListener('input', () => {
    localStorage.setItem('study_timer_braindump', brainDumpNote.value);
  });

  // -------------------------------------------------------------
  // Timer State & UI Synchronization
  // -------------------------------------------------------------
  function updateTimerUI(data) {
    timerDigits.textContent = data.formattedTime;

    // Smooth dashoffset update
    const offset = CIRCLE_CIRCUMFERENCE * (1 - data.progress);
    timerProgressCircle.style.strokeDashoffset = offset;

    // Update cycle status label
    if (data.mode === 'flow') {
      timerCycleStatus.textContent = 'โหมดปล่อยไหล • Deep Flow State';
    } else if (data.mode === 'shortBreak') {
      timerCycleStatus.textContent = `ช่วงพักสายตา • ผ่อนคลาย (${data.cycle}/${data.totalCycles})`;
    } else if (data.mode === 'longBreak') {
      timerCycleStatus.textContent = 'ช่วงพักยาว • ชาร์จพลังเต็มที่!';
    } else {
      timerCycleStatus.textContent = `รอบที่ ${data.cycle} / ${data.totalCycles} • ลุยสมาธิ`;
    }

    // Document Title Update
    const emojiMap = { pomodoro: '🍅', shortBreak: '☕', longBreak: '🛋️', flow: '⏱️' };
    const activeTask = taskManager.getActiveTask();
    const taskTitle = activeTask ? activeTask.title : 'TEMPO';
    document.title = `${emojiMap[data.mode] || '🍅'} (${data.formattedTime}) ${taskTitle}`;

    // Render PiP frame and Dynamic Favicon
    if (window.pipEngine) {
      pipEngine.renderPipFrame(data, activeTask);
    }
  }

  // Mindful Break Activities Pool
  const breakSuggestions = [
    '💧 ดื่มน้ำเปล่า 1 แก้วเต็มๆ เพื่อเติมความสดชื่นและกระตุ้นการทำงานของสมอง',
    '👀 กฎ 20-20-20: ละสายตาจากหน้าจอ มองออกไปไกล 20 ฟุต (6 เมตร) เป็นเวลา 20 วินาที เพื่อคลายกล้ามเนื้อตา',
    '🤸 ยืดเส้นคลายกล้ามเนื้อคอบ่าไหล่ (Desk Stretch) บรรเทาอาการเมื่อยล้าสะสมจากการนั่งนาน',
    '🚶 ลุกขึ้นเดินเปลี่ยนอิริยาบถรอบห้องหรือโต๊ะ 2 นาที กระตุ้นการไหลเวียนเลือดสู่สมอง',
    '🌬️ หายใจลึกๆ 4-4-4: หายใจเข้า 4 วินาที, กลั้น 4 วินาที, ผ่อนออก 4 วินาที ปรับคลื่นสมองให้สงบ',
    '🪟 ก้าวออกไปรับลมหรือมองวิวท้องฟ้า สูดอากาศบริสุทธิ์เพื่อรีเซ็ตจิตใจก่อนลุยต่อ'
  ];

  function shuffleBreakSuggestion() {
    const chosen = breakSuggestions[Math.floor(Math.random() * breakSuggestions.length)];
    if (breakCoachText) breakCoachText.textContent = chosen;
  }

  if (btnShuffleBreak) {
    btnShuffleBreak.addEventListener('click', shuffleBreakSuggestion);
  }

  // Screen Wake Lock API (keeps mobile & tablet screens awake while running)
  let wakeLockSentinel = null;
  async function acquireWakeLock() {
    if ('wakeLock' in navigator && !wakeLockSentinel) {
      try {
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        wakeLockSentinel.addEventListener('release', () => {
          wakeLockSentinel = null;
        });
      } catch (err) {
        console.warn('Wake Lock request error:', err);
      }
    }
  }

  async function releaseWakeLock() {
    if (wakeLockSentinel) {
      try {
        await wakeLockSentinel.release();
        wakeLockSentinel = null;
      } catch (err) {
        console.warn('Wake Lock release error:', err);
      }
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && studyTimer.state === 'running') {
      acquireWakeLock();
    }
  });

  studyTimer.callbacks.onTick = updateTimerUI;

  studyTimer.callbacks.onStateChange = (state) => {
    if (state === 'running') {
      acquireWakeLock();
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      btnPlayPauseText.textContent = 'หยุดชั่วคราว';
      btnPlayPause.classList.add('active');
    } else {
      releaseWakeLock();
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      btnPlayPauseText.textContent = state === 'paused' ? 'ลุยต่อ' : 'เริ่มจับเวลา';
      btnPlayPause.classList.remove('active');
    }
  };

  studyTimer.callbacks.onModeChange = (mode) => {
    modeTabs.forEach(tab => {
      if (tab.dataset.mode === mode) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Mindful Break Guidance Visibility
    if (mode === 'shortBreak' || mode === 'longBreak') {
      shuffleBreakSuggestion();
      if (breakCoachCard) breakCoachCard.style.display = 'block';
    } else {
      if (breakCoachCard) breakCoachCard.style.display = 'none';
    }

    // Randomize quote
    const randQuote = focusQuotes[Math.floor(Math.random() * focusQuotes.length)];
    document.getElementById('motivationQuote').textContent = randQuote;
  };

  studyTimer.callbacks.onHalfwayPassed = () => {
    const quoteEl = document.getElementById('motivationQuote');
    if (quoteEl) {
      const prev = quoteEl.textContent;
      quoteEl.textContent = '✨ ผ่านครึ่งทางแล้ว! สมาธิกำลังเยี่ยมยอด ลุยต่อจนจบรอบนะ';
      quoteEl.style.color = 'var(--accent-primary)';
      setTimeout(() => {
        quoteEl.textContent = prev;
        quoteEl.style.color = '';
      }, 6000);
    }
  };

  studyTimer.callbacks.onSessionComplete = (sessionInfo) => {
    // If it was a pomodoro, credit it to active task
    const activeTask = taskManager.getActiveTask();
    if (sessionInfo.mode === 'pomodoro') {
      taskManager.incrementActiveTaskPomodoro();
      visualEngine.triggerConfetti();
    }

    // Log to stats
    statsEngine.recordSession(
      sessionInfo.mode,
      sessionInfo.duration,
      activeTask ? activeTask.title : null
    );

    updateStatsSummaryUI();

    // Check if daily goal achieved right now
    const today = statsEngine.getTodayStats();
    if (sessionInfo.mode === 'pomodoro' && today.pomodoros === today.dailyGoal) {
      setTimeout(() => {
        visualEngine.triggerConfetti();
        alert('🎉 ยินดีด้วยครับ! คุณบรรลุเป้าหมายการอ่านประจำวันสำเร็จแล้ว (' + today.dailyGoal + ' มะเขือเทศ) 🔥');
      }, 500);
    }
  };

  // Timer Controls
  btnPlayPause.addEventListener('click', () => {
    // Ensure AudioContext is awakened on user click
    if (window.soundEngine) soundEngine.ensureContext();

    if (studyTimer.state === 'running') {
      studyTimer.pause();
    } else {
      studyTimer.start();
    }
  });

  btnReset.addEventListener('click', () => studyTimer.reset());
  btnSkip.addEventListener('click', () => studyTimer.skip());
  btnAddFive.addEventListener('click', () => studyTimer.addTime(300));

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      studyTimer.setMode(mode);
    });
  });

  // -------------------------------------------------------------
  // Task Management UI
  // -------------------------------------------------------------
  function renderTasks(tasks) {
    taskList.innerHTML = '';
    const activeTask = taskManager.getActiveTask();
    taskCountText.textContent = `${tasks.length} ภารกิจ`;

    if (tasks.length === 0) {
      taskList.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 20px; font-size: 13px;">ยังไม่มีภารกิจ เพิ่มภารกิจเพื่อเริ่มโฟกัสได้เลย!</div>`;
      return;
    }

    tasks.forEach(task => {
      const item = document.createElement('div');
      item.className = `task-item ${task.completed ? 'completed' : ''} ${activeTask && activeTask.id === task.id ? 'is-active' : ''}`;

      item.innerHTML = `
        <div class="task-left">
          <div class="task-check" title="เสร็จสิ้น">
            ${task.completed ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
          </div>
          <span class="task-text">${escapeHtml(task.title)}</span>
        </div>
        <div class="task-right">
          <span class="pom-counter" title="ใช้ไป / ประมาณการ">${task.actPomodoros || 0}/${task.estPomodoros} 🍅</span>
          <button class="btn-task-del" title="ลบภารกิจ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;

      // Checkbox click
      const checkBtn = item.querySelector('.task-check');
      checkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const done = taskManager.toggleComplete(task.id);
        if (done) {
          const rect = checkBtn.getBoundingClientRect();
          visualEngine.triggerConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      });

      // Delete click
      const delBtn = item.querySelector('.btn-task-del');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        taskManager.deleteTask(task.id);
      });

      // Item click sets as active focus
      item.addEventListener('click', () => {
        taskManager.setActiveTask(task.id);
      });

      taskList.appendChild(item);
    });
  }

  function updateActiveTaskBanner(active) {
    if (active) {
      activeTaskTitleText.textContent = active.title;
      activeTaskPomBadge.textContent = `${active.actPomodoros || 0}/${active.estPomodoros} 🍅`;
      activeTaskBanner.style.display = 'flex';
    } else {
      activeTaskTitleText.textContent = 'ยังไม่ได้เลือกภารกิจเจาะจง (คลิกเลือกที่รายการข้างๆ)';
      activeTaskPomBadge.textContent = '0 🍅';
    }
  }

  taskManager.onTasksChanged = renderTasks;
  taskManager.onActiveTaskChanged = updateActiveTaskBanner;

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    const est = parseInt(taskEstSelect.value) || 1;
    if (title) {
      taskManager.addTask(title, est);
      taskInput.value = '';
    }
  });

  // Initial render
  renderTasks(taskManager.getFilteredTasks());
  updateActiveTaskBanner(taskManager.getActiveTask());

  // -------------------------------------------------------------
  // Stats & Streaks Summary Update
  // -------------------------------------------------------------
  function updateStatsSummaryUI() {
    const today = statsEngine.getTodayStats();
    statTodayTime.textContent = `${today.minutes}m`;
    statTodayPoms.textContent = today.pomodoros;
    statStreakDays.textContent = today.streak;

    if (goalText) goalText.textContent = `${today.pomodoros} / ${today.dailyGoal} 🍅`;
    if (goalPercentText) goalPercentText.textContent = `${today.goalPercent}%`;
    if (goalBarFill) goalBarFill.style.width = `${today.goalPercent}%`;

    // Update Living Zen Bonsai Companion
    if (window.bonsaiEngine) {
      bonsaiEngine.setLevel(today.pomodoros, today.dailyGoal);
    }
  }
  updateStatsSummaryUI();

  // -------------------------------------------------------------
  // Ambient Sound Mixer Controller
  // -------------------------------------------------------------
  btnSoundMixer.addEventListener('click', () => {
    soundEngine.ensureContext();
    ambientMixerDrawer.classList.toggle('open');
    btnSoundMixer.classList.toggle('active', ambientMixerDrawer.classList.contains('open'));
  });

  btnCloseMixer.addEventListener('click', () => {
    ambientMixerDrawer.classList.remove('open');
    btnSoundMixer.classList.remove('active');
  });

  function updateSoundBadge() {
    let activeCount = 0;
    for (const key in soundEngine.volumes) {
      if (soundEngine.volumes[key] > 0) activeCount++;
    }
    if (activeCount > 0) {
      soundBadge.textContent = activeCount;
      soundBadge.classList.add('show');
    } else {
      soundBadge.classList.remove('show');
    }
  }

  soundSliders.forEach(slider => {
    slider.addEventListener('input', (e) => {
      const type = e.target.dataset.sound;
      const vol = parseFloat(e.target.value);
      soundEngine.setSoundscapeVolume(type, vol);
      updateSoundBadge();
    });
  });

  masterVolumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    soundEngine.setMasterVolume(vol);
  });

  // Soundscape Presets
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const preset = chip.dataset.preset;
      soundEngine.ensureContext();

      // Reset all sliders in UI
      soundSliders.forEach(s => s.value = 0);

      if (preset === 'reset-sound') {
        soundEngine.stopAllSoundscapes();
      } else if (preset === 'lofi-beats') {
        soundEngine.stopAllSoundscapes();
        soundEngine.setSoundscapeVolume('vinyl', 0.65);
        soundEngine.setSoundscapeVolume('lofiChords', 0.6);
        soundEngine.setSoundscapeVolume('cafe', 0.25);
        setSliderVal('vinyl', 0.65);
        setSliderVal('lofiChords', 0.6);
        setSliderVal('cafe', 0.25);
      } else if (preset === 'rainy-cafe') {
        soundEngine.stopAllSoundscapes();
        soundEngine.setSoundscapeVolume('rain', 0.6);
        soundEngine.setSoundscapeVolume('cafe', 0.4);
        setSliderVal('rain', 0.6);
        setSliderVal('cafe', 0.4);
      } else if (preset === 'night-cabin') {
        soundEngine.stopAllSoundscapes();
        soundEngine.setSoundscapeVolume('campfire', 0.7);
        soundEngine.setSoundscapeVolume('wind', 0.35);
        setSliderVal('campfire', 0.7);
        setSliderVal('wind', 0.35);
      } else if (preset === 'deep-focus') {
        soundEngine.stopAllSoundscapes();
        soundEngine.setSoundscapeVolume('binaural', 0.6);
        soundEngine.setSoundscapeVolume('brownNoise', 0.3);
        setSliderVal('binaural', 0.6);
        setSliderVal('brownNoise', 0.3);
      }

      updateSoundBadge();
    });
  });

  function setSliderVal(soundKey, val) {
    const s = document.querySelector(`.sound-slider[data-sound="${soundKey}"]`);
    if (s) s.value = val;
  }

  // -------------------------------------------------------------
  // Settings Modal Controller
  // -------------------------------------------------------------
  const inputPomDuration = document.getElementById('inputPomDuration');
  const inputShortDuration = document.getElementById('inputShortDuration');
  const inputLongDuration = document.getElementById('inputLongDuration');
  const inputCycles = document.getElementById('inputCycles');
  const inputDailyGoal = document.getElementById('inputDailyGoal');
  const selectChime = document.getElementById('selectChime');
  const toggleAutoBreaks = document.getElementById('toggleAutoBreaks');
  const toggleAutoPoms = document.getElementById('toggleAutoPoms');
  const toggleTicking = document.getElementById('toggleTicking');

  function populateSettingsUI() {
    inputPomDuration.value = Math.round(studyTimer.durations.pomodoro / 60);
    inputShortDuration.value = Math.round(studyTimer.durations.shortBreak / 60);
    inputLongDuration.value = Math.round(studyTimer.durations.longBreak / 60);
    inputCycles.value = studyTimer.totalCycles;
    if (inputDailyGoal) inputDailyGoal.value = statsEngine.dailyGoal;
    selectChime.value = studyTimer.chimeSound;
    toggleAutoBreaks.checked = studyTimer.autoStartBreaks;
    toggleAutoPoms.checked = studyTimer.autoStartPomodoros;
    toggleTicking.checked = studyTimer.tickingSoundEnabled;
    if (toggleHalfwayChime) toggleHalfwayChime.checked = studyTimer.halfwayChimeEnabled;
  }

  btnSettings.addEventListener('click', () => {
    populateSettingsUI();
    settingsModal.classList.add('open');
  });

  btnCloseSettings.addEventListener('click', () => {
    settingsModal.classList.remove('open');
  });

  btnTestChime.addEventListener('click', () => {
    soundEngine.ensureContext();
    soundEngine.playChime(selectChime.value);
  });

  btnReqNotify.addEventListener('click', () => {
    studyTimer.requestNotificationPermission();
  });

  btnSaveSettings.addEventListener('click', () => {
    studyTimer.saveSettings({
      pomodoroDuration: parseInt(inputPomDuration.value) || 25,
      shortBreakDuration: parseInt(inputShortDuration.value) || 5,
      longBreakDuration: parseInt(inputLongDuration.value) || 15,
      totalCycles: parseInt(inputCycles.value) || 4,
      chimeSound: selectChime.value,
      autoStartBreaks: toggleAutoBreaks.checked,
      autoStartPomodoros: toggleAutoPoms.checked,
      tickingSoundEnabled: toggleTicking.checked,
      halfwayChimeEnabled: toggleHalfwayChime ? toggleHalfwayChime.checked : true
    });
    if (inputDailyGoal) {
      statsEngine.setDailyGoal(inputDailyGoal.value);
      updateStatsSummaryUI();
    }
    settingsModal.classList.remove('open');
  });

  // -------------------------------------------------------------
  // Picture-in-Picture Controller
  // -------------------------------------------------------------
  if (btnPip && window.pipEngine) {
    btnPip.addEventListener('click', async () => {
      const active = await pipEngine.togglePip();
      btnPip.classList.toggle('active', active);
    });
    pipEngine.onPipToggle = (active) => {
      btnPip.classList.toggle('active', active);
    };
  }

  // -------------------------------------------------------------
  // Analytics & Stats Modal Controller
  // -------------------------------------------------------------
  btnStats.addEventListener('click', () => {
    statsModal.classList.add('open');
    refreshStatsModalContent();
  });

  btnCloseStats.addEventListener('click', () => {
    statsModal.classList.remove('open');
  });

  function refreshStatsModalContent() {
    // Render Canvas chart & 10-Week Heatmap
    setTimeout(() => {
      statsEngine.renderWeeklyChart(weeklyChartCanvas);
      const heatmapEl = document.getElementById('heatmapContainer');
      if (heatmapEl) {
        statsEngine.renderActivityHeatmap(heatmapEl);
      }
    }, 50);

    // Lifetime stats
    const allTime = statsEngine.getAllTimeStats();
    document.getElementById('allTimeHours').textContent = allTime.totalHours;
    document.getElementById('allTimeSessions').textContent = allTime.totalSessions;
    document.getElementById('allTimeStreak').textContent = `${allTime.streak} วัน`;

    // History list
    sessionHistoryList.innerHTML = '';
    const recents = statsEngine.history.slice(0, 10);
    if (recents.length === 0) {
      sessionHistoryList.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 12px;">ยังไม่มีประวัติรอบเวลา</div>`;
    } else {
      recents.forEach(item => {
        const d = new Date(item.timestamp);
        const dateStr = `${d.getDate()}/${d.getMonth()+1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
          <div>
            <span style="font-weight: 600; color: var(--text-main);">${escapeHtml(item.task)}</span>
            <span style="color: var(--text-dim); margin-left: 8px;">(${dateStr})</span>
          </div>
          <span style="color: var(--accent-primary); font-weight: 700;">+${item.minutes}m</span>
        `;
        sessionHistoryList.appendChild(div);
      });
    }
  }

  btnExportData.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(statsEngine.exportData());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `study_timer_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  btnClearStats.addEventListener('click', () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการเรียนทั้งหมด?')) {
      statsEngine.clearHistory();
      refreshStatsModalContent();
      updateStatsSummaryUI();
    }
  });

  // -------------------------------------------------------------
  // Fullscreen Zen Mode Controller
  // -------------------------------------------------------------
  function toggleZenMode() {
    const isZen = document.body.classList.toggle('zen-mode');
    if (isZen) {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  btnZen.addEventListener('click', toggleZenMode);
  btnExitZen.addEventListener('click', toggleZenMode);

  // -------------------------------------------------------------
  // Global Keyboard Shortcuts
  // -------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    // Avoid triggering shortcuts while typing inside inputs or textareas
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      btnPlayPause.click();
    } else if (e.altKey && e.code === 'KeyS') {
      e.preventDefault();
      studyTimer.skip();
    } else if (e.altKey && e.code === 'KeyR') {
      e.preventDefault();
      studyTimer.reset();
    } else if (e.altKey && e.code === 'KeyF') {
      e.preventDefault();
      toggleZenMode();
    } else if (e.altKey && e.code === 'KeyP') {
      e.preventDefault();
      if (btnPip) btnPip.click();
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      soundEngine.toggleMute();
    } else if (e.code === 'Escape') {
      if (document.body.classList.contains('zen-mode')) {
        toggleZenMode();
      }
      settingsModal.classList.remove('open');
      statsModal.classList.remove('open');
      ambientMixerDrawer.classList.remove('open');
    }
  });

  // Close modals clicking outside
  [settingsModal, statsModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  // Helper escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // Trigger initial tick to paint UI digits
  studyTimer.notifyTick();
});
