import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Bantu resolve path ESM setara __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handler = async (m, { conn, text, reply2, example }) => {
    if (!text) return reply2(example("namafile plugins"));
    if (!text.endsWith(".js")) return reply2("Nama file harus berformat .js");

    const pluginDir = "./lib/scrape";
    const filePath = path.join(pluginDir, text.toLowerCase());

    // Cek folder plugins
    if (!fs.existsSync(pluginDir)) {
        return reply2("Directory System/plugins tidak ditemukan!");
    }

    // Cek file plugins
    if (!fs.existsSync(filePath)) {
        return reply2("File plugins tidak ditemukan!");
    }

    try {
        // Hapus file
        await fs.promises.unlink(filePath);

        // Clear dari cache dynamic import (ESM)
        const resolvedPath = path.resolve(filePath);
        const modulePath = `file://${resolvedPath}`;
        if (import.meta.resolve) {
            // Jika environment dukung import.meta.resolve
            const resolvedModule = await import.meta.resolve(modulePath);
            if (resolvedModule) {
                // Tidak bisa langsung delete cache seperti CommonJS,
                // jadi reload plugin saat autoload saja
            }
        }

        return reply2(`Berhasil menghapus file plugins *${text.toLowerCase()}* dari directory System/plugins`);
    } catch (error) {
        return reply2(`Gagal menghapus file: ${error.message}`);
    }
};

handler.command = ["delplugins", "delplugin", "delp", "delplug"];
handler.owner = true;

export default handler;
