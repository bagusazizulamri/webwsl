# WebWSL

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

**Q: Apakah WebWSL bisa diakses dari perangkat lain?**  
A: Bisa. Server berjalan di `0.0.0.0`, jadi cukup akses `http://<IP-server>:3000` dari perangkat lain dalam jaringan yang sama.

**Q: Apakah WebWSL bisa berjalan di Windows tanpa WSL?**  
A: Tidak. WebWSL membutuhkan bash shell — baik native Linux maupun WSL di Windows.

**Q: Bagaimana cara mengganti port?**  
A: Set variabel environment `PORT`, misal `PORT=8080 npm start`, atau ubah file `.env`.

**Q: Apakah terminal ini mendukung copy-paste?**  
A: Ya. xterm.js bawaan mendukung seleksi teks (copy) dan paste via `Ctrl+Shift+V` atau klik kanan.

**Q: Berapa maksimal terminal session yang bisa dibuka?**  
A: Default 10 session. Bisa diubah dengan mengganti konstanta `MAX_TERMINALS` di `src/server.js`.

**Q: Apakah WebWSL aman digunakan di jaringan publik?**  
A: WebWSL tidak memiliki autentikasi. Sebaiknya gunakan reverse proxy seperti nginx dengan basic auth, atau akses via SSH tunnel.

**Q: Kenapa panel Services tidak muncul?**  
A: WebWSL mendeteksi layanan via `systemctl` atau `service --status-all`. Pastikan service manager tersedia di sistem Anda.

**Q: Bagaimana cara menghentikan proses dari panel Processes?**  
A: Klik tombol **Kill** di baris proses yang ingin dihentikan. Proses akan dikirim sinyal `SIGTERM`.
