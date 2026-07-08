# Rencana Pemolesan Win7 UI — Mendekati Real OS

## Prioritas: Dampak vs Effort

---

## ⚡ Fase 1: Quick Wins (Low Effort, High Impact)

### 1.1 Wallpaper Realistis
- **Ganti:** Gradien hijau polos → gambar Bliss (bukit hijau) asli Win7
- **Cara:** Download base64 inline atau file kecil `public/assets/win7/bliss.jpg`
- **Dampak:** Langsung berasa Win7 banget

### 1.2 Icon Set Nyata
- **Ganti:** Semua emoji → icon Win7 asli (16x16, 32x32, 48x48)
- **Yang kena:** Title bar icons, desktop icons, start menu icons, file type icons, taskbar
- **Cara:** Spritesheet PNG + CSS background-position, atau icon font custom
- **Sumber:** Extract dari `imageres.dll` / `shell32.dll` Windows 7 (free to use)

### 1.3 System Tray Lengkap
- **Tambah:** Icon jaringan (🌐), volume (🔊), power (🔋), flag Action Center
- **Logika:** Murni hiasan/dekoratif, bisa diklik kasih tooltip "No network / 100% / AC Power / No issues"
- **Dampak:** Tray jadi hidup

### 1.4 Start Menu — All Programs
- **Tambah:** "All Programs" toggle di start menu kiri bawah
- **Saat diklik:** Tampilkan list hierarchical: "Accessories", "System Tools", dll
- **Isi:** Shortcut ke app WebWSL + beberapa dummy (Notepad, Calculator, Paint — arah ke terminal)

### 1.5 Taskbar Context Menu
- **Klik kanan taskbar:** "Toolbars", "Cascade windows", "Show the desktop", "Task Manager", "Properties"
- **Properties:** Buka jendela Taskbar and Start Menu Properties (hiasan, info aja)

### 1.6 Desktop Icon Selection & Drag
- **Selection:** Klik icon → highlight dengan background transparan biru (seperti Win7)
- **Multiple select:** `Ctrl+klik` atau drag selection box di desktop
- **Drag pindah:** Icon bisa digeser bebas di desktop, posisi simpan di localStorage

---

## 🔧 Fase 2: Window Management (Medium Effort, High Impact)

### 2.1 Alt+Tab Window Switcher (Aero Flip)
- **Trigger:** `Alt+Tab` — overlay dengan thumbnail semua window
- **Tampilan:** Grid horizontal, window yang aktif di-highlight, navigasi dengan Tab (hold Alt)
- **Animasi:** Slide/fade transparan
- **Fallback:** `Alt+Shift+Tab` untuk reverse

### 2.2 Win+Tab Aero Flip 3D
- **Trigger:** `Win+Tab` — stacked 3D view (CSS perspective transform)
- **Tampilan:** Window ter-stack seperti kartu, yang paling depan aktif
- **Navigasi:** Tab/Wheel untuk rotate

### 2.3 Aero Shake
- **Trigger:** Drag titlebar sambil shake (gerak kiri-kanan cepat)
- **Efek:** Semua window lain minimize
- **Shake lagi:** Restore window yang terminimize

### 2.4 Aero Peek — Taskbar Thumbnail Preview
- **Hover taskbar button:** Muncul thumbnail kecil window + judul
- **Klik thumbnail:** Focus window
- **Thumbnail live:** Canvas capture DOM element tiap window via `html2canvas` atau `dom-to-image` (atau fallback: render ulang HTML mini)

### 2.5 Aero Snap — Keyboard Shortcuts
- **`Win+←`:** Snap ke kiri 50%
- **`Win+→`:** Snap ke kanan 50%
- **`Win+↑`:** Maximize
- **`Win+↓`:** Restore / Minimize
- **Visual guide:** Overlay transparan saat snap (garis biru tipis)

### 2.6 Window Animasi Smooth
- **Minimize:** Shrink ke taskbar button (CSS animate scale + translate ke posisi taskbar)
- **Restore:** Expand dari taskbar button ke posisi semula
- **Close:** Fade + scale down (0.15s)
- **Snap:** Slide animation saat snap ke tepi

### 2.7 Double-Click Titlebar Icon
- **Klik kiri 2x icon title bar** → tutup window (sama kayak Win7 beneran)

### 2.8 Pinned Taskbar
- **Klik kanan taskbar → "Pin this program to taskbar"** untuk app apapun
- **Pin start menu items** ke taskbar
- **Simpan pinned apps** di localStorage

---

## 🎨 Fase 3: Visual & Styling Deep Dive (High Effort, High Impact)

### 3.1 True Aero Glass
- **Efek kaca:** `backdrop-filter: blur(12px)` + `background: rgba(255,255,255,0.08)` + border tipis putih transparan + shadow warna biru/aqua
- **Title bar:** Gradient vertikal dari `rgba(255,255,255,0.18)` ke `rgba(255,255,255,0.04)`
- **Inactive window:** Title bar redup, glass effect berkurang
- **Window border:** 1px solid `rgba(255,255,255,0.25)` dengan rounding 8px
- **Shadow:** `box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.3)`

### 3.2 DWM-Style Window Chrome
- **Title bar buttons (min/max/close):**
  - Hover: highlight merah (close) / kuning (min) / hijau (max) — inline SVG atau CSS gradient
  - Ikon: garis Windows 7 style (bukan teks/emoji)
- **Title bar font:** Segoe UI (fallback: Tahoma), 12px, bold
- **Menu bar (File, Edit, View, Help):** Di bawah title bar, seperti Win7 explorer

### 3.3 Progress Bar Win7 Style
- **Gradient:** Hijau cerah `#4caf50` ke `#2e7d32`, animasi striped
- **Indeterminate:** Animasi loop marquee (loading)

### 3.4 Win7 Font Rendering
- **Font stack:** `Segoe UI', 'Tahoma', 'Verdana', sans-serif`
- **ClearType-style text shadow:** Tipis `#000` atau `rgba(0,0,0,0.5)` untuk readability di glass

### 3.5 Context Menu Full Win7 Style
- **Menu border:** 1px solid `#a0a0a0`, dengan `inset` highlight putih 1px
- **Icon margin:** 20px kiri untuk icon, teks menu menjorok
- **Hover:** Bar biru gradient (`#4fc3f7` ke `#0288d1`)
- **Sub-menu arrow:** Segitiga kecil (▶)

---

## 📂 Fase 4: File Explorer Enhancement (Medium Effort)

### 4.1 Navigation Tree (Left Pane)
- **Tree expandable:** Computer, `C:\` (root `/`), User Home, Network
- **Expand/collapse** dengan folder triangle icons
- **Selected item:** Highlight biru

### 4.2 File Context Menu
- **Right-click file:** Open, Edit, Copy, Cut, Delete, Rename, Properties
- **Properties dialog:** Info file (size, type, modified, permissions)

### 4.3 Column Sorting + View Modes
- **Sort:** Klik column header → sort asc/desc (toggle), arrow indicator
- **View modes:** Icons (default), List, Details — toggle di toolbar kanan
- **Details view:** Columns — Name, Size, Type, Date Modified, Permissions

### 4.4 Address Bar Breadcrumbs (Real)
- **Path:** Root → folder → subfolder, tiap segmen clickable
- **Dropdown arrow:** Di tiap segmen, klik → list subfolder (seperti Win7 explorer)
- **Edit mode:** Click path → jadi input teks

### 4.5 File Operations
- **Delete:** Konfirmasi dialog Win7 style → `rm -rf` di backend
- **Rename:** Inline edit di filename
- **New Folder:** Toolbar button → prompt nama → `mkdir` di backend
- **Copy/Move:** Simulasi clipboard (simpan path), paste → `cp` / `mv` di backend

---

## 📊 Fase 5: Task Manager Enhancement (Low-Medium Effort)

### 5.1 Networking Tab
- **Data:** Parse `/proc/net/dev` atau `ifconfig` via backend
- **Tampilan:** Tabel interface (name, IP, sent/received), grafik kecil throughput

### 5.2 Users Tab
- **Data:** `who` atau `w` command via backend
- **Tampilan:** User, session, CPU%, MEM% per user

### 5.3 Performance Tab — Historical Charts
- **Grafik garis:** CPU, Memory, Disk — history 60 detik (rolling window)
- **Canvas render:** Line chart real-time dengan grid

### 5.4 Status Bar
- **Bottom bar:** "Processes: XX | CPU: XX% | MEM: XX%" — update real-time

---

## 🚀 Fase 6: Backend & Performance (Medium Effort)

### 6.1 Backend — Disk Info Detail
- **Tambah endpoint:** `disk` → `df -h` parsed, mount points, usage per mount
- **Gunakan di:** Dashboard, File Explorer (disk selector)

### 6.2 Backend — Network Info
- **Tambah endpoint:** `network` → interfaces, IP, RX/TX bytes
- **Gunakan di:** Task Manager Networking tab

### 6.3 Backend — File Operations
- **Tambah handler:** `file-delete`, `file-rename`, `file-mkdir`, `file-copy`, `file-move`
- **Keamanan:** Path sanitization, prevent `..` traversal, limit ke home directory

### 6.4 Performance — Debounce / Throttle
- **Dashboard refresh:** 5s → 3s (lebih responsif)
- **Processes refresh:** 5s → 2s (lebih real-time)
- **Services refresh:** 8s → 10s (tidak perlu terlalu sering)
- **Debounce** resize event (sudah ada, tapi perbaiki timing)

### 6.5 WebSocket Reconnect
- **Auto-reconnect:** Exponential backoff (1s, 2s, 4s, 8s, max 30s)
- **Indicator:** Di system tray (status terputus → icon merah)

---

## 🎯 Fase 7: Advanced Shell Features (High Effort)

### 7.1 Aero Snap Zones + Visual Guide
- **Drag ke tepi:** Garis biru transparan muncul sebagai guide
- **Snap zones:** Kiri (50%), kanan (50%), kiri-atas (25%), kiri-bawah (25%), kanan-atas (25%), kanan-bawah (25%), atas (full)

### 7.2 Window Grouping (Taskbar)
- **Group:** Terminal (multiple windows) → 1 taskbar button dengan stack counter
- **Click:** Popup list (taskbar thumbnail preview) atau cycling antar window

### 7.3 Jump List (Taskbar Right-Click)
- **Right-click taskbar app:** Recent files (File Explorer), New Terminal (Terminal), dsb

### 7.4 Desktop Gadgets
- **Clock gadget:** Transparan, draggable, di desktop
- **CPU/MEM gadget:** Mini gauge kecil di desktop (optional)

### 7.5 Notification System
- **Balloon notification:** Popup dari system tray (seperti Win7 action center)
- **Event:** Terminal exit, service crash, disk low, dll

---

## 📋 Fase 8: Keyboard & UX Polish (Low-Medium Effort)

### 8.1 Global Shortcuts
| Shortcut | Action |
|----------|--------|
| `Win+D` | Show Desktop |
| `Win+E` | Open File Explorer |
| `Win+R` | Run dialog |
| `Win+F` | Search |
| `Esc` | Close start menu / context menu |
| `F5` | Refresh desktop |
| `F2` | Rename selected icon |
| `Delete` | Delete selected icon |
| `Ctrl+Esc` | Open Start Menu |
| `Alt+F4` | Close active window |

### 8.2 Run Dialog (`Win+R`)
- Dialog kecil: "Open:" input field + OK/Cancel
- Mendukung: `cmd` (terminal), `explorer` (files), `control` (control panel), `taskmgr` (task manager), `winver` (about)

### 8.3 Winver (About Windows)
- Dialog: "Microsoft Windows 7 — WebWSL Edition", build number, RAM, copyright

### 8.4 System Sounds
- **Event:** Startup, shutdown, minimize, maximize, error, device connect
- **Cara:** AudioContext generate beep / short audio file (base64 WAV kecil)

---

## Ringkasan Prioritas

| Fase | Item | Effort | Impact |
|------|------|--------|--------|
| 1 | Bliss wallpaper | Rendah | Tinggi |
| 1 | Icon set nyata | Rendah | Tinggi |
| 1 | System tray lengkap | Rendah | Sedang |
| 1 | All Programs menu | Rendah | Sedang |
| 1 | Taskbar context menu | Rendah | Sedang |
| 2 | Alt+Tab switcher | Sedang | Tinggi |
| 2 | Aero Snap keyboard | Sedang | Tinggi |
| 2 | Window animations | Sedang | Tinggi |
| 2 | Taskbar thumbnails | Sedang | Tinggi |
| 3 | True Aero Glass | Sedang | Tinggi |
| 3 | Win7 title bar buttons | Rendah | Tinggi |
| 4 | File Explorer tree | Sedang | Sedang |
| 4 | File operations | Sedang | Tinggi |
| 5 | Task Manager charts | Sedang | Sedang |
| 6 | Backend file ops | Sedang | Tinggi |
| 6 | WebSocket reconnect | Rendah | Tinggi |
| 7 | Aero Snap zones | Sedang | Tinggi |
| 7 | Notification system | Sedang | Sedang |
| 8 | Global shortcuts | Rendah | Tinggi |
| 8 | Run dialog | Rendah | Sedang |

---

## Catatan

- Semua icon bisa pakai ekstrak gratis dari Windows 7 icon set (open source)
- Tidak perlu backend baru untuk fase 1-3, 5, 8 — murni frontend
- Fase 4, 6 butuh penambahan handler WebSocket di `src/server.js`
- Animasi prioritas: minimize/restore > snap > window open/close
- Urutan eksekusi: Fase 1 → Fase 8 → Fase 3 → Fase 2 → Fase 4 → Fase 5 → Fase 6 → Fase 7
