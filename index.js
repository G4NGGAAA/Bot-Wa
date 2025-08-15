import { createRequire } from 'module';
import qrcode from 'qrcode-terminal';
import pkg, { fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
const { makeWASocket, useMultiFileAuthState, Browsers } = pkg;

import { Boom } from '@hapi/boom';
import P from 'pino';
import fs, { watchFile, unwatchFile } from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import readline from 'readline';
import globalConfig from './settings/config.js';
import colors from './settings/colors.js';
import { setupMessageHandler } from './handler.js';
import { Connection } from './lib/connection/connect.js';

// ====== Helper ======
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function tanya(pertanyaan) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(pertanyaan, jawaban => {
        rl.close();
        resolve(jawaban.trim());
    }));
}

// ====== Loader Plugin ======
const PLUGINS_DIR = path.resolve(__dirname, "./command");
async function pluginsLoader(directory) {
    let plugins = [];
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const filePath = path.join(directory, file);
        if (filePath.endsWith(".js")) {
            try {
                const fileUrl = pathToFileURL(filePath).href;
                delete require.cache[fileUrl];
                const pluginModule = await import(fileUrl + `?update=${Date.now()}`);
                const pluginHandler = pluginModule.default;
                if (typeof pluginHandler === 'function' && pluginHandler.command) {
                    plugins.push(pluginHandler);
                } else {
                    console.log(`${colors.error}[PLUGIN ERROR] Plugin ${file} tidak memiliki struktur sesuai.${colors.reset}`);
                }
            } catch (error) {
                console.log(`${colors.error}[PLUGIN ERROR] Gagal memuat plugin ${file}:${colors.reset}`, error);
            }
        }
    }
    return plugins;
}

// ====== Limit User ======
const userLimits = {};
function checkAndApplyLimit(userJid) {
    if (!globalConfig.limit.enable) return true;
    const now = Date.now();
    let userData = userLimits[userJid];
    if (!userData) {
        userData = { count: 0, lastUsed: now };
        userLimits[userJid] = userData;
    }
    if (now - userData.lastUsed > globalConfig.limit.resetIntervalMs) {
        userData.count = 0;
        userData.lastUsed = now;
    }
    if (userData.count >= globalConfig.limit.maxDaily) return false;
    userData.count++;
    userData.lastUsed = now;
    return true;
}

// ====== Main Connection ======
let currentSock = null;
async function connectToWhatsApp(mode = "qr") {
    if (currentSock) {
        try { if (typeof currentSock.end === 'function') await currentSock.end(); } catch {}
        currentSock = null;
    }

    const { state, saveCreds } = await useMultiFileAuthState('sesi');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        auth: state,
        browser: Browsers.macOS('Desktop'),
        version
    });

    if (mode === "pairing") {
        let nomorBot = globalConfig.NomorBot;
        if (!nomorBot || nomorBot === "null") {
            nomorBot = await tanya(`${colors.info}[INPUT] Masukkan nomor bot (contoh: 6281234567890): ${colors.reset}`);
        }
        try {
            const pairingCode = await sock.requestPairingCode(nomorBot);
            console.log(`${colors.info}[PAIRING] Kode Pairing: ${colors.reset}${colors.bright}${pairingCode}${colors.reset}`);
        } catch (err) {
            console.error(`${colors.error}[PAIRING ERROR] Gagal membuat pairing code:${colors.reset}`, err);
        }
    }

    sock.ev.on('connection.update', (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr && mode === "qr") {
            console.clear();
            console.log(`${colors.info}[LOGIN] Scan QR berikut untuk login:${colors.reset}`);
            qrcode.generate(qr, { small: true });
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(`${colors.error}[KONEKSI] Terputus. Status Kode: ${reason}${colors.reset}`);
            if (reason === 401) {
                console.log(`${colors.warning}[PERINGATAN] Sesi buruk atau logout! Hapus folder "sesi" lalu login ulang.${colors.reset}`);
            }
        }

        if (connection === "open") {
            console.log(`${colors.success}[CONNECTED] Bot berhasil terhubung!${colors.reset}`);
        }
    });

    currentSock = sock;

    const loadedPlugins = await pluginsLoader(PLUGINS_DIR);
    console.log(`${colors.info}[PLUGIN LOADER] Memuat ${loadedPlugins.length} plugin dari ${PLUGINS_DIR}${colors.reset}`);

    setupMessageHandler(sock, loadedPlugins, globalConfig, userLimits, checkAndApplyLimit);
    Connection(sock, () => connectToWhatsApp(mode), saveCreds);
}

// ====== Plugin Watcher ======
let isWatchingPlugins = false;
function startPluginWatcher() {
    if (isWatchingPlugins) return;
    const files = fs.readdirSync(PLUGINS_DIR);
    console.log(`${colors.info}[WATCHER] Memulai pengawasan ${files.length} plugin di ${PLUGINS_DIR}${colors.reset}`);
    files.forEach(file => {
        if (file.endsWith(".js")) {
            const filePath = path.join(PLUGINS_DIR, file);
            watchFile(filePath, () => {
                unwatchFile(filePath);
                console.log(`${colors.warning}[RELOAD] Perubahan terdeteksi pada plugin: ${file}${colors.reset}`);
                connectToWhatsApp();
            });
        }
    });
    isWatchingPlugins = true;
}

// ====== Startup ======
console.log(`\n${colors.bright}${colors.cyan}=====================================${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}         BOT WHATSAPP DIMULAI        ${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}=====================================${colors.reset}\n`);

(async () => {
    console.log("Pilih metode login:");
    console.log("1. QR");
    console.log("2. Pairing Code");
    const pilihan = await tanya("Masukkan pilihan (1/2): ");
    const mode = pilihan === "2" ? "pairing" : "qr";
    await connectToWhatsApp(mode);
    startPluginWatcher();
})();
