<div align="center">

# 🔴 ZAFALINK Technology
## Real-Time MikroTik Network Monitoring Dashboard

![Version](https://img.shields.io/badge/version-1.0.0-red?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express-5.x-black?style=for-the-badge&logo=express)
![MikroTik](https://img.shields.io/badge/MikroTik-RouterOS-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-ISC-purple?style=for-the-badge)

> **Dashboard monitoring jaringan real-time** untuk ISP Zafalink Technology — Gorontalo.
> Memantau performa router MikroTik, trafik interface, dan sesi PPPoE aktif secara langsung.

</div>

---

## ✨ Fitur Utama

| Fitur | Keterangan |
|-------|------------|
| 🔴 **CPU Load Monitor** | Tampilan real-time penggunaan CPU router |
| 💾 **Memory Monitor** | Free memory & total memory dalam MB |
| ⏱️ **Router Uptime** | Waktu router berjalan tanpa reboot |
| 📊 **Live Traffic Chart** | Grafik RX/TX per-interface (Chart.js) |
| 👥 **PPPoE Active Users** | Daftar sesi PPPoE aktif beserta detail |
| 🔌 **MikroTik API Native** | Koneksi langsung via TCP socket (tanpa library berat) |
| 🌑 **Dark Mode Premium** | UI modern dengan gradient merah-ungu-biru |
| 📱 **Responsive** | Tampilan optimal di desktop dan mobile |

---

## 🛠️ Tech Stack

- **Backend** — Node.js + Express 5
- **Frontend** — HTML5, TailwindCSS (CDN), Chart.js
- **Protokol** — MikroTik RouterOS API (TCP Socket murni)
- **Config** — dotenv untuk environment variables

---

## ⚙️ Instalasi & Menjalankan

### Prasyarat
- Node.js v18 atau lebih baru
- Router MikroTik dengan API service aktif
- Akses jaringan ke router (IP & port API)

### 1. Clone repository
```bash
git clone https://github.com/USERNAME/zafalink-monitoring.git
cd zafalink-monitoring
```

### 2. Install dependencies
```bash
npm install
```

### 3. Konfigurasi environment
Buat file `.env` dengan isi berikut:
```env
PORT=3000
MT_HOST=192.168.88.1
MT_USER=admin
MT_PASS=yourpassword
MT_PORT=8728
```

### 4. Jalankan server
```bash
npm start
```

Buka browser ke → **http://localhost:3000**

---

## 🔧 Konfigurasi MikroTik

Pastikan **API service** aktif di router MikroTik Anda:

```routeros
# Aktifkan API Service
/ip service enable api

# (Opsional) Batasi akses hanya dari IP monitoring server
/ip service set api address=192.168.1.100/32
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/resource` | Info resource router (CPU, RAM, versi, uptime) |
| `GET` | `/api/traffic/:interfaceName` | Traffic RX/TX interface tertentu |
| `GET` | `/api/pppoe/active` | Daftar semua sesi PPPoE aktif |

### Contoh Response

**`GET /api/resource`**
```json
{
  "success": true,
  "data": {
    "uptime": "12d4h30m",
    "cpuLoad": 24,
    "freeMemory": 268435456,
    "totalMemory": 536870912,
    "version": "7.15.3",
    "boardName": "CHR"
  }
}
```

**`GET /api/pppoe/active`**
```json
{
  "success": true,
  "totalActive": 42,
  "users": [
    {
      "name": "pelanggan001",
      "service": "pppoe",
      "callerId": "00:00:00:00:00:01",
      "address": "10.10.10.5",
      "uptime": "1d2h30m"
    }
  ]
}
```

---

## 📁 Struktur Proyek

```
zafalink-monitoring/
├── public/
│   ├── index.html          # Dashboard UI utama
│   └── js/
│       └── app.js          # Logic frontend & polling API
├── src/
│   └── routes/             # Route tambahan
├── server.js               # Express server & MikroTik API driver
├── package.json
├── .gitignore
└── README.md
```

---

## 🔒 Keamanan

> ⚠️ **JANGAN** commit file `.env` ke GitHub! File ini berisi kredensial sensitif router.
> File `.env` sudah di-exclude via `.gitignore` dalam repo ini.

- Gunakan user MikroTik dengan hak akses terbatas untuk keamanan
- Batasi akses API MikroTik hanya dari IP server monitoring
- Pertimbangkan HTTPS jika dashboard diakses dari internet

---

## 🚀 Deploy Production

Menggunakan **PM2** di server Linux:

```bash
# Install PM2 secara global
npm install -g pm2

# Jalankan dengan PM2
pm2 start server.js --name "zafalink-monitor"

# Auto-start saat reboot
pm2 startup
pm2 save
```

---

## 👨‍💻 Developer

**Zafalink Technology** — ISP Gorontalo
🌐 [app.zafalink.web.id](https://app.zafalink.web.id)

---

## 📄 License

Distributed under the **ISC License**.
Copyright © 2026 Zafalink Technology — Gorontalo.
