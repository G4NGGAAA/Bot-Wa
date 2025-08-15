# 🤖 WhatsApp Bot Hybrid (QR & Pairing Code)

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Baileys-Library-orange?style=for-the-badge" alt="Baileys">
</p>

<p align="center">
  Bot WhatsApp canggih dengan <strong>dua metode login</strong>—QR Code & Pairing Code—yang dibangun menggunakan library <a href="https://www.npmjs.com/package/@yupra/baileys">Baileys</a>. Dilengkapi dengan fitur <strong>hot-reload plugin</strong>, <strong>sistem limit per user</strong>, dan konfigurasi yang sangat mudah.
</p>

---

## ✨ Fitur Unggulan

* 🚀 **Login Fleksibel**: Pilih antara **QR Code** atau **Pairing Code** untuk masuk.
* ✅ **Kode Bersih**: Dioptimalkan untuk berjalan tanpa *warning deprecated* dari Baileys.
* 🔄 **Hot-Reload Plugin**: Tambah atau ubah *command* tanpa perlu me-restart bot. Perubahan langsung aktif!
* 📊 **Sistem Limit**: Kontrol penggunaan bot dengan membatasi jumlah perintah per pengguna setiap hari.
* 🗂️ **Struktur Modular**: File `command` dan `config` terpisah, membuat proyek lebih rapi dan mudah dikelola.
* ⚙️ **Instalasi Mudah**: Proses instalasi dan konfigurasi dirancang agar sederhana dan cepat.

---

## 📦 Instalasi & Penggunaan

### 1. Clone Repository
Buka terminal Anda dan jalankan perintah berikut:
```bash
git clone [https://github.com/username/wabot-hybrid.git](https://github.com/username/wabot-hybrid.git)
cd wabot-hybrid
```
2. Install Dependencies
Pasang semua paket yang dibutuhkan:
```bash
npm install
```
4. Jalankan Bot
Mulai bot dengan perintah:
```bash
npm start
```
6. Proses Login
Setelah dijalankan, Anda akan diminta memilih metode login:
Pilih metode login:
1. QR Code
2. Pairing Code

Masukkan pilihan (1/2):

 * Jika Anda memilih Pairing Code, masukkan nomor bot Anda (jika belum diatur di settings/config.js), dan kode pairing akan muncul di terminal.
 * Jika Anda memilih QR Code, pindai QR yang muncul menggunakan aplikasi WhatsApp di ponsel Anda.
📂 Struktur Proyek
Berikut adalah struktur folder dari proyek ini:
.
├── command/              # Folder untuk semua plugin/command bot
├── lib/                  # Berisi file helper & koneksi utama
├── settings/             # Tempat konfigurasi & pengaturan warna terminal
├── sesi/                 # Menyimpan data sesi login (jangan dihapus)
├── index.js              # File utama untuk menjalankan bot
└── package.json

🛠 Menambahkan Command Baru
Membuat perintah baru sangatlah mudah. Cukup buat file .js baru di dalam folder command/. Bot akan secara otomatis memuatnya berkat fitur hot-reload.
Contoh: command/ping.js
// Handler function
async function handler(sock, m) {
    await sock.sendMessage(m.chat, { text: 'Pong!' });
}

// Command properties
handler.command = ['ping'];
handler.help = 'ping';
handler.tags = ['main'];

// Export the handler
export default handler;

Simpan file tersebut, dan perintah ping akan langsung aktif tanpa perlu restart.
⚠️ Catatan Penting
 * Jangan hapus folder sesi/ kecuali Anda ingin login ulang dari awal.
 * Pastikan koneksi internet Anda stabil selama proses pairing atau scan QR.
 * Nomor yang digunakan untuk bot harus merupakan nomor WhatsApp yang aktif.
👥 Kredit & Apresiasi
Proyek ini tidak akan terwujud tanpa kontribusi dari:
 * Creator Base: Fauzi Alifatahfauzi
 * Pengembang Base: G4NGGAAA
 * Penyedia Baileys: @yupra/baileys
📜 Lisensi
Didistribusikan di bawah Lisensi MIT. Lihat LICENSE untuk informasi lebih lanjut.
<p align="center">
Dibuat untuk mempermudah pengembangan bot WhatsApp yang fleksibel dan modular.
</p>

* **Sistem Limit Per User**: Batasi penggunaan bot per hari untuk setiap pengguna.
* **Struktur Modular**: `Command` dan konfigurasi dipisahkan, membuat bot lebih rapi dan mudah diatur.
* **Mudah Dipasang & Dikonfigurasi**: Proses instalasi dan setup yang sederhana.

---

## 📦 Instalasi

### 1. Clone Repository
```bash
git clone [https://github.com/username/wabot-hybrid.git](https://github.com/username/wabot-hybrid.git)
cd wabot-hybrid

Pilih metode login:
1. QR
2. Pairing Code
Masukkan pilihan (1/2): 2

Masukkan nomor bot jika NomorBot diset null, lalu pairing code akan muncul di terminal.
📂 Struktur Project
.
├── command/              # Folder plugin/command bot
├── lib/                  # File helper & koneksi
├── settings/             # Config & warna terminal
├── sesi/                 # Data sesi login (jangan dihapus kecuali mau login ulang)
├── index.js              # File utama bot
└── package.json

🛠 Menambahkan Command Baru
Untuk menambahkan command baru, buat file di dalam folder command/.
Contoh, file ping.js:
export default handler;
handler.command = ['ping'];

async function handler(sock, m) {
    await sock.sendMessage(m.chat, { text: 'Pong!' });
}

Perubahan akan langsung dimuat tanpa perlu me-restart bot.
⚠️ Catatan
 * Jangan hapus folder sesi/ kecuali Anda ingin login ulang.
 * Pastikan koneksi internet stabil saat proses pairing atau scan QR.
 * Nomor bot harus aktif di WhatsApp.
👥 Kredit
 * Creator Base: Fauzi Alifatahfauzi
 * Pengembang Base: G4NGGAAA
 * Penyedia Baileys: @yupra/baileys
📜 Lisensi
MIT License © 2025
Dikembangkan untuk mempermudah pembuatan bot WhatsApp yang fleksibel dan modular.
