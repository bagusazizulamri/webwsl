<input type="checkbox" id="lang-toggle" style="display:none">
<div class="lang-bar" style="text-align:right;margin:10px 0;font-size:14px">
  <label for="lang-toggle" class="lang-en-lbl" style="cursor:pointer;background:#2da44e;color:#fff;padding:4px 12px;border-radius:6px;display:inline-block">🌐 Baca dalam Bahasa Indonesia</label>
  <label for="lang-toggle" class="lang-id-lbl" style="cursor:pointer;background:#2da44e;color:#fff;padding:4px 12px;border-radius:6px;display:none">🌐 Read in English</label>
</div>

<div class="lang-en">

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

</div>

<div class="lang-id">

# WebWSL

Emulator terminal berbasis web untuk Linux (dan WSL) dengan dashboard, file browser, process manager, service manager, dan **tampilan desktop ala Windows 7**.

## Fitur

### Mode Dark Modern
- **Multi-session Terminal** — Terminal berbasis xterm.js dengan banyak session, support resize, dan tombol aksi cepat
- **Dashboard** — Overview sistem real-time dengan gauge SVG untuk CPU, memori, dan disk; bar CPU per-core; info host
- **File Browser** — Navigasi direktori, breadcrumb, riwayat kembali, ikon tipe file, tampilan ukuran
- **Process Manager** — Tabel dengan kolom yang bisa diurutkan (PID, CPU%, MEM%, RSS), tombol kill, filter/pencarian
- **Service Manager** — Start/stop layanan systemd atau sysvinit dengan badge status

### Mode Desktop Windows 7
Klik tombol **Win7** di sidebar untuk beralih ke lingkungan desktop ala Windows 7:
- **Aero Glass Windows** — Window bisa digeser, di-resize, minimize/maximize/close, double-klik titlebar untuk maximize
- **Taskbar** — Tombol window yang berjalan, system tray dengan jam, tombol show desktop
- **Start Menu** — Luncurkan semua aplikasi, cari program dan file, tombol shutdown
- **Desktop Icons** — Computer, User Files, Recycle Bin
- **Klik Kanan Context Menu** — View, Refresh, Personalize
- **Aero Snap** — Seret ke atas untuk maximize, seret ke kiri/kanan untuk snap 50% lebar
- **Semua panel dalam window** — Terminal, Dashboard, File Explorer, Task Manager, Services, Control Panel
- **Integrasi Terminal** — xterm.js pindah mulus ke window terminal Win7

### Slash Commands
`/help`, `/files`, `/ps`, `/services`, `/sysinfo`, `/clear` tersedia langsung di terminal

### Deteksi WSL
Otomatis mendeteksi WSL dan menjalankan shell yang sesuai

## Tech Stack

- **Backend:** Node.js, Express, `ws` (WebSocket), `node-pty`, `compression`
- **Frontend:** Vanilla JS, [xterm.js](https://xtermjs.org/) dengan FitAddon, SVG gauge
- **Styling:** Tema dark + overlay Windows 7 Aero glass (tanpa dependensi eksternal)

## Persyaratan

- Node.js 18+
- Linux atau WSL (Windows Subsystem for Linux)

## Instalasi

```bash
git clone https://github.com/bagusazizulamri/webwsl.git
cd webwsl
npm install
```

## Penggunaan

```bash
npm start
```

Buka `http://localhost:3000` di browser. Klik tombol **Win7** di sidebar untuk beralih ke mode desktop Windows 7.

### Environment

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `PORT`   | `3000`  | Port HTTP server |

## Struktur Proyek

```
webwsl/
├── public/
│   ├── css/
│   │   ├── style.css       # Tema dark modern
│   │   └── win7.css        # Overlay Windows 7 Aero glass
│   ├── js/
│   │   ├── app.js          # Aplikasi frontend
│   │   └── win7.js         # Engine UI desktop Win7
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

</div>

<style>
  .lang-id { display: none; }
  #lang-toggle:checked ~ .lang-bar .lang-en-lbl { display: none; }
  #lang-toggle:checked ~ .lang-bar .lang-id-lbl { display: inline-block; }
  #lang-toggle:checked ~ .lang-en { display: none; }
  #lang-toggle:checked ~ .lang-id { display: block; }
</style>