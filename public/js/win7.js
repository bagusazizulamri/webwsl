const Win7 = {
  active: false,
  windows: {},
  windowZIndex: 10000,
  windowOrder: [],
  dragData: null,
  resizeData: null,
  snapData: null,
  startMenuOpen: false,
  clockInterval: null,
  terminalAttached: false,
  termObserver: null,
  fileHistory: [],
  fileForward: [],
  refreshTimers: {},
  altTabActive: false,
  altTabIndex: 0,
  flip3DActive: false,
  notificationTimers: {},
  _perfHistory: null,
  _winKeyHeld: false,
  _clipboard: null,
  _pinnedApps: [],
  _fileDragData: null,
  _peekTimer: null,
  _snapRegion: null,
  _desktopSel: null,

  SVG: {
    start: '<svg viewBox="0 0 48 48" width="22" height="22"><path fill="currentColor" d="M24 4L4 24l20 20 20-20z"/><path fill="#fff" d="M24 8L8 24l16 16 16-16z" opacity="0.25"/></svg>',
    close: '<svg viewBox="0 0 10 10"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/></svg>',
    max: '<svg viewBox="0 0 10 10"><rect x="1.5" y="1.5" width="7" height="7" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    min: '<svg viewBox="0 0 10 10"><rect x="1" y="5" width="8" height="1.5" fill="currentColor"/></svg>',
    restore: '<svg viewBox="0 0 10 10"><rect x="1.5" y="3.5" width="6" height="6" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3 3.5V2h5.5v5.5H8" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    computer: '<svg viewBox="0 0 48 48" width="32" height="32"><rect x="6" y="8" width="36" height="26" rx="2" fill="#e8e8e8" stroke="#999" stroke-width="1.5"/><rect x="8" y="10" width="32" height="22" rx="1" fill="#fff"/><rect x="12" y="14" width="10" height="6" rx="1" fill="#58a6ff"/><rect x="12" y="22" width="6" height="2" rx="1" fill="#ccc"/><rect x="24" y="14" width="12" height="2" rx="1" fill="#ccc"/><rect x="24" y="18" width="8" height="2" rx="1" fill="#ccc"/><rect x="24" y="22" width="6" height="2" rx="1" fill="#ccc"/><path d="M10 34v3h28v-3" fill="none" stroke="#999" stroke-width="1.5"/><rect x="20" y="37" width="8" height="3" rx="1" fill="#999"/><rect x="12" y="20" width="6" height="2" rx="1" fill="#ccc"/></svg>',
    folder: '<svg viewBox="0 0 48 48" width="32" height="32"><path d="M6 12h16l4 6h16v20H6V12z" fill="#f5d76e" stroke="#d4a017" stroke-width="1.5"/><path d="M6 12h16l4 6h16v20H6V12z" fill="#f9e47a" opacity="0.4"/></svg>',
    recycle: '<svg viewBox="0 0 48 48" width="32" height="32"><path d="M24 6l-6 10h4v18h-4l6 10 6-10h-4V16h4z" fill="#bbb" stroke="#999" stroke-width="1.5"/><circle cx="24" cy="26" r="8" fill="none" stroke="#999" stroke-width="1.2"/></svg>',
    network: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 16l8-10 8 10" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="18" r="2" fill="currentColor"/></svg>',
    drive: '<svg viewBox="0 0 48 48" width="32" height="32"><rect x="4" y="14" width="40" height="20" rx="3" fill="#e8e8e8" stroke="#999" stroke-width="1.5"/><rect x="6" y="16" width="36" height="16" rx="2" fill="#fff"/><rect x="8" y="18" width="8" height="4" rx="1" fill="#58a6ff"/><rect x="8" y="26" width="12" height="2" rx="1" fill="#ccc"/></svg>',
    settings: '<svg viewBox="0 0 48 48" width="32" height="32"><path d="M24 4l4 8h8l-4 6 4 8-8 4-4 8-4-8-8-4 4-8-4-6h8z" fill="#ccc" stroke="#999" stroke-width="1.5"/><circle cx="24" cy="24" r="6" fill="#fff" stroke="#999" stroke-width="1"/></svg>',
    terminal: '<svg viewBox="0 0 48 48" width="32" height="32"><rect x="6" y="8" width="36" height="32" rx="3" fill="#1a1a2e" stroke="#555" stroke-width="1.5"/><path d="M14 16l6 6-6 6M22 28h10" fill="none" stroke="#3fb950" stroke-width="2.5" stroke-linecap="round"/></svg>',
    services: '<svg viewBox="0 0 48 48" width="32" height="32"><rect x="10" y="6" width="28" height="36" rx="2" fill="#e8e8e8" stroke="#999" stroke-width="1.5"/><rect x="14" y="12" width="20" height="4" rx="1" fill="#58a6ff"/><rect x="14" y="20" width="16" height="3" rx="1" fill="#ccc"/><rect x="14" y="27" width="18" height="3" rx="1" fill="#ccc"/><rect x="14" y="34" width="12" height="3" rx="1" fill="#ccc"/></svg>',
    dashboard: '<svg viewBox="0 0 48 48" width="32" height="32"><rect x="6" y="6" width="16" height="20" rx="2" fill="#58a6ff" stroke="#4a90d9" stroke-width="1.2"/><rect x="26" y="6" width="16" height="14" rx="2" fill="#3fb950" stroke="#2ea32e" stroke-width="1.2"/><rect x="6" y="30" width="16" height="12" rx="2" fill="#d97706" stroke="#b85e00" stroke-width="1.2"/><rect x="26" y="24" width="16" height="18" rx="2" fill="#dc2626" stroke="#a51d1d" stroke-width="1.2"/></svg>',
    file: '<svg viewBox="0 0 48 48" width="32" height="32"><path d="M12 6h16l10 10v26H12V6z" fill="#fff" stroke="#999" stroke-width="1.5"/><path d="M28 6v10h10" fill="#e8e8e8" stroke="#999" stroke-width="1.5"/><rect x="16" y="22" width="16" height="2" rx="1" fill="#ccc"/><rect x="16" y="28" width="12" height="2" rx="1" fill="#ccc"/><rect x="16" y="34" width="14" height="2" rx="1" fill="#ccc"/></svg>',
    image: '<svg viewBox="0 0 48 48" width="32" height="32"><rect x="6" y="8" width="36" height="32" rx="2" fill="#fff" stroke="#999" stroke-width="1.5"/><circle cx="16" cy="18" r="4" fill="#58a6ff"/><polygon points="6,36 22,24 34,36" fill="#3fb950"/><rect x="30" y="22" width="4" height="14" fill="#d97706"/></svg>',
    link: '<svg viewBox="0 0 48 48" width="32" height="32"><path d="M36 24l-8 8-8-8 8-8z" fill="#e8e8e8" stroke="#999" stroke-width="1.5"/><path d="M28 20V10M28 38V32" stroke="#999" stroke-width="1.5" fill="none"/></svg>',
  },

  toggle() {
    if (this.active) this.hide();
    else this.show();
  },

  show() {
    this.active = true;
    document.getElementById('win7-overlay').classList.add('active');
    document.getElementById('sidebar').style.display = 'none';
    document.body.style.overflow = 'hidden';
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.updateTray();
    this._startGadgets();
    this.openApp('dashboard');
    this.openApp('terminal');
    this._startTerminalWatcher();
    this._startRefreshTimers();
    this._playSound('startup');
    if (this._pinnedApps.length === 0) this._pinnedApps = ['terminal', 'dashboard', 'files'];
  },

  hide() {
    this.active = false;
    document.getElementById('win7-overlay').classList.remove('active');
    document.getElementById('sidebar').style.display = '';
    document.body.style.overflow = '';
    if (this.clockInterval) { clearInterval(this.clockInterval); this.clockInterval = null; }
    this._stopGadgets();
    this._detachTerminal();
    this._stopTerminalWatcher();
    this._stopRefreshTimers();
    for (const id of Object.keys(this.windows)) this.closeWindow(id, true);
    this.hideContextMenu();
    this.hideCalendar();
    this._playSound('shutdown');
  },

  createWindow(opts) {
    if (this.windows[opts.id]) {
      this.focusWindow(opts.id);
      if (this.windows[opts.id].minimized) this.restoreWindow(opts.id);
      return this.windows[opts.id];
    }

    const defaults = {
      width: 500, height: 350, icon: '\u{1F4C4}',
      x: 80 + (Object.keys(this.windows).length * 28) % 280,
      y: 40 + (Object.keys(this.windows).length * 22) % 180,
      content: '', onClose: null, resizable: true, modal: false,
    };
    const o = { ...defaults, ...opts };

    const container = document.getElementById('win7-windows-container');
    const el = document.createElement('div');
    el.className = 'win7-window show';
    el.id = 'win7-win-' + o.id;
    el.style.cssText = 'width:' + o.width + 'px;height:' + o.height + 'px;left:' + o.x + 'px;top:' + o.y + 'px;z-index:' + (++this.windowZIndex);

    const iconSvg = this._getWinIconSvg(o.id, o.icon);

    el.innerHTML = [
      '<div class="win7-win-titlebar" data-win="' + o.id + '">',
      '<span class="win7-win-icon">' + iconSvg + '</span>',
      '<span class="win7-win-title">' + this.esc(o.title) + '</span>',
      '<div class="win7-win-btns">',
      '<button class="win7-win-btn minimize" data-win="' + o.id + '" data-action="minimize">' + this.SVG.min + '</button>',
      '<button class="win7-win-btn maximize" data-win="' + o.id + '" data-action="maximize">' + this.SVG.max + '</button>',
      '<button class="win7-win-btn close" data-win="' + o.id + '" data-action="close">' + this.SVG.close + '</button>',
      '</div></div>',
      '<div class="win7-win-body" data-win="' + o.id + '">' + o.content + '</div>',
      o.resizable ? '<div class="win7-win-resize-handle n" data-win="' + o.id + '" data-edge="n"></div><div class="win7-win-resize-handle s" data-win="' + o.id + '" data-edge="s"></div><div class="win7-win-resize-handle w" data-win="' + o.id + '" data-edge="w"></div><div class="win7-win-resize-handle e" data-win="' + o.id + '" data-edge="e"></div><div class="win7-win-resize-handle nw" data-win="' + o.id + '" data-edge="nw"></div><div class="win7-win-resize-handle ne" data-win="' + o.id + '" data-edge="ne"></div><div class="win7-win-resize-handle sw" data-win="' + o.id + '" data-edge="sw"></div><div class="win7-win-resize-handle se" data-win="' + o.id + '" data-edge="se"></div>' : '',
    ].join('');

    if (o.modal) {
      const overlay = document.createElement('div');
      overlay.className = 'win7-modal-overlay';
      overlay.style.cssText = 'position:absolute;inset:0;z-index:' + (this.windowZIndex - 1) + ';background:rgba(0,0,0,0.02)';
      container.appendChild(overlay);
      el.dataset.modalOverlay = overlay;
    }

    setTimeout(() => el.classList.remove('show'), 200);

    container.appendChild(el);

    const winObj = { id: o.id, el, minimized: false, maximized: false, normalRect: null, title: o.title, icon: o.icon, onClose: o.onClose, type: o.id === 'terminal' ? 'terminal' : 'app', modal: o.modal };
    this.windows[o.id] = winObj;
    this.windowOrder.push(o.id);
    this.updateTaskbar();
    if (this.startMenuOpen) this.toggleStartMenu();

    const dataTypes = { dashboard: 'dashboard', files: 'files', processes: 'processes', services: 'services' };
    if (dataTypes[o.id] && window.send) {
      window.send(dataTypes[o.id] === 'files' ? { type: 'files', path: '.' } : { type: dataTypes[o.id] });
    }

    return winObj;
  },

  _getWinIconSvg(id, icon) {
    const svgs = { terminal: this.SVG.terminal, dashboard: this.SVG.dashboard, files: this.SVG.folder, taskmgr: this.SVG.settings, services: this.SVG.services, computer: this.SVG.computer };
    if (svgs[id]) return svgs[id];
    return '<span style="font-size:14px">' + icon + '</span>';
  },

  closeWindow(id, silent) {
    const w = this.windows[id];
    if (!w) return;
    if (id === 'terminal' && this.terminalAttached) this._detachTerminal();
    if (!silent) {
      w.el.classList.add('hide');
      setTimeout(() => { if (w.el) w.el.remove(); }, 100);
    } else {
      if (w.el) w.el.remove();
    }
    if (w.modal && w.el.dataset.modalOverlay) {
      w.el.dataset.modalOverlay.remove();
    }
    delete this.windows[id];
    const idx = this.windowOrder.indexOf(id);
    if (idx > -1) this.windowOrder.splice(idx, 1);
    if (!silent) { this.updateTaskbar(); this._playSound('close'); }
    if (w.onClose) w.onClose();
  },

  minimizeWindow(id) {
    const w = this.windows[id];
    if (!w || w.minimized) return;
    if (id === 'terminal' && this.terminalAttached) this._detachTerminal();
    w.minimized = true;
    if (!w.normalRect) {
      const s = w.el.style;
      w.normalRect = { width: s.width, height: s.height, left: s.left, top: s.top };
    }
    w.el.classList.add('minimizing');
    setTimeout(() => {
      w.el.style.display = 'none';
      w.el.classList.remove('minimizing');
    }, 120);
    this.updateTaskbar();
    this._playSound('minimize');
  },

  maximizeWindow(id) {
    const w = this.windows[id];
    if (!w) return;
    if (w.maximized) { this.restoreWindow(id); return; }
    w.maximized = true;
    if (!w.normalRect) {
      const s = w.el.style;
      w.normalRect = { width: s.width, height: s.height, left: s.left, top: s.top };
    }
    if (id === 'terminal' && this.terminalAttached) this._detachTerminal();
    const taskbar = document.getElementById('win7-taskbar');
    const tbH = taskbar ? taskbar.offsetHeight : 40;
    w.el.classList.add('restoring');
    setTimeout(() => {
      w.el.classList.remove('restoring');
      w.el.style.cssText = 'left:0;top:0;right:0;bottom:' + tbH + 'px;width:auto;height:auto;z-index:' + (++this.windowZIndex);
      w.el.classList.add('maximized');
    }, 60);
    this.focusWindow(id);
    if (id === 'terminal') setTimeout(() => this._attachTerminal(), 100);
  },

  restoreWindow(id) {
    const w = this.windows[id];
    if (!w || !w.normalRect) return;
    const wasMinimized = w.minimized;
    if (w.maximized) {
      w.maximized = false;
      w.el.classList.remove('maximized');
    }
    w.minimized = false;
    const r = w.normalRect;
    w.el.classList.add('restoring');
    setTimeout(() => {
      w.el.classList.remove('restoring');
      w.el.style.cssText = 'display:block;width:' + r.width + ';height:' + r.height + ';left:' + r.left + ';top:' + r.top + ';right:;bottom:;z-index:' + (++this.windowZIndex);
    }, wasMinimized ? 0 : 60);
    this.focusWindow(id);
    this.updateTaskbar();
    if (id === 'terminal') setTimeout(() => this._attachTerminal(), 100);
  },

  focusWindow(id) {
    const w = this.windows[id];
    if (!w || w.minimized) return;
    w.el.style.zIndex = ++this.windowZIndex;
    const idx = this.windowOrder.indexOf(id);
    if (idx > -1) { this.windowOrder.splice(idx, 1); this.windowOrder.push(id); }
    for (const wid of Object.keys(this.windows)) {
      const w2 = this.windows[wid];
      if (w2 && w2.el) w2.el.classList.toggle('inactive', wid !== id);
    }
    this.updateTaskbar();
    if (id === 'terminal') {
      const s = this._getActiveTermSession();
      if (s && s.term) setTimeout(() => s.term.focus(), 50);
    }
  },

  _getActiveTermSession() {
    if (window.__getSessions && window.__getActiveId) {
      return window.__getSessions()[window.__getActiveId()];
    }
    return null;
  },

  shakeWindow(id) {
    const w = this.windows[id];
    if (!w) return;
    for (const wid of Object.keys(this.windows)) {
      if (wid === id) continue;
      const w2 = this.windows[wid];
      if (w2 && !w2.minimized) {
        w2.minimized = true;
        if (!w2.normalRect) {
          const s = w2.el.style;
          w2.normalRect = { width: s.width, height: s.height, left: s.left, top: s.top };
        }
        w2.el.style.display = 'none';
      }
    }
    this.updateTaskbar();
  },

  snapWindow(id, side) {
    const w = this.windows[id];
    if (!w) return;
    const desktop = document.getElementById('win7-desktop');
    const taskbar = document.getElementById('win7-taskbar');
    const tbH = taskbar ? taskbar.offsetHeight : 40;
    const dw = desktop.clientWidth;
    const dh = desktop.clientHeight - tbH;
    if (w.maximized) {
      w.el.style.cssText = 'width:;height:;left:;top:;right:;bottom:;';
      w.el.classList.remove('maximized');
      w.maximized = false;
    }
    w.normalRect = w.normalRect || { width: w.el.style.width, height: w.el.style.height, left: w.el.style.left, top: w.el.style.top };
    if (side === 'left') {
      w.el.style.cssText = 'width:' + Math.floor(dw / 2) + 'px;height:' + dh + 'px;left:0;top:0;right:;bottom:;z-index:' + (++this.windowZIndex);
    } else if (side === 'right') {
      w.el.style.cssText = 'width:' + Math.floor(dw / 2) + 'px;height:' + dh + 'px;left:' + Math.floor(dw / 2) + 'px;top:0;right:;bottom:;z-index:' + (++this.windowZIndex);
    } else if (side === 'top') {
      this.maximizeWindow(id);
    }
    this.focusWindow(id);
  },

  _checkSnapRegion(id, x, y) {
    const w = this.windows[id];
    if (!w || w.maximized) return;
    const desktop = document.getElementById('win7-desktop');
    const dw = desktop.clientWidth;
    const dh = desktop.clientHeight;
    if (Math.abs(x - 0) < 4) return 'left';
    if (Math.abs(x - dw) < 4) return 'right';
    if (Math.abs(y - 0) < 4) return 'top';
    return null;
  },

  updateTaskbar() {
    const tb = document.getElementById('win7-taskbar-windows');
    if (!tb) return;
    const focusId = this.windowOrder.length ? this.windowOrder[this.windowOrder.length - 1] : null;
    const allIds = this.windowOrder.filter(id => this.windows[id]);
    tb.innerHTML = allIds.map(id => {
      const w = this.windows[id];
      if (!w) return '';
      const active = id === focusId ? ' active' : '';
      const icon = this._getTaskbarIcon(id);
      return '<button class="win7-taskbar-btn' + active + '" data-win="' + id + '">'
        + '<span class="win7-tb-icon">' + icon + '</span>'
        + '<span class="win7-tb-label">' + this.esc(w.title) + '</span>'
        + '</button>';
    }).join('');
  },

  _showTaskbarPreview(id, btn) {
    const w = this.windows[id];
    if (!w || w.minimized) return;
    const rect = btn.getBoundingClientRect();
    const popup = document.getElementById('win7-peek-popup');
    if (!popup) return;
    popup.classList.add('active');
    popup.style.cssText = 'left:' + (rect.left + rect.width / 2 - 80) + 'px;bottom:42px';
    popup.innerHTML = '<div class="win7-peek-item" data-win="' + id + '"><div class="win7-peek-thumb">' + this._getTaskbarIcon(id) + '</div><div>' + this.esc(w.title) + '</div></div>';
    popup.onclick = () => { this.focusWindow(id); popup.classList.remove('active'); };
    this._peekTimer = null;
  },

  _hideTaskbarPreview() {
    if (this._peekTimer) clearTimeout(this._peekTimer);
    this._peekTimer = setTimeout(() => {
      const popup = document.getElementById('win7-peek-popup');
      if (popup) popup.classList.remove('active');
    }, 200);
  },

  _getTaskbarIcon(id) {
    const icons = {
      terminal: '\u26A1', dashboard: '\u{1F4CA}', files: '\u{1F4C1}',
      taskmgr: '\u2699', services: '\u{1F527}',
    };
    return icons[id] || '\u{1F4C4}';
  },

  updateClock() {
    const el = document.getElementById('win7-clock');
    if (!el) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    el.textContent = hh + ':' + mm;
    const gadgetTime = document.getElementById('win7-gadget-time');
    if (gadgetTime) gadgetTime.textContent = hh + ':' + mm;
    const gadgetDate = document.getElementById('win7-gadget-date');
    if (gadgetDate) {
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      gadgetDate.textContent = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate();
    }
  },

  showCalendar() {
    const existing = document.getElementById('win7-calendar-popup');
    if (existing) { existing.remove(); return; }
    const clock = document.getElementById('win7-clock');
    if (!clock) return;
    const rect = clock.getBoundingClientRect();
    const now = new Date();
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const y = now.getFullYear();
    const m = now.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const lastDate = new Date(y, m + 1, 0).getDate();
    const today = now.getDate();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    let calDays = '';
    for (let i = 0; i < firstDay; i++) calDays += '<span></span>';
    for (let d = 1; d <= lastDate; d++) {
      calDays += '<span' + (d === today ? ' style="background:var(--w-blue);color:#fff;border-radius:2px"' : '') + '>' + d + '</span>';
    }
    const popup = document.createElement('div');
    popup.id = 'win7-calendar-popup';
    popup.style.cssText = 'position:fixed;z-index:10020;right:' + (window.innerWidth - rect.right) + 'px;bottom:42px;background:#f0f3f8;border:1px solid #b0b8c4;box-shadow:3px 3px 10px rgba(0,0,0,0.12);border-radius:3px;padding:8px;min-width:210px;font-size:11px;color:#1a3a6e';
    popup.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:6px;border-bottom:1px solid #d4d8de;margin-bottom:6px"><span style="font-weight:600">' + months[m] + ' ' + y + '</span><span style="font-size:18px;font-weight:300;color:rgba(0,0,0,0.3)">' + hh + ':' + mm + '</span></div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center">' + days.map(d => '<span style="color:rgba(0,0,0,0.25);font-size:9px">' + d + '</span>').join('') + calDays + '</div>';
    document.getElementById('win7-overlay').appendChild(popup);
    setTimeout(() => document.addEventListener('click', this._closeCalHandler = (e) => { if (!e.target.closest('#win7-calendar-popup') && !e.target.closest('#win7-clock')) { this.hideCalendar(); } }), 10);
  },

  hideCalendar() {
    const p = document.getElementById('win7-calendar-popup');
    if (p) p.remove();
    if (this._closeCalHandler) { document.removeEventListener('click', this._closeCalHandler); this._closeCalHandler = null; }
  },

  updateTray() {
    const n = document.getElementById('win7-tray-network');
    const v = document.getElementById('win7-tray-volume');
    const p = document.getElementById('win7-tray-power');
    const a = document.getElementById('win7-tray-action');
    if (n) { n.title = 'Network: Connected'; n.innerHTML = '\u{1F4F6}'; }
    if (v) { v.title = 'Volume: 100%'; v.innerHTML = '\u{1F50A}'; }
    if (p) { p.title = 'Power: AC'; p.innerHTML = '\u26A1'; }
    if (a) { a.title = 'No issues'; a.innerHTML = '\u2691'; }
  },

  showAltTab(dir) {
    const visible = this.windowOrder.filter(id => this.windows[id] && !this.windows[id].minimized);
    if (visible.length < 2 && !this.altTabActive) return;
    if (!this.altTabActive) {
      this.altTabActive = true;
      this.altTabIndex = visible.length - 1;
      const overlay = document.createElement('div');
      overlay.id = 'win7-alttab-overlay';
      overlay.innerHTML = '<div class="win7-alttab-bg"></div><div class="win7-alttab-list" id="win7-alttab-list"></div>';
      document.getElementById('win7-overlay').appendChild(overlay);
    }
    const len = this.windowOrder.filter(id => this.windows[id] && !this.windows[id].minimized).length;
    this.altTabIndex = (this.altTabIndex + dir + len) % len;
    this.renderAltTab();
  },

  renderAltTab() {
    const list = document.getElementById('win7-alttab-list');
    if (!list) return;
    const visible = this.windowOrder.filter(id => this.windows[id] && !this.windows[id].minimized);
    list.innerHTML = visible.map((id, i) => {
      const w = this.windows[id];
      if (!w) return '';
      const active = i === this.altTabIndex ? ' active' : '';
      return '<div class="win7-alttab-item' + active + '" data-win="' + id + '">'
        + '<div class="win7-alttab-icon">' + this._getTaskbarIcon(id) + '</div>'
        + '<div class="win7-alttab-label">' + Win7.esc(w.title) + '</div></div>';
    }).join('');
  },

  hideAltTab() {
    if (!this.altTabActive) return;
    this.altTabActive = false;
    const overlay = document.getElementById('win7-alttab-overlay');
    if (overlay) overlay.remove();
    if (this.altTabIndex >= 0) {
      const visible = this.windowOrder.filter(id => this.windows[id] && !this.windows[id].minimized);
      const target = visible[this.altTabIndex];
      if (target) this.focusWindow(target);
    }
    this.altTabIndex = 0;
  },

  showFlip3D() {
    if (this.flip3DActive) return;
    const visible = this.windowOrder.filter(id => this.windows[id] && !this.windows[id].minimized);
    if (visible.length < 2) return;
    this.flip3DActive = true;
    this.altTabIndex = visible.length - 1;
    const overlay = document.createElement('div');
    overlay.id = 'win7-flip3d-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;perspective:1200px;background:rgba(0,0,0,0.15);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = '<div id="win7-flip3d-stage" style="position:relative;transform-style:preserve-3d;width:80%;height:80%"></div>';
    document.getElementById('win7-overlay').appendChild(overlay);
    this._renderFlip3D();
  },

  _renderFlip3D() {
    const stage = document.getElementById('win7-flip3d-stage');
    if (!stage) return;
    const visible = this.windowOrder.filter(id => this.windows[id] && !this.windows[id].minimized);
    const angle = 360 / visible.length;
    const radius = Math.min(400, visible.length * 40);
    stage.innerHTML = visible.map((id, i) => {
      const w = this.windows[id];
      const rot = i * angle;
      const isActive = i === this.altTabIndex;
      const scale = isActive ? 1.1 : 0.8;
      return '<div class="win7-flip3d-card" data-win="' + id + '" style="position:absolute;left:50%;top:50%;width:300px;height:200px;margin-left:-150px;margin-top:-100px;transform:translateZ(' + (-radius) + 'px) rotateY(' + rot + 'deg) translateZ(' + radius + 'px) scale(' + scale + ');cursor:pointer;border-radius:8px;background:rgba(255,255,255,0.85);backdrop-filter:blur(8px);border:2px solid ' + (isActive ? 'rgba(0,120,215,0.3)' : 'transparent') + ';box-shadow:0 8px 32px rgba(0,0,0,0.1);display:flex;flex-direction:column;overflow:hidden">'
        + '<div style="padding:8px 12px;font-size:11px;font-weight:600;color:rgba(0,0,0,0.5);border-bottom:1px solid rgba(0,0,0,0.04);display:flex;align-items:center;gap:6px"><span>' + this._getTaskbarIcon(id) + '</span><span>' + this.esc(w.title) + '</span></div>'
        + '<div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:32px;opacity:0.3">' + this._getTaskbarIcon(id) + '</div>'
        + '</div>';
    }).join('');
    stage.style.transform = 'rotateY(' + (-this.altTabIndex * angle) + 'deg)';
  },

  hideFlip3D() {
    if (!this.flip3DActive) return;
    this.flip3DActive = false;
    const overlay = document.getElementById('win7-flip3d-overlay');
    if (overlay) overlay.remove();
    if (this.altTabIndex >= 0) {
      const visible = this.windowOrder.filter(id => this.windows[id] && !this.windows[id].minimized);
      const target = visible[this.altTabIndex];
      if (target) this.focusWindow(target);
    }
    this.altTabIndex = 0;
  },

  openRunDialog() {
    this.createWindow({
      id: 'run-' + Date.now(), title: 'Run', icon: '\u{1F4DD}',
      width: 400, height: 170, modal: true,
      content: '<div style="padding:20px"><div style="font-size:11px;color:rgba(0,0,0,0.5);margin-bottom:12px">Type the name of a program, folder, document, or Internet resource to open.</div><div style="display:flex;gap:8px;align-items:center"><span style="font-size:11px;color:rgba(0,0,0,0.4);white-space:nowrap">Open:</span><input id="win7-run-input" style="flex:1;padding:4px 8px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:3px;color:rgba(0,0,0,0.7);font-size:12px;font-family:inherit;outline:none" spellcheck="false" autofocus></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button id="win7-run-ok" style="min-width:70px">OK</button><button id="win7-run-cancel" style="min-width:70px">Cancel</button></div></div>',
      onClose: null,
    });
    setTimeout(() => {
      const inp = document.getElementById('win7-run-input');
      if (inp) {
        inp.focus();
        inp.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') Win7._execRunCommand(inp.value);
          if (ev.key === 'Escape') { const w = Win7.windows[inp.closest('.win7-window')?.id]; if (w) Win7.closeWindow(w.id); }
        });
      }
      document.getElementById('win7-run-ok')?.addEventListener('click', () => { const v = document.getElementById('win7-run-input'); if (v) Win7._execRunCommand(v.value); });
      document.getElementById('win7-run-cancel')?.addEventListener('click', () => { const winId = document.getElementById('win7-run-cancel')?.closest('.win7-window')?.id; if (winId) Win7.closeWindow(winId); });
    }, 50);
  },

  _execRunCommand(cmd) {
    if (!cmd) return;
    const map = {
      'cmd': 'terminal', 'terminal': 'terminal', 'explorer': 'files',
      'control': 'panel', 'taskmgr': 'taskmgr', 'winver': 'winver',
      'notepad': null, 'calc': null, 'msconfig': null, 'regedit': null,
    };
    const app = map[cmd.toLowerCase().trim()];
    if (app) {
      Win7.openApp(app);
      const w = Win7.windows[Object.keys(Win7.windows).find(k => k.startsWith('run-'))];
      if (w) Win7.closeWindow(w.id);
    } else {
      const w = Win7.windows[Object.keys(Win7.windows).find(k => k.startsWith('run-'))];
      if (w) {
        const body = w.el.querySelector('.win7-win-body');
        if (body) body.innerHTML = '<div style="padding:24px;text-align:center"><div style="color:rgba(220,38,38,0.6);font-size:14px;margin-bottom:8px">\u26A0</div><div style="color:rgba(0,0,0,0.5)">\'<span style="font-family:monospace">' + Win7.esc(cmd) + '</span>\' is not recognized.</div></div>';
      }
    }
  },

  _handleFileAction(action, path, type) {
    if (!path) return;
    switch (action) {
      case 'file-open':
        if (type === 'dir' && window.send) {
          const addr = document.querySelector('#win7-win-files .win7-explorer-addr');
          if (addr) Win7.fileHistory.push(addr.value);
          window.send({ type: 'files', path });
        }
        break;
      case 'file-copy':
        Win7._clipboard = { action: 'copy', path };
        Win7._notify('Copy', 'Copied: ' + path.split('/').pop());
        break;
      case 'file-cut':
        Win7._clipboard = { action: 'cut', path };
        Win7._notify('Cut', 'Cut: ' + path.split('/').pop());
        break;
      case 'file-rename': {
        const name = path.split('/').pop();
        const newName = prompt('Rename:', name);
        if (newName && newName !== name && window.send) {
          const parent = path.replace(/\/[^/]*$/, '');
          window.send({ type: 'file-rename', path, newPath: parent + '/' + newName });
        }
        break;
      }
      case 'file-delete':
        if (confirm('Delete ' + path + '?')) {
          if (window.send) window.send({ type: 'file-delete', path });
        }
        break;
      case 'file-paste': {
        if (!Win7._clipboard || !window.send) { Win7._notify('Paste', 'Nothing to paste'); break; }
        const dest = document.querySelector('#win7-win-files .win7-explorer-addr');
        const destPath = dest ? dest.value : '.';
        const act = Win7._clipboard.action === 'cut' ? 'file-move' : 'file-copy';
        window.send({ type: act, path: Win7._clipboard.path, dest: destPath + '/' + Win7._clipboard.path.split('/').pop() });
        Win7._clipboard = null;
        break;
      }
      case 'file-new-folder': {
        const parent = path || '.';
        const name = prompt('New folder name:', 'New Folder');
        if (name && window.send) window.send({ type: 'file-mkdir', path: parent + '/' + name });
        break;
      }
      case 'file-props': {
        const name = path.split('/').pop();
        const ot = type === 'dir' ? 'File folder' : 'File';
        Win7.createWindow({
          id: 'fileprops-' + Date.now(), title: name + ' Properties', icon: '\u{1F4DD}',
          width: 380, height: 260,
          content: '<div style="padding:20px;text-align:center;color:rgba(0,0,0,0.5)"><div style="font-size:36px;margin-bottom:8px">\u{1F4DD}</div><div style="font-weight:600;margin-bottom:4px;color:rgba(0,0,0,0.6)">' + Win7.esc(name) + '</div><div style="font-size:11px;color:rgba(0,0,0,0.35)">Type: ' + ot + '</div><div style="font-size:10px;color:rgba(0,0,0,0.25);margin-top:8px">Path: ' + Win7.esc(path) + '</div></div>',
        });
        break;
      }
    }
  },

  _refreshCurrentDir() {
    const addr = document.querySelector('#win7-win-files .win7-explorer-addr');
    if (addr && window.send) window.send({ type: 'files', path: addr.value });
  },

  _handleFileResult(m) {
    if (!m.success) { Win7._notify('Error', (m.action || 'Operation') + ' failed: ' + (m.error || 'Unknown')); return; }
    const names = { delete: 'Deleted', rename:'Renamed', mkdir:'Created', copy:'Copied', move:'Moved' };
    Win7._notify(names[m.action] || m.action, (m.path || '').split('/').pop() || 'Done');
    setTimeout(() => Win7._refreshCurrentDir(), 200);
  },

  _openSearch() {
    Win7.createWindow({
      id: 'search-' + Date.now(), title: 'Search Results', icon: '\u{1F50D}',
      width: 480, height: 320,
      content: '<div style="padding:16px"><div style="font-size:13px;font-weight:600;color:rgba(0,0,0,0.6);margin-bottom:8px">Search</div><div style="display:flex;gap:6px"><input id="win7-search-win" style="flex:1;padding:5px 8px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:3px;color:rgba(0,0,0,0.7);font-size:12px;font-family:inherit;outline:none" placeholder="Search files and folders..." spellcheck="false"><button id="win7-search-win-go" style="padding:4px 12px">Search</button></div><div style="margin-top:12px;color:rgba(0,0,0,0.25);font-size:11px" id="win7-search-win-results">Enter a search term and click Search.</div></div>',
    });
    setTimeout(() => {
      document.getElementById('win7-search-win')?.focus();
      document.getElementById('win7-search-win-go')?.addEventListener('click', () => {
        const q = document.getElementById('win7-search-win')?.value;
        const res = document.getElementById('win7-search-win-results');
        if (res) res.innerHTML = q ? 'Searching for "<b>' + Win7.esc(q) + '</b>"...<br><br><span style="color:rgba(0,0,0,0.2)">Search uses the File Explorer &mdash; navigate manually.</span>' : 'Enter a search term.';
      });
    }, 50);
  },

  /* ═══ DESKTOP ICON INTERACTION ═══ */
  _selectDesktopIcon(el, ctrl) {
    if (!ctrl) {
      document.querySelectorAll('.win7-desktop-icon').forEach(i => i.classList.remove('selected'));
    }
    el.classList.toggle('selected');
  },

  _launchDesktopShortcut(type) {
    if (type === 'computer') this.openApp('computer');
    else if (type === 'files') this.openApp('files');
    else if (type === 'recycle') {
      this.createWindow({
        id: 'recycle-' + Date.now(), title: 'Recycle Bin', icon: '\u{1F5D1}',
        width: 480, height: 340,
        content: '<div style="padding:24px;text-align:center;color:rgba(0,0,0,0.35)"><div style="font-size:48px;margin-bottom:12px">\u{1F5D1}</div><div>Recycle Bin</div><div style="font-size:10px;margin-top:8px;color:rgba(0,0,0,0.2)">Empty</div></div>',
      });
    }
  },

  _startDesktopSelection(x, y) {
    const sel = document.createElement('div');
    sel.className = 'win7-desktop-selection';
    sel.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:0;height:0';
    document.getElementById('win7-desktop').appendChild(sel);
    this._desktopSel = { el: sel, startX: x, startY: y };
  },

  _moveDesktopSelection(x, y) {
    if (!this._desktopSel) return;
    const d = this._desktopSel;
    const l = Math.min(d.startX, x), t = Math.min(d.startY, y);
    const w = Math.abs(x - d.startX), h = Math.abs(y - d.startY);
    d.el.style.cssText = 'left:' + l + 'px;top:' + t + 'px;width:' + w + 'px;height:' + h + 'px';
    document.querySelectorAll('.win7-desktop-icon').forEach(ic => {
      const r = ic.getBoundingClientRect();
      const overlap = !(r.right < l || r.left > l + w || r.bottom < t || r.top > t + h);
      ic.classList.toggle('selected', overlap);
    });
  },

  _endDesktopSelection() {
    if (this._desktopSel) {
      this._desktopSel.el.remove();
      this._desktopSel = null;
    }
  },

  /* ═══ START MENU ═══ */
  toggleStartMenu() {
    this.startMenuOpen = !this.startMenuOpen;
    document.getElementById('win7-start-menu').classList.toggle('active', this.startMenuOpen);
    document.getElementById('win7-start-btn').classList.toggle('active', this.startMenuOpen);
    if (!this.startMenuOpen) {
      document.getElementById('win7-search-input').value = '';
      this._filterStartMenu('');
    }
  },

  _filterStartMenu(q) {
    const items = document.querySelectorAll('.win7-start-item');
    const lower = q.toLowerCase().trim();
    items.forEach(el => {
      if (!lower) { el.style.display = ''; return; }
      const text = el.textContent.toLowerCase();
      el.style.display = text.includes(lower) ? '' : 'none';
    });
  },

  openApp(name) {
    this.hideContextMenu();
    if (this.startMenuOpen) this.toggleStartMenu();
    switch (name) {
      case 'terminal':
        this.createWindow({
          id: 'terminal', title: 'Terminal - WebWSL', icon: '\u26A1',
          width: 720, height: 420,
          content: '<div id="win7-term-container" style="height:100%;padding:4px;display:flex;flex-direction:column"></div>',
          onClose: () => { this.terminalAttached = false; },
        });
        setTimeout(() => this._attachTerminal(), 50);
        break;
      case 'dashboard':
        this.createWindow({
          id: 'dashboard', title: 'System Dashboard', icon: '\u{1F4CA}',
          width: 660, height: 480,
          content: '<div style="padding:20px;text-align:center;color:rgba(0,0,0,0.35)">Loading dashboard...</div>',
        });
        if (window.send) window.send({ type: 'dashboard' });
        break;
      case 'files':
        this.fileHistory = [];
        this.createWindow({
          id: 'files', title: 'File Explorer', icon: '\u{1F4C1}',
          width: 740, height: 480,
          content: this.filesExplorerHTML('.'),
        });
        if (window.send) window.send({ type: 'files', path: '.' });
        break;
      case 'taskmgr':
        this.createWindow({
          id: 'taskmgr', title: 'Task Manager', icon: '\u2699',
          width: 660, height: 440,
          content: this.taskManagerHTML(),
        });
        if (window.send) { window.send({ type: 'processes' }); window.send({ type: 'services' }); window.send({ type: 'dashboard' }); window.send({ type: 'network' }); }
        break;
      case 'services':
        this.createWindow({
          id: 'services', title: 'Task Manager - Services', icon: '\u{1F527}',
          width: 600, height: 400,
          content: '<div style="padding:20px;text-align:center;color:rgba(0,0,0,0.35)">Loading services...</div>',
        });
        if (window.send) window.send({ type: 'services' });
        break;
      case 'panel':
        this.createWindow({
          id: 'panel-' + Date.now(), title: 'Control Panel', icon: '\u2699',
          width: 540, height: 400,
          content: '<div style="padding:16px"><div style="font-size:14px;font-weight:600;margin-bottom:12px;color:rgba(0,0,0,0.7)">Control Panel</div><div style="display:flex;flex-wrap:wrap;gap:12px"><div class="win7-cp-item" data-action="dashboard"><div style="font-size:28px">\u{1F4CA}</div><div style="font-size:11px;margin-top:4px">System</div></div><div class="win7-cp-item" data-action="taskmgr"><div style="font-size:28px">\u2699</div><div style="font-size:11px;margin-top:4px">Administrative Tools</div></div><div class="win7-cp-item" data-action="files"><div style="font-size:28px">\u{1F4C1}</div><div style="font-size:11px;margin-top:4px">File Explorer Options</div></div><div class="win7-cp-item" data-action="services"><div style="font-size:28px">\u{1F527}</div><div style="font-size:11px;margin-top:4px">Services</div></div><div class="win7-cp-item" data-action="devices"><div style="font-size:28px">\u{1F4F1}</div><div style="font-size:11px;margin-top:4px">Devices and Printers</div></div><div class="win7-cp-item" data-action="personalize"><div style="font-size:28px">\u{1F3A8}</div><div style="font-size:11px;margin-top:4px">Personalization</div></div></div></div>',
        });
        break;
      case 'devices':
        this.createWindow({ id: 'devices-' + Date.now(), title: 'Devices and Printers', icon: '\u{1F4F1}', width: 460, height: 280, content: '<div style="padding:32px;text-align:center;color:rgba(0,0,0,0.35)"><div style="font-size:48px;margin-bottom:12px">\u{1F4F1}</div><div>No devices connected</div><div style="font-size:10px;margin-top:8px;color:rgba(0,0,0,0.2)">WebWSL virtual environment</div></div>' });
        break;
      case 'personalize':
        this.createWindow({ id: 'personalize-' + Date.now(), title: 'Personalization', icon: '\u{1F3A8}', width: 420, height: 260, content: '<div style="padding:24px;text-align:center;color:rgba(0,0,0,0.5);font-size:13px">Personalization</div><div style="padding:0 24px 24px;text-align:center;color:rgba(0,0,0,0.25);font-size:11px">Choose a color scheme for the desktop. Options: Aero, Basic, High Contrast.</div>' });
        break;
      case 'winver':
        this.createWindow({ id: 'winver-' + Date.now(), title: 'About Windows', icon: '\u{1F4BB}', width: 440, height: 300, content: '<div style="padding:32px;text-align:center"><div style="font-size:40px;margin-bottom:8px;opacity:0.5">\u{229E}</div><div style="font-size:18px;font-weight:600;color:rgba(0,0,0,0.7)">Microsoft Windows 7</div><div style="font-size:11px;color:rgba(0,0,0,0.35);margin-top:4px">WebWSL Edition &middot; Version 1.0</div><div style="font-size:10px;color:rgba(0,0,0,0.25);margin-top:12px">Microsoft Windows 7 WebWSL Edition. All rights reserved.</div><div style="font-size:10px;color:rgba(0,0,0,0.2);margin-top:4px">WebWSL virtual environment &middot; Linux ' + (navigator.platform || 'unknown') + '</div><div style="font-size:9px;color:rgba(0,0,0,0.15);margin-top:8px">WebWSL &copy; 2024-2026</div></div>' });
        break;
      case 'computer':
        this.createWindow({ id: 'computer-' + Date.now(), title: 'Computer', icon: '\u{1F4BB}', width: 460, height: 300, content: '<div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px"><div style="text-align:center;width:80px;padding:8px;cursor:pointer" data-action="dashboard"><div style="font-size:32px">\u{1F4CA}</div><div style="font-size:11px;margin-top:4px">System Dashboard</div></div><div style="text-align:center;width:80px;padding:8px;cursor:pointer" data-action="files"><div style="font-size:32px">\u{1F4C1}</div><div style="font-size:11px;margin-top:4px">File Explorer</div></div><div style="text-align:center;width:80px;padding:8px;cursor:pointer" data-action="services"><div style="font-size:32px">\u{1F527}</div><div style="font-size:11px;margin-top:4px">Services</div></div><div style="text-align:center;width:80px;padding:8px;cursor:pointer" data-action="taskmgr"><div style="font-size:32px">\u2699</div><div style="font-size:11px;margin-top:4px">Task Manager</div></div></div><div style="padding:8px 16px;border-top:1px solid rgba(0,0,0,0.04);font-size:11px;color:rgba(0,0,0,0.35)">System: WebWSL on Linux</div>' });
        break;
    }
  },

  /* ═══ DESKTOP CONTEXT MENU ═══ */
  showContextMenu(e, type) {
    e.preventDefault();
    const menuId = type === 'file' ? 'win7-file-ctx' : type === 'taskbar' ? 'win7-taskbar-ctx' : 'win7-context-menu';
    const menu = document.getElementById(menuId);
    if (!menu) return;
    menu.style.cssText = 'left:' + Math.min(e.clientX, window.innerWidth - menu.offsetWidth || 190) + 'px;top:' + Math.min(e.clientY, window.innerHeight - menu.offsetHeight || 200) + 'px';
    menu.classList.add('active');
    menu._ctxType = type || 'desktop';
  },

  hideContextMenu() {
    document.querySelectorAll('.win7-context-menu').forEach(el => el.classList.remove('active'));
  },

  /* ═══ FILE EXPLORER HTML ═══ */
  filesExplorerHTML(path) {
    return [
      '<div class="win7-explorer" style="display:flex;flex-direction:column;height:100%">',
      '<div class="win7-explorer-toolbar">',
      '<button data-action="back" title="Back">\u25C0</button>',
      '<button data-action="forward" title="Forward">\u25B6</button>',
      '<button data-action="up" title="Up">\u25B2</button>',
      '<div class="win7-toolbar-sep"></div>',
      '<button data-action="refresh" title="Refresh">\u21BB</button>',
      '<div class="win7-toolbar-sep"></div>',
      '<input class="win7-explorer-addr" value="' + this.esc(path) + '" spellcheck="false">',
      '<div class="win7-explorer-views">',
      '<button class="win7-view-btn active" data-view="icons" title="Icons">\u25A6</button>',
      '<button class="win7-view-btn" data-view="list" title="List">\u2630</button>',
      '<button class="win7-view-btn" data-view="details" title="Details">\u2261</button>',
      '</div></div>',
      '<div style="display:flex;flex:1;min-height:0">',
      '<div class="win7-explorer-tree">',
      '<div class="win7-tree-item" data-path="."><span class="win7-tree-arrow">\u25B6</span>\u{1F4C1} Desktop</div>',
      '<div class="win7-tree-item" data-path="/"><span class="win7-tree-arrow">\u25B6</span>\u{1F4BB} Computer</div>',
      '<div class="win7-tree-item" data-path="/tmp"><span class="win7-tree-arrow"></span>\u{1F4DD} Temp</div>',
      '</div>',
      '<div id="win7-files-grid" class="files-grid" style="flex:1;overflow:auto"></div>',
      '</div>',
      '<div class="win7-explorer-status" id="win7-explorer-status">Ready</div>',
      '</div>',
    ].join('');
  },

  _renderWin7Files(msg) {
    const grid = document.getElementById('win7-files-grid');
    if (!grid) return;
    const addr = document.querySelector('#win7-win-files .win7-explorer-addr');
    if (addr) addr.value = msg.path;
    const isRoot = msg.path === '/';
    const parent = isRoot ? '/' : msg.path.replace(/\/+$/, '').replace(/\/[^/]*$/, '') || '/';

    let h = '';
    if (!isRoot) {
      h += '<div class="file-item file-up-item" data-path="' + parent.replace(/"/g, '&quot;') + '" data-type="dir"><div class="file-icon">\u2190</div><div class="file-name">..</div></div>';
    }
    for (const e of msg.entries) {
      const p = (msg.path.replace(/\/$/, '') + '/' + e.name).replace(/"/g, '&quot;');
      const icon = this._getFileIcon(e.name, e.type);
      const cls = e.type === 'dir' ? ' file-folder' : '';
      h += '<div class="file-item' + cls + '" data-path="' + p + '" data-type="' + e.type + '"><div class="file-icon">' + icon + '</div><div class="file-name">' + this.esc(e.name) + (e.type === 'dir' ? '/' : '') + '</div>' + (e.type !== 'dir' ? '<div class="file-size-sm">' + this._fmtSize(e.size) + '</div>' : '') + '</div>';
    }
    grid.innerHTML = h || '<div class="empty-msg" style="padding:20px;text-align:center;color:rgba(0,0,0,0.2)">Empty directory</div>';

    const status = document.getElementById('win7-explorer-status');
    if (status) status.textContent = msg.entries.length + ' items';
  },

  _getFileIcon(name, type) {
    if (type === 'dir') return '\u{1F4C1}';
    if (type === 'link') return '\u{1F517}';
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    const icons = {
      js: '\u{1F7E8}', ts: '\u{1F7E6}', py: '\u{1F40D}', html: '\u{1F310}',
      css: '\u{1F3A8}', json: '\u2699', md: '\u{1F4DD}', txt: '\u{1F4C4}',
      zip: '\u{1F4E6}', tar: '\u{1F4E6}', gz: '\u{1F4E6}', rar: '\u{1F4E6}',
      exe: '\u2699', deb: '\u{1F4E6}', rpm: '\u{1F4E6}',
      png: '\u{1F5BC}', jpg: '\u{1F5BC}', jpeg: '\u{1F5BC}', gif: '\u{1F5BC}', svg: '\u{1F5BC}',
      mp3: '\u{1F3B5}', wav: '\u{1F3B5}', mp4: '\u{1F3AC}', mov: '\u{1F3AC}',
      pdf: '\u{1F4D1}', sh: '\u{1F4BB}', bash: '\u{1F4BB}', conf: '\u2699',
      c: '\u{1F4BB}', cpp: '\u{1F4BB}', h: '\u{1F4BB}', go: '\u{1F426}', rs: '\u{1F980}',
    };
    return icons[ext] || '\u{1F4C4}';
  },

  /* ═══ TASK MANAGER ═══ */
  taskManagerHTML() {
    return [
      '<div style="display:flex;flex-direction:column;height:100%">',
      '<div class="win7-tab-bar">',
      '<button class="win7-tab active" data-tab="processes">Processes</button>',
      '<button class="win7-tab" data-tab="performance">Performance</button>',
      '<button class="win7-tab" data-tab="services">Services</button>',
      '</div>',
      '<div class="win7-tab-body active" id="win7-tab-processes"><div id="win7-proc-list"></div></div>',
      '<div class="win7-tab-body" id="win7-tab-performance"><div id="win7-perf-content"><div style="padding:20px;text-align:center;color:rgba(0,0,0,0.35)">Loading performance data...</div></div></div>',
      '<div class="win7-tab-body" id="win7-tab-services"><div id="win7-svc-list"><div style="padding:20px;text-align:center;color:rgba(0,0,0,0.35)">Loading services...</div></div></div>',
      '</div>',
    ].join('');
  },

  _renderWin7Processes(msg) {
    const c = document.getElementById('win7-proc-list');
    if (!c) return;
    const list = msg.list || [];
    const sorted = list.sort((a, b) => b.cpu - a.cpu).slice(0, 30);
    let h = '<table style="width:100%;border-collapse:collapse;font-size:11px">';
    h += '<tr style="background:linear-gradient(180deg,#e8edf4,#dce3ec);color:#3a5a7e"><th style="text-align:left;padding:3px 6px;border-bottom:1px solid #c8d0d8">PID</th><th style="text-align:left;padding:3px 6px;border-bottom:1px solid #c8d0d8">Name</th><th style="padding:3px 6px;border-bottom:1px solid #c8d0d8">CPU</th><th style="padding:3px 6px;border-bottom:1px solid #c8d0d8">MEM</th><th style="padding:3px 6px;border-bottom:1px solid #c8d0d8"></th></tr>';
    for (const p of sorted) {
      h += '<tr style="border-bottom:1px solid #e0e4e8"><td style="padding:2px 6px;color:rgba(0,0,0,0.4)">' + p.pid + '</td><td style="padding:2px 6px">' + this.esc(p.command) + '</td><td style="padding:2px 6px;color:' + (p.cpu > 50 ? '#dc2626' : p.cpu > 20 ? '#d97706' : '#16a34a') + '">' + p.cpu.toFixed(1) + '%</td><td style="padding:2px 6px;color:' + (p.mem > 50 ? '#dc2626' : '#16a34a') + '">' + p.mem.toFixed(1) + '%</td><td style="padding:2px 6px"><button class="win7-btn-kill" data-pid="' + p.pid + '">Kill</button></td></tr>';
    }
    h += '</table>';
    c.innerHTML = h || '<div style="padding:20px;text-align:center;color:rgba(0,0,0,0.2)">No processes</div>';
  },

  _renderWin7Services(msg) {
    const c = document.getElementById('win7-svc-list');
    if (!c) return;
    const list = msg.list || [];
    let h = '<table style="width:100%;border-collapse:collapse;font-size:11px">';
    h += '<tr style="background:linear-gradient(180deg,#e8edf4,#dce3ec);color:#3a5a7e"><th style="text-align:left;padding:3px 6px;border-bottom:1px solid #c8d0d8">Name</th><th style="padding:3px 6px;border-bottom:1px solid #c8d0d8">Status</th><th style="padding:3px 6px;border-bottom:1px solid #c8d0d8"></th></tr>';
    for (const s of list) {
      h += '<tr style="border-bottom:1px solid #e0e4e8"><td style="padding:2px 6px">' + this.esc(s.name) + '</td><td style="padding:2px 6px;color:' + (s.active ? '#16a34a' : 'rgba(0,0,0,0.4)') + '">' + (s.active ? 'Running' : 'Stopped') + '</td><td style="padding:2px 6px"><button class="win7-btn-svc" data-svc="' + this.esc(s.name) + '" data-action="' + (s.active ? 'stop' : 'start') + '" style="background:' + (s.active ? 'rgba(220,38,38,0.06)' : 'rgba(22,163,74,0.06)') + ';border:1px solid ' + (s.active ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)') + ';color:' + (s.active ? '#dc2626' : '#16a34a') + '">' + (s.active ? 'Stop' : 'Start') + '</button></td></tr>';
    }
    h += '</table>';
    c.innerHTML = h || '<div style="padding:20px;text-align:center;color:rgba(0,0,0,0.2)">No services</div>';
  },

  _renderWin7Performance(msg) {
    const c = document.getElementById('win7-perf-content');
    if (!c) return;
    const d = msg.data || {};
    const cpu = d.cpu || 0;
    const mem = d.mem || 0;
    c.innerHTML = '<div style="padding:16px"><div style="font-size:13px;font-weight:600;color:rgba(0,0,0,0.6);margin-bottom:12px">Performance</div><div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(0,0,0,0.4);margin-bottom:2px"><span>CPU Usage</span><span>' + cpu.toFixed(1) + '%</span></div><div class="win7-progress"><div class="win7-progress-bar" style="width:' + Math.min(cpu, 100) + '%"></div></div></div><div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(0,0,0,0.4);margin-bottom:2px"><span>Memory</span><span>' + mem.toFixed(1) + '%</span></div><div class="win7-progress"><div class="win7-progress-bar" style="width:' + Math.min(mem, 100) + '%"></div></div></div></div>';
  },

  /* ═══ WINDOW DRAG ═══ */
  _startDrag(e) {
    const titlebar = e.target.closest('.win7-win-titlebar');
    if (!titlebar) return;
    const id = titlebar.dataset.win;
    const w = this.windows[id];
    if (!w || w.maximized) return;

    const btn = e.target.closest('.win7-win-btn');
    if (btn) return;

    this.focusWindow(id);
    titlebar.classList.add('dragging');

    const rect = w.el.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    this.dragData = { id, dx, dy, startX: e.clientX, startY: e.clientY, titlebar, moved: false };

    const onMove = (ev) => {
      if (!this.dragData) return;
      this.dragData.moved = true;
      const snapSide = this._checkSnapRegion(id, ev.clientX, ev.clientY);
      w.el.style.left = (ev.clientX - this.dragData.dx) + 'px';
      w.el.style.top = (ev.clientY - this.dragData.dy) + 'px';
      w.el.style.right = '';
      w.el.style.bottom = '';
      w.el.style.width = '';
      w.el.style.height = '';

      if (snapSide !== this._snapRegion) {
        this._snapRegion = snapSide;
        w.el.style.outline = snapSide ? '3px solid rgba(0,120,215,0.4)' : '';
      }
    };

    const onUp = (ev) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (this.dragData) {
        if (!this.dragData.moved && ev.clientX === this.dragData.startX && ev.clientY === this.dragData.startY) {
          this.shakeWindow(id);
        } else if (this._snapRegion) {
          w.el.style.outline = '';
          this.snapWindow(id, this._snapRegion);
          this._snapRegion = null;
        }
        titlebar.classList.remove('dragging');
        this.dragData = null;
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  },

  _startResize(e) {
    const handle = e.target.closest('.win7-win-resize-handle');
    if (!handle) return;
    const id = handle.dataset.win;
    const w = this.windows[id];
    if (!w || w.maximized) return;
    e.preventDefault();
    this.focusWindow(id);
    const edge = handle.dataset.edge;
    const rect = w.el.getBoundingClientRect();
    this.resizeData = { id, edge, startX: e.clientX, startY: e.clientY, rect };

    const onMove = (ev) => {
      if (!this.resizeData) return;
      const d = this.resizeData;
      const dx = ev.clientX - d.startX, dy = ev.clientY - d.startY;
      let { left, top, width, height } = d.rect;
      if (edge.includes('e')) width = Math.max(250, d.rect.width + dx);
      if (edge.includes('w')) { width = Math.max(250, d.rect.width - dx); left = d.rect.left + d.rect.width - width; }
      if (edge.includes('s')) height = Math.max(120, d.rect.height + dy);
      if (edge.includes('n')) { height = Math.max(120, d.rect.height - dy); top = d.rect.top + d.rect.height - height; }
      w.el.style.cssText = 'left:' + left + 'px;top:' + top + 'px;width:' + width + 'px;height:' + height + 'px;right:;bottom:;z-index:' + this.windowZIndex;
      if (!w.normalRect) w.normalRect = { width: d.rect.width + 'px', height: d.rect.height + 'px', left: d.rect.left + 'px', top: d.rect.top + 'px' };
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.resizeData = null;
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  },

  /* ═══ NOTIFICATIONS ═══ */
  _notify(title, text) {
    const id = 'win7-notif-' + Date.now();
    const el = document.createElement('div');
    el.id = id;
    el.className = 'win7-notification';
    el.innerHTML = '<div class="win7-notif-icon">\u{1F514}</div><div class="win7-notif-body"><div class="win7-notif-title">' + this.esc(title) + '</div><div class="win7-notif-text">' + this.esc(text) + '</div></div><button class="win7-notif-close">&times;</button>';
    document.getElementById('win7-overlay').appendChild(el);
    el.querySelector('.win7-notif-close').addEventListener('click', () => el.remove());
    if (this.notificationTimers[id]) clearTimeout(this.notificationTimers[id]);
    this.notificationTimers[id] = setTimeout(() => { if (el.parentNode) el.remove(); delete this.notificationTimers[id]; }, 4000);
  },

  _playSound(name) { try { if (window.AudioContext) { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const o = ctx.createOscillator(); const g = ctx.createGain(); g.gain.value = 0.03; o.connect(g); g.connect(ctx.destination); o.frequency.value = name === 'startup' ? 800 : name === 'shutdown' ? 400 : name === 'close' ? 600 : 700; o.start(); o.stop(ctx.currentTime + 0.04); } } catch {} },

  /* ═══ TERMINAL ═══ */
  _attachTerminal() {
    if (this.terminalAttached) return;
    const container = document.getElementById('win7-term-container');
    if (!container) return;
    const termEl = document.getElementById('term-c');
    if (termEl && termEl.children.length > 0) {
      while (container.firstChild) container.removeChild(container.firstChild);
      for (const child of termEl.children) container.appendChild(child);
      this.terminalAttached = true;
    }
  },

  _detachTerminal() {
    if (!this.terminalAttached) return;
    const container = document.getElementById('win7-term-container');
    const termEl = document.getElementById('term-c');
    if (container && termEl) {
      while (termEl.firstChild) termEl.removeChild(termEl.firstChild);
      for (const child of container.children) termEl.appendChild(child);
    }
    this.terminalAttached = false;
  },

  _startTerminalWatcher() {
    this._stopTerminalWatcher();
    this.termObserver = new MutationObserver(() => {
      if (this.windows.terminal && !this.windows.terminal.minimized && !this.terminalAttached) {
        const container = document.getElementById('win7-term-container');
        if (container && container.children.length === 0) this._attachTerminal();
      }
    });
    const termC = document.getElementById('term-c');
    if (termC) this.termObserver.observe(termC, { childList: true, subtree: true });
  },

  _stopTerminalWatcher() { if (this.termObserver) { this.termObserver.disconnect(); this.termObserver = null; } },

  /* ═══ GADGETS ═══ */
  _startGadgets() {
    let layer = document.getElementById('win7-gadgets-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'win7-gadgets-layer';
      layer.className = 'win7-gadgets-layer';
      document.getElementById('win7-desktop').appendChild(layer);
    }
    if (!document.getElementById('win7-gadget-clock')) {
      const clock = document.createElement('div');
      clock.id = 'win7-gadget-clock';
      clock.className = 'win7-gadget win7-gadget-clock';
      clock.style.cssText = 'right:12px;top:40px';
      clock.innerHTML = '<div class="gadget-time" id="win7-gadget-time"></div><div class="gadget-date" id="win7-gadget-date"></div>';
      layer.appendChild(clock);
    }
  },

  _stopGadgets() { const layer = document.getElementById('win7-gadgets-layer'); if (layer) { layer.innerHTML = ''; layer.remove(); } },

  /* ═══ REFRESH TIMERS ═══ */
  _startRefreshTimers() {
    this._stopRefreshTimers();
    this.refreshTimers.processes = setInterval(() => { if (this.windows.taskmgr && !this.windows.taskmgr.minimized && window.send) window.send({ type: 'processes' }); }, 3000);
    this.refreshTimers.services = setInterval(() => { if (this.windows.taskmgr && !this.windows.taskmgr.minimized && window.send) window.send({ type: 'services' }); }, 5000);
    this.refreshTimers.dashboard = setInterval(() => { if (this.windows.dashboard && !this.windows.dashboard.minimized && window.send) window.send({ type: 'dashboard' }); }, 3000);
    this.refreshTimers.network = setInterval(() => { if (this.windows.taskmgr && !this.windows.taskmgr.minimized && window.send) window.send({ type: 'network' }); }, 5000);
  },

  _stopRefreshTimers() { for (const k of Object.keys(this.refreshTimers)) { clearInterval(this.refreshTimers[k]); } this.refreshTimers = {}; },

  /* ═══ HELPERS ═══ */
  esc(s) {
    if (typeof s !== 'string') return String(s);
    const m = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return s.replace(/[&<>"']/g, c => m[c] || c);
  },

  _fmtSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const u = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0; let s = bytes;
    while (s >= 1024 && i < u.length - 1) { s /= 1024; i++; }
    return s.toFixed(i > 0 ? 1 : 0) + ' ' + u[i];
  },
};

/* ═══════════════════════════════════════
   EVENT BINDINGS
   ═══════════════════════════════════════ */
(function() {

window.win7Handle = (m) => {
  if (!Win7.active) return;
  switch (m.type) {
    case 'files':
      if (document.getElementById('win7-files-grid')) Win7._renderWin7Files(m);
      break;
    case 'processes':
      if (document.getElementById('win7-proc-list')) Win7._renderWin7Processes(m);
      break;
    case 'services':
      if (document.getElementById('win7-svc-list')) Win7._renderWin7Services(m);
      break;
    case 'dashboard':
      if (document.getElementById('win7-perf-content')) Win7._renderWin7Performance(m);
      break;
    case 'file-result':
      Win7._handleFileResult(m);
      break;
  }
};

document.getElementById('win7-overlay').addEventListener('click', (e) => {
  if (!Win7.active) return;
  const t = e.target;

  /* Title bar buttons */
  const btn = t.closest('.win7-win-btn');
  if (btn) {
    const id = btn.dataset.win;
    const action = btn.dataset.action;
    e.stopPropagation();
    if (action === 'close') Win7.closeWindow(id);
    else if (action === 'minimize') Win7.minimizeWindow(id);
    else if (action === 'maximize') Win7.maximizeWindow(id);
    return;
  }

  /* Clicking window body focuses it */
  const winBody = t.closest('.win7-win-body');
  if (winBody) {
    const id = winBody.dataset.win;
    if (id && Win7.windows[id]) Win7.focusWindow(id);
  }

  /* Taskbar buttons */
  const tb = t.closest('.win7-taskbar-btn');
  if (tb) {
    const id = tb.dataset.win;
    const w = Win7.windows[id];
    if (!w) return;
    if (w.minimized) Win7.restoreWindow(id);
    else if (w === Win7.windows[Win7.windowOrder[Win7.windowOrder.length - 1]]) Win7.minimizeWindow(id);
    else Win7.focusWindow(id);
    return;
  }

  /* Start button */
  if (t.closest('#win7-start-btn')) { Win7.toggleStartMenu(); return; }

  /* Show Desktop */
  if (t.closest('#win7-show-desktop')) {
    for (const id of Object.keys(Win7.windows)) {
      const w = Win7.windows[id];
      if (w && !w.minimized) {
        w.minimized = true;
        if (!w.normalRect) {
          const s = w.el.style;
          w.normalRect = { width: s.width, height: s.height, left: s.left, top: s.top };
        }
        w.el.style.display = 'none';
      }
    }
    Win7.updateTaskbar();
    return;
  }

  /* System tray clock */
  if (t.closest('#win7-clock')) { Win7.showCalendar(); return; }

  /* Start menu items */
  const si = t.closest('.win7-start-item');
  if (si && si.dataset.app) { Win7.openApp(si.dataset.app); return; }
  if (si && si.dataset.shortcut) { Win7._launchDesktopShortcut(si.dataset.shortcut); return; }
  if (si && si.dataset.action) {
    if (si.dataset.action === 'run') Win7.openRunDialog();
    if (si.dataset.action === 'all-programs') {
      const wrap = document.getElementById('win7-all-programs-wrap');
      if (wrap) wrap.classList.toggle('open');
    }
    if (si.dataset.action === 'exit' || si.dataset.action === 'shutdown') {
      if (confirm('Are you sure you want to exit Windows 7 mode?')) {
        if (Win7.active) Win7.toggle();
      }
    }
    return;
  }

  /* Shutdown button */
  if (t.closest('#win7-start-shutdown')) {
    if (Win7.active) Win7.toggle();
    return;
  }

  /* All Programs toggle */
  if (t.closest('.win7-start-item.all-programs')) {
    const wrap = document.getElementById('win7-all-programs-wrap');
    if (wrap) wrap.classList.toggle('open');
    return;
  }

  /* Desktop icons */
  const di = t.closest('.win7-desktop-icon');
  if (di) {
    Win7._selectDesktopIcon(di, e.ctrlKey || e.metaKey);
    return;
  }

  /* File explorer items */
  const treeItem = t.closest('.win7-tree-item');
  if (treeItem && treeItem.dataset.path) {
    const addr = document.querySelector('#win7-win-files .win7-explorer-addr');
    if (addr) { Win7.fileHistory.push(addr.value); addr.value = treeItem.dataset.path; }
    if (window.send) window.send({ type: 'files', path: treeItem.dataset.path });
    return;
  }

  const fileItem = t.closest('.win7-explorer .file-item');
  if (fileItem) {
    document.querySelectorAll('#win7-files-grid .file-item').forEach(el => el.classList.remove('selected'));
    fileItem.classList.add('selected');
    if (fileItem.dataset.path) {
      if (fileItem.dataset.type === 'dir' || fileItem.classList.contains('file-up-item')) {
        const addr = document.querySelector('#win7-win-files .win7-explorer-addr');
        if (addr) { Win7.fileHistory.push(addr.value); addr.value = fileItem.dataset.path; }
        if (window.send) window.send({ type: 'files', path: fileItem.dataset.path });
      }
    }
    return;
  }

  /* Explorer toolbar */
  const tbBtn = t.closest('.win7-explorer-toolbar button');
  if (tbBtn && tbBtn.dataset.action) {
    const addr = document.querySelector('#win7-win-files .win7-explorer-addr');
    const curPath = addr ? addr.value : '.';
    switch (tbBtn.dataset.action) {
      case 'back':
        if (Win7.fileHistory.length > 0) {
          const prev = Win7.fileHistory.pop();
          Win7.fileForward.push(curPath);
          if (window.send) window.send({ type: 'files', path: prev });
        }
        break;
      case 'forward':
        if (Win7.fileForward.length > 0) {
          const next = Win7.fileForward.pop();
          Win7.fileHistory.push(curPath);
          if (window.send) window.send({ type: 'files', path: next });
        }
        break;
      case 'up': {
        const up = curPath === '/' ? '/' : curPath.replace(/\/+$/, '').replace(/\/[^/]*$/, '') || '/';
        Win7.fileHistory.push(curPath);
        if (window.send) window.send({ type: 'files', path: up });
        break;
      }
      case 'refresh':
        if (window.send) window.send({ type: 'files', path: curPath });
        break;
    }
    return;
  }

  /* View buttons */
  const viewBtn = t.closest('.win7-view-btn');
  if (viewBtn && viewBtn.dataset.view) {
    document.querySelectorAll('.win7-view-btn').forEach(el => el.classList.remove('active'));
    viewBtn.classList.add('active');
    return;
  }

  /* Context menu items */
  const ctxItem = t.closest('.win7-ctx-item');
  if (ctxItem && ctxItem.dataset.action) {
    Win7.hideContextMenu();
    const action = ctxItem.dataset.action;
    switch (action) {
      case 'show-desktop':
        document.getElementById('win7-show-desktop')?.click();
        break;
      case 'taskmgr':
        Win7.openApp('taskmgr');
        break;
      case 'personalize':
        Win7.openApp('personalize');
        break;
      case 'properties':
        Win7._notify('Properties', 'System properties');
        break;
      case 'run':
        Win7.openRunDialog();
        break;
      case 'view':
      case 'sort-by':
      case 'refresh':
        Win7._notify('Desktop', action.charAt(0).toUpperCase() + action.slice(1));
        break;
      case 'file-new-folder': {
        const addr = document.querySelector('#win7-win-files .win7-explorer-addr');
        const cur = addr ? addr.value : '.';
        const name = prompt('New folder name:', 'New Folder');
        if (name && window.send) window.send({ type: 'file-mkdir', path: cur + '/' + name });
        break;
      }
      case 'file-new-text': {
        const addr2 = document.querySelector('#win7-win-files .win7-explorer-addr');
        const cur2 = addr2 ? addr2.value : '.';
        const name2 = prompt('New file name:', 'New Text Document.txt');
        if (name2 && window.send) window.send({ type: 'file-create', path: cur2 + '/' + name2, content: '' });
        break;
      }
      case 'file-paste':
        Win7._handleFileAction('file-paste');
        break;
      case 'cascade':
      case 'stack':
      case 'side':
        Win7._notify('Arrange', 'Window arrangement (' + action + ')');
        break;
      default:
        if (action.startsWith('file-')) {
          const selected = document.querySelector('#win7-files-grid .file-item.selected');
          Win7._handleFileAction(action, selected?.dataset?.path, selected?.dataset?.type);
        }
    }
    return;
  }

  /* Tab buttons */
  const tab = t.closest('.win7-tab');
  if (tab && tab.dataset.tab) {
    document.querySelectorAll('.win7-tab').forEach(el => el.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.win7-tab-body').forEach(el => el.classList.remove('active'));
    const body = document.getElementById('win7-tab-' + tab.dataset.tab);
    if (body) body.classList.add('active');
    return;
  }

  /* Control Panel items */
  const cp = t.closest('.win7-cp-item');
  if (cp && cp.dataset.action) { Win7.openApp(cp.dataset.action); return; }

  /* Kill button */
  const kill = t.closest('.win7-btn-kill');
  if (kill && kill.dataset.pid) {
    if (window.send) window.send({ type: 'kill', pid: parseInt(kill.dataset.pid) });
    kill.textContent = '...'; kill.disabled = true;
    return;
  }

  /* Service button */
  const svc = t.closest('.win7-btn-svc');
  if (svc && svc.dataset.svc && svc.dataset.action) {
    if (window.send) window.send({ type: 'service', name: svc.dataset.svc, action: svc.dataset.action });
    svc.textContent = '...'; svc.disabled = true;
    return;
  }
});

/* Desktop right-click context menu */
document.getElementById('win7-desktop').addEventListener('contextmenu', (e) => Win7.showContextMenu(e, 'desktop'));

/* File item right-click context menu on explorer */
document.getElementById('win7-overlay').addEventListener('contextmenu', (e) => {
  const fileItem = e.target.closest('.win7-explorer .file-item');
  if (fileItem) {
    e.preventDefault();
    fileItem.classList.add('selected');
    Win7.showContextMenu(e, 'file');
  }
});

/* Taskbar right-click */
document.getElementById('win7-taskbar').addEventListener('contextmenu', (e) => Win7.showContextMenu(e, 'taskbar'));

/* Close context menu on click anywhere */
document.addEventListener('click', () => Win7.hideContextMenu());

/* Window drag/resize */
document.getElementById('win7-windows-container').addEventListener('mousedown', (e) => {
  if (!Win7.active) return;
  Win7._startDrag(e);
  if (!e.target.closest('.win7-win-btn')) Win7._startResize(e);
});

/* Desktop drag selection */
document.getElementById('win7-desktop').addEventListener('mousedown', (e) => {
  if (!Win7.active) return;
  if (e.target.closest('.win7-desktop-icon')) return;
  if (e.target.closest('.win7-context-menu')) return;
  if (e.target.closest('.win7-windows-container')) return;
  if (e.target.closest('.win7-gadgets-layer')) return;
  const x = e.clientX, y = e.clientY;
  Win7._startDesktopSelection(x, y);
  const onMove = (ev) => { Win7._moveDesktopSelection(ev.clientX, ev.clientY); };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    Win7._endDesktopSelection();
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});

/* Desktop double-click shortcuts */
document.getElementById('win7-desktop').addEventListener('dblclick', (e) => {
  if (!Win7.active) return;
  const di = e.target.closest('.win7-desktop-icon');
  if (di && di.dataset.shortcut) Win7._launchDesktopShortcut(di.dataset.shortcut);
});

/* Keyboard shortcuts */
document.addEventListener('keydown', (e) => {
  if (!Win7.active) return;
  if (e.altKey && e.key === 'Tab') { e.preventDefault(); Win7.showAltTab(e.shiftKey ? -1 : 1); return; }
  if (e.key === 'Escape' && Win7.altTabActive) { Win7.hideAltTab(); return; }
  if (e.key === 'Escape' && Win7.flip3DActive) { Win7.hideFlip3D(); return; }
  if (e.key === 'Escape' && Win7.startMenuOpen) { Win7.toggleStartMenu(); return; }
  if (e.key === 'Escape') Win7.hideContextMenu();

  if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Win') {
    Win7._winKeyHeld = true;
    if (e.repeat) return;
    Win7.toggleStartMenu();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Win') Win7._winKeyHeld = false;
});

document.getElementById('win7-search-input')?.addEventListener('input', function() {
  Win7._filterStartMenu(this.value);
});

document.getElementById('win7-taskbar-windows')?.addEventListener('mouseover', (e) => {
  const btn = e.target.closest('.win7-taskbar-btn');
  if (btn && btn.dataset.win) Win7._showTaskbarPreview(btn.dataset.win, btn);
});

document.getElementById('win7-taskbar-windows')?.addEventListener('mouseout', (e) => {
  const btn = e.target.closest('.win7-taskbar-btn');
  if (btn) Win7._hideTaskbarPreview();
});

document.getElementById('win7-overlay')?.addEventListener('keydown', (e) => {
  const addr = e.target.closest('.win7-explorer-addr');
  if (addr && e.key === 'Enter') {
    if (window.send) window.send({ type: 'files', path: addr.value });
  }
});

})();

window.toggleWin7 = () => Win7.toggle();
