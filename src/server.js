const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const os = require('os');
const pty = require('node-pty');
const { exec } = require('child_process');
const compression = require('compression');

const PORT = process.env.PORT || 3000;
const MAX_TERMINALS = 10;
const BATCH_INTERVAL = 16;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, maxPayload: 1024 * 1024 });

app.use(compression({ level: 6, threshold: 256 }));
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '1h', etag: true }));

const isWSL = os.platform() === 'win32' && require('child_process').spawnSync('wsl', ['echo', 'ok'], { timeout: 2000 }).status === 0;
const SHELL = isWSL ? 'wsl' : 'bash';

const terminals = new Map();
const outbox = new Map();

function send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch {} }

function enqueue(id, ws, data) {
  let b = outbox.get(ws);
  if (!b) { b = []; outbox.set(ws, b); }
  b.push(JSON.stringify({ type: 'output', id, data }));
}

setInterval(() => {
  for (const [ws, b] of outbox) {
    if (b.length && ws.readyState === 1) {
      ws.send('[' + b.join(',') + ']');
      b.length = 0;
    }
  }
}, BATCH_INTERVAL);

function createTerminal(ws) {
  if (terminals.size >= MAX_TERMINALS) { send(ws, { type: 'error', data: 'Max terminals reached' }); return null; }
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  const env = { ...process.env, TERM: 'xterm-256color' };
  const proc = isWSL
    ? pty.spawn('wsl', ['-e', 'bash', '--login'], { name: 'xterm-256color', cols: 80, rows: 24, cwd: os.homedir(), env })
    : pty.spawn('bash', ['--login'], { name: 'xterm-256color', cols: 80, rows: 24, cwd: os.homedir(), env });
  terminals.set(id, { proc, ws });
  send(ws, { type: 'init', id, shell: SHELL });
  proc.onData((d) => enqueue(id, ws, d));
  proc.onExit(({ exitCode }) => { if (terminals.has(id)) { send(ws, { type: 'exit', id, code: exitCode }); terminals.delete(id); } });
  return id;
}

function killTerminal(id) { const t = terminals.get(id); if (t) { try { t.proc.kill(); } catch {} terminals.delete(id); } }
function killAll(ws) { for (const [id, t] of terminals) { if (t.ws === ws) { try { t.proc.kill(); } catch {} terminals.delete(id); } } outbox.delete(ws); }

function run(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 10000, maxBuffer: 1024 * 64 }, (err, stdout, stderr) => {
      resolve((stdout || '') + (stderr ? '\n' + stderr : '') + (err ? '\nError: ' + err.message : ''));
    });
  });
}

function handleSlash(id, cmd) {
  const t = terminals.get(id);
  if (!t) return null;
  const parts = cmd.split(' ');
  const main = parts[0].toLowerCase();

  if (main === '/help') return 'Commands: /files <path>, /ps, /services, /sysinfo, /clear, /help';
  if (main === '/clear') { t.proc.write('\x1bc'); return null; }

  let shellCmd;
  if (main === '/files') {
    const p = parts.slice(1).join(' ') || '.';
    shellCmd = isWSL ? `wsl -e ls -la "${p}"` : `ls -la "${p}"`;
  } else if (main === '/ps') {
    shellCmd = isWSL ? `wsl -e ps aux --sort=-%mem | head -20` : `ps aux --sort=-%mem | head -20`;
  } else if (main === '/services') {
    shellCmd = isWSL
      ? `wsl -e bash -c 'service --status-all 2>/dev/null || systemctl list-units --type=service --all --no-pager 2>/dev/null || echo "No service manager"'`
      : `bash -c 'service --status-all 2>/dev/null || systemctl list-units --type=service --all --no-pager 2>/dev/null || echo "No service manager"'`;
  } else if (main === '/sysinfo') {
    shellCmd = isWSL ? `wsl -e bash -c 'echo "Host: $(hostname)\nKernel: $(uname -r)\nCPU: $(nproc) cores\nMem: $(free -h | awk "/^Mem:/{print \$3\"/\"\$2}")\nUptime: $(uptime -p)"'` : `bash -c 'echo "Host: $(hostname)\nKernel: $(uname -r)\nCPU: $(nproc) cores\nMem: $(free -h | awk "/^Mem:/{print \$3\"/\"\$2}")\nUptime: $(uptime -p)"'`;
  } else return null;

  run(shellCmd).then((output) => {
    enqueue(id, t.ws, '\r\n' + output + '\r\n');
  });
  return '';
}

wss.on('connection', (ws) => {
  createTerminal(ws);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      switch (msg.type) {
        case 'input': {
          const t = terminals.get(msg.id);
          if (!t) break;
          const trimmed = msg.data.trimEnd();
          const known = ['/help','/files','/ps','/services','/sysinfo','/clear'];
          if (known.some((k) => trimmed.startsWith(k + ' ') || trimmed === k)) {
            const result = handleSlash(msg.id, trimmed);
            if (result === '') break;
            if (result) { enqueue(msg.id, t.ws, '\r\n' + result + '\r\n'); break; }
          }
          t.proc.write(msg.data);
          break;
        }
        case 'resize': {
          const t = terminals.get(msg.id);
          if (t) t.proc.resize(msg.cols || 80, msg.rows || 24);
          break;
        }
        case 'create': createTerminal(ws); break;
        case 'close': killTerminal(msg.id); break;
        case 'cmd': {
          run(msg.command).then((out) => send(ws, { type: 'cmdout', id: msg.id || 0, data: out }));
          break;
        }
      }
    } catch {}
  });

  ws.on('close', () => killAll(ws));
  ws.on('error', () => killAll(ws));
});

server.listen(PORT, '0.0.0.0', () => process.stdout.write('WebWSL on http://localhost:' + PORT + '\n'));
