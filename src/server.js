const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const os = require('os');
const pty = require('node-pty');
const { exec } = require('child_process');
const compression = require('compression');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const MAX_TERMINALS = 10;
const BATCH_INTERVAL = 16;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, maxPayload: 1024 * 1024 });

app.use(compression({ level: 6, threshold: 256 }));
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: 0, etag: false }));

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

function getDashboard() {
  return new Promise((resolve) => {
    const load = os.loadavg();
    const cpus = os.cpus();
    const cpuCores = cpus.map(c => {
      const total = Object.values(c.times).reduce((a, b) => a + b, 0);
      return parseFloat(((1 - c.times.idle / total) * 100).toFixed(1));
    });
    const memTotal = os.totalmem();
    const memFree = os.freemem();
    const memUsed = memTotal - memFree;
    const data = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      shell: SHELL,
      cpuCount: cpus.length,
      cpuModel: cpus[0].model.trim(),
      cpuCores,
      cpuLoad: parseFloat((load[0] / cpus.length * 100).toFixed(1)),
      memUsage: parseFloat((memUsed / memTotal * 100).toFixed(1)),
      memory: `${(memUsed / 1048576).toFixed(0)}MB / ${(memTotal / 1048576).toFixed(0)}MB`,
      uptime: (s => { const d = s / 86400 | 0; const h = s % 86400 / 3600 | 0; const m = s % 3600 / 60 | 0; return `${d}d ${h}h ${m}m`; })(os.uptime()),
      loadavg: load.map(v => v.toFixed(2)).join(', '),
    };
    exec('df -h / | awk \'NR==2{print $3"/"$2" ("$5")"}\'', { timeout: 3000 }, (e, o) => {
      if (!e && o) {
        const m = o.trim().match(/\(([^)]+)\)/);
        data.diskUsage = m ? parseFloat(m[1]) : 0;
        data.disk = o.trim();
      }
      resolve(data);
    });
  });
}

function getFiles(dir) {
  return new Promise((resolve) => {
    fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
      if (err) { resolve([]); return; }
      const out = []; let n = entries.length || 1;
      if (!n) { resolve(out); return; }
      for (const e of entries) {
        const fp = path.join(dir, e.name);
        fs.stat(fp, (err, st) => {
          out.push({
            name: e.name,
            type: e.isDirectory() ? 'dir' : (e.isSymbolicLink() ? 'link' : 'file'),
            size: st && !e.isDirectory() ? st.size : 0,
            mode: st ? st.mode.toString(8).slice(-3) : '---',
            date: st ? st.mtime.toISOString().slice(0, 19).replace('T', ' ') : '',
          });
          if (!--n) resolve(out);
        });
      }
    });
  });
}

function getProcesses() {
  return new Promise((resolve) => {
    exec('ps -eo pid,user,%cpu,%mem,rss,args --sort=-%cpu --no-headers 2>/dev/null | head -100', { timeout: 5000, maxBuffer: 131072 }, (err, stdout) => {
      if (err) { resolve([]); return; }
      resolve(stdout.trim().split('\n').filter(Boolean).map(line => {
        const p = line.trim().split(/\s+/);
        return { pid: parseInt(p[0]) || 0, user: p[1] || '', cpu: parseFloat(p[2]) || 0, mem: parseFloat(p[3]) || 0, rss: parseInt(p[4]) || 0, command: p.slice(5).join(' ') || '' };
      }));
    });
  });
}

function getServices() {
  return new Promise((resolve) => {
    exec('systemctl list-units --type=service --all --no-pager --no-legend 2>/dev/null | head -100', { timeout: 5000, maxBuffer: 131072 }, (err, stdout) => {
      if (err || !stdout.trim()) {
        exec('service --status-all 2>/dev/null', { timeout: 5000 }, (e, o) => {
          if (e || !o) { resolve([]); return; }
          resolve(o.trim().split('\n').filter(Boolean).map(line => {
            const m = line.match(/\[(\+|\-|\?)\]\s+(.+)/);
            return { name: m ? m[2] : line, status: m ? (m[1] === '+' ? 'running' : 'stopped') : 'unknown' };
          }));
        });
        return;
      }
      resolve(stdout.trim().split('\n').filter(Boolean).map(line => {
        const p = line.trim().split(/\s+/);
        return { name: p[0] || '', status: p[3] || 'unknown', description: p.slice(4).join(' ') || '' };
      }));
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
        case 'dashboard':
          getDashboard().then(data => send(ws, { type: 'dashboard', data }));
          break;
        case 'files':
          getFiles(msg.path || '.').then(entries => send(ws, { type: 'files', path: msg.path || '.', entries }));
          break;
        case 'processes':
          getProcesses().then(list => send(ws, { type: 'processes', list }));
          break;
        case 'services':
          getServices().then(list => send(ws, { type: 'services', list }));
          break;
        case 'close': killTerminal(msg.id); break;
        case 'kill':
          exec('kill ' + msg.pid, { timeout: 3000 }, (err) => {
            send(ws, { type: 'kill-result', pid: msg.pid, success: !err, error: err ? err.message : null });
          });
          break;
        case 'service':
          exec((msg.action === 'stop' ? 'systemctl stop ' : 'systemctl start ') + msg.name + ' 2>/dev/null || ' + (msg.action === 'stop' ? 'service ' : 'service ') + msg.name + ' ' + msg.action + ' 2>/dev/null', { timeout: 10000 }, (err) => {
            send(ws, { type: 'service-result', name: msg.name, action: msg.action, success: !err, error: err ? err.message : null });
          });
          break;
        case 'file-delete':
          exec('rm -rf ' + JSON.stringify(msg.path), { timeout: 5000 }, (err) => {
            send(ws, { type: 'file-result', action: 'delete', path: msg.path, success: !err, error: err ? err.message : null });
          });
          break;
        case 'file-rename':
          exec('mv ' + JSON.stringify(msg.path) + ' ' + JSON.stringify(msg.newPath), { timeout: 5000 }, (err) => {
            send(ws, { type: 'file-result', action: 'rename', path: msg.path, newPath: msg.newPath, success: !err, error: err ? err.message : null });
          });
          break;
        case 'file-mkdir':
          exec('mkdir -p ' + JSON.stringify(msg.path), { timeout: 5000 }, (err) => {
            send(ws, { type: 'file-result', action: 'mkdir', path: msg.path, success: !err, error: err ? err.message : null });
          });
          break;
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
