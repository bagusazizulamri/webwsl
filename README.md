# WebWSL

<div align="center">
  <a href="README_ID.md"><b>🌐 Baca dalam Bahasa Indonesia</b></a>
</div>

<br>

A web-based Linux (and WSL) terminal emulator with a built-in dashboard, file browser, process manager, service manager, and **Windows 7 inspired desktop UI**.

## Features

### Modern Dark Mode
- **Multi-session Terminal** — xterm.js-powered terminal with multiple concurrent sessions, resize support, and quick-action buttons
- **Dashboard** — Real-time system overview with SVG gauges for CPU, memory, and disk usage; per-core CPU bars; host info
- **File Browser** — Navigate directories, breadcrumb trail, back history, file type icons, size display
- **Process Manager** — Table with sortable columns (PID, CPU%, MEM%, RSS), inline kill buttons, filter/search
- **Service Manager** — Start/stop systemd or sysvinit services with status badges

### Windows 7 Desktop Mode
Click the **Win7** button in the sidebar to switch to a full Windows 7-inspired desktop environment:
- **Aero Glass Windows** — Draggable, resizable windows with minimize/maximize/close, double-click titlebar to maximize
- **Taskbar** — Running window buttons, system tray with clock, show desktop button
- **Start Menu** — Launch all apps, search programs and files, shutdown button
- **Desktop Icons** — Computer, User Files, Recycle Bin
- **Right-click Context Menu** — View, Refresh, Personalize
- **Aero Snap** — Drag to top to maximize, drag to left/right edges for 50% width snap
- **All panels in windows** — Terminal, Dashboard, File Explorer, Task Manager, Services, Control Panel
- **Terminal integration** — xterm.js seamlessly moves into Win7 terminal window

### Slash Commands
`/help`, `/files`, `/ps`, `/services`, `/sysinfo`, `/clear` available directly in the terminal

### WSL Detection
Automatically detects WSL and spawns shells accordingly

## Tech Stack

- **Backend:** Node.js, Express, `ws` (WebSocket), `node-pty`, `compression`
- **Frontend:** Vanilla JS, [xterm.js](https://xtermjs.org/) with FitAddon, SVG gauges
- **Styling:** Dark theme + Windows 7 Aero glass overlay (no external dependencies)

## Requirements

- Node.js 18+
- Linux or WSL (Windows Subsystem for Linux)

## Installation

```bash
git clone https://github.com/bagusazizulamri/webwsl.git
cd webwsl
npm install
```

## Usage

```bash
npm start
```

Then open `http://localhost:3000` in your browser. Click the **Win7** button in the sidebar to switch to Windows 7 desktop mode.

### Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3000`  | HTTP server port |

## Project Structure

```
webwsl/
├── public/
│   ├── css/
│   │   ├── style.css       # Modern dark theme
│   │   └── win7.css        # Windows 7 Aero glass overlay
│   ├── js/
│   │   ├── app.js          # Frontend application
│   │   └── win7.js         # Win7 desktop UI engine
│   └── index.html          # Entry HTML
├── src/
│   ├── server.js           # Backend server
│   └── ...
├── .env
├── .gitignore
├── package.json
└── README.md
```

## FAQ

**Q: Can WebWSL be accessed from other devices?**  
A: Yes. The server listens on `0.0.0.0`, so access `http://<server-IP>:3000` from any device on the same network.

**Q: Can WebWSL run on Windows without WSL?**  
A: No. WebWSL requires a bash shell — either native Linux or WSL on Windows.

**Q: How do I change the port?**  
A: Set the `PORT` environment variable, e.g. `PORT=8080 npm start`, or edit the `.env` file.

**Q: Does the terminal support copy-paste?**  
A: Yes. xterm.js supports text selection (copy) and paste via `Ctrl+Shift+V` or right-click.

**Q: How many terminal sessions can be opened?**  
A: Default is 10 sessions. Change `MAX_TERMINALS` in `src/server.js`.

**Q: Is WebWSL safe for public networks?**  
A: WebWSL has no authentication. Use a reverse proxy like nginx with basic auth, or access via SSH tunnel.

**Q: Why doesn't the Services panel show up?**  
A: WebWSL detects services via `systemctl` or `service --status-all`. Make sure a service manager is available.

**Q: How to kill a process from the Processes panel?**  
A: Click the **Kill** button on the process row. The process will receive a `SIGTERM` signal.
