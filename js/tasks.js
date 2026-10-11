/**
 * Task Management Module with Pomodoro Tracking
 * Integrates directly with active timer session
 */

class TaskManager {
  constructor() {
    this.tasks = [];
    this.activeTaskId = null;
    this.filter = 'all'; // 'all' | 'active' | 'completed'

    this.onTasksChanged = null;
    this.onActiveTaskChanged = null;

    this.load();
  }

  load() {
    try {
      const data = localStorage.getItem('study_timer_tasks');
      if (data) {
        this.tasks = JSON.parse(data);
      } else {
        // Initial sample tasks to inspire user
        this.tasks = [
          {
            id: 'task_demo_1',
            title: '📖 ทบทวนเนื้อหาบทที่ 1-2 & สรุป Mindmap',
            estPomodoros: 2,
            actPomodoros: 1,
            completed: false,
            priority: 'high',
            tag: 'Reading',
            createdAt: Date.now() - 3600000
          },
          {
            id: 'task_demo_2',
            title: '✍️ ทำแบบฝึกหัดท้ายบท 10 ข้อ',
            estPomodoros: 3,
            actPomodoros: 0,
            completed: false,
            priority: 'med',
            tag: 'Practice',
            createdAt: Date.now()
          }
        ];
      }

      const activeId = localStorage.getItem('study_timer_active_task_id');
      if (activeId && this.tasks.some(t => t.id === activeId && !t.completed)) {
        this.activeTaskId = activeId;
      } else {
        const firstIncomplete = this.tasks.find(t => !t.completed);
        this.activeTaskId = firstIncomplete ? firstIncomplete.id : null;
      }
    } catch (e) {
      console.warn('Failed to load tasks:', e);
      this.tasks = [];
    }
  }

  save() {
    try {
      localStorage.setItem('study_timer_tasks', JSON.stringify(this.tasks));
      if (this.activeTaskId) {
        localStorage.setItem('study_timer_active_task_id', this.activeTaskId);
      } else {
        localStorage.removeItem('study_timer_active_task_id');
      }
    } catch (e) {
      console.warn('Failed to save tasks:', e);
    }
    this.notify();
  }

  addTask(title, estPomodoros = 1, priority = 'med', tag = 'Study') {
    if (!title || !title.trim()) return null;

    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: title.trim(),
      estPomodoros: Math.max(1, parseInt(estPomodoros) || 1),
      actPomodoros: 0,
      completed: false,
      priority: priority,
      tag: tag,
      createdAt: Date.now()
    };

    this.tasks.unshift(newTask);

    // If no active task, set this as active
    if (!this.activeTaskId) {
      this.activeTaskId = newTask.id;
    }

    this.save();
    return newTask;
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.activeTaskId === id) {
      const next = this.tasks.find(t => !t.completed);
      this.activeTaskId = next ? next.id : null;
    }
    this.save();
  }

  toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;

    if (task.completed) {
      // Play celebratory chime/sound
      if (window.soundEngine) {
        window.soundEngine.playSuccessPop();
      }
      // If completed was active, switch to next uncompleted
      if (this.activeTaskId === id) {
        const next = this.tasks.find(t => !t.completed && t.id !== id);
        this.activeTaskId = next ? next.id : null;
      }
    }

    this.save();
    return task.completed;
  }

  setActiveTask(id) {
    if (this.activeTaskId === id) return;
    const task = this.tasks.find(t => t.id === id);
    if (task && !task.completed) {
      this.activeTaskId = id;
      this.save();
    }
  }

  getActiveTask() {
    if (!this.activeTaskId) return null;
    return this.tasks.find(t => t.id === this.activeTaskId) || null;
  }

  incrementActiveTaskPomodoro() {
    const active = this.getActiveTask();
    if (active) {
      active.actPomodoros = (active.actPomodoros || 0) + 1;
      this.save();
    }
  }

  setFilter(filter) {
    this.filter = filter;
    this.notify();
  }

  getFilteredTasks() {
    if (this.filter === 'active') {
      return this.tasks.filter(t => !t.completed);
    }
    if (this.filter === 'completed') {
      return this.tasks.filter(t => t.completed);
    }
    return this.tasks;
  }

  clearCompleted() {
    this.tasks = this.tasks.filter(t => !t.completed);
    this.save();
  }

  notify() {
    if (this.onTasksChanged) {
      this.onTasksChanged(this.getFilteredTasks());
    }
    if (this.onActiveTaskChanged) {
      this.onActiveTaskChanged(this.getActiveTask());
    }
  }
}

// Global instance
window.taskManager = new TaskManager();
