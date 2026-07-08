import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

const TERM_OPTS = {
  fontFamily: "'Fira Code','Cascadia Code','Consolas',monospace",
  fontSize: 14, lineHeight: 1.2, cursorBlink: true, scrollback: 5000,
  theme: {
    background: '#0d1117', foreground: '#e6edf3', cursor: '#58a6ff',
    cursorAccent: '#0d1117', selectionBackground: 'rgba(88,166,255,0.3)',
    black: '#484f58', red: '#ff7b72', green: '#3fb950', yellow: '#d29922',
    blue: '#58a6ff', magenta: '#bc8cff', cyan: '#79c0ff', white: '#b1bac4',
    brightBlack: '#6e7681', brightRed: '#ffa198', brightGreen: '#56d364',
    brightYellow: '#e3b341', brightBlue: '#79c0ff', brightMagenta: '#d2a8ff',
    brightCyan: '#a5d6ff', brightWhite: '#f0f6fc',
  },
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
let ws, sessions = {}, activeId = null;
let currentPath = '.', sortKey = '', sortDir = 1;
let refreshTimer = null;
let historyStack = [];

function connect() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host);
  ws.onopen = () => { setStatus('connected'); send({ type: 'dashboard' }); };
  ws.onmessage = (e) => {
    try {
      const m = JSON.parse(e.data);
      if (Array.isArray(m)) { for (const x of m) { handle(x); window.win7Handle && window.win7Handle(x); } } else { handle(m); window.win7Handle && window.win7Handle(m); }
    } catch {}
  };
  ws.onclose = () => {
    setStatus('error'); sessions = {}; activeId = null;
    $('#term-c').innerHTML = ''; renderSessions(); clearTimers();
    setTimeout(connect, 3000);
  };
  ws.onerror = () => setStatus('error');
}

function setStatus(s) {
  $('#dot').className = 'dot ' + s;
  $('#status-lbl').textContent = s === 'connected' ? 'Connected' : s === 'error' ? 'Error' : 'Connecting...';
}

function send(o) { if (ws?.readyState === 1) ws.send(JSON.stringify(o)); }
window.send = send;

function handle(m) {
  switch (m.type) {
    case 'init':
      sessions[m.id] = { id: m.id, shell: m.shell, term: null, fit: null };
      switchSession(m.id);
      break;
    case 'output':
      if (sessions[m.id]?.term) sessions[m.id].term.write(m.data);
      break;
    case 'exit':
      if (sessions[m.id]?.term)
        sessions[m.id].term.write('\r\n\x1b[31m[exit ' + m.code + ']\x1b[0m\r\n');
      break;
    case 'dashboard':
      renderDashboard(m.data);
      break;
    case 'files':
      renderFiles(m);
      break;
    case 'processes':
      renderProcesses(m);
      break;
    case 'services':
      renderServices(m);
      break;
    case 'cmdout': {
      const el = m.id ? document.getElementById('out-' + m.id) : null;
      if (el) el.textContent = m.data;
      break;
    }
    case 'kill-result': {
      const btn = document.querySelector('.btn-kill[data-pid="' + m.pid + '"]');
      if (btn) {
        btn.textContent = m.success ? 'Done' : 'Err';
        btn.disabled = true;
        setTimeout(() => { if (btn) btn.remove(); }, 1500);
      }
      break;
    }
    case 'service-result': {
      const btn = document.querySelector('.btn-svc[data-svc="' + m.name + '"]');
      if (btn) {
        btn.textContent = m.success ? (m.action === 'stop' ? 'Start' : 'Stop') : 'Fail';
        setTimeout(() => {
          const active = document.querySelector('.panel.active');
          if (active && active.id === 'panel-services') send({ type: 'services' });
        }, 500);
      }
      break;
    }
  }
}

/* ═══════════════════════════════════════
   DASHBOARD - Modern GUI with SVG Gauges
   ═══════════════════════════════════════ */
const CIRCUMFERENCE = 2 * Math.PI * 52;

function setGauge(id, pct, sub) {
  const g = document.getElementById(id);
  if (g) g.style.strokeDashoffset = CIRCUMFERENCE * (1 - Math.min(pct, 100) / 100);
  const pctEl = document.getElementById(id + '-pct') || document.getElementById(id.replace('gauge-', 'gauge-') + '-pct');
  const gaugeCard = g?.closest?.('.gauge-card');
  if (gaugeCard) {
    const pctText = gaugeCard.querySelector('.gauge-pct');
    if (pctText) pctText.textContent = Math.round(pct) + '%';
    const subText = gaugeCard.querySelector('.gauge-sub');
    if (subText) subText.textContent = sub || '';
  }
}

function renderDashboard(d) {
  for (const [k, v] of Object.entries(d)) {
    const el = document.getElementById('info-' + k);
    if (el && k !== 'cpuCount' && k !== 'cpuModel' && k !== 'cpuCores' && k !== 'cpuLoad' &&
        k !== 'memUsage' && k !== 'diskUsage' && k !== 'memory' && k !== 'disk') {
      el.textContent = v;
    }
  }
  if (d.cpuModel) {
    const el = $('#info-cpuModel');
    if (el) el.textContent = d.cpuModel;
  }
  if (d.cpuLoad !== undefined) {
    setGauge('gauge-cpu', d.cpuLoad, d.cpuCount + ' cores');
  }
  if (d.memUsage !== undefined) {
    setGauge('gauge-mem', d.memUsage, d.memUsage.toFixed(1) + '%');
    const el = $('#info-memory');
    if (el) el.textContent = d.memory;
  }
  if (d.diskUsage !== undefined) {
    setGauge('gauge-disk', parseFloat(d.diskUsage), d.diskUsage + '%');
    const el = $('#info-disk');
    if (el) el.textContent = d.disk;
  }
  if (d.cpuCores && Array.isArray(d.cpuCores)) {
    const cc = $('#cpu-cores');
    if (cc) {
      cc.innerHTML = d.cpuCores.map((u, i) => {
        const cls = u < 50 ? 'green' : u < 80 ? 'yellow' : 'red';
        return '<div class="cpu-core-col"><div class="cpu-core-bar-v"><div class="cpu-core-fill-v ' + cls + '" style="height:' + u + '%"></div></div><span class="cpu-core-lbl-v">' + i + '</span></div>';
      }).join('');
    }
  }
}

/* ═══════════════════════════════════════
   FILES - GUI Grid (Explorer/Thunar Style)
   ═══════════════════════════════════════ */
function getFileIcon(name, type) {
  if (type === 'dir') return '&#x1F4C1;';
  if (type === 'link') return '&#x1F517;';
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  const icons = {
    js: '&#x1F7E8;', ts: '&#x1F7E6;', py: '&#x1F40D;', html: '&#x1F310;',
    css: '&#x1F3A8;', json: '&#x2699;', md: '&#x1F4DD;', txt: '&#x1F4C4;',
    zip: '&#x1F4E6;', tar: '&#x1F4E6;', gz: '&#x1F4E6;', rar: '&#x1F4E6;',
    exe: '&#x2699;', deb: '&#x1F4E6;', rpm: '&#x1F4E6;',
    png: '&#x1F5BC;', jpg: '&#x1F5BC;', jpeg: '&#x1F5BC;', gif: '&#x1F5BC;', svg: '&#x1F5BC;',
    mp3: '&#x1F3B5;', wav: '&#x1F3B5;', mp4: '&#x1F3AC;', mov: '&#x1F3AC;',
    pdf: '&#x1F4D1;', sh: '&#x1F4BB;', bash: '&#x1F4BB;', conf: '&#x2699;',
    c: '&#x1F4BB;', cpp: '&#x1F4BB;', h: '&#x1F4BB;', go: '&#x1F426;', rs: '&#x1F980;',
  };
  return icons[ext] || '&#x1F4C4;';
}

function renderFiles(msg) {
  currentPath = msg.path;
  const c = $('#files-container');
  const isRoot = msg.path === '/';
  const parent = isRoot ? '/' : msg.path.replace(/\/+$/, '').replace(/\/[^/]*$/, '') || '/';

  let h = '';
  if (!isRoot) {
    h += '<div class="file-item file-up-item" data-path="' + parent.replace(/"/g, '&quot;') + '">';
    h += '<div class="file-icon">&#x2190;</div><div class="file-name">..</div></div>';
  }
  for (const e of msg.entries) {
    const path = (msg.path.replace(/\/$/, '') + '/' + e.name).replace(/"/g, '&quot;');
    const icon = getFileIcon(e.name, e.type);
    const cls = e.type === 'dir' ? 'file-folder' : (e.type === 'link' ? 'file-link' : '');
    h += '<div class="file-item ' + cls + '" data-path="' + path + '" data-type="' + e.type + '">';
    h += '<div class="file-icon">' + icon + '</div>';
    h += '<div class="file-name">' + esc(e.name) + (e.type === 'dir' ? '/' : '') + '</div>';
    if (e.type !== 'dir') {
      h += '<div class="file-size-sm">' + fmtSize(e.size) + '</div>';
    }
    h += '</div>';
  }
  c.innerHTML = h || '<div class="empty-msg">Empty directory</div>';

  renderBreadcrumb(msg.path);
}

function renderBreadcrumb(path) {
  const bc = $('#files-breadcrumb');
  if (!bc) return;
  const isAbs = path.startsWith('/');
  const parts = path === '/' ? ['/'] : path.replace(/\/$/, '').split('/').filter(Boolean);
  let h = '';
  if (isAbs && path !== '/') {
    h += '<span data-path="/">/</span>';
  }
  for (let i = 0; i < parts.length; i++) {
    if (i > 0 || (isAbs && path !== '/')) {
      h += '<span class="bc-sep">&#x276F;</span>';
    }
    const fullPath = isAbs ? '/' + parts.slice(0, i + 1).join('/') : parts.slice(0, i + 1).join('/');
    h += '<span data-path="' + fullPath.replace(/"/g, '&quot;') + '">' + esc(parts[i]) + '</span>';
  }
  bc.innerHTML = h;
}

/* ═══════════════════════════════════════
   PROCESSES - Task Manager Style
   ═══════════════════════════════════════ */
function barColor(val) {
  return val < 50 ? 'green' : val < 80 ? 'yellow' : 'red';
}

function renderProcesses(msg) {
  const list = msg.list;
  const c = $('#procs-container');
  const filter = ($('#proc-search')?.value || '').toLowerCase();
  const filtered = filter ? list.filter(p =>
    p.command.toLowerCase().includes(filter) ||
    p.user.toLowerCase().includes(filter) ||
    String(p.pid).includes(filter)
  ) : list;
  const sorted = sortData(filtered, sortKey, sortDir);
  let h = '<table class="tbl tbl-procs"><thead><tr>';
  const cols = [
    { key: 'pid', label: 'PID' }, { key: 'user', label: 'User' },
    { key: 'cpu', label: 'CPU%' }, { key: 'mem', label: 'MEM%' },
    { key: 'rss', label: 'RSS' }, { key: 'command', label: 'Command' },
    { key: '', label: '' },
  ];
  for (const col of cols) {
    const cls = sortKey === col.key ? 'sorted' : '';
    h += '<th class="' + cls + '" data-sort="' + col.key + '">' + col.label + '</th>';
  }
  h += '</tr></thead><tbody>';
  for (const p of sorted) {
    const cpuCls = barColor(p.cpu);
    const memCls = barColor(p.mem);
    h += '<tr><td>' + p.pid + '</td><td>' + esc(p.user) + '</td>';
    h += '<td><div class="cell-bar"><div class="bar"><div class="bar-fill ' + cpuCls + '" style="width:' + Math.min(p.cpu, 100) + '%"></div></div><span class="bar-lbl">' + p.cpu.toFixed(1) + '</span></div></td>';
    h += '<td><div class="cell-bar"><div class="bar"><div class="bar-fill ' + memCls + '" style="width:' + Math.min(p.mem, 100) + '%"></div></div><span class="bar-lbl">' + p.mem.toFixed(1) + '</span></div></td>';
    h += '<td class="val-rss">' + fmtSize(p.rss * 1024) + '</td><td>' + esc(p.command) + '</td>';
    h += '<td><button class="btn-kill" data-pid="' + p.pid + '">Kill</button></td></tr>';
  }
  h += '</tbody></table>';
  c.innerHTML = h || '<div class="empty-msg">No processes</div>';
}

/* ═══════════════════════════════════════
   SERVICES
   ═══════════════════════════════════════ */
function renderServices(msg) {
  const list = msg.list;
  const c = $('#svcs-container');
  let h = '<table class="tbl tbl-svcs"><thead><tr><th></th><th>Name</th><th>Status</th><th>Description</th></tr></thead><tbody>';
  for (const s of list) {
    const running = s.status === 'running' || s.status === 'active';
    const badge = running ? 'badge-running' : (s.status === 'stopped' || s.status === 'inactive' ? 'badge-stopped' : 'badge-unknown');
    const label = running ? 'Stop' : 'Start';
    const action = running ? 'stop' : 'start';
    const btnCls = running ? 'stop' : 'start';
    h += '<tr><td><button class="btn-svc ' + btnCls + '" data-svc="' + esc(s.name) + '" data-action="' + action + '">' + label + '</button></td>';
    h += '<td>' + esc(s.name) + '</td>';
    h += '<td><span class="badge ' + badge + '">' + esc(s.status) + '</span></td>';
    h += '<td>' + esc(s.description || '') + '</td></tr>';
  }
  h += '</tbody></table>';
  c.innerHTML = h || '<div class="empty-msg">No services</div>';
}

/* ═══════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════ */
function fmtSize(b) {
  if (!b) return '-';
  const u = ['B', 'KB', 'MB', 'GB']; let i = 0;
  while (b >= 1024 && i < 3) { b /= 1024; i++; }
  return (i === 0 ? b : b.toFixed(1)) + ' ' + u[i];
}

function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]); }

function sortData(arr, key, dir) {
  if (!key) return arr;
  return [...arr].sort((a, b) => {
    const va = a[key], vb = b[key];
    if (typeof va === 'number') return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });
}

/* ═══════════════════════════════════════
   TERMINAL
   ═══════════════════════════════════════ */
function switchSession(id) {
  activeId = id;
  const ct = $('#term-c');
  ct.innerHTML = '';
  const s = sessions[id];
  if (!s) return;

  if (s.term) {
    ct.appendChild(s.term.element); s.fit.fit(); s.term.focus();
    renderSessions(); return;
  }

  const t = new Terminal(TERM_OPTS);
  const fit = new FitAddon();
  t.loadAddon(fit);
  t.open(ct);
  fit.fit();

  s.term = t; s.fit = fit;
  t.onData((data) => send({ type: 'input', id, data }));

  let raf;
  t.onResize(({ cols, rows }) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => send({ type: 'resize', id, cols, rows }));
  });

  setTimeout(() => { fit.fit(); t.focus(); }, 50);
  renderSessions();
}

function closeSession(id) {
  if (sessions[id]?.term) sessions[id].term.dispose();
  delete sessions[id];
  send({ type: 'close', id });
  if (activeId === id) {
    const keys = Object.keys(sessions);
    if (keys.length) switchSession(keys[keys.length - 1]);
    else { activeId = null; send({ type: 'create' }); }
  }
  renderSessions();
}

function renderSessions() {
  const list = $('#session-list');
  if (!list) return;
  let h = '';
  for (const id of Object.keys(sessions)) {
    const s = sessions[id];
    h += '<div class="session-item' + (id === activeId ? ' active' : '') + '" data-sid="' + id + '">' +
      '<span class="session-dot"></span><span>' + s.shell + ' #' + id.slice(-4) + '</span>' +
      '<button class="sclose" data-sid="' + id + '">&times;</button></div>';
  }
  list.innerHTML = h;
}

function switchPanel(name) {
  $$('.panel').forEach((p) => p.classList.toggle('active', p.id === 'panel-' + name));
  $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.panel === name));
  if (name === 'terminal' && sessions[activeId]) {
    requestAnimationFrame(() => { const s = sessions[activeId]; if (s?.fit) s.fit.fit(); if (s?.term) s.term.focus(); });
  }
  clearTimers();
  if (name === 'dashboard') {
    send({ type: 'dashboard' });
    refreshTimer = setInterval(() => {
      if (document.querySelector('.panel.active')?.id === 'panel-dashboard') send({ type: 'dashboard' });
    }, 5000);
  } else if (name === 'files') {
    send({ type: 'files', path: ($('#fp')?.value || '.') });
  } else if (name === 'processes') {
    send({ type: 'processes' });
    refreshTimer = setInterval(() => {
      if (document.querySelector('.panel.active')?.id === 'panel-processes') send({ type: 'processes' });
    }, 5000);
  } else if (name === 'services') {
    send({ type: 'services' });
    refreshTimer = setInterval(() => {
      if (document.querySelector('.panel.active')?.id === 'panel-services') send({ type: 'services' });
    }, 8000);
  }
}

function clearTimers() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
}

function sendCmd(cmd) { if (activeId) send({ type: 'input', id: activeId, data: cmd + '\n' }); }

function loadFiles(path) {
  if ($('#fp')) $('#fp').value = path;
  send({ type: 'files', path: path });
}

/* ═══════════════════════════════════════
   EVENT DELEGATION (click on #app)
   ═══════════════════════════════════════ */
$('#app').addEventListener('click', (e) => {
  const t = e.target;

  const nav = t.closest('.nav-btn');
  if (nav) return switchPanel(nav.dataset.panel);

  if (t.closest('#new-btn')) return send({ type: 'create' });

  const sc = t.closest('.sclose');
  if (sc) return closeSession(sc.dataset.sid);

  const si = t.closest('.session-item');
  if (si?.dataset.sid) return switchSession(si.dataset.sid);

  const q = t.closest('.q-btn');
  if (q?.dataset.cmd) { switchPanel('terminal'); sendCmd(q.dataset.cmd); }

  if (t.closest('#files-go')) {
    const path = $('#fp')?.value || '.';
    loadFiles(path);
    return;
  }

  if (t.closest('#files-back')) {
    if (historyStack.length > 0) {
      const prev = historyStack.pop();
      loadFiles(prev);
    }
    return;
  }

  const fileItem = t.closest('.file-item');
  if (fileItem) {
    const path = fileItem.dataset.path;
    const type = fileItem.dataset.type;
    if (path) {
      if (type === 'dir') {
        historyStack.push(currentPath);
        loadFiles(path);
      } else if (fileItem.classList.contains('file-up-item')) {
        loadFiles(path);
      }
    }
    return;
  }

  const bcSpan = t.closest('.files-breadcrumb span:not(.bc-sep)');
  if (bcSpan && bcSpan.dataset.path) {
    loadFiles(bcSpan.dataset.path);
    return;
  }

  const th = t.closest('th[data-sort]');
  if (th) {
    const key = th.dataset.sort;
    if (!key) return;
    if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = 1; }
    const active = document.querySelector('.panel.active');
    if (active && active.id === 'panel-processes') {
      send({ type: 'processes' });
    }
    return;
  }

  const killBtn = t.closest('.btn-kill');
  if (killBtn && killBtn.dataset.pid) {
    send({ type: 'kill', pid: parseInt(killBtn.dataset.pid) });
    killBtn.textContent = '...';
    killBtn.disabled = true;
    return;
  }

  const svcBtn = t.closest('.btn-svc');
  if (svcBtn && svcBtn.dataset.svc && svcBtn.dataset.action) {
    send({ type: 'service', name: svcBtn.dataset.svc, action: svcBtn.dataset.action });
    svcBtn.textContent = '...';
    svcBtn.disabled = true;
    return;
  }
});

$('#fp')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadFiles(e.target.value || '.');
});

$('#proc-search')?.addEventListener('input', () => {
  const active = document.querySelector('.panel.active');
  if (active && active.id === 'panel-processes') send({ type: 'processes' });
});

let raf;
window.addEventListener('resize', () => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => { const s = sessions[activeId]; if (s?.fit) s.fit.fit(); });
}, { passive: true });

window.__getActiveId = () => activeId;
window.__getSessions = () => sessions;

connect();
