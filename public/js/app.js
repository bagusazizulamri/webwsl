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

/* Create an initial terminal session silently on load */
let initialCreated = false;

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
let ws, sessions = {}, activeId = null;
let sortKey = '', sortDir = 1;
let refreshTimer = null;
let reconnectAttempts = 0;

function connect() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host);
  ws.onopen = () => {
    setStatus('connected');
    reconnectAttempts = 0;
    send({ type: 'dashboard' });
    if (!initialCreated) { initialCreated = true; send({ type: 'create' }); }
  };
  ws.onmessage = (e) => {
    try {
      const m = JSON.parse(e.data);
      if (Array.isArray(m)) { for (const x of m) { handle(x); window.win7Handle && window.win7Handle(x); } } else { handle(m); window.win7Handle && window.win7Handle(m); }
    } catch {}
  };
  ws.onclose = () => {
    setStatus('error'); sessions = {}; activeId = null;
    $('#term-c').innerHTML = ''; renderSessions(); clearTimers();
    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    setTimeout(connect, delay);
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
      const sel = '.btn-svc[data-svc="' + m.name + '"], .btn-restart-svc[data-svc="' + m.name + '"]';
      const btn = document.querySelector(sel);
      if (btn) {
        btn.textContent = m.success ? (m.action === 'stop' ? 'Start' : m.action === 'restart' ? '\u{1F504} Restart' : 'Stop') : 'Fail';
        btn.disabled = false;
        setTimeout(() => {
          const active = document.querySelector('.panel.active');
          if (active && (active.id === 'panel-services' || active.id === 'panel-dashboard')) send({ type: 'services' });
        }, 500);
      }
      break;
    }
    case 'file-stat': {
      const s = m.stat || {};
      const info = 'Path: ' + m.path + '\nSize: ' + fmtSize(s.size || 0) + '\nMode: ' + (s.mode || '') + '\nModified: ' + (s.mtime || '');
      alert(info);
      break;
    }
    case 'file-delete-result': {
      const pane = m._pane || 0;
      const p = filesState.tabs[filesState.activeTab] || '.';
      loadFilesPane(pane, p);
      break;
    }
    case 'file-result': {
      const pane = 0;
      const p = filesState.tabs[filesState.activeTab] || '.';
      loadFilesPane(pane, p);
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
   FILES - Thunar-style Explorer
   ═══════════════════════════════════════ */
const filesState = { activePane: 0, split: false, showHidden: false, tabs: [{ path: '.' }], activeTab: 0, hist: [[], []] };

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

function fpPaneId() { return filesState.activePane === 0 ? '' : '2'; }

function rfile(gridId, bcId, path, entries, pane) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const isRoot = path === '/';
  const parent = isRoot ? '/' : path.replace(/\/+$/, '').replace(/\/[^/]*$/, '') || '/';

  /* Filter hidden */
  const filtered = filesState.showHidden ? entries : entries.filter(e => !e.name.startsWith('.'));

  /* Filter by search */
  const searchEl = document.getElementById('files-search');
  const q = (searchEl?.value || '').trim().toLowerCase();
  const searched = q ? filtered.filter(e => e.name.toLowerCase().includes(q)) : filtered;

  let h = '';
  if (!isRoot) {
    h += '<div class="file-item file-up-item" data-path="' + parent.replace(/"/g, '&quot;') + '" data-pane="' + pane + '">';
    h += '<div class="file-icon">&#x2190;</div><div class="file-name">..</div></div>';
  }
  for (const e of searched) {
    const p = (path.replace(/\/$/, '') + '/' + e.name).replace(/"/g, '&quot;');
    const icon = getFileIcon(e.name, e.type);
    const cls = e.type === 'dir' ? 'file-folder' : (e.type === 'link' ? 'file-link' : '');
    h += '<div class="file-item ' + cls + '" data-path="' + p + '" data-type="' + e.type + '" data-pane="' + pane + '">';
    h += '<div class="file-icon">' + icon + '</div>';
    h += '<div class="file-name">' + esc(e.name) + (e.type === 'dir' ? '/' : '') + '</div>';
    if (e.type !== 'dir') h += '<div class="file-size-sm">' + fmtSize(e.size) + '</div>';
    h += '</div>';
  }
  grid.innerHTML = h || '<div class="empty-msg">' + (q ? 'No results for "' + q + '"' : 'Empty directory') + '</div>';

  /* Status */
  const statusL = document.getElementById('fp-status-left');
  if (statusL) statusL.textContent = searched.length + (q ? ' matches' : ' items');
  const dirs = entries.filter(e => e.type === 'dir').length;
  const fcount = entries.length - dirs;
  const statusR = document.getElementById('fp-status-right');
  if (statusR) statusR.textContent = path + ' — ' + dirs + ' folders, ' + fcount + ' files';

  /* Breadcrumb */
  const bc = document.getElementById(bcId);
  if (bc) {
    const parts = path === '/' ? ['/'] : path.replace(/\/$/, '').split('/').filter(Boolean);
    let b = '';
    if (path !== '/') b += '<span data-path="/">/</span>';
    for (let i = 0; i < parts.length; i++) {
      if (i > 0 || path !== '/') b += '<span class="bc-sep">&#x276F;</span>';
      const fullPath = (path.startsWith('/') ? '/' : '') + parts.slice(0, i + 1).join('/');
      b += '<span data-path="' + fullPath.replace(/"/g, '&quot;') + '">' + esc(parts[i]) + '</span>';
    }
    bc.innerHTML = b;
  }
}

function loadFilesPane(pane, path) {
  const s = pane === 0 ? '' : '2';
  send({ type: 'files', path: path || '.', _pane: pane });
  const inp = document.getElementById('fp' + s + '-path');
  if (inp) inp.value = path || '.';
}

function renderFiles(msg) {
  const pane = msg._pane || 0;
  const s = pane === 0 ? '' : '2';
  if (pane === 0 && filesState.tabs[filesState.activeTab]) filesState.tabs[filesState.activeTab] = msg.path;
  if (msg._br) {
    brFiles = msg.entries.map(e => ({ path: msg.path + '/' + e.name, name: e.name, type: e.type }));
    renderBrPreview();
    document.getElementById('files-bulk-rename').style.display = 'flex';
    return;
  }
  rfile('fp' + s + '-container', 'fp' + s + '-breadcrumb', msg.path, msg.entries, pane);
  if (pane === 0) {
    filesState.tabs[filesState.activeTab] = msg.path;
    renderTabs();
  }
}

function renderTabs() {
  const bar = document.getElementById('files-tabbar');
  if (!bar) return;
  const tabs = filesState.tabs;
  let h = '';
  for (let i = 0; i < tabs.length; i++) {
    const active = i === filesState.activeTab ? ' active' : '';
    const p = tabs[i] || '.';
    const label = p === '/' ? '/' : p.split('/').filter(Boolean).pop() || 'Home';
    h += '<div class="files-tab' + active + '" data-tab="' + i + '">'
      + '<span class="files-tab-label">&#x1F4C1; ' + esc(label) + '</span>'
      + '<button class="files-tab-close" data-tab="' + i + '">&times;</button></div>';
  }
  h += '<button class="files-tab-new" id="files-tab-new" title="New Tab (Ctrl+T)">+</button>';
  bar.innerHTML = h;
}

function switchTab(idx) {
  filesState.activeTab = idx;
  const p = filesState.tabs[idx] || '.';
  loadFilesPane(0, p);
  renderTabs();
}

/* ── Context menu ── */
let filesCtxTarget = null;

document.addEventListener('contextmenu', (e) => {
  const panel = document.querySelector('.panel.active');
  if (!panel || panel.id !== 'panel-files') return;
  const fi = e.target.closest('.file-item');
  if (!fi) { const cm = document.getElementById('files-context-menu'); if (cm) cm.style.display = 'none'; return; }
  e.preventDefault();
  filesCtxTarget = fi;
  const cm = document.getElementById('files-context-menu');
  if (!cm) return;
  cm.style.display = 'block';
  cm.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
  cm.style.top = Math.min(e.clientY, window.innerHeight - 250) + 'px';
});

document.addEventListener('click', () => {
  const cm = document.getElementById('files-context-menu');
  if (cm) cm.style.display = 'none';
});

$('#files-context-menu')?.addEventListener('click', (e) => {
  const item = e.target.closest('.files-cm-item');
  if (!item || !filesCtxTarget) return;
  const action = item.dataset.action;
  const path = filesCtxTarget.dataset.path;
  const type = filesCtxTarget.dataset.type;
  const pane = parseInt(filesCtxTarget.dataset.pane) || 0;

  if (action === 'open') {
    if (type === 'dir') loadFilesPane(pane, path);
    return;
  }
  if (action === 'delete') {
    if (confirm('Delete "' + path + '"?')) send({ type: 'file-delete', path: path });
    return;
  }
  if (action === 'new-folder') {
    const name = prompt('Folder name:');
    if (name) send({ type: 'file-mkdir', path: (filesState.tabs[filesState.activeTab] || '.') + '/' + name });
    return;
  }
  if (action === 'new-file') {
    const name = prompt('File name:');
    if (name) send({ type: 'file-create', path: (filesState.tabs[filesState.activeTab] || '.') + '/' + name });
    return;
  }
  if (action === 'rename') {
    const name = prompt('New name:', path.split('/').pop());
    if (name) send({ type: 'file-rename', path: path, name: name });
    return;
  }
  if (action === 'bulk-rename') {
    openBulkRename();
    return;
  }
  if (action === 'properties') {
    send({ type: 'file-stat', path: path, _pane: pane });
    return;
  }
});

/* ── Bulk rename ── */
let brFiles = [];

function openBulkRename() {
  const sel = document.querySelectorAll('#panel-files .file-item.selected');
  brFiles = sel.length > 0 ? Array.from(sel).map(el => ({
    path: el.dataset.path, name: el.dataset.path.split('/').pop(), type: el.dataset.type
  })) : [];
  if (brFiles.length === 0) {
    const curPath = filesState.tabs[filesState.activeTab] || '.';
    send({ type: 'files', path: curPath, _br: true });
    return;
  }
  renderBrPreview();
  document.getElementById('files-bulk-rename').style.display = 'flex';
}

function renderBrPreview() {
  const list = document.getElementById('br-preview-list');
  if (!list) return;
  if (brFiles.length === 0) { list.innerHTML = '<div class="empty-msg">Select files first</div>'; return; }
  const srch = document.getElementById('br-search')?.value || '';
  const repl = document.getElementById('br-replace')?.value || '';
  const prefix = document.getElementById('br-prefix')?.value || '';
  const suffix = document.getElementById('br-suffix')?.value || '';
  const numTpl = document.getElementById('br-numbering')?.value || '';
  const numFiles = document.getElementById('br-number-files')?.checked;
  const numDirs = document.getElementById('br-number-dirs')?.checked;
  let n = 0;
  let h = '';
  for (let i = 0; i < Math.min(brFiles.length, 40); i++) {
    const f = brFiles[i];
    let newName = f.name;
    if (srch) newName = newName.split(srch).join(repl);
    if (numFiles && f.type !== 'dir') { newName = prefix + n + suffix; n++; }
    else if (numDirs && f.type === 'dir') { newName = prefix + n + suffix; n++; }
    else { newName = prefix + newName + suffix; }
    if (numTpl) {
      newName = numTpl.replace('{n}', String(i));
      if (!numFiles && !numDirs) newName = prefix + newName + suffix;
    }
    h += '<div>' + esc(f.name) + ' → ' + esc(newName) + '</div>';
  }
  list.innerHTML = h || '<div>No files</div>';
}

['br-search', 'br-replace', 'br-prefix', 'br-suffix', 'br-numbering', 'br-number-files', 'br-number-dirs'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', renderBrPreview);
  document.getElementById(id)?.addEventListener('change', renderBrPreview);
});

$('#br-apply')?.addEventListener('click', () => {
  if (brFiles.length === 0) return;
  const srch = document.getElementById('br-search')?.value || '';
  const repl = document.getElementById('br-replace')?.value || '';
  const prefix = document.getElementById('br-prefix')?.value || '';
  const suffix = document.getElementById('br-suffix')?.value || '';
  const numTpl = document.getElementById('br-numbering')?.value || '';
  const numFiles = document.getElementById('br-number-files')?.checked;
  const numDirs = document.getElementById('br-number-dirs')?.checked;
  let n = 0;
  for (const f of brFiles) {
    let newName = f.name;
    if (srch) newName = newName.split(srch).join(repl);
    if (numFiles && f.type !== 'dir') { newName = prefix + n + suffix; n++; }
    else if (numDirs && f.type === 'dir') { newName = prefix + n + suffix; n++; }
    else { newName = prefix + newName + suffix; }
    if (numTpl) {
      newName = numTpl.replace('{n}', String(n));
      if (numFiles || numDirs) n++;
      else newName = prefix + newName + suffix;
    }
    const dir = f.path.substring(0, f.path.lastIndexOf('/') + 1) || '';
    send({ type: 'file-rename', path: f.path, newPath: dir + newName });
  }
  document.getElementById('files-bulk-rename').style.display = 'none';
});

$('#br-cancel')?.addEventListener('click', () => {
  document.getElementById('files-bulk-rename').style.display = 'none';
});

/* ── Select file items with Ctrl+click ── */
document.addEventListener('click', (e) => {
  const fi = e.target.closest('.file-item');
  if (!fi) return;
  if (e.ctrlKey || e.metaKey) {
    fi.classList.toggle('selected');
  }
});

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
    h += '<tr><td style="display:flex;gap:2px">'
      + '<button class="btn-svc ' + btnCls + '" data-svc="' + esc(s.name) + '" data-action="' + action + '" style="padding:2px 6px;font-size:9px">' + label + '</button>'
      + '<button class="btn-restart-svc" data-svc="' + esc(s.name) + '" title="Restart" style="padding:2px 5px;font-size:9px;background:rgba(210,153,34,0.08);border:1px solid rgba(210,153,34,0.2);color:#d29922;border-radius:3px;cursor:pointer;font-family:inherit">\u{1F504}</button></td>';
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

/* ═══════════════════════════════════════
   EVENT DELEGATION (click on #app)
   ═══════════════════════════════════════ */
$('#app').addEventListener('click', (e) => {
  const t = e.target;

  const nav = t.closest('.nav-btn');
  if (nav) {
    if (nav.id === 'win7-btn') { if (window.toggleWin7) window.toggleWin7(); return; }
    return switchPanel(nav.dataset.panel);
  }

  if (t.closest('#new-btn')) return send({ type: 'create' });

  const sc = t.closest('.sclose');
  if (sc) return closeSession(sc.dataset.sid);

  const si = t.closest('.session-item');
  if (si?.dataset.sid) return switchSession(si.dataset.sid);

  const q = t.closest('.q-btn');
  if (q?.dataset.cmd) { switchPanel('terminal'); sendCmd(q.dataset.cmd); }

  const q2 = t.closest('.q2-btn');
  if (q2?.dataset.cmd) { switchPanel('terminal'); sendCmd(q2.dataset.cmd); }

  const appCard = t.closest('.app-card');
  if (appCard && appCard.dataset.app) {
    const app = appCard.dataset.app;
    if (app === 'win7') { document.getElementById('win7-btn')?.click(); }
    else if (app === 'run') { if (window.Win7) Win7.openRunDialog(); else switchPanel('terminal'); }
    else { switchPanel(app); }
    return;
  }

  /* File tabs */
  if (t.closest('#files-tab-new')) {
    const idx = filesState.tabs.length;
    filesState.tabs.push('.');
    filesState.activeTab = idx;
    switchTab(idx);
    return;
  }
  const tabClose = t.closest('.files-tab-close');
  if (tabClose) {
    e.stopPropagation();
    const idx = parseInt(tabClose.dataset.tab);
    if (filesState.tabs.length <= 1) return;
    filesState.tabs.splice(idx, 1);
    if (filesState.activeTab >= filesState.tabs.length) filesState.activeTab = filesState.tabs.length - 1;
    if (filesState.activeTab >= idx && idx > 0) filesState.activeTab--;
    switchTab(filesState.activeTab);
    return;
  }
  const tabLabel = t.closest('.files-tab');
  if (tabLabel && !t.closest('.files-tab-close')) {
    const idx = parseInt(tabLabel.dataset.tab);
    switchTab(idx);
    return;
  }

  /* Split pane toggle */
  if (t.closest('#files-btn-split')) {
    filesState.split = !filesState.split;
    const pane2 = document.getElementById('files-pane-1');
    if (pane2) pane2.style.display = filesState.split ? 'flex' : 'none';
    t.closest('#files-btn-split')?.classList.toggle('active', filesState.split);
    return;
  }

  /* Hidden files toggle */
  if (t.closest('#files-btn-hidden')) {
    filesState.showHidden = !filesState.showHidden;
    t.closest('#files-btn-hidden')?.classList.toggle('active', filesState.showHidden);
    const pane = filesState.activePane;
    const p = filesState.tabs[filesState.activeTab] || '.';
    loadFilesPane(pane, p);
    return;
  }

  /* Split pane 2 close */
  if (t.closest('#fp2-close')) {
    filesState.split = false;
    const pane2 = document.getElementById('files-pane-1');
    if (pane2) pane2.style.display = 'none';
    document.getElementById('files-btn-split')?.classList.remove('active');
    return;
  }

  /* Pane-specific Go buttons */
  if (t.closest('#fp-go')) {
    const path = document.getElementById('fp-path')?.value || '.';
    loadFilesPane(0, path);
    return;
  }
  if (t.closest('#fp2-go')) {
    const path = document.getElementById('fp2-path')?.value || '.';
    loadFilesPane(1, path);
    return;
  }

  /* Pane nav buttons */
  const navMap = { 'fp-back': [0, 'back'], 'fp-forward': [0, 'forward'], 'fp-up': [0, 'up'], 'fp-home': [0, 'home'],
    'fp2-back': [1, 'back'], 'fp2-forward': [1, 'forward'], 'fp2-up': [1, 'up'] };
  for (const [id, [pane, dir]] of Object.entries(navMap)) {
    const btn = t.closest('#' + id);
    if (!btn) continue;
    const s = pane === 0 ? '' : '2';
    const cur = document.getElementById('fp' + s + '-path')?.value || '.';
    if (dir === 'home') { loadFilesPane(pane, '.'); return; }
    if (dir === 'up') {
      const up = cur === '/' ? '/' : cur.replace(/\/+$/, '').replace(/\/[^/]*$/, '') || '/';
      loadFilesPane(pane, up); return;
    }
    if (dir === 'back') {
      const hist = filesState.hist[pane];
      if (hist.length > 0) {
        const prev = hist.pop();
        const curPath = document.getElementById('fp' + s + '-path')?.value || '.';
        filesState.hist[pane + '_fwd'] = filesState.hist[pane + '_fwd'] || [];
        filesState.hist[pane + '_fwd'].push(curPath);
        loadFilesPane(pane, prev);
      }
      return;
    }
    if (dir === 'forward') {
      const fwd = filesState.hist[pane + '_fwd'];
      if (fwd && fwd.length > 0) {
        const next = fwd.pop();
        filesState.hist[pane] = filesState.hist[pane] || [];
        filesState.hist[pane].push(document.getElementById('fp' + s + '-path')?.value || '.');
        loadFilesPane(pane, next);
      }
      return;
    }
  }

  /* Sidebar items */
  const si2 = t.closest('.files-sidebar-item');
  if (si2 && si2.dataset.path) {
    document.querySelectorAll('.files-sidebar-item').forEach(el => el.classList.remove('active'));
    si2.classList.add('active');
    const pane = filesState.activePane;
    const p = si2.dataset.path;
    loadFilesPane(pane, p);
    return;
  }

  /* File items */
  const fileItem = t.closest('.file-item');
  if (fileItem) {
    const path = fileItem.dataset.path;
    const type = fileItem.dataset.type;
    const pane = parseInt(fileItem.dataset.pane) || 0;
    if (path) {
      if (type === 'dir' || fileItem.classList.contains('file-up-item')) {
        const s = pane === 0 ? '' : '2';
        const cur = document.getElementById('fp' + s + '-path')?.value || '.';
        filesState.hist[pane] = filesState.hist[pane] || [];
        filesState.hist[pane].push(cur);
        loadFilesPane(pane, path);
      }
    }
    return;
  }

  /* Breadcrumbs */
  const bcSpan = t.closest('.files-breadcrumb span:not(.bc-sep)');
  if (bcSpan && bcSpan.dataset.path) {
    const pane = filesState.activePane;
    loadFilesPane(pane, bcSpan.dataset.path);
    return;
  }

  /* Process table sort */
  const th = t.closest('th[data-sort]');
  if (th) {
    const key = th.dataset.sort;
    if (!key) return;
    if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = 1; }
    const active = document.querySelector('.panel.active');
    if (active && active.id === 'panel-processes') send({ type: 'processes' });
    return;
  }

  const killBtn = t.closest('.btn-kill');
  if (killBtn && killBtn.dataset.pid) {
    send({ type: 'kill', pid: parseInt(killBtn.dataset.pid) });
    killBtn.textContent = '...'; killBtn.disabled = true;
    return;
  }

  const svcBtn = t.closest('.btn-svc');
  if (svcBtn && svcBtn.dataset.svc && svcBtn.dataset.action) {
    send({ type: svcBtn.dataset.action === 'restart' ? 'restart' : 'service', name: svcBtn.dataset.svc, action: svcBtn.dataset.action });
    svcBtn.textContent = '...'; svcBtn.disabled = true;
    return;
  }

  const restartBtn = t.closest('.btn-restart-svc');
  if (restartBtn && restartBtn.dataset.svc) {
    send({ type: 'restart', pid: restartBtn.dataset.svc });
    restartBtn.textContent = '...'; restartBtn.disabled = true;
    setTimeout(() => send({ type: 'services' }), 2000);
    return;
  }

  const cleanBtn = t.closest('.btn-clean-cache');
  if (cleanBtn) {
    cleanBtn.textContent = 'Cleaning...'; cleanBtn.disabled = true;
    send({ type: 'clean-cache' });
    setTimeout(() => { cleanBtn.textContent = '\u{1F9F9} Clean Cache'; cleanBtn.disabled = false; }, 5000);
    return;
  }
});

/* File pane Enter keys */
document.getElementById('fp-path')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadFilesPane(0, e.target.value || '.');
});
document.getElementById('fp2-path')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadFilesPane(1, e.target.value || '.');
});

/* Search on input */
document.getElementById('files-search')?.addEventListener('input', () => {
  const pane = filesState.activePane;
  const p = filesState.tabs[filesState.activeTab] || '.';
  loadFilesPane(pane, p);
});

/* Keyboard shortcuts for file panel */
document.addEventListener('keydown', (e) => {
  const panel = document.querySelector('.panel.active');
  if (!panel || panel.id !== 'panel-files') return;

  if (e.ctrlKey && e.key === 't') {
    e.preventDefault();
    const idx = filesState.tabs.length;
    filesState.tabs.push('.');
    filesState.activeTab = idx;
    switchTab(idx);
    return;
  }
  if (e.ctrlKey && e.key === 'w') {
    e.preventDefault();
    if (filesState.tabs.length <= 1) return;
    filesState.tabs.splice(filesState.activeTab, 1);
    if (filesState.activeTab >= filesState.tabs.length) filesState.activeTab = filesState.tabs.length - 1;
    switchTab(filesState.activeTab);
    return;
  }
  if (e.key === 'F3') {
    e.preventDefault();
    filesState.split = !filesState.split;
    const p2 = document.getElementById('files-pane-1');
    if (p2) p2.style.display = filesState.split ? 'flex' : 'none';
    document.getElementById('files-btn-split')?.classList.toggle('active', filesState.split);
    return;
  }
  if (e.ctrlKey && e.key === 'e') {
    e.preventDefault();
    filesState.showHidden = !filesState.showHidden;
    document.getElementById('files-btn-hidden')?.classList.toggle('active', filesState.showHidden);
    const p = filesState.tabs[filesState.activeTab] || '.';
    loadFilesPane(filesState.activePane, p);
    return;
  }
  if (e.ctrlKey && e.key === 'f') {
    e.preventDefault();
    const sb = document.getElementById('files-search');
    if (sb) { sb.focus(); sb.select(); }
    return;
  }
});

/* Proc search */
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
