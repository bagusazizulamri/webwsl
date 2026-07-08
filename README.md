# WebWSL

A web-based Linux (and WSL) terminal emulator with a built-in dashboard, file browser, process manager, and service manager.

## Features

- **Multi-session Terminal** — xterm.js-powered terminal with multiple concurrent sessions, resize support, and quick-action buttons
- **Dashboard** — Real-time system overview with SVG gauges for CPU, memory, and disk usage; per-core CPU bars; host info
- **File Browser** — Navigate directories, breadcrumb trail, back history, file type icons, size display
- **Process Manager** — Table with sortable columns (PID, CPU%, MEM%, RSS), inline kill buttons, filter/search
- **Service Manager** — Start/stop systemd or sysvinit services with status badges
- **Slash Commands** — `/help`, `/files`, `/ps`, `/services`, `/sysinfo`, `/clear` available directly in the terminal
- **WSL Detection** — Automatically detects WSL and spawns shells accordingly

## Tech Stack

- **Backend:** Node.js, Express, `ws` (WebSocket), `node-pty`, `compression`
- **Frontend:** Vanilla JS, [xterm.js](https://xtermjs.org/) with FitAddon, SVG gauges
- **Styling:** Dark theme inspired by GitHub Dark

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

Then open `http://localhost:3000` in your browser.

### Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3000`  | HTTP server port |

## Project Structure

```
webwsl/
├── public/
│   ├── css/style.css      # Stylesheet
│   ├── js/app.js          # Frontend application
│   └── index.html         # Entry HTML
├── src/
│   └── server.js          # Backend server
├── .env                   # Environment variables
├── .gitignore
└── package.json
```
