# WebWSL

<div align="right">
  <a href="README.md"><b>🌐 Read in English</b></a>
</div>

<br>

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
