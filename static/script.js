// ==========================================================================
// NEXUS TASK — Premium Futuristic UI Engine
// All original backend API logic preserved + premium animations added
// ==========================================================================

'use strict';

// ===== THEME MANAGER =====
const ThemeManager = {
  STORAGE_KEY: 'nexus-theme',

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY) || 'dark';
    this.apply(saved);
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    this.apply(next);
    localStorage.setItem(this.STORAGE_KEY, next);
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      const sunIcon  = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      btn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
      btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  }
};


// ===== TOAST SYSTEM (Premium) =====
const Toast = {
  container: null,

  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },

  show(message, type = 'info', title = null, duration = 3500) {
    const icons = {
      success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      danger:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
      info:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
      warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    };

    const defaultTitles = {
      success: 'Success',
      danger:  'Deleted',
      info:    'Info',
      warning: 'Warning'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon-wrap">${icons[type] || icons.info}</div>
      <div class="toast-body">
        <div class="toast-title">${title || defaultTitles[type] || 'Notification'}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    this.container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });

    const dismiss = () => {
      toast.classList.add('hiding');
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    };

    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  }
};

// Legacy showToast compatibility (preserved for existing logic)
function showToast(message, type = 'success') {
  Toast.show(message, type);
}


// ===== CONFIRMATION DIALOG (Premium) =====
function confirmAction(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        <div class="modal-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="modal-title">Confirm Action</div>
        <div class="modal-message">${message}</div>
        <div class="modal-actions">
          <button class="btn btn-ghost confirm-no">Cancel</button>
          <button class="btn btn-danger confirm-yes">Delete</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    addRippleToButtons(overlay.querySelectorAll('.btn'));

    const close = (result) => {
      overlay.style.animation = 'none';
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.remove(); resolve(result); }, 200);
    };

    overlay.querySelector('.confirm-yes').addEventListener('click', () => close(true));
    overlay.querySelector('.confirm-no').addEventListener('click',  () => close(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });

    // Escape key
    const escHandler = (e) => { if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);
  });
}


// ===== CURSOR GLOW (Mouse Follow Light) =====
function initCursorGlow() {
  const glow = document.querySelector('.cursor-glow');
  if (!glow) return;

  let mouseX = 0, mouseY = 0;
  let currentX = 0, currentY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateGlow() {
    currentX += (mouseX - currentX) * 0.08;
    currentY += (mouseY - currentY) * 0.08;
    glow.style.left = currentX + 'px';
    glow.style.top  = currentY + 'px';
    requestAnimationFrame(animateGlow);
  }

  animateGlow();
}


// ===== PARTICLE SYSTEM =====
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light';

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.4 + 0.1,
    color: ['99,102,241', '139,92,246', '6,182,212'][Math.floor(Math.random() * 3)]
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      if (isDark()) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();
      }
    });

    // Draw connecting lines for nearby particles
    if (isDark()) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
}


// ===== 3D CARD TILT =====
function init3DTilt() {
  const cards = document.querySelectorAll('[data-tilt]');

  cards.forEach(card => {
    const strength = parseFloat(card.dataset.tiltStrength || '8');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;

      const rotateY = x * strength;
      const rotateX = -y * strength;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.01)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
      card.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s linear';
    });
  });
}


// ===== RIPPLE EFFECT =====
function addRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top  - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
}

function addRippleToButtons(btns) {
  btns.forEach(btn => btn.addEventListener('click', addRipple));
}


// ===== SIDEBAR MANAGER =====
const Sidebar = {
  el: null,
  mainContent: null,
  isCollapsed: false,

  init() {
    this.el = document.querySelector('.sidebar');
    this.mainContent = document.querySelector('.main-content');
    const toggle = document.querySelector('.sidebar-toggle');
    if (!this.el) return;

    // Restore state
    const saved = localStorage.getItem('sidebar-collapsed') === 'true';
    if (saved) this.collapse();

    if (toggle) {
      toggle.addEventListener('click', () => this.toggle());
    }

    // Mobile overlay
    const mobileToggle = document.getElementById('mobile-sidebar-toggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        this.el.classList.toggle('mobile-open');
      });
    }
  },

  toggle() {
    this.isCollapsed ? this.expand() : this.collapse();
  },

  collapse() {
    this.isCollapsed = true;
    this.el?.classList.add('collapsed');
    this.mainContent?.classList.add('sidebar-collapsed');
    localStorage.setItem('sidebar-collapsed', 'true');
    this.updateToggleIcon();
  },

  expand() {
    this.isCollapsed = false;
    this.el?.classList.remove('collapsed');
    this.mainContent?.classList.remove('sidebar-collapsed');
    localStorage.setItem('sidebar-collapsed', 'false');
    this.updateToggleIcon();
  },

  updateToggleIcon() {
    const btn = document.querySelector('.sidebar-toggle');
    if (!btn) return;
    if (this.isCollapsed) {
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
    } else {
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`;
    }
  }
};


// ===== AVATAR DROPDOWN =====
function initAvatarDropdown() {
  const btn  = document.getElementById('avatar-btn');
  const menu = document.getElementById('avatar-dropdown');
  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });

  document.addEventListener('click', () => menu.classList.remove('open'));
}


// ===== STAT COUNTER ANIMATION =====
function animateCounter(el) {
  const target = parseInt(el.dataset.target || el.textContent, 10);
  if (isNaN(target)) return;
  const duration = 1200;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
    el.textContent = Math.round(ease * target);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function initCounters() {
  const counters = document.querySelectorAll('.stat-value[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}


// ===== STAT BAR ANIMATION =====
function initStatBars() {
  const bars = document.querySelectorAll('.stat-bar-fill[data-width]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const w = entry.target.dataset.width;
        setTimeout(() => entry.target.style.width = w, 200);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  bars.forEach(bar => {
    bar.style.width = '0%';
    observer.observe(bar);
  });
}


// ===== SCROLL ENTRANCE ANIMATIONS =====
function initScrollAnimations() {
  const items = document.querySelectorAll('.task-card, .stat-card, .feature-card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.animationDelay = (i * 0.06) + 's';
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  items.forEach(item => observer.observe(item));
}


// ===== FILTER TABS =====
function initFilterTabs() {
  const tabs = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.task-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter || 'all';
      cards.forEach(card => {
        const status = card.dataset.status || '';
        const isOverdue = card.dataset.overdue === 'true';

        let show = false;
        if (filter === 'all') show = true;
        else if (filter === 'pending'   && status === 'Pending')   show = true;
        else if (filter === 'completed' && status === 'Completed') show = true;
        else if (filter === 'overdue'   && isOverdue)              show = true;

        card.style.display = show ? '' : 'none';
      });
    });
  });
}


// ===== PASSWORD VISIBILITY TOGGLE =====
function setupPasswordToggle() {
  const passwordInputs = document.querySelectorAll('.form-input[type="password"]');

  passwordInputs.forEach(input => {
    const wrapper = input.closest('.input-icon-wrap') || (() => {
      const w = document.createElement('div');
      w.className = 'input-icon-wrap';
      input.parentNode.insertBefore(w, input);
      w.appendChild(input);
      return w;
    })();

    if (wrapper.querySelector('.toggle-password')) return;

    const btn = document.createElement('button');
    btn.className = 'toggle-password';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle password visibility');
    btn.innerHTML = eyeIcon();
    wrapper.appendChild(btn);

    btn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.innerHTML = isPassword ? eyeOffIcon() : eyeIcon();
    });
  });
}

function eyeIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

function eyeOffIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
}


// ===== SEARCH FILTER =====
function initSearch() {
  const searchInput = document.getElementById('task-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.task-card');
    cards.forEach(card => {
      const title = card.querySelector('.task-title')?.textContent.toLowerCase() || '';
      const desc  = card.querySelector('.task-description')?.textContent.toLowerCase() || '';
      card.style.display = (title.includes(query) || desc.includes(query)) ? '' : 'none';
    });
  });
}


// ===== ORIGINAL DELETE HANDLER (PRESERVED) =====
function initDeleteButtons() {
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      const confirmed = await confirmAction('Are you sure you want to permanently delete this task?');
      if (!confirmed) return;

      try {
        const res  = await fetch(`/delete/${id}`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          const card = button.closest('.task-card');
          if (card) {
            card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.transform  = 'scale(0.85) translateY(-10px)';
            card.style.opacity    = '0';
            setTimeout(() => {
              card.remove();
              updateStatCounts();
            }, 400);
          }
          Toast.show('Task has been permanently deleted.', 'danger', 'Deleted');
        }
      } catch (err) {
        Toast.show('Something went wrong. Please try again.', 'warning', 'Error');
      }
    });
  });
}


// ===== ORIGINAL TOGGLE HANDLER (PRESERVED) =====
function initToggleButtons() {
  document.querySelectorAll('.toggle-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;

      try {
        const res  = await fetch(`/toggle/${id}`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          const card = button.closest('.task-card');
          if (card) {
            // Update card status
            card.dataset.status = data.status;
            if (data.status === 'Completed') {
              card.classList.add('completed-task');
            } else {
              card.classList.remove('completed-task');
            }

            // Update status badge
            const badge = card.querySelector('.task-status-badge');
            if (badge) {
              if (data.status === 'Completed') {
                badge.className = 'task-status-badge status-completed';
                badge.innerHTML = `<span class="status-dot"></span>Completed`;
              } else {
                badge.className = 'task-status-badge status-pending';
                badge.innerHTML = `<span class="status-dot"></span>Pending`;
              }
            }

            // Update button tooltip
            button.title = data.status === 'Completed' ? 'Mark as Pending' : 'Mark as Completed';

            // Card flash animation
            card.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            card.style.transform  = 'scale(1.04)';
            setTimeout(() => card.style.transform = 'scale(1)', 300);

            updateStatCounts();
          }

          const msg = data.status === 'Completed'
            ? 'Task marked as completed! 🎉'
            : 'Task marked as pending.';
          Toast.show(msg, 'success', data.status === 'Completed' ? 'Completed!' : 'Updated');
        }
      } catch (err) {
        Toast.show('Something went wrong. Please try again.', 'warning', 'Error');
      }
    });
  });
}


// ===== DYNAMIC STAT COUNT UPDATE =====
function updateStatCounts() {
  const allCards       = document.querySelectorAll('.task-card');
  const completedCards = document.querySelectorAll('.task-card.completed-task');
  const pendingCards   = document.querySelectorAll('.task-card:not(.completed-task)');
  const overdueCards   = document.querySelectorAll('.task-card[data-overdue="true"]:not(.completed-task)');

  const set = (id, val) => {
    const el = document.querySelector(`.stat-value[data-id="${id}"]`);
    if (el) el.textContent = val;
  };

  set('total',     allCards.length);
  set('pending',   pendingCards.length);
  set('completed', completedCards.length);
  set('overdue',   overdueCards.length);
}


// ===== HERO PARALLAX =====
function initHeroParallax() {
  const hero = document.querySelector('.hero-section');
  if (!hero) return;

  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth  - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    const orbs = document.querySelectorAll('.hero-orb');
    orbs.forEach((orb, i) => {
      const factor = (i + 1) * 0.5;
      orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
    });
  });
}


// ===== STAGGERED CARD ENTRANCE =====
function initStaggeredEntrance() {
  const cards = document.querySelectorAll('.task-card, .stat-card');
  cards.forEach((card, i) => {
    card.style.animationDelay = `${i * 0.07}s`;
    card.style.animationFillMode = 'both';
  });
}


// ===== MAIN INIT =====
document.addEventListener('DOMContentLoaded', () => {

  // Core systems
  ThemeManager.init();
  Toast.init();

  // Visual effects
  initCursorGlow();
  initParticles();

  // UI components
  Sidebar.init();
  initAvatarDropdown();

  // 3D tilt on cards
  init3DTilt();

  // Buttons - ripple effect
  addRippleToButtons(document.querySelectorAll('.btn'));

  // Password toggle
  setupPasswordToggle();

  // Animations
  initCounters();
  initStatBars();
  initScrollAnimations();
  initStaggeredEntrance();
  initHeroParallax();

  // Interactivity
  initFilterTabs();
  initSearch();

  // Original API handlers (preserved)
  initDeleteButtons();
  initToggleButtons();

  // Theme toggle button
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => ThemeManager.toggle());
  }
});