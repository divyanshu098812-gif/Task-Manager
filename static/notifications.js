class NotificationManager {
  constructor() {
    this.btn = null;
    this.dropdown = null;
    this.badge = null;
    this.pollInterval = null;
    this.isOpen = false;
  }

  async init() {
    this.createUI();
    await this.loadNotifications();
    this.startPolling();
    this.setupEventListeners();
  }

  createUI() {
    this.btn = document.getElementById('notif-btn');
    if (!this.btn) return;

    this.badge = this.btn.querySelector('.topnav-badge');
    if (!this.badge) {
      this.badge = document.createElement('span');
      this.badge.className = 'topnav-badge';
      this.badge.style.display = 'none';
      this.btn.appendChild(this.badge);
    }

    const container = this.btn.parentElement;
    container.style.position = 'relative';
    
    this.dropdown = document.createElement('div');
    this.dropdown.id = 'notif-dropdown';
    this.dropdown.className = 'notif-dropdown';
    this.dropdown.innerHTML = `
      <div class="notif-header">
        <span class="notif-header-title">Notifications</span>
        <div class="notif-header-actions">
          <button class="notif-action-btn" id="mark-all-read" title="Mark all as read">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
          <button class="notif-action-btn" id="clear-all" title="Clear all">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="notif-list" id="notif-list">
        <div class="notif-loading">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite;">
            <circle cx="12" cy="12" r="10" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"/>
          </svg>
        </div>
      </div>
    `;
    
    container.appendChild(this.dropdown);
  }

  setupEventListeners() {
    this.btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    document.addEventListener('click', (e) => {
      if (!this.dropdown.contains(e.target) && e.target !== this.btn) {
        this.closeDropdown();
      }
    });

    document.getElementById('mark-all-read')?.addEventListener('click', () => this.markAllRead());
    document.getElementById('clear-all')?.addEventListener('click', () => this.clearAll());
  }

  async loadNotifications() {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      
      if (data.notifications) {
        this.renderNotifications(data.notifications);
        this.updateBadge(data.unread || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }

  renderNotifications(notifications) {
    const list = document.getElementById('notif-list');
    if (!list) return;

    if (!notifications.length) {
      list.innerHTML = `
        <div class="notif-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div class="notif-empty-text">No notifications yet</div>
        </div>
      `;
      return;
    }

    list.innerHTML = notifications.map(n => this.renderNotification(n)).join('');
    
    list.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.dataset.id);
        if (!item.classList.contains('notif-read')) {
          this.markRead(id);
        }
      });
    });
  }

  renderNotification(n) {
    const icons = {
      task_created: `<svg viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
      task_completed: `<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      task_updated: `<svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
      task_deleted: `<svg viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>`,
      overdue: `<svg viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      due_today: `<svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      welcome: `<svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
    };

    const icon = icons[n.type] || icons.task_updated;
    const time = this.formatTime(n.created_at);

    return `
      <div class="notif-item ${n.is_read ? 'notif-read' : ''}" data-id="${n.id}">
        <div class="notif-icon">${icon}</div>
        <div class="notif-content">
          <div class="notif-title">${n.title}</div>
          ${n.message ? `<div class="notif-message">${n.message}</div>` : ''}
          <div class="notif-time">${time}</div>
        </div>
        ${!n.is_read ? '<span class="notif-unread-dot"></span>' : ''}
      </div>
    `;
  }

  formatTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  updateBadge(count) {
    if (!this.badge) return;
    
    if (count > 0) {
      this.badge.style.display = 'block';
      this.badge.textContent = count > 99 ? '99+' : count;
    } else {
      this.badge.style.display = 'none';
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      this.dropdown.classList.add('open');
      this.loadNotifications();
    } else {
      this.dropdown.classList.remove('open');
    }
  }

  closeDropdown() {
    this.isOpen = false;
    this.dropdown?.classList.remove('open');
  }

  async markRead(id) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      await this.loadNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }

  async markAllRead() {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      await this.loadNotifications();
      if (window.Toast) Toast.show('All notifications marked as read', 'success');
    } catch (err) {
      if (window.Toast) Toast.show('Failed to mark all as read', 'warning');
    }
  }

  async clearAll() {
    try {
      await fetch('/api/notifications/clear', { method: 'DELETE' });
      await this.loadNotifications();
      if (window.Toast) Toast.show('All notifications cleared', 'success');
    } catch (err) {
      if (window.Toast) Toast.show('Failed to clear notifications', 'warning');
    }
  }

  startPolling() {
    this.pollInterval = setInterval(() => {
      this.loadNotifications();
    }, 30000);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('notif-btn')) {
    window.NotifManager = new NotificationManager();
    window.NotifManager.init();
  }
});

const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);
