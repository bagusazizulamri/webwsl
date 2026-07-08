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
let ws, sessions = {}, activeId = null;

function connect() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host);
  ws.onopen = () => { setStatus('connected'); cmd('sysinfo'); };
  ws.onmessage = (e) => {
    try {
      const m = JSON.parse(e.data);
      if (Array.isArray(m)) { for (const x of m) handle(x); } else handle(m);
    } catch {}
  };
  ws.onclose = () => {
    setStatus('error'); sessions = {}; activeId = null;
    $('#term-c').innerHTML = ''; renderSessions();
    setTimeout(connect, 3000);
  };
  ws.onerror = () => setStatus('error');
}

function setStatus(s) {
  $('#dot').className = 'dot ' + s;
  $('#status-lbl').textContent = s === 'connected' ? 'Connected' : s === 'error' ? 'Error' : 'Connecting...';
}

function send(o) { if (ws?.readyState === 1) ws.send(JSON.stringify(o)); }

function cmd(c, id) { send({ type: 'cmd', command: c, id }); }

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
    case 'cmdout': {
      const el = m.id ? document.getElementById('out-' + m.id) : null;
      if (el) el.textContent = m.data;
      break;
    }
    case 'sysinfo':
      for (const [k, v] of Object.entries(m.data)) {
        const el = document.getElementById('info-' + k);
        if (el) el.textContent = v;
      }
      break;
  }
}

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
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === 'panel-' + name));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.panel === name));
  if (name === 'terminal' && sessions[activeId]) {
    requestAnimationFrame(() => { const s = sessions[activeId]; if (s?.fit) s.fit.fit(); if (s?.term) s.term.focus(); });
  }
}

function sendCmd(cmd) { if (activeId) send({ type: 'input', id: activeId, data: cmd + '\n' }); }

// ── Single event delegation ──
$('#sidebar').addEventListener('click', (e) => {
  const t = e.target;

  // Nav
  const nav = t.closest('.nav-btn');
  if (nav) return switchPanel(nav.dataset.panel);

  // New session
  if (t.closest('#new-btn')) return send({ type: 'create' });

  // Close session
  const sc = t.closest('.sclose');
  if (sc) return closeSession(sc.dataset.sid);

  // Switch session
  const si = t.closest('.session-item');
  if (si?.dataset.sid) return switchSession(si.dataset.sid);

  // Quick command
  const q = t.closest('.q-btn');
  if (q?.dataset.cmd) { switchPanel('terminal'); sendCmd(q.dataset.cmd); }

  // Tool buttons with data-cmd
  const btn = t.closest('[data-cmd]');
  if (!btn) return;

  switch (btn.dataset.cmd) {
    case 'sysinfo':
      send({ type: 'sysinfo' });
      break;
    case 'files':
      cmd('ls -la "' + ($('#fp')?.value || '.') + '"', 'files');
      break;
    case 'procs':
      cmd('ps aux --sort=-%mem | head -20', 'procs');
      break;
    case 'svcs':
      cmd('bash -c \'service --status-all 2>/dev/null || systemctl list-units --type=service --all --no-pager 2>/dev/null || echo "No svc mgr"\'', 'svcs');
      break;
  }
});

// File path enter key
$('#fp')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') cmd('ls -la "' + (e.target.value || '.') + '"', 'files');
});

// Resize RAF
let raf;
window.addEventListener('resize', () => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => { const s = sessions[activeId]; if (s?.fit) s.fit.fit(); });
}, { passive: true });

connect();
