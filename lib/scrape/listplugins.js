import fs from "fs";
import path from "path";

const handler = async (m, { conn, reply2, example }) => {
    const pluginDir = "./lib/scrape";

    if (!fs.existsSync(pluginDir)) {
        return reply2("Directory System/plugins tidak ditemukan!");
    }

    const dir = fs.readdirSync(pluginDir);
    if (dir.length < 1) return reply2("Tidak ada file plugins");

    let teks = "\n";
    for (let e of dir) {
        teks += `* ${e}\n`;
    }

    reply2(teks);
};

handler.command = ["listplugin", "listplugins"];
handler.owner = true;

export default handler;
