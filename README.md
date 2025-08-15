# WhatsApp Bot Hybrid (QR + Pairing)
> Bot WhatsApp dengan dua metode login — QR Code & Pairing Code — dibuat menggunakan library Baileys. Bot ini juga mendukung hot-reload plugin, sistem limit per user, dan konfigurasi yang mudah.
> 
✨ Fitur Utama
 * Login Fleksibel: Pilih antara QR Code atau Pairing Code untuk login.
 * Tanpa Warning Deprecated: Code dioptimalkan untuk menghilangkan warning.
 * Hot-Reload Plugin: Perubahan pada plugin langsung aktif tanpa perlu me-restart bot.
 * Sistem Limit Per User: Batasi penggunaan bot per hari untuk setiap pengguna.
 * Struktur Modular: Command dan konfigurasi dipisahkan, membuat bot lebih rapi dan mudah diatur.
 * Mudah Dipasang & Dikonfigurasi: Proses instalasi dan setup yang sederhana.
📦 Instalasi
1. Clone Repository
git clone https://github.com/username/wabot-hybrid.git
cd wabot-hybrid

2. Install Dependencies
Pastikan Node.js v18+ sudah terpasang.
npm install

3. Konfigurasi Bot
Edit file settings/config.js:
export default {
    NomorBot: "null", // isi nomor bot atau biarkan null untuk input saat pairing
    limit: {
        enable: true,
        maxDaily: 50,
        resetIntervalMs: 86400000 // 24 jam
    }
}

▶️ Cara Menjalankan
Mode QR Code
Jalankan bot dan pilih opsi 1:
npm start

Pilih metode login:
1. QR
2. Pairing Code
Masukkan pilihan (1/2): 1

Selanjutnya, scan QR yang muncul di terminal.
Mode Pairing Code
Jalankan bot dan pilih opsi 2:
npm start

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
