const Win7 = {
  active: false,
  windows: {},
  windowZIndex: 10000,
  windowOrder: [],
  dragData: null,
  resizeData: null,
  startMenuOpen: false,
  clockInterval: null,
  terminalAttached: false,
  termObserver: null,
  fileHistory: [],
  refreshTimers: {},

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
    this.openApp('dashboard');
    this.openApp('terminal');
    this._startTerminalWatcher();
    this._startRefreshTimers();
  },

  hide() {
    this.active = false;
    document.getElementById('win7-overlay').classList.remove('active');
    document.getElementById('sidebar').style.display = '';
    document.body.style.overflow = '';
    if (this.clockInterval) { clearInterval(this.clockInterval); this.clockInterval = null; }
    this._detachTerminal();
    this._stopTerminalWatcher();
    this._stopRefreshTimers();
    for (const id of Object.keys(this.windows)) this.closeWindow(id, true);
    this.hideContextMenu();
  },

  createWindow(opts) {
    if (this.windows[opts.id]) {
      this.focusWindow(opts.id);
      if (this.windows[opts.id].minimized) this.restoreWindow(opts.id);
      return this.windows[opts.id];
    }

    const defaults = {
      width: 500, height: 350, icon: '\u{1F4C4}',
      x: 80 + (Object.keys(this.windows).length * 24) % 240,
      y: 40 + (Object.keys(this.windows).length * 20) % 160,
      content: '', onClose: null, resizable: true,
    };
    const o = { ...defaults, ...opts };

    const container = document.getElementById('win7-windows-container');
    const el = document.createElement('div');
    el.className = 'win7-window';
    el.id = 'win7-win-' + o.id;
    el.style.width = o.width + 'px';
    el.style.height = o.height + 'px';
    el.style.left = o.x + 'px';
    el.style.top = o.y + 'px';
    el.style.zIndex = ++this.windowZIndex;

    el.innerHTML = [
      '<div class="win7-win-titlebar" data-win="' + o.id + '">',
      '<span class="win7-win-icon">' + o.icon + '</span>',
      '<span class="win7-win-title">' + this.esc(o.title) + '</span>',
      '<div class="win7-win-btns">',
      '<button class="win7-win-btn minimize" data-win="' + o.id + '" data-action="minimize">\u2500</button>',
      '<button class="win7-win-btn maximize" data-win="' + o.id + '" data-action="maximize">\u25A1</button>',
      '<button class="win7-win-btn close" data-win="' + o.id + '" data-action="close">\u2715</button>',
      '</div></div>',
      '<div class="win7-win-body" data-win="' + o.id + '">' + o.content + '</div>',
      o.resizable ? [
        '<div class="win7-win-resize-handle n" data-win="' + o.id + '" data-edge="n"></div>',
        '<div class="win7-win-resize-handle s" data-win="' + o.id + '" data-edge="s"></div>',
        '<div class="win7-win-resize-handle w" data-win="' + o.id + '" data-edge="w"></div>',
        '<div class="win7-win-resize-handle e" data-win="' + o.id + '" data-edge="e"></div>',
        '<div class="win7-win-resize-handle nw" data-win="' + o.id + '" data-edge="nw"></div>',
        '<div class="win7-win-resize-handle ne" data-win="' + o.id + '" data-edge="ne"></div>',
        '<div class="win7-win-resize-handle sw" data-win="' + o.id + '" data-edge="sw"></div>',
        '<div class="win7-win-resize-handle se" data-win="' + o.id + '" data-edge="se"></div>',
      ].join('') : '',
    ].join('');

    container.appendChild(el);

    const winObj = { id: o.id, el, minimized: false, maximized: false, normalRect: null, title: o.title, icon: o.icon, onClose: o.onClose };
    this.windows[o.id] = winObj;
    this.windowOrder.push(o.id);
    this.updateTaskbar();
    if (this.startMenuOpen) this.toggleStartMenu();

    const dataTypes = { dashboard: 'dashboard', files: 'files', processes: 'processes', services: 'services' };
    if (dataTypes[o.id] && window.send) {
      const p = dataTypes[o.id] === 'files' ? { type: 'files', path: '.' } : { type: dataTypes[o.id] };
      window.send(p);
    }

    return winObj;
  },

  closeWindow(id, silent) {
    const w = this.windows[id];
    if (!w) return;
    if (id === 'terminal' && this.terminalAttached) {
      this._detachTerminal();
    }
    if (w.el) w.el.remove();
    delete this.windows[id];
    const idx = this.windowOrder.indexOf(id);
    if (idx > -1) this.windowOrder.splice(idx, 1);
    if (!silent) this.updateTaskbar();
    if (w.onClose) w.onClose();
  },

  minimizeWindow(id) {
    const w = this.windows[id];
    if (!w || w.minimized) return;
    if (id === 'terminal' && this.terminalAttached) {
      this._detachTerminal();
    }
    w.minimized = true;
    if (!w.normalRect) {
      const s = w.el.style;
      w.normalRect = { width: s.width, height: s.height, left: s.left, top: s.top };
    }
    w.el.style.display = 'none';
    this.updateTaskbar();
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
    if (id === 'terminal' && this.terminalAttached) {
      this._detachTerminal();
    }
    const taskbar = document.getElementById('win7-taskbar');
    const tbH = taskbar ? taskbar.offsetHeight : 40;
    w.el.style.width = '';
    w.el.style.height = '';
    w.el.style.left = '0';
    w.el.style.top = '0';
    w.el.style.right = '0';
    w.el.style.bottom = tbH + 'px';
    w.el.classList.add('maximized');
    this.focusWindow(id);
    if (id === 'terminal') {
      setTimeout(() => this._attachTerminal(), 50);
    }
  },

  restoreWindow(id) {
    const w = this.windows[id];
    if (!w || !w.normalRect) return;
    w.maximized = false;
    w.minimized = false;
    const r = w.normalRect;
    w.el.style.width = r.width;
    w.el.style.height = r.height;
    w.el.style.left = r.left;
    w.el.style.top = r.top;
    w.el.style.right = '';
    w.el.style.bottom = '';
    w.el.style.display = '';
    w.el.classList.remove('maximized');
    this.focusWindow(id);
    this.updateTaskbar();
    if (id === 'terminal') {
      setTimeout(() => this._attachTerminal(), 50);
    }
  },

  focusWindow(id) {
    const w = this.windows[id];
    if (!w || w.minimized) return;
    w.el.style.zIndex = ++this.windowZIndex;
    const idx = this.windowOrder.indexOf(id);
    if (idx > -1) { this.windowOrder.splice(idx, 1); this.windowOrder.push(id); }
    this.updateTaskbar();
    if (id === 'terminal') {
      const s = window.__getSessions()[window.__getActiveId()];
      if (s && s.term) setTimeout(() => s.term.focus(), 50);
    }
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
      const icon = w.icon || '\u{1F4C4}';
      return '<button class="win7-taskbar-btn' + active + '" data-win="' + id + '">' + icon + ' ' + this.esc(w.title) + '</button>';
    }).join('');
  },

  updateClock() {
    const el = document.getElementById('win7-clock');
    if (!el) return;
    const now = new Date();
    el.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  },

  toggleStartMenu() {
    this.startMenuOpen = !this.startMenuOpen;
    document.getElementById('win7-start-menu').classList.toggle('active', this.startMenuOpen);
    document.getElementById('win7-start-btn').classList.toggle('active', this.startMenuOpen);
    if (!this.startMenuOpen) {
      document.getElementById('win7-search-input').value = '';
      document.querySelectorAll('.win7-start-item').forEach(el => el.style.display = '');
    }
  },

  openApp(name) {
    this.hideContextMenu();
    if (this.startMenuOpen) this.toggleStartMenu();

    switch (name) {
      case 'terminal':
        this.createWindow({
          id: 'terminal', title: 'Terminal - WebWSL', icon: '\u26A1',
          width: 680, height: 400,
          content: '<div id="win7-term-container" style="height:100%;padding:4px;display:flex;flex-direction:column"></div>',
          onClose: () => { this.terminalAttached = false; },
        });
        setTimeout(() => this._attachTerminal(), 50);
        break;
      case 'dashboard':
        this.createWindow({
          id: 'dashboard', title: 'System Dashboard', icon: '\u{1F4CA}',
          width: 620, height: 460,
          content: '<div style="padding:20px;text-align:center;color:rgba(255,255,255,0.4)">Loading dashboard...</div>',
        });
        if (window.send) window.send({ type: 'dashboard' });
        break;
      case 'files':
        this.fileHistory = [];
        this.createWindow({
          id: 'files', title: 'File Explorer', icon: '\u{1F4C1}',
          width: 700, height: 460,
          content: this.filesExplorerHTML('.'),
        });
        if (window.send) window.send({ type: 'files', path: '.' });
        break;
      case 'taskmgr':
        this.createWindow({
          id: 'taskmgr', title: 'Task Manager', icon: '\u2699',
          width: 640, height: 420,
          content: this.taskManagerHTML(),
        });
        if (window.send) {
          window.send({ type: 'processes' });
          window.send({ type: 'services' });
          window.send({ type: 'dashboard' });
        }
        break;
      case 'services':
        this.createWindow({
          id: 'services', title: 'Task Manager - Services', icon: '\u{1F527}',
          width: 580, height: 380,
          content: '<div style="padding:20px;text-align:center;color:rgba(255,255,255,0.4)">Loading services...</div>',
        });
        if (window.send) window.send({ type: 'services' });
        break;
      case 'panel':
        this.createWindow({
          id: 'panel-' + Date.now(), title: 'Control Panel', icon: '\u2699',
          width: 520, height: 380,
          content: [
            '<div style="padding:16px">',
            '<div style="font-size:14px;font-weight:600;margin-bottom:12px;color:rgba(255,255,255,0.8)">Control Panel</div>',
            '<div style="display:flex;flex-wrap:wrap;gap:12px">',
            '<div class="win7-cp-item" data-action="dashboard"><div style="font-size:28px">\u{1F4CA}</div><div style="font-size:11px;margin-top:4px">System</div></div>',
            '<div class="win7-cp-item" data-action="taskmgr"><div style="font-size:28px">\u2699</div><div style="font-size:11px;margin-top:4px">Administrative Tools</div></div>',
            '<div class="win7-cp-item" data-action="files"><div style="font-size:28px">\u{1F4C1}</div><div style="font-size:11px;margin-top:4px">File Explorer Options</div></div>',
            '<div class="win7-cp-item" data-action="services"><div style="font-size:28px">\u{1F527}</div><div style="font-size:11px;margin-top:4px">Services</div></div>',
            '<div class="win7-cp-item" data-action="devices"><div style="font-size:28px">\u{1F4F1}</div><div style="font-size:11px;margin-top:4px">Devices and Printers</div></div>',
            '</div>',
            '<div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(255,255,255,0.4)">WebWSL System Control Panel</div>',
            '</div>',
          ].join(''),
        });
        break;
      case 'devices':
        this.createWindow({
          id: 'devices-' + Date.now(), title: 'Devices and Printers', icon: '\u{1F4F1}',
          width: 460, height: 280,
          content: '<div style="padding:32px;text-align:center;color:rgba(255,255,255,0.4)"><div style="font-size:48px;margin-bottom:12px">\u{1F4F1}</div><div>No devices connected</div><div style="font-size:10px;margin-top:8px;color:rgba(255,255,255,0.25)">WebWSL virtual environment</div></div>',
        });
        break;
      case 'computer':
        this.createWindow({
          id: 'computer-' + Date.now(), title: 'Computer', icon: '\u{1F4BB}',
          width: 460, height: 300,
          content: [
            '<div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px">',
            '<div style="text-align:center;width:80px;padding:8px;cursor:pointer" data-action="dashboard"><div style="font-size:32px">\u{1F4CA}</div><div style="font-size:11px;margin-top:4px">System Dashboard</div></div>',
            '<div style="text-align:center;width:80px;padding:8px;cursor:pointer" data-action="files"><div style="font-size:32px">\u{1F4C1}</div><div style="font-size:11px;margin-top:4px">File Explorer</div></div>',
            '<div style="text-align:center;width:80px;padding:8px;cursor:pointer" data-action="services"><div style="font-size:32px">\u{1F527}</div><div style="font-size:11px;margin-top:4px">Services</div></div>',
            '<div style="text-align:center;width:80px;padding:8px;cursor:pointer" data-action="taskmgr"><div style="font-size:32px">\u2699</div><div style="font-size:11px;margin-top:4px">Task Manager</div></div>',
            '</div>',
            '<div style="padding:8px 16px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(255,255,255,0.4)">System: WebWSL on Linux</div>',
          ].join(''),
        });
        break;
    }
  },

  showContextMenu(e) {
    e.preventDefault();
    const menu = document.getElementById('win7-context-menu');
    menu.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
    menu.style.top = Math.min(e.clientY, window.innerHeight - 150) + 'px';
    menu.classList.add('active');
  },

  hideContextMenu() {
    document.getElementById('win7-context-menu').classList.remove('active');
  },

  filesExplorerHTML(path) {
    return [
      '<div class="win7-explorer-toolbar">',
      '<button id="win7-explorer-back" title="Back">\u2190</button>',
      '<input class="win7-explorer-addr" id="win7-explorer-addr" value="' + this.esc(path) + '" spellcheck="false">',
      '<button id="win7-explorer-go" style="padding:3px 10px;background:rgba(88,166,255,0.2);border:none;border-radius:3px;color:#fff;cursor:pointer">Go</button>',
      '</div>',
      '<div class="files-grid" id="win7-files-grid" style="flex:1;overflow:auto;background:rgba(0,0,0,0.15);border:none;border-radius:0;padding:8px">',
      '<div class="empty-msg" style="color:rgba(255,255,255,0.4)">Loading...</div></div>',
    ].join('');
  },

  taskManagerHTML() {
    return [
      '<div class="win7-tab-bar">',
      '<button class="win7-tab active" data-tab="processes">Processes</button>',
      '<button class="win7-tab" data-tab="perf">Performance</button>',
      '<button class="win7-tab" data-tab="services">Services</button>',
      '</div>',
      '<div class="win7-tab-body active" id="win7-tab-processes"><div id="win7-procs-container" style="height:100%;overflow:auto"><div style="padding:16px;text-align:center;color:rgba(255,255,255,0.4)">Loading...</div></div></div>',
      '<div class="win7-tab-body" id="win7-tab-perf"><div id="win7-perf-container" style="height:100%;overflow:auto;display:flex;flex-wrap:wrap;gap:10px;padding:8px"><div style="text-align:center;width:100%;color:rgba(255,255,255,0.4)">Loading...</div></div></div>',
      '<div class="win7-tab-body" id="win7-tab-services"><div id="win7-svcs-container" style="height:100%;overflow:auto"><div style="padding:16px;text-align:center;color:rgba(255,255,255,0.4)">Loading...</div></div></div>',
    ].join('');
  },

  showDesktop() {
    for (const id of this.windowOrder) {
      const w = this.windows[id];
      if (w && !w.minimized) {
        if (id === 'terminal' && this.terminalAttached) {
          this._detachTerminal();
        }
        if (!w.normalRect) {
          const s = w.el.style;
          w.normalRect = { width: s.width, height: s.height, left: s.left, top: s.top };
        }
        w.minimized = true;
        w.el.style.display = 'none';
      }
    }
    this.updateTaskbar();
  },

  _attachTerminal() {
    if (!this.active || !this.windows.terminal) return;
    const container = document.getElementById('win7-term-container');
    if (!container) return;
    const ct = document.getElementById('term-c');
    if (!ct) return;
    const termEl = ct.querySelector('.xterm');
    if (!termEl) return;
    if (container.contains(termEl)) {
      this.terminalAttached = true;
      return;
    }
    container.innerHTML = '';
    container.appendChild(termEl);
    this.terminalAttached = true;
    const s = window.__getSessions()[window.__getActiveId()];
    if (s && s.fit) {
      setTimeout(() => { s.fit.fit(); if (s.term) s.term.focus(); }, 50);
    }
  },

  _detachTerminal() {
    if (!this.terminalAttached) return;
    const container = document.getElementById('win7-term-container');
    const ct = document.getElementById('term-c');
    if (!container || !ct) { this.terminalAttached = false; return; }
    const termEl = container.querySelector('.xterm');
    if (termEl) {
      ct.appendChild(termEl);
      const s = window.__getSessions()[window.__getActiveId()];
      if (s && s.fit) setTimeout(() => s.fit.fit(), 50);
    }
    this.terminalAttached = false;
  },

  _startTerminalWatcher() {
    const ct = document.getElementById('term-c');
    if (!ct) return;
    this._termObserver = new MutationObserver(() => {
      if (this.active && this.windows.terminal && !this.windows.terminal.minimized) {
        setTimeout(() => this._attachTerminal(), 50);
      }
    });
    this._termObserver.observe(ct, { childList: true });
  },

  _stopTerminalWatcher() {
    if (this._termObserver) {
      this._termObserver.disconnect();
      this._termObserver = null;
    }
  },

  _startRefreshTimers() {
    this._stopRefreshTimers();
    this.refreshTimers.dashboard = setInterval(() => {
      if (this.active && this.windows.dashboard && window.send) {
        window.send({ type: 'dashboard' });
      }
    }, 5000);
    this.refreshTimers.processes = setInterval(() => {
      if (this.active && this.windows.taskmgr && window.send) {
        window.send({ type: 'processes' });
      }
    }, 5000);
    this.refreshTimers.services = setInterval(() => {
      if (this.active && (this.windows.taskmgr || this.windows.services) && window.send) {
        window.send({ type: 'services' });
      }
    }, 8000);
  },

  _stopRefreshTimers() {
    for (const key of Object.keys(this.refreshTimers)) {
      clearInterval(this.refreshTimers[key]);
    }
    this.refreshTimers = {};
  },

  onMessage(m) {
    if (!this.active) return;
    switch (m.type) {
      case 'dashboard': this.renderDash(m.data); this.renderPerf(m.data); break;
      case 'files': this.renderFiles(m); break;
      case 'processes': this.renderProcesses(m); break;
      case 'services': this.renderServices(m); break;
    }
  },

  renderDash(d) {
    if (!this.windows.dashboard) return;
    const body = document.querySelector('#win7-win-dashboard .win7-win-body');
    if (!body) return;

    const circ = 2 * Math.PI * 40;
    const gauge = (lbl, pct, sub, color) => {
      const off = circ * (1 - Math.min(pct || 0, 100) / 100);
      return '<div style="background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:12px;display:flex;flex-direction:column;align-items:center;gap:4px">'
        + '<div style="font-size:9px;text-transform:uppercase;letter-spacing:0.6px;color:rgba(255,255,255,0.5);font-weight:600">' + lbl + '</div>'
        + '<svg width="90" height="90" viewBox="0 0 90 90">'
        + '<circle cx="45" cy="45" r="40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="6"/>'
        + '<circle cx="45" cy="45" r="40" fill="none" stroke="' + color + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + off + '" transform="rotate(-90,45,45)" style="transition:stroke-dashoffset 0.6s"/>'
        + '<text x="45" y="40" text-anchor="middle" fill="#fff" font-size="15" font-weight="700" font-family="monospace">' + Math.round(pct || 0) + '%</text>'
        + '<text x="45" y="56" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="9" font-family="monospace">' + (sub || '') + '</text>'
        + '</svg></div>';
    };

    const card = (lbl, val) => '<div style="flex:1;min-width:80px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px 12px">'
      + '<div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:rgba(255,255,255,0.4);margin-bottom:2px">' + lbl + '</div>'
      + '<div style="font-size:12px;font-weight:600;font-family:monospace;word-break:break-all">' + this.esc(val) + '</div></div>';

    let html = '<div style="display:flex;flex-direction:column;gap:8px">'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap">'
      + card('Hostname', d.hostname || '-')
      + card('Platform', d.platform || '-')
      + card('Kernel', d.release || '-')
      + card('Uptime', d.uptime || '-')
      + card('Load', d.loadavg || '-')
      + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">'
      + gauge('CPU', d.cpuLoad, (d.cpuCount || '?') + ' cores', '#3fb950')
      + gauge('Memory', d.memUsage, (d.memory || ''), '#58a6ff')
      + gauge('Disk (/)', parseFloat(d.diskUsage || 0), (d.disk || ''), '#d29922')
      + '</div>';

    if (d.cpuModel) html += '<div style="font-size:10px;color:rgba(255,255,255,0.4);text-align:center">' + this.esc(d.cpuModel) + '</div>';

    if (d.cpuCores && Array.isArray(d.cpuCores)) {
      html += '<div style="display:flex;gap:2px;flex-wrap:wrap;justify-content:center">';
      for (let i = 0; i < d.cpuCores.length; i++) {
        const u = d.cpuCores[i];
        const cls = u < 50 ? '#3fb950' : u < 80 ? '#d29922' : '#f85149';
        html += '<div style="display:flex;flex-direction:column;align-items:center;gap:1px">'
          + '<div style="width:14px;height:24px;background:rgba(0,0,0,0.3);border-radius:2px;overflow:hidden;position:relative">'
          + '<div style="position:absolute;bottom:0;width:100%;height:' + u + '%;border-radius:2px;background:' + cls + '"></div></div>'
          + '<span style="font-size:7px;color:rgba(255,255,255,0.4)">' + i + '</span></div>';
      }
      html += '</div>';
    }
    html += '</div>';
    body.innerHTML = html;
  },

  renderFiles(m) {
    if (!this.windows.files) return;
    const body = document.querySelector('#win7-win-files .win7-win-body');
    if (!body) return;

    const addr = body.querySelector('.win7-explorer-addr');
    if (addr) addr.value = m.path;

    const grid = body.querySelector('#win7-files-grid');
    if (!grid) return;

    const isRoot = m.path === '/';
    const parent = isRoot ? '/' : m.path.replace(/\/+$/, '').replace(/\/[^/]*$/, '') || '/';
    let h = '';
    if (!isRoot) {
      h += '<div class="file-item file-up-item" data-path="' + parent.replace(/"/g, '&quot;') + '">'
        + '<div class="file-icon">\u2190</div><div class="file-name">..</div></div>';
    }
    const entries = Array.isArray(m.entries) ? m.entries : [];
    for (const e of entries) {
      const path = (m.path.replace(/\/$/, '') + '/' + e.name).replace(/"/g, '&quot;');
      const icon = this.getFileIcon(e.name, e.type);
      const cls = e.type === 'dir' ? 'file-folder' : '';
      h += '<div class="file-item ' + cls + '" data-path="' + path + '" data-type="' + e.type + '">';
      h += '<div class="file-icon">' + icon + '</div>';
      h += '<div class="file-name">' + this.esc(e.name) + (e.type === 'dir' ? '/' : '') + '</div>';
      if (e.type !== 'dir') {
        h += '<div class="file-size-sm" style="color:rgba(255,255,255,0.4)">' + this.fmtSize(e.size) + '</div>';
      }
      h += '</div>';
    }
    grid.innerHTML = h || '<div class="empty-msg" style="color:rgba(255,255,255,0.4)">Empty directory</div>';
  },

  getFileIcon(name, type) {
    if (type === 'dir') return '\u{1F4C1}';
    if (type === 'link') return '\u{1F517}';
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    const icons = {
      js: '\u{1F7E8}', ts: '\u{1F7E6}', py: '\u{1F40D}', html: '\u{1F310}',
      css: '\u{1F3A8}', json: '\u2699', md: '\u{1F4DD}', txt: '\u{1F4C4}',
      zip: '\u{1F4E6}', tar: '\u{1F4E6}', gz: '\u{1F4E6}',
      png: '\u{1F5BC}', jpg: '\u{1F5BC}', jpeg: '\u{1F5BC}', gif: '\u{1F5BC}', svg: '\u{1F5BC}',
      mp3: '\u{1F3B5}', mp4: '\u{1F3AC}', pdf: '\u{1F4D1}', sh: '\u{1F4BB}', conf: '\u2699',
      c: '\u{1F4BB}', cpp: '\u{1F4BB}', go: '\u{1F426}', rs: '\u{1F980}',
    };
    return icons[ext] || '\u{1F4C4}';
  },

  renderProcesses(m) {
    if (!this.windows.taskmgr) return;
    const container = document.getElementById('win7-procs-container');
    if (!container) return;

    const list = m.list || [];
    const sorted = [...list].sort((a, b) => b.cpu - a.cpu).slice(0, 50);
    let h = '<table class="tbl" style="width:100%;border-collapse:collapse;font-size:11px">'
      + '<thead><tr>'
      + '<th style="padding:4px 8px;text-align:left;font-size:9px;color:rgba(255,255,255,0.5);background:rgba(0,0,0,0.2);position:sticky;top:0;width:45px">PID</th>'
      + '<th style="padding:4px 8px;text-align:left;font-size:9px;color:rgba(255,255,255,0.5);background:rgba(0,0,0,0.2);position:sticky;top:0;width:60px">CPU%</th>'
      + '<th style="padding:4px 8px;text-align:left;font-size:9px;color:rgba(255,255,255,0.5);background:rgba(0,0,0,0.2);position:sticky;top:0;width:60px">MEM%</th>'
      + '<th style="padding:4px 8px;text-align:left;font-size:9px;color:rgba(255,255,255,0.5);background:rgba(0,0,0,0.2);position:sticky;top:0;width:55px">RSS</th>'
      + '<th style="padding:4px 8px;text-align:left;font-size:9px;color:rgba(255,255,255,0.5);background:rgba(0,0,0,0.2);position:sticky;top:0">Command</th>'
      + '<th style="padding:4px 8px;text-align:left;font-size:9px;color:rgba(255,255,255,0.5);background:rgba(0,0,0,0.2);position:sticky;top:0;width:40px"></th>'
      + '</tr></thead><tbody>';
    for (const p of sorted) {
      const bar = (val, c1, c2, c3) => val < 50 ? c1 : val < 80 ? c2 : c3;
      const cpuC = bar(p.cpu, 'rgba(63,185,80,0.6)', 'rgba(210,153,34,0.6)', 'rgba(248,81,73,0.6)');
      const memC = bar(p.mem, 'rgba(88,166,255,0.6)', 'rgba(210,153,34,0.6)', 'rgba(248,81,73,0.6)');
      h += '<tr><td style="padding:3px 8px;border-bottom:1px solid rgba(255,255,255,0.03);font-family:monospace;font-size:10px">' + p.pid + '</td>'
        + '<td style="padding:3px 8px;border-bottom:1px solid rgba(255,255,255,0.03)"><div style="display:flex;align-items:center;gap:4px"><div style="flex:1;height:4px;background:rgba(0,0,0,0.3);border-radius:2px;overflow:hidden"><div style="height:100%;width:' + Math.min(p.cpu, 100) + '%;background:' + cpuC + ';border-radius:2px"></div></div><span style="font-size:9px;font-family:monospace;min-width:28px;text-align:right">' + p.cpu.toFixed(1) + '</span></div></td>'
        + '<td style="padding:3px 8px;border-bottom:1px solid rgba(255,255,255,0.03)"><div style="display:flex;align-items:center;gap:4px"><div style="flex:1;height:4px;background:rgba(0,0,0,0.3);border-radius:2px;overflow:hidden"><div style="height:100%;width:' + Math.min(p.mem, 100) + '%;background:' + memC + ';border-radius:2px"></div></div><span style="font-size:9px;font-family:monospace;min-width:28px;text-align:right">' + p.mem.toFixed(1) + '</span></div></td>'
        + '<td style="padding:3px 8px;border-bottom:1px solid rgba(255,255,255,0.03);font-family:monospace;font-size:10px">' + this.fmtSize(p.rss * 1024) + '</td>'
        + '<td style="padding:3px 8px;border-bottom:1px solid rgba(255,255,255,0.03);font-size:10px">' + this.esc(p.command) + '</td>'
        + '<td style="padding:3px 4px;border-bottom:1px solid rgba(255,255,255,0.03);text-align:center"><button class="win7-btn-kill" data-pid="' + p.pid + '" style="padding:1px 6px;font-size:9px;background:rgba(248,81,73,0.15);border:1px solid rgba(248,81,73,0.3);color:#f85149;border-radius:3px;cursor:pointer">Kill</button></td></tr>';
    }
    h += '</tbody></table>';
    container.innerHTML = h || '<div style="padding:16px;text-align:center;color:rgba(255,255,255,0.4)">No processes</div>';
  },

  renderServices(m) {
    const containers = [];
    if (this.windows.taskmgr) {
      const c = document.getElementById('win7-svcs-container');
      if (c) containers.push(c);
    }
    if (this.windows.services) {
      const body = document.querySelector('#win7-win-services .win7-win-body');
      if (body) containers.push(body);
    }
    if (!containers.length) return;

    const list = m.list || [];
    let h = '<table class="tbl" style="width:100%;border-collapse:collapse;font-size:11px">'
      + '<thead><tr>'
      + '<th style="padding:4px 8px;text-align:left;font-size:9px;color:rgba(255,255,255,0.5);background:rgba(0,0,0,0.2);position:sticky;top:0;width:55px"></th>'
      + '<th style="padding:4px 8px;text-align:left;font-size:9px;color:rgba(255,255,255,0.5);background:rgba(0,0,0,0.2);position:sticky;top:0">Name</th>'
      + '<th style="padding:4px 8px;text-align:left;font-size:9px;color:rgba(255,255,255,0.5);background:rgba(0,0,0,0.2);position:sticky;top:0;width:70px">Status</th>'
      + '<th style="padding:4px 8px;text-align:left;font-size:9px;color:rgba(255,255,255,0.5);background:rgba(0,0,0,0.2);position:sticky;top:0">Description</th>'
      + '</tr></thead><tbody>';
    for (const s of list) {
      const running = s.status === 'running' || s.status === 'active';
      const badgeBg = running ? 'rgba(63,185,80,0.2)' : 'rgba(248,81,73,0.2)';
      const badgeColor = running ? '#3fb950' : '#f85149';
      const action = running ? 'stop' : 'start';
      const actionLabel = running ? 'Stop' : 'Start';
      h += '<tr>'
        + '<td style="padding:3px 4px;border-bottom:1px solid rgba(255,255,255,0.03);text-align:center">'
        + '<button class="win7-btn-svc" data-svc="' + this.esc(s.name) + '" data-action="' + action + '" style="padding:1px 6px;font-size:9px;background:' + (running ? 'rgba(248,81,73,0.15)' : 'rgba(63,185,80,0.15)') + ';border:1px solid ' + (running ? 'rgba(248,81,73,0.3)' : 'rgba(63,185,80,0.3)') + ';color:' + (running ? '#f85149' : '#3fb950') + ';border-radius:3px;cursor:pointer">' + actionLabel + '</button></td>'
        + '<td style="padding:3px 8px;border-bottom:1px solid rgba(255,255,255,0.03);font-family:monospace;font-size:11px">' + this.esc(s.name) + '</td>'
        + '<td style="padding:3px 8px;border-bottom:1px solid rgba(255,255,255,0.03)"><span style="display:inline-block;padding:1px 8px;border-radius:8px;font-size:9px;font-weight:600;background:' + badgeBg + ';color:' + badgeColor + '">' + this.esc(s.status) + '</span></td>'
        + '<td style="padding:3px 8px;border-bottom:1px solid rgba(255,255,255,0.03);color:rgba(255,255,255,0.5);font-size:10px">' + this.esc(s.description || '') + '</td></tr>';
    }
    h += '</tbody></table>';
    const fallback = '<div style="padding:16px;text-align:center;color:rgba(255,255,255,0.4)">No services</div>';
    for (const el of containers) {
      el.innerHTML = h || fallback;
    }
  },

  renderPerf(d) {
    if (!this.windows.taskmgr) return;
    const container = document.getElementById('win7-perf-container');
    if (!container || !d) return;

    const circ = 2 * Math.PI * 32;
    const gauge = (lbl, pct, sub, color) => {
      const off = circ * (1 - Math.min(pct || 0, 100) / 100);
      return '<div style="background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:10px;display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;min-width:140px">'
        + '<div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:rgba(255,255,255,0.4)">' + lbl + '</div>'
        + '<svg width="74" height="74" viewBox="0 0 74 74">'
        + '<circle cx="37" cy="37" r="32" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="5"/>'
        + '<circle cx="37" cy="37" r="32" fill="none" stroke="' + color + '" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + off + '" transform="rotate(-90,37,37)" style="transition:stroke-dashoffset 0.6s"/>'
        + '<text x="37" y="34" text-anchor="middle" fill="#fff" font-size="13" font-weight="700" font-family="monospace">' + Math.round(pct || 0) + '%</text>'
        + '<text x="37" y="48" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="8" font-family="monospace">' + (sub || '') + '</text>'
        + '</svg>'
        + '<div style="font-size:9px;color:rgba(255,255,255,0.4);font-family:monospace">' + this.esc(d.memory || '') + '</div></div>';
    };

    const infoCard = (lbl, val) => '<div style="flex:1;min-width:100px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px 10px">'
      + '<div style="font-size:8px;text-transform:uppercase;letter-spacing:0.4px;color:rgba(255,255,255,0.4);margin-bottom:2px">' + lbl + '</div>'
      + '<div style="font-size:11px;font-weight:600;font-family:monospace">' + this.esc(val) + '</div></div>';

    let html = '<div style="display:flex;flex-wrap:wrap;gap:8px;width:100%">'
      + gauge('CPU', d.cpuLoad, (d.cpuCount || '?') + ' cores', '#3fb950')
      + gauge('Memory', d.memUsage, '', '#58a6ff')
      + gauge('Disk (/)', parseFloat(d.diskUsage || 0), '', '#d29922')
      + '</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;width:100%">'
      + infoCard('Hostname', d.hostname || '-')
      + infoCard('Platform', d.platform || '-')
      + infoCard('Kernel', d.release || '-')
      + infoCard('Uptime', d.uptime || '-')
      + '</div>';

    if (d.cpuCores && Array.isArray(d.cpuCores)) {
      html += '<div style="margin-top:8px;width:100%"><div style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:rgba(255,255,255,0.4);margin-bottom:4px">CPU Cores</div>'
        + '<div style="display:flex;gap:2px;flex-wrap:wrap">';
      for (let i = 0; i < d.cpuCores.length; i++) {
        const u = d.cpuCores[i];
        const cls = u < 50 ? '#3fb950' : u < 80 ? '#d29922' : '#f85149';
        html += '<div style="display:flex;flex-direction:column;align-items:center;gap:1px">'
          + '<div style="width:14px;height:24px;background:rgba(0,0,0,0.3);border-radius:2px;overflow:hidden;position:relative">'
          + '<div style="position:absolute;bottom:0;width:100%;height:' + u + '%;border-radius:2px;background:' + cls + '"></div></div>'
          + '<span style="font-size:7px;color:rgba(255,255,255,0.4)">' + i + '</span></div>';
      }
      html += '</div></div>';
    }

    container.innerHTML = html;
  },

  esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
  },

  fmtSize(b) {
    if (!b) return '-';
    const u = ['B', 'KB', 'MB', 'GB']; let i = 0;
    while (b >= 1024 && i < 3) { b /= 1024; i++; }
    return (i === 0 ? b : b.toFixed(1)) + ' ' + u[i];
  },

  initDrag(e, winId) {
    if (e.button !== 0) return;
    const w = this.windows[winId];
    if (!w || w.maximized) return;
    const rect = w.el.getBoundingClientRect();
    this.dragData = { winId, startX: e.clientX, startY: e.clientY, origLeft: rect.left, origTop: rect.top };
    const tb = w.el.querySelector('.win7-win-titlebar');
    if (tb) tb.classList.add('dragging');
    document.addEventListener('mousemove', this._onDragMove);
    document.addEventListener('mouseup', this._onDragEnd);
    e.preventDefault();
  },

  _onDragMove(e) {
    const d = Win7.dragData;
    if (!d) return;
    const w = Win7.windows[d.winId];
    if (!w) return;
    w.el.style.left = (d.origLeft + e.clientX - d.startX) + 'px';
    w.el.style.top = (d.origTop + e.clientY - d.startY) + 'px';
  },

  _onDragEnd(e) {
    document.removeEventListener('mousemove', Win7._onDragMove);
    document.removeEventListener('mouseup', Win7._onDragEnd);
    const d = Win7.dragData;
    if (!d) return;
    const w = Win7.windows[d.winId];
    if (w) {
      const tb = w.el.querySelector('.win7-win-titlebar');
      if (tb) tb.classList.remove('dragging');
    }
    if (w && Math.abs(e.clientX - d.startX) < 5 && Math.abs(e.clientY - d.startY) < 5) {
      Win7.dragData = null;
      return;
    }

    if (w) {
      const desktop = document.getElementById('win7-desktop');
      const taskbar = document.getElementById('win7-taskbar');
      const tbH = taskbar ? taskbar.offsetHeight : 40;
      const dw = desktop.clientWidth;
      const dh = desktop.clientHeight - tbH;
      const rect = w.el.getBoundingClientRect();

      if (rect.top < 10) {
        Win7.maximizeWindow(d.winId);
      } else if (rect.left < 30) {
        w.normalRect = w.normalRect || { width: w.el.style.width, height: w.el.style.height, left: w.el.style.left, top: w.el.style.top };
        w.el.style.width = Math.floor(dw / 2) + 'px';
        w.el.style.height = dh + 'px';
        w.el.style.left = '0';
        w.el.style.top = '0';
        w.el.style.right = '';
        w.el.style.bottom = '';
      } else if (rect.left + rect.width > dw - 30) {
        w.normalRect = w.normalRect || { width: w.el.style.width, height: w.el.style.height, left: w.el.style.left, top: w.el.style.top };
        w.el.style.width = Math.floor(dw / 2) + 'px';
        w.el.style.height = dh + 'px';
        w.el.style.left = Math.floor(dw / 2) + 'px';
        w.el.style.top = '0';
        w.el.style.right = '';
        w.el.style.bottom = '';
      }
    }
    Win7.dragData = null;
  },

  initResize(e, winId, edge) {
    if (e.button !== 0) return;
    const w = this.windows[winId];
    if (!w || w.maximized) return;
    const rect = w.el.getBoundingClientRect();
    this.resizeData = {
      winId, edge, startX: e.clientX, startY: e.clientY,
      origW: rect.width, origH: rect.height,
      origL: rect.left, origT: rect.top, minW: 250, minH: 150,
    };
    document.addEventListener('mousemove', this._onResizeMove);
    document.addEventListener('mouseup', this._onResizeEnd);
    e.preventDefault();
  },

  _onResizeMove(e) {
    const d = Win7.resizeData;
    if (!d) return;
    const w = Win7.windows[d.winId];
    if (!w) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    let newW = d.origW, newH = d.origH, newL = d.origL, newT = d.origT;
    if (d.edge.includes('e')) newW = Math.max(d.minW, d.origW + dx);
    if (d.edge.includes('w')) { newW = Math.max(d.minW, d.origW - dx); newL = d.origL + (d.origW - newW); }
    if (d.edge.includes('s')) newH = Math.max(d.minH, d.origH + dy);
    if (d.edge.includes('n')) { newH = Math.max(d.minH, d.origH - dy); newT = d.origT + (d.origH - newH); }
    w.el.style.width = newW + 'px';
    w.el.style.height = newH + 'px';
    w.el.style.left = newL + 'px';
    w.el.style.top = newT + 'px';
  },

  _onResizeEnd() {
    document.removeEventListener('mousemove', Win7._onResizeMove);
    document.removeEventListener('mouseup', Win7._onResizeEnd);
    const d = Win7.resizeData;
    if (d) {
      const w = Win7.windows[d.winId];
      if (w && w.id === 'terminal') {
        const s = window.__getSessions()[window.__getActiveId()];
        if (s && s.fit) setTimeout(() => { s.fit.fit(); if (s.term) s.term.focus(); }, 50);
      }
    }
    Win7.resizeData = null;
  },
};

const overlay = document.getElementById('win7-overlay');

overlay.addEventListener('mousedown', (e) => {
  const titlebar = e.target.closest('.win7-win-titlebar');
  if (titlebar && titlebar.dataset.win) {
    const id = titlebar.dataset.win;
    Win7.focusWindow(id);
    if (id === 'terminal') {
      const s = window.__getSessions()[window.__getActiveId()];
      if (s && s.term) setTimeout(() => s.term.focus(), 50);
    }
    if (!e.target.closest('.win7-win-btn')) {
      if (e.detail === 2) { Win7.maximizeWindow(id); return; }
      Win7.initDrag(e, id);
      return;
    }
  }

  const winBtn = e.target.closest('.win7-win-btn');
  if (winBtn && winBtn.dataset.win && winBtn.dataset.action) {
    const id = winBtn.dataset.win;
    if (winBtn.dataset.action === 'close') Win7.closeWindow(id);
    else if (winBtn.dataset.action === 'minimize') Win7.minimizeWindow(id);
    else if (winBtn.dataset.action === 'maximize') Win7.maximizeWindow(id);
    return;
  }

  const resizeHandle = e.target.closest('.win7-win-resize-handle');
  if (resizeHandle && resizeHandle.dataset.win && resizeHandle.dataset.edge) {
    Win7.initResize(e, resizeHandle.dataset.win, resizeHandle.dataset.edge);
    return;
  }

  /* ── Content handlers (inside window body) ── */

  const fileItem = e.target.closest('.file-item');
  if (fileItem && fileItem.dataset.path) {
    const path = fileItem.dataset.path;
    const type = fileItem.dataset.type;
    if (type === 'dir' || fileItem.classList.contains('file-up-item')) {
      const addr = document.querySelector('#win7-win-files .win7-explorer-addr');
      if (addr) Win7.fileHistory.push(addr.value);
      if (window.send) window.send({ type: 'files', path });
      if (addr) addr.value = path;
    }
    return;
  }

  if (e.target.closest('#win7-explorer-go') || e.target.closest('.win7-explorer-go')) {
    const addr = document.querySelector('#win7-win-files .win7-explorer-addr');
    if (addr && window.send) {
      Win7.fileHistory.push(addr.value);
      window.send({ type: 'files', path: addr.value });
    }
    return;
  }

  if (e.target.closest('#win7-explorer-back')) {
    const addr = document.querySelector('#win7-win-files .win7-explorer-addr');
    if (addr && window.send) {
      const prev = Win7.fileHistory.length ? Win7.fileHistory.pop() : '.';
      window.send({ type: 'files', path: prev });
      addr.value = prev;
    }
    return;
  }

  const tab = e.target.closest('.win7-tab');
  if (tab && tab.dataset.tab) {
    const parent = tab.closest('.win7-window');
    if (parent) {
      parent.querySelectorAll('.win7-tab').forEach(t => t.classList.remove('active'));
      parent.querySelectorAll('.win7-tab-body').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const body = parent.querySelector('#win7-tab-' + tab.dataset.tab);
      if (body) body.classList.add('active');
      if (tab.dataset.tab === 'perf' && window.send) {
        window.send({ type: 'dashboard' });
      }
    }
    return;
  }

  const killBtn = e.target.closest('.win7-btn-kill');
  if (killBtn && killBtn.dataset.pid) {
    if (window.send) {
      window.send({ type: 'kill', pid: parseInt(killBtn.dataset.pid) });
      killBtn.textContent = '...';
      killBtn.disabled = true;
    }
    return;
  }

  const svcBtn = e.target.closest('.win7-btn-svc');
  if (svcBtn && svcBtn.dataset.svc && svcBtn.dataset.action) {
    if (window.send) {
      window.send({ type: 'service', name: svcBtn.dataset.svc, action: svcBtn.dataset.action });
      svcBtn.textContent = '...';
      svcBtn.disabled = true;
    }
    return;
  }

  const cpItem = e.target.closest('.win7-cp-item');
  if (cpItem && cpItem.dataset.action) {
    Win7.openApp(cpItem.dataset.action);
    return;
  }

  const computerItem = e.target.closest('[data-action]');
  if (computerItem && computerItem.closest('.win7-window')) {
    Win7.openApp(computerItem.dataset.action);
    return;
  }

  /* ── Window body focus (catch-all for unhandled body clicks) ── */
  const winBody = e.target.closest('.win7-win-body');
  if (winBody && winBody.dataset.win) {
    Win7.focusWindow(winBody.dataset.win);
    if (winBody.dataset.win === 'terminal') {
      const s = window.__getSessions()[window.__getActiveId()];
      if (s && s.term) s.term.focus();
    }
    return;
  }

  /* ── Non-body window catch-all ── */
  if (e.target.closest('.win7-window')) return;

  /* ── Desktop ── */
  if (e.target.closest('.win7-desktop')) {
    Win7.hideContextMenu();
    if (Win7.startMenuOpen) Win7.toggleStartMenu();
  }

  /* ── Taskbar ── */
  const tbBtn = e.target.closest('.win7-taskbar-btn');
  if (tbBtn && tbBtn.dataset.win) {
    const id = tbBtn.dataset.win;
    const w = Win7.windows[id];
    if (!w) return;
    if (w.minimized) Win7.restoreWindow(id);
    else if (id === Win7.windowOrder[Win7.windowOrder.length - 1] && !w.minimized) Win7.minimizeWindow(id);
    else Win7.focusWindow(id);
    return;
  }

  if (e.target.closest('.win7-show-desktop')) {
    Win7.showDesktop();
    return;
  }

  /* ── Start Menu ── */
  if (e.target.closest('.win7-start-btn')) {
    Win7.toggleStartMenu();
    return;
  }

  const startItem = e.target.closest('.win7-start-item');
  if (startItem) {
    const app = startItem.dataset.app;
    const shortcut = startItem.dataset.shortcut;
    const action = startItem.dataset.action;
    if (app) Win7.openApp(app);
    else if (shortcut) Win7.openApp(shortcut);
    else if (action === 'exit') Win7.toggle();
    return;
  }

  if (e.target.closest('.win7-start-shutdown')) {
    Win7.toggle();
    return;
  }

  /* ── Desktop Icons ── */
  const desktopIcon = e.target.closest('.win7-desktop-icon');
  if (desktopIcon) {
    const sc = desktopIcon.dataset.shortcut;
    if (sc === 'computer') Win7.openApp('computer');
    else if (sc === 'files') Win7.openApp('files');
    else if (sc === 'recycle') {
      Win7.createWindow({
        id: 'recycle-' + Date.now(), title: 'Recycle Bin', icon: '\u{1F5D1}',
        width: 400, height: 260,
        content: '<div style="padding:40px;text-align:center;color:rgba(255,255,255,0.4);font-size:48px;line-height:1">\u{1F5D1}</div><div style="text-align:center;color:rgba(255,255,255,0.4)">Recycle Bin is empty</div>',
      });
    }
    return;
  }
});

overlay.addEventListener('contextmenu', (e) => {
  if (e.target.closest('.win7-desktop')) {
    Win7.showContextMenu(e);
  }
});

overlay.addEventListener('click', (e) => {
  const ctxMenu = document.getElementById('win7-context-menu');
  if (ctxMenu.classList.contains('active') && !e.target.closest('.win7-context-menu')) {
    Win7.hideContextMenu();
  }

  const ctxItem = e.target.closest('.win7-ctx-item');
  if (ctxItem) {
    Win7.hideContextMenu();
    const action = ctxItem.dataset.action;
    if (action === 'personalize') {
      Win7.createWindow({
        id: 'personalize-' + Date.now(), title: 'Personalization', icon: '\u{1F3A8}',
        width: 420, height: 260,
        content: '<div style="padding:24px;text-align:center;color:rgba(255,255,255,0.6);font-size:13px">Personalization</div><div style="padding:0 24px 24px;text-align:center;color:rgba(255,255,255,0.3);font-size:11px">Choose a color scheme for the desktop. Options: Aero, Basic, High Contrast.</div>',
      });
    } else if (action === 'refresh') {
      if (window.send) {
        window.send({ type: 'dashboard' });
        window.send({ type: 'files', path: '.' });
      }
    } else if (action === 'view') {
      Win7.createWindow({
        id: 'view-' + Date.now(), title: 'View', icon: '\u{1F4DD}',
        width: 300, height: 200,
        content: '<div style="padding:24px;text-align:center;color:rgba(255,255,255,0.4);font-size:13px">Desktop view settings</div>',
      });
    }
  }
});

overlay.addEventListener('keydown', (e) => {
  const target = e.target;
  if (target.id === 'win7-explorer-addr' && e.key === 'Enter') {
    if (window.send) {
      Win7.fileHistory.push(target.value);
      window.send({ type: 'files', path: target.value });
    }
    return;
  }
  if (target.id === 'win7-search-input') {
    const q = target.value.toLowerCase();
    document.querySelectorAll('.win7-start-item').forEach(el => {
      const text = el.textContent.toLowerCase();
      el.style.display = text.includes(q) ? '' : 'none';
    });
    return;
  }
  if (e.key === 'Escape') {
    if (Win7.startMenuOpen) Win7.toggleStartMenu();
    if (document.getElementById('win7-context-menu').classList.contains('active')) {
      Win7.hideContextMenu();
    }
  }
});

document.getElementById('win7-btn')?.addEventListener('click', () => Win7.toggle());

window.win7Handle = (m) => Win7.onMessage(m);
