<![CDATA[<div align="center">

# 🏛️ WIN-OS — Wisma Nusantara Integrated Operation System

### Sistem ERP Internal untuk Pengelolaan Operasional Wisma Nusantara Cairo

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PayloadCMS](https://img.shields.io/badge/Payload_CMS_3-000000?style=for-the-badge&logo=payload&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

**🌍 Berlokasi di Cairo, Egypt · 🇮🇩 Dibangun untuk Komunitas Indonesia**

---

*Sistem operasional terintegrasi yang mendigitalisasi seluruh proses bisnis Wisma Nusantara Cairo — dari manajemen hotel, penyewaan auditorium, pengelolaan keuangan, hingga monitoring kinerja staf.*

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Fitur Utama](#-fitur-utama)
- [Portal Divisi](#-portal-divisi--7-portal-khusus)
- [Database Schema](#-database-schema--11-collections)
- [Tech Stack](#-tech-stack)
- [Keamanan](#-sistem-keamanan)
- [Screenshots & Preview](#-screenshots--preview)

---

## 🏢 Tentang Proyek

**WIN-OS** (Wisma Nusantara Integrated Operation System) adalah sistem **Enterprise Resource Planning (ERP)** yang dirancang khusus untuk mengelola seluruh operasional **Wisma Nusantara Cairo** — sebuah hostel & community center milik komunitas Indonesia di Kairo, Mesir.

### 🎯 Masalah yang Diselesaikan

| Sebelum (Manual) | Sesudah (WIN-OS) |
|---|---|
| 📓 Pencatatan booking di buku tulis | 📱 Booking digital real-time dengan kalender visual |
| 💵 Keuangan dicatat di spreadsheet | 💰 Cashflow otomatis multi-currency (EGP/USD/IDR/EUR) |
| 📋 Laporan piket via Google Form | 📊 Portal Sekretaris dengan PDF generator |
| 🗒️ Invoice ditulis manual | 🧾 Auto-generated invoice + kirim via WhatsApp |
| 📦 Stok barang tidak terpantau | 📦 Inventory tracking dengan alert stok minimum |
| 🔑 Tidak ada pembagian akses | 🔐 7 Portal divisi dengan PIN/OTP authentication |

### 📊 Skala Sistem

```
🏨 13 Kamar Hotel (2 Lantai + Homestay)
🏛️ 1 Auditorium Multi-paket
✈️ Layanan Visa On Arrival
🍽️ Paket Makanan Indonesia
🚗 Layanan Rental & Airport Pickup
👥 9 Petugas Piket
💱 4 Mata Uang (EGP, USD, IDR, EUR)
📱 Progressive Web App (Install di HP)
```

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                 │
│  ┌─────────┐  ┌───────────┐  ┌────────────────────────┐ │
│  │  Login  │  │ Dashboard │  │   7 Portal Divisi      │ │
│  │  Page   │  │ (Central) │  │   (PIN/OTP Protected)  │ │
│  └─────────┘  └───────────┘  └────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                   API LAYER (Next.js Routes)             │
│  /api/booking  /api/finance  /api/dashboard  /api/tasks  │
│  /api/inventory  /api/laporan-piket  /api/otp  /api/users│
├─────────────────────────────────────────────────────────┤
│                  BACKEND (Payload CMS v3)                 │
│     11 Collections · RBAC · Hooks · Auto-generation      │
├─────────────────────────────────────────────────────────┤
│            DATABASE & STORAGE                            │
│  ┌──────────────┐    ┌───────────────────┐               │
│  │   MongoDB    │    │  Cloudflare R2    │               │
│  │  (Primary)   │    │  (File Storage)   │               │
│  └──────────────┘    └───────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

---

## ⭐ Fitur Utama

### 1. 📊 Central Dashboard — Command Center

Dashboard utama yang menampilkan semua data operasional secara real-time:

- **Weekly Overview** — Ringkasan aktivitas minggu berjalan
- **Mini Calendar Cards** — Hotel, Auditorium, Visa, Rental dalam 1 pandangan
- **Revenue Chart** — Grafik pendapatan dengan Recharts
- **Occupancy Bar** — Perbandingan tingkat hunian per unit bisnis
- **Recent Invoices** — Invoice terbaru yang sudah dibayar
- **Logbook** — Catatan aktivitas harian
- **Multi-Currency Balance** — Saldo EGP, USD, IDR, EUR di header

**Tab Navigation:**
| Tab | Fungsi |
|-----|--------|
| 🏠 Overview | Dashboard ringkasan |
| 🏨 Hotel | Kalender booking hotel interaktif |
| 🏛️ Auditorium | Jadwal penyewaan auditorium |
| ✈️ Visa | Tracking inquiry visa |
| 📦 Rental | Manajemen penyewaan peralatan |
| 🧾 Invoice | Pembuatan & pengelolaan invoice |

---

### 2. 🏨 Hotel Booking System

Sistem reservasi hotel lengkap dengan 13 kamar di 2 lantai + 1 homestay:

```
Lantai 1: Room 101-106 (Single/Double)
Lantai 2: Room 201-206 (Single/Double/Triple/Quadruple)
Bonus:    Homestay (3 Kamar + Fasilitas Lengkap)
```

**Fitur Booking:**
- ✅ Visual calendar dengan status booking per kamar
- ✅ Auto-assign kamar berdasarkan tipe & ketersediaan
- ✅ Booking ID otomatis (format: `HTL-YYYYMMDD-XXXX`)
- ✅ Data tamu lengkap (passport, phone, WhatsApp)
- ✅ Harga per tipe kamar (Single $30, Double $35, Homestay $100)
- ✅ Extra bed management
- ✅ Airport pickup (Medium $35, Hiace $50)
- ✅ Paket makanan Indonesia (Nasi Goreng 100 EGP, Ayam Goreng 120 EGP, Nasi Kuning 130 EGP)
- ✅ Pricing summary otomatis (USD + EGP)
- ✅ Status tracking (Pending → Confirmed → Checked-In → Checked-Out)

---

### 3. 🏛️ Auditorium Booking System

Sistem penyewaan auditorium dengan paket fleksibel:

| Paket | Durasi | Harga |
|-------|--------|-------|
| Paket A | 4 Jam | 420 EGP |
| Paket B | 9 Jam | 900 EGP |
| Paket C | 12 Jam | 1,100 EGP |
| Full Day | 14 Jam | 1,250 EGP |

**Layanan Tambahan:**
- 🌡️ AC (150–350 EGP berdasarkan durasi)
- 🪑 Kursi (3–40 kursi, 75–680 EGP)
- 📽️ Projector & Screen (75–275 EGP)
- 🪑 Meja (3–9+ meja, 140–300 EGP)
- 🍽️ Piring & Gelas
- ⏰ After-hours surcharge (22:00–07:00) + 115 EGP/jam
- 🆔 Booking ID otomatis (`AULA-YYYYMMDD-XXXX`)

---

### 4. 🧾 Invoice & Billing System

- **Auto Invoice Generation** — Nomor invoice otomatis (`INV-YYYYMMDD-XXXX`)
- **PDF Invoice** — Generate & download invoice dalam format PDF
- **Multi-Currency** — Support EGP, USD, EUR
- **WhatsApp Integration** — Kirim invoice langsung ke customer via WhatsApp API
- **Payment Tracking** — Status: Pending → Partial → Paid → Cancelled
- **Payment Methods** — Cash, Transfer Bank, Instapay, QRIS
- **Discount Support** — Diskon per invoice
- **Related Booking** — Link otomatis ke booking Hotel/Auditorium/Visa

---

### 5. 💰 Financial Management (Cashflow)

Sistem keuangan multi-divisi dengan approval workflow:

- **Multi-Division Cashflow** — Tracking per divisi (BPUPD, BPPG, PMIK, Dapur, Sekretaris)
- **Income Categories** — Hotel, Auditorium, Visa, Rental, Dana Bendahara
- **Expense Categories** — Stok, Operasional, Gaji, dll.
- **Proof Upload** — Bukti transfer/kwitansi via Cloudflare R2
- **Approval Workflow** — Pending → Approved/Rejected oleh Bendahara
- **Fiscal Year Chart** — Grafik operasional tahunan (Feb–Jan)
- **Monthly Archive** — Navigasi bulan dengan summary per periode
- **PDF Report** — Generate laporan keuangan per bulan/kategori

---

### 6. 📋 Laporan Piket Digital

Sistem pelaporan tugas jaga (piket) kantor:

- **9 Petugas** dengan jadwal bergilir
- **Data Tercatat:** Jam masuk/keluar, durasi shift, kegiatan harian
- **Checklist:** Lampu, kebersihan, ruangan, keamanan
- **Monitoring:** Kamar terisi, snack, WiFi, meteran air/listrik
- **Auditorium Report:** Penyewa, biaya, pembayaran
- **Overtime Tracking:** Highlight otomatis untuk shift > 14 jam
- **PDF Export:** Rekap bulanan per petugas dengan ringkasan statistik

---

### 7. 📦 Inventory Management

Tracking stok barang untuk divisi BPUPD & BPPG:

**BPUPD (Housekeeping):**
- Toiletries, Linen, Cleaning Supplies, F&B
- Alert stok minimum otomatis
- Quick stock update (+ / -)

**BPPG (Maintenance):**
- Peralatan Tukang, Material Bangunan, Elektronik, Pipa
- Tipe: Aset Tetap vs Habis Pakai
- Tracking kondisi aset (Bagus/Rusak/Hilang) dengan progress bar
- Rincian isi set (detail per item dalam 1 set alat)

---

### 8. 📌 Proker Bulanan (Kanban Board)

Manajemen program kerja ala Trello:

```
📋 Todo  →  ⚡ In Progress  →  ✅ Selesai
```

- **Per Divisi** — BPUPD, BPPG, PMIK masing-masing punya board sendiri
- **Monthly Navigation** — Browse proker per bulan
- **Assignee Filter** — Filter task per staf
- **Priority System** — 🔴 High / 🟡 Normal / 🟢 Low
- **Staff Progress** — Persentase penyelesaian per staf
- **Drag-like Navigation** — Move task antar kolom dengan 1 klik

---

## 🚪 Portal Divisi — 7 Portal Khusus

Setiap divisi memiliki portal tersendiri dengan akses PIN/OTP:

### 1. 🛡️ Portal Bendahara — *Pusat Keuangan*
- **Incoming Funds** — Terima & approve setoran dari divisi
- **Distribusi Operasional** — Kirim dana ke BPUPD/BPPG/PMIK
- **Generate Slip Gaji** — Cetak slip gaji karyawan
- **OTP Authentication** — Verifikasi via WhatsApp OTP
- **Summary Cards** — Total Pemasukan, Pengeluaran, Saldo Aktif

### 2. ✈️ Portal BPUPD — *Pengembangan Usaha & Pengelolaan Dana*
- **Proker Bulanan** — Kanban board program kerja
- **Dana Operasional** — Cashflow lengkap dengan fiscal year chart
- **Pendapatan Unit** — Laporan per unit (Hotel/Auditorium/Visa/Rental)
- **Inventaris** — Stok housekeeping (Toiletries, Linen, F&B)
- **PDF Report** — Generate laporan per kategori per bulan
- **Fiscal Year Chart** — Grafik 12 bulan (Feb–Jan)

### 3. 🛠️ Portal BPPG — *Perbaikan & Pemeliharaan Gedung*
- **Proker Bulanan** — Task maintenance & housekeeping
- **Inventaris BPPG** — Aset tetap + habis pakai
  - Tracking kondisi aset (Bagus/Rusak/Hilang)
  - Detail isi set alat
  - Low-stock warning
- **Dana Operasional** — Budget maintenance bulanan

### 4. 🍳 Portal Dapur — *Logistik & Operasional Dapur*
- **Catat Pengeluaran** — Input belanja bahan makanan
- **Timeline Belanja** — Riwayat pembelian kronologis
- **Month Navigator** — Arsip per bulan
- **PDF Report** — Laporan pengeluaran dapur
- **Upload Struk** — Bukti belanja/bon

### 5. 📚 Portal PMIK — *Perpustakaan, Media, Informasi & Komunikasi*
- **Proker Bulanan** — Program kerja media & komunikasi
- **Dana Operasional** — Budget divisi PMIK
- **Staff Progress** — Tracking kinerja per staf

### 6. 📁 Portal Sekretaris — *Admin & HR Management*
- **Master Data** — Kelola harga kamar, user, layanan
- **HR Monitor** — Rekap absensi & performa staf
- **Audit Log** — Riwayat perubahan data
- **Jawaban Laporan Piket** — Review & filter laporan piket
  - Filter per petugas/bulan/tahun
  - Summary cards (Total Laporan, Shift Lengkap, Jam Kerja)
  - Edit & hapus laporan
- **Arsip Bulanan** — Folder per bulan dengan PDF download
- **PDF Generator** — Rekap piket profesional (landscape A4)

### 7. 👔 Portal Direktur — *Executive Dashboard (View Only)*
- **KPI Cards** — Revenue, Occupancy Rate, Visa Processed, Total Transaksi
- **Revenue Chart** — Grafik pendapatan
- **Occupancy Trend** — Tren hunian bulanan
- **Executive Summary** — Logbook direktur
- **Recent Transactions** — Daftar transaksi terbaru

---

## 🗄️ Database Schema — 11 Collections

```
┌──────────────────────────────────────────────┐
│              PAYLOAD CMS v3                   │
│                                               │
│  👤 Users           (Auth + RBAC)             │
│  📦 Services        (Master Data Layanan)     │
│  🧾 Transactions    (Invoice & Billing)       │
│  ✈️ TravelDocs      (Visa & Passport)         │
│  📌 Tasks           (Proker/Kanban)           │
│  💰 Cashflow        (Keuangan Multi-divisi)   │
│  🖼️ Media           (File Storage → R2)       │
│  🏛️ AuditoriumBookings  (Sewa Auditorium)    │
│  🏨 HotelBookings   (Reservasi Hotel)         │
│  📋 LaporanPiket    (Laporan Tugas Jaga)      │
│  📦 Inventory       (Stok Barang)             │
└──────────────────────────────────────────────┘
```

### User Roles (7 Level)
| Role | Akses |
|------|-------|
| `direktur` | Executive dashboard (view-only) |
| `bendahara` | Keuangan pusat + approval + OTP |
| `sekretaris` | Admin, HR, laporan piket |
| `bpupd` | Operasional usaha + inventory |
| `bppg` | Maintenance + inventory teknis |
| `pmik` | Media & komunikasi |
| `staff` | Akses dasar |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **Next.js 15** | Full-stack React framework (App Router) |
| **React 19** | UI component library |
| **TypeScript** | Type-safe development |
| **Tailwind CSS 3** | Utility-first styling |
| **Recharts** | Data visualization (Revenue, Occupancy) |
| **Lucide React** | Icon system (575+ icons) |
| **Radix UI** | Accessible component primitives |
| **next-themes** | Dark/Light mode toggle |
| **next-pwa** | Progressive Web App support |
| **Sonner** | Toast notification system |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Payload CMS v3** | Headless CMS + API + Admin Panel |
| **MongoDB** | Primary database (NoSQL) |
| **Mongoose** | MongoDB adapter for Payload |
| **Cloudflare R2** | Object storage (S3-compatible) |
| **Sharp** | Image processing & optimization |
| **Lexical Editor** | Rich text editing |

### PDF & Documents
| Technology | Purpose |
|-----------|---------|
| **jsPDF** | PDF generation (Invoice, Laporan) |
| **jspdf-autotable** | Table rendering in PDF |
| **@react-pdf/renderer** | React-based PDF rendering |
| **pdf-lib** | PDF manipulation library |

### Integration
| Technology | Purpose |
|-----------|---------|
| **WhatsApp API** | Notifikasi & pengiriman invoice |
| **Axios** | HTTP client for external APIs |
| **GraphQL** | Query language for Payload |

---

## 🔐 Sistem Keamanan

```
┌─── Layer 1: Authentication ───────────────────┐
│  • Email/Password login via Payload Auth       │
│  • JWT Token (payload-token cookie)            │
│  • Session check on every page load            │
│  • Google OAuth (prepared)                     │
└────────────────────────────────────────────────┘
┌─── Layer 2: Portal Protection ────────────────┐
│  • PIN Guard per portal divisi                 │
│  • OTP via WhatsApp (Bendahara)                │
│  • Device ID verification                      │
└────────────────────────────────────────────────┘
┌─── Layer 3: Middleware ───────────────────────┐
│  • Route protection (/dashboard/*)             │
│  • Auto-redirect unauthenticated users         │
│  • Cookie-based token validation               │
└────────────────────────────────────────────────┘
┌─── Layer 4: RBAC (Role-Based Access) ─────────┐
│  • Collection-level access control             │
│  • Cashflow: hanya Bendahara & Direktur read   │
│  • Create: per-role restrictions               │
│  • Update: role-specific permissions           │
└────────────────────────────────────────────────┘
```

---

## 🎨 Design System

### Color Palette
- **Primary:** `#8B4513` (Saddle Brown) — Warm, professional
- **Dark Sidebar:** `#1A1612` — Premium dark navigation
- **Success:** `#10b981` — Green accents
- **Warning:** `#f59e0b` — Amber highlights
- **Error:** `#ef4444` — Red alerts
- **Info:** `#3b82f6` — Blue informational

### UI Components
- 🌙 **Dark/Light Mode** — Full theme support
- 📱 **Responsive** — Mobile-first dengan sidebar sheet
- ✨ **Glassmorphism** — Login page glass effects
- 🎯 **Micro-animations** — Smooth transitions & hover effects
- 📊 **Data Visualization** — Charts, progress bars, donut indicators

---

## 📱 Progressive Web App (PWA)

WIN-OS dapat di-install langsung di HP seperti aplikasi native:

- ✅ Install dari browser (Chrome/Safari)
- ✅ Offline-capable
- ✅ Full-screen mode (tanpa address bar)
- ✅ Push notification ready
- ✅ Home screen icon

---

## 📊 Ringkasan Teknis

```
📁 Total Files          : 50+ komponen React
🗃️ Database Collections : 11 collections
🔌 API Endpoints        : 17+ route groups
🚪 Portal Pages         : 7 portal divisi
📄 PDF Generators       : 5+ template PDF
🌐 Multi-Currency       : 4 mata uang
👥 User Roles           : 7 level akses
🔐 Auth Methods         : PIN + OTP + JWT
📱 PWA                  : Yes (installable)
🌙 Dark Mode            : Yes (system-aware)
```

---

## 🧑‍💻 Dikembangkan Oleh

**Wisma Nusantara Cairo** — Indonesian Student Hostel & Community Center

📍 Rabaa Adawiyah, Nasr City, Cairo, Egypt

---

<div align="center">

### 🇮🇩 Built with ❤️ in Cairo for the Indonesian Community

*WIN-OS — Mengubah manajemen wisma dari buku catatan menjadi sistem digital terintegrasi.*

**© 2025-2026 Wisma Nusantara Cairo. All Rights Reserved.**

</div>
]]>
