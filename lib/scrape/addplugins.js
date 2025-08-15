import fs from "fs";
import path from "path";

const handler = async (m, { conn, text, reply2, example }) => {
    if (!text) return reply2(example("namafile & reply code"));
    if (!m.quoted || !m.quoted.text) return reply2(example("namafile & reply code"));
    if (!text.endsWith(".js")) return reply2("Nama file harus berformat .js");

    let kondisi = "menambah";
    const pluginDir = "./lib/scrape";
    const filePath = path.join(pluginDir, text);

    // Buat folder jika belum ada
    if (!fs.existsSync(pluginDir)) {
        fs.mkdirSync(pluginDir, { recursive: true });
    }

    // Cek apakah file sudah ada
    if (fs.existsSync(filePath)) return reply2("Nama file plugins sudah terdaftar di dalam folder plugins!");

    const teks = m.quoted.text;
    try {
        await fs.promises.writeFile(filePath, teks);
        return reply2(`Berhasil ${kondisi} file plugins *${text}* ke directory System/plugins`);
    } catch (error) {
        return reply2(`Gagal menambahkan file: ${error.message}`);
    }
};

handler.command = ["addplugins", "addplugin", "addp", "addplug"];
handler.owner = true;

export default handler;
