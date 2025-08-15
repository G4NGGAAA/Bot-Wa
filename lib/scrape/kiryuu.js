//source: https://whatsapp.com/channel/0029VacFb8kLNSZwwiUfq62b
//©Levi Ackerman pemula
//fitur button kiryuu (search,detail, latest update,manga, populer, Download chapter jadi )
//Base: https://kiryuu02.com
//Ramaikan
import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import { promisify } from 'util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

const sanitizeFilename = (name) => {
  return name.replace(/[^a-z0-9\s-]/gi, '_').replace(/\s+/g, '-');
};

const extractChapterSlug = (url) => {
  try {
    const urlParts = url.split('/');
    const slug = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1];
    return slug.replace(/\/$/, ''); 
  } catch (error) {
    return 'kiryuu-chapter';
  }
};

async function toPDF(images, opt = {}) {
    return new Promise(async (resolve, reject) => {
        if (!Array.isArray(images)) images = [images];
        let buffs = [],
            doc = new PDFDocument({ margin: 0 });

        if (images.length > 0) {
            try {
                let firstImageData = (await axios.get(images[0], { responseType: "arraybuffer", ...opt })).data;
                let firstImage = doc.openImage(firstImageData);
                doc.addPage({ size: [firstImage.width, firstImage.height] });
                doc.image(firstImageData, 0, 0, { width: firstImage.width, height: firstImage.height });
            } catch (error) {
                return reject(error);
            }
        }

        for (let x = 1; x < images.length; x++) {
            if (/.webp|.gif/.test(images[x])) continue;
            try {
                let data = (await axios.get(images[x], { responseType: "arraybuffer", ...opt })).data;
                let image = doc.openImage(data);
                doc.addPage({ size: [image.width, image.height] });
                doc.image(data, 0, 0, { width: image.width, height: image.height });
            } catch (error) {
                continue;
            }
        }

        doc.on("data", (chunk) => buffs.push(chunk));
        doc.on("end", () => {
            const buffer = Buffer.concat(buffs);
            
            setTimeout(() => {
                if (buffs && buffs.length > 0) {
                    buffs.length = 0; 
                    buffs = null; 
                }
            }, 600000); 
            
            resolve(buffer);
        });
        doc.on("error", (err) => reject(err));
        doc.end();
    });
}

class KiryuuManga {
    constructor() {
        this.baseUrl = 'https://kiryuu02.com';
    }

    
    async search(searchTerm, page = 1) {
        const searchUrl = `${this.baseUrl}/page/${page}/?s=${encodeURIComponent(searchTerm)}`;
        
        try {
            const { data } = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
            });
            
            const $ = cheerio.load(data);
            const results = [];

            $('.listupd .bs').each((i, el) => {
                const title = $(el).find('.tt').text().trim();
                const link = $(el).find('a').attr('href');
                const image = $(el).find('img').attr('src');
                const chapter = $(el).find('.epxs').text().trim();
                const rating = $(el).find('.numscore').text().trim();

                results.push({
                    title,
                    url: link.startsWith('http') ? link : `${this.baseUrl}${link}`,
                    image: image.startsWith('http') ? image : `${this.baseUrl}${image}`,
                    latestChapter: chapter,
                    rating: rating || 'N/A'
                });
            });

            const hasNextPage = $('.pagination .next').length > 0;
            
            return {
                results,
                hasNextPage,
                currentPage: page,
                nextPage: hasNextPage ? page + 1 : null
            };

        } catch (error) {
            console.error('Search failed:', error);
            return {
                results: [],
                hasNextPage: false,
                currentPage: page,
                nextPage: null
            };
        }
    }

    async detail(url) {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
            });
            
            const $ = cheerio.load(data);

            const title = $('h1.entry-title').text().trim();
            const alternativeTitle = $('.seriestualt').text().trim();
            const description = $('.entry-content.entry-content-single').text().trim();
            const imageUrl = $('.thumb > img').attr('src');

            const status = $('table.infotable tr:contains("Status") td:last-child').text().trim() || 'Tidak diketahui';
            const type = $('table.infotable tr:contains("Type") td:last-child').text().trim() || 'Tidak diketahui';
            const author = $('table.infotable tr:contains("Author") td:last-child').text().trim() || 'Tidak diketahui';

            const genres = [];
            $('.seriestugenre a').each((i, el) => {
                genres.push($(el).text().trim());
            });

            const chapters = [];
            $('#chapterlist ul.clstyle li').each((i, el) => {
                const chapterText = $(el).find('.chapternum').text().trim();
                const chapterUrl = $(el).find('a').attr('href');
                const chapterDate = $(el).find('.chapterdate').text().trim();
                
                let chapterNumber = 0;
                const numberMatch = chapterText.match(/(?:Chapter|Ch\.?)\s*(\d+(?:\.\d+)?)/i);
                if (numberMatch) {
                    chapterNumber = parseFloat(numberMatch[1]);
                }

                chapters.push({
                    chapter: chapterText,
                    url: chapterUrl,
                    date: chapterDate,
                    number: chapterNumber,
                    displayNumber: chapterNumber > 0 ? `Ch. ${chapterNumber}` : chapterText
                });
            });

            return {
                metadata: {
                    judul: title,
                    judulAlternatif: alternativeTitle,
                    author: author,
                    status: status,
                    type: type,
                    genre: genres.join(', '),
                    sinopsis: description,
                    thumbnail: imageUrl
                },
                chapter: chapters.sort((a, b) => b.number - a.number) // Sort by chapter number descending
            };

        } catch (error) {
            console.error('Detail scraping failed:', error);
            return { metadata: {}, chapter: [] };
        }
    }

    async chapter(url) {
        try {
            const { data: html } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
            });

            const $ = cheerio.load(html);

            const title = $('h1.entry-title').text().trim() || 'kiryuu-chapter';
            
            let imageUrls = [];
            
            $('#readerarea noscript img').each((i, el) => {
                const src = $(el).attr('src');
                if (src) {
                    imageUrls.push(src.trim());
                }
            });

            if (imageUrls.length === 0) {
                const scriptContent = $('script:contains("ts_reader.run")').html();
                if (scriptContent) {
                    try {
                        const match = scriptContent.match(/"images":(\[.*?\])/);
                        if (match && match[1]) {
                            const imagesFromJson = JSON.parse(match[1]);
                            imageUrls.push(...imagesFromJson);
                        }
                    } catch (e) {
                        console.error('Failed to parse image data from script tag.');
                    }
                }
            }

            const chapterSlug = extractChapterSlug(url);
            const chapterNumberMatch = chapterSlug.match(/chapter-(\d+(?:\.\d+)?)/i);
            const chapterNumber = chapterNumberMatch ? chapterNumberMatch[1] : '';

            let metadata = {
                judul: title,
                chapterNumber: chapterNumber,
                chapterSlug: chapterSlug,
                total_halaman: imageUrls.length,
                url: url
            };

            let buffer = await toPDF(imageUrls, {
                headers: {
                    'Referer': url
                }
            });

            return { metadata, buffer };

        } catch (error) {
            console.error('Chapter scraping failed:', error);
            return { metadata: {}, buffer: null };
        }
    }

    async getHomepage() {
        try {
            const { data } = await axios.get(this.baseUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
            });
            
            const $ = cheerio.load(data);
            const result = {
                featured: [],
                popular: [],
                latestUpdates: [],
                recommendations: []
            };

            $('.slidernom3 .swiper-slide .mainslider').each((i, el) => {
                const item = $(el);
                const title = item.find('.name').text().trim();
                const link = item.find('a').first().attr('href');
                const chapter = item.find('.slidlc').text().replace('Chapter:', '').trim();
                const image = item.find('.slidtrithumb img').attr('src');
                const genres = [];
                
                item.find('.metas-slider-genres a').each((i, genreEl) => {
                    genres.push($(genreEl).text().trim());
                });

                if (title && link) {
                    result.featured.push({
                        title,
                        url: link,
                        latestChapter: chapter,
                        genres: genres.slice(0, 3),
                        image
                    });
                }
            });

            $('.listupd.popularslider .bs').each((i, el) => {
                const item = $(el);
                const title = item.find('.tt').text().trim();
                const link = item.find('a').attr('href');
                const image = item.find('img').attr('src');
                const chapter = item.find('.epxs').text().trim();
                const rating = item.find('.numscore').text().trim();

                if (title && link) {
                    result.popular.push({
                        title,
                        url: link,
                        latestChapter: chapter,
                        rating,
                        image
                    });
                }
            });

            $('.postbody .listupd .bs').each((i, el) => {
                const item = $(el);
                const title = item.find('.tt').text().trim();
                const link = item.find('a').attr('href');
                const image = item.find('img').attr('src');
                const chapter = item.find('.epxs').text().trim();
                const date = item.find('.adds .date').text().trim();

                if (title && link) {
                    result.latestUpdates.push({
                        title,
                        url: link,
                        image,
                        latestChapter: chapter,
                        date
                    });
                }
            });

            $('.releases .item').each((i, el) => {
                const item = $(el);
                const title = item.find('.tt').text().trim();
                const link = item.find('a').attr('href');
                const image = item.find('img').attr('src');
                const chapter = item.find('.epxs').text().trim();

                if (title && link) {
                    result.recommendations.push({
                        title,
                        url: link,
                        latestChapter: chapter,
                        image
                    });
                }
            });

            return result;

        } catch (error) {
            console.error('Homepage scraping failed:', error);
            return {
                featured: [],
                popular: [],
                latestUpdates: [],
                recommendations: []
            };
        }
    }
}

const kiryuuManga = new KiryuuManga();

const searchState = new Map();
const pdfBuffers = new Map(); 

const cleanupPDFBuffer = (bufferId) => {
    if (pdfBuffers.has(bufferId)) {
        const bufferData = pdfBuffers.get(bufferId);
        if (bufferData && bufferData.buffer) {
            bufferData.buffer = null; 
        }
        pdfBuffers.delete(bufferId);
        console.log(`PDF buffer ${bufferId} cleaned up`);
    }
};

setInterval(() => {
    const now = Date.now();
    for (const [bufferId, data] of pdfBuffers.entries()) {
        if (now - data.timestamp > 900000) { // 15 minutes
            cleanupPDFBuffer(bufferId);
        }
    }
}, 300000); 

const handler = async (m, { conn, text, command }) => {
    if (!text) {
        const sections = [{
            title: "📚 KIRYUU MANGA MENU",
            rows: [
                {
                    title: "🏠 Homepage",
                    description: "Lihat update terbaru dari Kiryuu",
                    rowId: ".kiryuu homepage"
                },
                {
                    title: "🔍 Cari Manga",
                    description: "Cari manga berdasarkan judul",
                    rowId: ".kiryuu cari|"
                },
                {
                    title: "📖 Detail Manga",
                    description: "Lihat detail manga dengan URL",
                    rowId: ".kiryuu detail|"
                },
                {
                    title: "📥 Download Chapter",
                    description: "Download chapter manga dalam PDF",
                    rowId: ".kiryuu download|"
                },
                {
                    title: "🔥 Popular Today",
                    description: "Lihat manga populer hari ini",
                    rowId: ".kiryuu popular"
                },
                {
                    title: "🔄 Latest Updates",
                    description: "Lihat update chapter terbaru",
                    rowId: ".kiryuu latest"
                }
            ]
        }];
        
        const listMessage = {
            text: `*📚 Kiryuu02.com Manga Scraper*\n\nPilih fitur yang ingin digunakan:`,
            footer: 'Contoh: .kiryuu cari|solo leveling',
            title: "MENU UTAMA",
            buttonText: "PILIH MENU",
            sections
        };
        
        return conn.sendMessage(m.chat, listMessage, { quoted: m });
    }

    try {
        const [subcommand, query] = text.split('|').map(str => str.trim());
        
        if (!subcommand) {
            return m.reply('Subcommand tidak valid. Gunakan homepage, cari, detail, atau download');
        }

        switch (subcommand.toLowerCase()) {
            case 'homepage':
                return await handleHomepage(m, conn);
            case 'popular':
                return await handlePopular(m, conn);
            case 'latest':
                return await handleLatest(m, conn);
            case 'cari':
                return await handleSearch(m, conn, query);
            case 'nextpage':
                return await handleNextPage(m, conn, query);
            case 'detail':
                return await handleDetail(m, conn, query);
            case 'download':
                return await handleDownload(m, conn, query);
            default:
                return m.reply('Subcommand tidak valid. Gunakan homepage, cari, detail, atau download');
        }
    } catch (error) {
        console.error("Error:", error);
        await conn.sendMessage(m.chat, { text: "⚠️ Terjadi kesalahan. Coba lagi nanti." }, { quoted: m });
    }
};

async function handleHomepage(m, conn) {
    await m.reply('📡 Mengambil data homepage Kiryuu...');
    
    const homepage = await kiryuuManga.getHomepage();
    
    if (!homepage.featured.length && !homepage.popular.length && !homepage.latestUpdates.length) {
        return m.reply('Gagal mengambil data homepage Kiryuu.');
    }

    const sections = [];

    if (homepage.featured.length > 0) {
        sections.push({
            title: "🌟 FEATURED MANGA",
            rows: homepage.featured.slice(0, 20).map((manga, i) => ({
                title: `${i + 1}. ${manga.title.substring(0, 30)}${manga.title.length > 30 ? '...' : ''}`,
                description: `📖 ${manga.latestChapter} | ${manga.genres.join(', ')}`,
                rowId: `.kiryuu detail|${manga.url}`
            }))
        });
    }

    // Popular Today Section
    if (homepage.popular.length > 0) {
        sections.push({
            title: "🔥 POPULAR TODAY",
            rows: homepage.popular.slice(0, 20).map((manga, i) => ({
                title: `${i + 1}. ${manga.title.substring(0, 30)}${manga.title.length > 30 ? '...' : ''}`,
                description: `⭐ ${manga.rating} | 📖 ${manga.latestChapter}`,
                rowId: `.kiryuu detail|${manga.url}`
            }))
        });
    }

    // Latest Updates Section
    if (homepage.latestUpdates.length > 0) {
        sections.push({
            title: "🆕 LATEST UPDATES",
            rows: homepage.latestUpdates.slice(0, 20).map((manga, i) => ({
                title: `${i + 1}. ${manga.title.substring(0, 30)}${manga.title.length > 30 ? '...' : ''}`,
                description: `📖 ${manga.latestChapter} | 📅 ${manga.date}`,
                rowId: `.kiryuu detail|${manga.url}`
            }))
        });
    }

    // Navigation Section
    sections.push({
        title: "🔍 NAVIGASI",
        rows: [
            {
                title: "🔥 Lihat Semua Popular",
                description: "Tampilkan semua manga populer",
                rowId: ".kiryuu popular"
            },
            {
                title: "🔄 Lihat Semua Update",
                description: "Tampilkan semua update terbaru",
                rowId: ".kiryuu latest"
            },
            {
                title: "🏠 Kembali ke Menu",
                description: "Kembali ke menu utama",
                rowId: ".kiryuu"
            }
        ]
    });

    const listMessage = {
        text: `*📚 KIRYUU HOMEPAGE*\n\nUpdate terbaru dari Kiryuu Manga:`,
        footer: 'Pilih manga untuk melihat detail lengkap',
        title: "HOMEPAGE KIRYUU",
        buttonText: "PILIH MANGA",
        sections
    };

    if (homepage.featured.length > 0 && homepage.featured[0].image) {
        await conn.sendFile(m.chat, homepage.featured[0].image, 'featured.jpg', `🌟 Featured: ${homepage.featured[0].title}`, m);
    }

    return conn.sendMessage(m.chat, listMessage, { quoted: m });
}

async function handlePopular(m, conn) {
    await m.reply('🔥 Mengambil manga populer hari ini...');
    
    const homepage = await kiryuuManga.getHomepage();
    
    if (!homepage.popular.length) {
        return m.reply('Tidak ditemukan manga populer.');
    }

    const sections = [{
        title: "🔥 POPULAR MANGA",
        rows: homepage.popular.map((manga, i) => ({
            title: `${i + 1}. ${manga.title.substring(0, 35)}${manga.title.length > 35 ? '...' : ''}`,
            description: `⭐ ${manga.rating} | 📖 ${manga.latestChapter}`,
            rowId: `.kiryuu detail|${manga.url}`
        }))
    }];

    sections.push({
        title: "🔙 NAVIGASI",
        rows: [
            {
                title: "🏠 Kembali ke Homepage",
                description: "Kembali ke homepage",
                rowId: ".kiryuu homepage"
            },
            {
                title: "🏠 Kembali ke Menu",
                description: "Kembali ke menu utama",
                rowId: ".kiryuu"
            }
        ]
    });

    const listMessage = {
        text: `*🔥 POPULAR MANGA HARI INI*\n\nTotal ${homepage.popular.length} manga populer:`,
        footer: 'Pilih manga untuk melihat detail',
        title: "POPULAR MANGA",
        buttonText: "PILIH MANGA",
        sections
    };

    return conn.sendMessage(m.chat, listMessage, { quoted: m });
}

async function handleLatest(m, conn) {
    await m.reply('🔄 Mengambil update terbaru...');
    
    const homepage = await kiryuuManga.getHomepage();
    
    if (!homepage.latestUpdates.length) {
        return m.reply('Tidak ditemukan update terbaru.');
    }

    const sections = [{
        title: "🆕 LATEST UPDATES",
        rows: homepage.latestUpdates.map((manga, i) => ({
            title: `${i + 1}. ${manga.title.substring(0, 35)}${manga.title.length > 35 ? '...' : ''}`,
            description: `📖 ${manga.latestChapter} | 📅 ${manga.date}`,
            rowId: `.kiryuu detail|${manga.url}`
        }))
    }];

    sections.push({
        title: "🔙 NAVIGASI",
        rows: [
            {
                title: "🏠 Kembali ke Homepage",
                description: "Kembali ke homepage",
                rowId: ".kiryuu homepage"
            },
            {
                title: "🏠 Kembali ke Menu",
                description: "Kembali ke menu utama",
                rowId: ".kiryuu"
            }
        ]
    });

    const listMessage = {
        text: `*🔄 LATEST UPDATES*\n\nTotal ${homepage.latestUpdates.length} update terbaru:`,
        footer: 'Pilih manga untuk melihat detail',
        title: "LATEST UPDATES",
        buttonText: "PILIH MANGA",
        sections
    };

    return conn.sendMessage(m.chat, listMessage, { quoted: m });
}

async function showSubcommandMenu(m, conn, subcommand) {
    let text = '';
    let example = '';
    let rows = [];
    
    switch (subcommand.toLowerCase()) {
        case 'cari':
            text = '🔍 *Menu Pencarian Manga*';
            example = 'Contoh: .kiryuu cari|solo leveling';
            rows = [{
                title: "🔎 Contoh Pencarian",
                description: "Cari manga Solo Leveling",
                rowId: ".kiryuu cari|solo leveling"
            }];
            break;
        case 'detail':
            text = '📖 *Menu Detail Manga*';
            example = 'Contoh: .kiryuu detail|https://kiryuu02.com/manga/judul-manga/';
            rows = [{
                title: "📋 Contoh Detail Manga",
                description: "Lihat detail manga",
                rowId: ".kiryuu detail|https://kiryuu02.com/manga/solo-leveling/"
            }];
            break;
        case 'download':
            text = '📥 *Menu Download Chapter*';
            example = 'Contoh: .kiryuu download|https://kiryuu02.com/manga-chapter-url/';
            rows = [{
                title: "💾 Contoh Download Chapter",
                description: "Download chapter manga",
                rowId: ".kiryuu download|https://kiryuu02.com/solo-leveling-chapter-1/"
            }];
            break;
        default:
            return m.reply('Subcommand tidak valid. Gunakan cari, detail, atau download');
    }
    
    rows.push({
        title: "🔙 Kembali ke Menu Utama",
        description: "Kembali ke menu utama",
        rowId: ".kiryuu"
    });
    
    const sections = [{
        title: `📌 ${text}`,
        rows: rows
    }];
    
    const listMessage = {
        text: `${text}\n\nSilakan masukkan query setelah subcommand.\n\n${example}`,
        footer: 'Pilih contoh di bawah atau ketik manual',
        title: "PANDUAN PENGGUNAAN",
        buttonText: "PILIH CONTOH",
        sections
    };
    
    return conn.sendMessage(m.chat, listMessage, { quoted: m });
}

async function handleSearch(m, conn, query) {
    await m.reply(`🔍 Mencari manga "${query}" di Kiryuu...`);
    
    const searchResult = await kiryuuManga.search(query, 1);
    
    if (!searchResult?.results?.length) {
        return m.reply('Tidak ditemukan manga yang cocok dengan pencarian tersebut.');
    }

    const searchKey = `${m.chat}_${query}`;
    searchState.set(searchKey, {
        query,
        currentPage: 1,
        lastUpdate: Date.now()
    });

    const sections = [{
        title: `🔍 Hasil Pencarian untuk "${query}" (Halaman 1)`,
        rows: searchResult.results.slice(0, 20).map((result, index) => ({
            title: `📘 ${index + 1}. ${result.title.substring(0, 35)}${result.title.length > 35 ? '...' : ''}`,
            description: `Chapter: ${result.latestChapter} | Rating: ${result.rating}`,
            rowId: `.kiryuu detail|${result.url}`
        }))
    }];

    const navigationRows = [];
    
    if (searchResult.hasNextPage) {
        navigationRows.push({
            title: "➡️ Halaman Berikutnya",
            description: `Lihat halaman ${searchResult.nextPage}`,
            rowId: `.kiryuu nextpage|${query}|${searchResult.nextPage}`
        });
    }
    
    navigationRows.push({
        title: "🔙 Kembali ke Menu Pencarian",
        description: "Kembali ke menu sebelumnya",
        rowId: ".kiryuu cari|"
    });

    sections.push({
        title: "🔙 Navigasi",
        rows: navigationRows
    });

    const listMessage = {
        text: `Ditemukan hasil untuk pencarian "${query}"\n📄 Halaman: ${searchResult.currentPage}${searchResult.hasNextPage ? ` | Ada halaman berikutnya` : ` | Halaman terakhir`}`,
        footer: 'Pilih manga untuk melihat detail',
        title: "HASIL PENCARIAN",
        buttonText: "PILIH MANGA",
        sections
    };

    await conn.sendMessage(m.chat, listMessage, { quoted: m });

    for (const item of searchResult.results.slice(0, 3)) {
        try {
            await conn.sendFile(m.chat, item.image, 'cover.jpg', `📖 ${item.title}`, m);
        } catch (e) {
            console.error('Gagal mengirim gambar:', e);
        }
    }
}

async function handleNextPage(m, conn, queryWithPage) {
    const [query, pageStr] = queryWithPage.split('|');
    const page = parseInt(pageStr) || 2;
    
    await m.reply(`🔍 Memuat halaman ${page} untuk "${query}"...`);
    
    const searchResult = await kiryuuManga.search(query, page);
    
    if (!searchResult?.results?.length) {
        return m.reply('Tidak ada hasil di halaman ini.');
    }

    const sections = [{
        title: `🔍 Hasil Pencarian untuk "${query}" (Halaman ${page})`,
        rows: searchResult.results.slice(0, 20).map((result, index) => ({
            title: `📘 ${index + 1}. ${result.title.substring(0, 35)}${result.title.length > 35 ? '...' : ''}`,
            description: `Chapter: ${result.latestChapter} | Rating: ${result.rating}`,
            rowId: `.kiryuu detail|${result.url}`
        }))
    }];

    const navigationRows = [];
    
    if (page > 1) {
        navigationRows.push({
            title: "⬅️ Halaman Sebelumnya",
            description: `Lihat halaman ${page - 1}`,
            rowId: page === 2 ? `.kiryuu cari|${query}` : `.kiryuu nextpage|${query}|${page - 1}`
        });
    }
    
    if (searchResult.hasNextPage) {
        navigationRows.push({
            title: "➡️ Halaman Berikutnya",
            description: `Lihat halaman ${searchResult.nextPage}`,
            rowId: `.kiryuu nextpage|${query}|${searchResult.nextPage}`
        });
    }
    
    navigationRows.push({
        title: "🔙 Kembali ke Menu Pencarian",
        description: "Kembali ke menu sebelumnya",
        rowId: ".kiryuu cari|"
    });

    sections.push({
        title: "🔙 Navigasi",
        rows: navigationRows
    });

    const listMessage = {
        text: `Hasil pencarian "${query}"\n📄 Halaman: ${page}${searchResult.hasNextPage ? ` | Ada halaman berikutnya` : ` | Halaman terakhir`}`,
        footer: 'Pilih manga untuk melihat detail',
        title: "HASIL PENCARIAN",
        buttonText: "PILIH MANGA",
        sections
    };

    return conn.sendMessage(m.chat, listMessage, { quoted: m });
}

async function handleDetail(m, conn, url) {
    if (!url.includes('kiryuu02.com/manga/')) {
        return m.reply('URL harus dari kiryuu02.com/manga/');
    }

    await m.reply('📖 Mengambil detail manga...');
    
    const manga = await kiryuuManga.detail(url);
    
    if (!manga?.chapter?.length) {
        return m.reply('Tidak ditemukan detail untuk URL tersebut.');
    }

    const sections = [];
    
    const allChapters = manga.chapter.map((ch) => ({
        title: `📖 ${ch.displayNumber || ch.chapter}`,
        description: `📅 ${ch.date}`,
        rowId: `.kiryuu download|${ch.url}`
    }));

    const chunkSize = 10;
    for (let i = 0; i < allChapters.length; i += chunkSize) {
        const chunk = allChapters.slice(i, i + chunkSize);
        const startNum = manga.chapter[i].number || (i + 1);
        const endNum = manga.chapter[Math.min(i + chunkSize - 1, allChapters.length - 1)].number || (i + chunkSize);
        
        sections.push({
            title: `📚 Chapter ${startNum} - ${endNum}`,
            rows: chunk
        });
    }

    const metadataRows = [
        {
            title: "📌 Judul",
            description: manga.metadata.judul || 'N/A',
            rowId: `.kiryuu detail|${url}`
        },
        {
            title: "📌 Author",
            description: manga.metadata.author || 'N/A',
            rowId: `.kiryuu detail|${url}`
        },
        {
            title: "📌 Status",
            description: manga.metadata.status || 'N/A',
            rowId: `.kiryuu detail|${url}`
        },
        {
            title: "📌 Genre",
            description: manga.metadata.genre || 'N/A',
            rowId: `.kiryuu detail|${url}`
        }
    ];

    sections.unshift({
        title: "📖 Detail Manga",
        rows: metadataRows
    });

    sections.push({
        title: "🔙 Navigasi",
        rows: [
            {
                title: "Kembali ke Pencarian",
                description: `Kembali ke hasil pencarian`,
                rowId: `.kiryuu cari|${manga.metadata.judul || 'manga'}`
            },
            {
                title: "Menu Utama",
                description: "Kembali ke menu utama",
                rowId: ".kiryuu"
            }
        ]
    });

    const listMessage = {
        text: `📚 *${manga.metadata.judul || 'Manga'}*\n\n${manga.metadata.sinopsis ? manga.metadata.sinopsis.substring(0, 200) + '...' : ''}\n\n📊 Total Chapter: ${manga.chapter.length}`,
        footer: `Menampilkan SEMUA ${manga.chapter.length} chapter`,
        title: "DETAIL MANGA",
        buttonText: "PILIH CHAPTER",
        sections
    };

    if (manga.metadata.thumbnail) {
        await conn.sendFile(m.chat, manga.metadata.thumbnail, 'cover.jpg', `📖 ${manga.metadata.judul}`, m);
    }

    return conn.sendMessage(m.chat, listMessage, { quoted: m });
}

async function handleDownload(m, conn, url) {
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(url)) {
        return m.reply('❌ URL tidak valid! Pastikan URL dimulai dengan http:// atau https://');
    }

    await m.reply('📚 Memulai download manga chapter...\n⏳ Proses ini mungkin memakan waktu beberapa menit.');

    const chapter = await kiryuuManga.chapter(url);
    
    if (!chapter?.buffer) {
        return m.reply('❌ Gagal mendownload chapter. Silakan coba lagi atau periksa URL.');
    }

    const fileName = `${chapter.metadata.chapterSlug || 'kiryuu-chapter'}.pdf`;
    
    const bufferId = `${m.chat}_${Date.now()}`;
    pdfBuffers.set(bufferId, {
        buffer: chapter.buffer,
        timestamp: Date.now(),
        fileName: fileName
    });

    try {
        await conn.sendMessage(m.chat, {
            document: chapter.buffer,
            mimetype: 'application/pdf',
            fileName: fileName,
            caption: `📥 *Download Chapter Berhasil*\n\n📙 *Judul:* ${chapter.metadata.judul}\n🔢 *Chapter:* ${chapter.metadata.chapterNumber || 'N/A'}\n📄 *Total Halaman:* ${chapter.metadata.total_halaman}\n🔗 *URL:* ${chapter.metadata.url}\n\n⚠️ *File akan otomatis dihapus dari memori setelah 15 menit*`
        }, { quoted: m });
        
        setTimeout(() => {
            cleanupPDFBuffer(bufferId);
        }, 900000); 
        
    } catch (sendError) {
        console.error('Error sending PDF:', sendError);
        cleanupPDFBuffer(bufferId);
        return m.reply('❌ PDF berhasil dibuat tetapi gagal mengirim file. Mungkin file terlalu besar.');
    }

    const sections = [{
        title: "📚 Opsi Tambahan",
        rows: [
            {
                title: "🔙 Kembali ke Detail",
                description: "Kembali ke detail manga",
                rowId: `.kiryuu detail|${url.split('/chapter')[0] || url.replace(/\/[^\/]*$/, '')}`
            },
            {
                title: "🏠 Menu Utama",
                description: "Kembali ke menu utama",
                rowId: ".kiryuu"
            }
        ]
    }];

    const listMessage = {
        text: `✅ ${chapter.metadata.judul} berhasil didownload!`,
        footer: 'Pilih opsi di bawah untuk navigasi',
        title: "DOWNLOAD BERHASIL",
        buttonText: "PILIH OPSI",
        sections
    };

    return conn.sendMessage(m.chat, listMessage, { quoted: m });
}

setInterval(() => {
    const now = Date.now();
    for (const [key, state] of searchState.entries()) {
        if (now - state.lastUpdate > 3600000) {
            searchState.delete(key);
        }
    }
}, 300000); 

handler.command = ["kiryuu", "kiryuumanga"];
handler.tags = ['komiku'];
handler.help = ['kiryuu'];
handler.premium = false;
handler.limit = 2;

export default handler;