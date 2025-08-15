import fs from "fs";
import path from "path";

const handler = async (m, { conn, reply2, text, example }) => {
    if (!text) return reply2(example("namafile & reply code"));
    if (!m.quoted || !m.quoted.text) return reply2(example("namafile & reply code"));
    if (!text.endsWith(".js")) return reply2("Nama file harus berformat .js");

    const pluginDir = "./lib/scrape";
    const filePath = path.join(pluginDir, text.toLowerCase());
    let kondisi = "mengedit";

    // Buat folder jika belum ada
    if (!fs.existsSync(pluginDir)) {
        fs.mkdirSync(pluginDir, { recursive: true });
    }

    // Cek apakah file ada atau tidak
    if (!fs.existsSync(filePath)) {
        kondisi = "membuat";
    }

    const teks = m.quoted.text;

    try {
        // Simpan / edit file
        fs.writeFileSync(filePath, teks, "utf8");

        // ESM tidak punya require.cache, jadi reload plugin dilakukan lewat autoload system
        // Kamu bisa implementasikan autoload agar plugin terbaru langsung aktif

        return reply2(`Berhasil ${kondisi} file plugins *${text.toLowerCase()}* di directory System/plugins`);
    } catch (error) {
        return reply2(`Gagal ${kondisi} file: ${error.message}`);
    }
};

handler.command = ["sp", "svp", "saveplugins", "saveplugin", "editplugin", "editp"];
handler.owner = true;

export default handler;
