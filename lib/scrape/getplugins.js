import fs from "fs";
import path from "path";

const handler = async (m, { conn, reply2, text, example }) => {
    if (!text) return reply2(example("namafile plugins nya"));
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
        // Baca isi file
        const res = fs.readFileSync(filePath, "utf8");

        // Cek apakah kosong
        if (!res || res.trim() === "") {
            return reply2("File plugins kosong!");
        }

        // Kirim isi file
        return reply2(`*Isi file ${text.toLowerCase()}:*\n\n\`\`\`javascript\n${res}\n\`\`\``);
    } catch (error) {
        return reply2(`Gagal membaca file: ${error.message}`);
    }
};

handler.command = ["getp", "gp", "getplugins", "getplugin"];
handler.owner = true;

export default handler;
