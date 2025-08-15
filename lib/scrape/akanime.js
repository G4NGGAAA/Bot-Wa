//source: https://whatsapp.com/channel/0029VacFb8kLNSZwwiUfq62b
//©Levi Ackerman pemula
//fitur button akanime (search,detail, ongoing,completed, populer, episode,url link download)
//Base: https://akanime.fun
//Ramaikan
import axios from 'axios';
import * as cheerio from 'cheerio';

const scrapeAkanime = async (url = 'https://akanime.fun/') => {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        const $ = cheerio.load(data);

        const extractedData = {
            pageTitle: $('title').text().trim(),
            popularAnime: [],
            latestReleases: [],
            ongoingAnime: [],
            recommendations: {},
            newSeries: []
        };

        const extractAnime = (element) => {
            const $el = $(element);
            const link = $el.find('a').first();
            const title = link.attr('title') || $el.find('h2, h3, h4').text().trim();
            const href = link.attr('href');
            const image = $el.find('img').attr('src');
            const episode = $el.find('.epx, .eggepisode').text().trim();
            const type = $el.find('.typez, .eggtype').text().trim();

            if (!title || !href) return null;

            return {
                title: title.trim(),
                link: href,
                image: image || '',
                episode: episode || '',
                type: type || ''
            };
        };

        $('.listupd.popularslider article.bs').each((i, el) => {
            const anime = extractAnime(el);
            if (anime) extractedData.popularAnime.push(anime);
        });

        $('.bixbox:has(h3:contains("Rilisan Terbaru")) .listupd article.bs').each((i, el) => {
            const anime = extractAnime(el);
            if (anime) extractedData.latestReleases.push(anime);
        });

        $('.bixbox:has(h3:contains("Anime Ongoing")) .listupd article.bs').each((i, el) => {
            const anime = extractAnime(el);
            if (anime) extractedData.ongoingAnime.push(anime);
        });

        return extractedData;

    } catch (error) {
        throw new Error(`Scraping failed: ${error.message}`);
    }
};

const searchAkanime = async (query) => {
    try {
        const searchUrl = `https://akanime.fun/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        const $ = cheerio.load(data);
        const searchResults = {
            query: query,
            totalResults: 0,
            animeList: [],
            hasResults: false
        };

        const extractSearchResult = (element) => {
            const $el = $(element);
            const link = $el.find('a').first();
            const title = link.attr('title') || $el.find('h2, h3').text().trim();
            const href = link.attr('href');
            const image = $el.find('img').attr('src') || $el.find('img').attr('data-src');
            const type = $el.find('.typez, .type').text().trim();
            const episode = $el.find('.epx, .episode').text().trim();

            if (!title || !href) return null;

            return {
                title: title.trim(),
                link: href,
                image: image || '',
                type: type || 'Unknown',
                episode: episode || ''
            };
        };

        $('article.bs').each((i, el) => {
            const result = extractSearchResult(el);
            if (result) {
                searchResults.animeList.push(result);
            }
        });

        searchResults.hasResults = searchResults.animeList.length > 0;
        searchResults.totalResults = searchResults.animeList.length;

        return searchResults;

    } catch (error) {
        throw new Error(`Search failed: ${error.message}`);
    }
};

const scrapeAnimeDetail = async (url) => {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        const $ = cheerio.load(data);

        if (!$('.postbody').length && !$('.entry-content').length) {
            throw new Error('Halaman anime tidak ditemukan');
        }

        const animeData = {
            title: $('h1.entry-title').text().trim() || $('title').text().trim(),
            image: $('.thumbook .thumb img').attr('src') || $('.wp-post-image').attr('src') || '',
            synopsis: '',
            details: {},
            episodes: [],
            totalEpisodes: 0
        };

        const synopsis = $('.bixbox.synp .entry-content p').first().text().trim();
        if (synopsis && synopsis.length > 20) {
            animeData.synopsis = synopsis;
        }

        $('.eplister ul li').each((index, element) => {
            const $ep = $(element);
            const numberText = $ep.find('.epl-num').text().trim();
            const episodeNumber = parseInt(numberText.replace(/\D/g, ''), 10);
            const title = $ep.find('.epl-title').text().trim();
            const link = $ep.find('a').attr('href');

            if (!isNaN(episodeNumber) && title && link) {
                animeData.episodes.push({
                    episode: episodeNumber,
                    title: title,
                    link: link
                });
            }
        });

        animeData.episodes.sort((a, b) => a.episode - b.episode);
        animeData.totalEpisodes = animeData.episodes.length;

        return animeData;

    } catch (error) {
        throw new Error(`Gagal mengambil detail anime: ${error.message}`);
    }
};

const scrapeEpisode = async (url) => {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        const $ = cheerio.load(data);

        const episodeData = {
            title: $('title').text().trim(),
            episodeTitle: $('h1.entry-title').text().trim() || $('h1').first().text().trim(),
            poster: $('.megavid .item.meta .tb img').attr('src') || '',
            downloadLinks: []
        };

        $('.bixbox .mctnx .soraddlx').each((i, el) => {
            const $section = $(el);
            const formatTitle = $section.find('.sorattlx h3').text().trim() || `Format ${i + 1}`;
            const resolutions = [];

            $section.find('.soraurlx').each((j, resEl) => {
                const $res = $(resEl);
                const resolution = $res.find('strong').text().trim();
                const links = [];

                $res.find('a').each((k, linkEl) => {
                    const $link = $(linkEl);
                    const provider = $link.text().trim();
                    const url = $link.attr('href');
                    
                    if (provider && url && !url.startsWith('#')) {
                        links.push({
                            provider: provider,
                            url: url
                        });
                    }
                });

                if (resolution && links.length > 0) {
                    resolutions.push({
                        quality: resolution,
                        links: links
                    });
                }
            });

            if (formatTitle && resolutions.length > 0) {
                episodeData.downloadLinks.push({
                    format: formatTitle,
                    resolutions: resolutions
                });
            }
        });

        return episodeData;

    } catch (error) {
        throw new Error(`Gagal mengambil data episode: ${error.message}`);
    }
};

const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

const createHomeSections = (homeData) => {
    const sections = [];
    
    if (homeData.popularAnime.length > 0) {
        sections.push({
            title: `🔥 Anime Terpopuler (${homeData.popularAnime.length})`,
            rows: homeData.popularAnime.map((item, i) => ({
                title: `${i + 1}. ${item.title.substring(0, 35)}${item.title.length > 35 ? '...' : ''}`,
                description: `${item.type} ${item.episode ? `• ${item.episode}` : ''}`,
                rowId: `.akanime detail|${item.link}`
            }))
        });
    }

    if (homeData.latestReleases.length > 0) {
        const latestChunks = chunkArray(homeData.latestReleases, 20);
        latestChunks.forEach((chunk, chunkIdx) => {
            sections.push({
                title: `🆕 Rilisan Terbaru ${latestChunks.length > 1 ? `(${chunkIdx + 1}/${latestChunks.length})` : `(${chunk.length})`}`,
                rows: chunk.map((item, i) => ({
                    title: `${item.title.substring(0, 30)}${item.title.length > 30 ? '...' : ''}`,
                    description: `${item.episode || 'New Episode'} • ${item.type}`,
                    rowId: `.akanime episode|${item.link}`
                }))
            });
        });
    }

    if (homeData.ongoingAnime.length > 0) {
        sections.push({
            title: `▶️ Anime Ongoing (${homeData.ongoingAnime.length})`,
            rows: homeData.ongoingAnime.map((item, i) => ({
                title: `${i + 1}. ${item.title.substring(0, 35)}${item.title.length > 35 ? '...' : ''}`,
                description: `${item.episode || 'Latest Ep'} • ${item.type}`,
                rowId: `.akanime detail|${item.link}`
            }))
        });
    }

    return sections;
};

const showMainMenu = async (m, conn) => {
    return conn.sendMessage(m.chat, {
        text: `*🎌 Akanime Bot Menu*\n\nPilih fitur yang ingin digunakan:`,
        footer: '© Akanime Scraper Bot',
        title: "AKANIME BOT",
        buttonText: "PILIH FITUR",
        sections: [{
            title: "🏠 Main Features",
            rows: [
                {
                    title: "🏠 Homepage",
                    description: "Lihat anime populer, terbaru, dan ongoing",
                    rowId: ".akanime home"
                },
                {
                    title: "🔍 Search Anime", 
                    description: "Cari anime berdasarkan judul",
                    rowId: ".akanime search|"
                },
                {
                    title: "📋 Anime Details",
                    description: "Lihat detail anime dan daftar episode",
                    rowId: ".akanime detail|"
                },
                {
                    title: "📥 Episode Download",
                    description: "Download episode anime dengan berbagai kualitas",
                    rowId: ".akanime episode|"
                }
            ]
        }]
    }, { quoted: m });
};

let handler = async (m, { conn, text }) => {
    try {
        if (!text) return showMainMenu(m, conn);
        
        const [cmd, ...args] = text.split('|').map(s => s.trim());
        const query = args.join('|');

        switch (cmd.toLowerCase()) {
            case 'home':
                const homeData = await scrapeAkanime();
                const homeSections = createHomeSections(homeData);

                let homeMessage = `*🎌 Akanime.fun Homepage*\n\n`;
                homeMessage += `🔥 *Popular:* ${homeData.popularAnime.length} anime\n`;
                homeMessage += `🆕 *Latest:* ${homeData.latestReleases.length} releases\n`;
                homeMessage += `▶️ *Ongoing:* ${homeData.ongoingAnime.length} series\n\n`;
                homeMessage += `Pilih kategori untuk melihat daftar anime:`;

                return conn.sendMessage(m.chat, {
                    text: homeMessage,
                    footer: 'Select anime to view details or episodes',
                    title: "AKANIME HOME",
                    buttonText: "SELECT ANIME",
                    sections: homeSections
                }, { quoted: m });

            case 'search':
                if (!query) {
                    return m.reply('❌ Masukkan kata kunci pencarian!\nContoh: .akanime search|naruto');
                }

                const searchResults = await searchAkanime(query);
                
                if (!searchResults.hasResults) {
                    return m.reply(`❌ Tidak ditemukan hasil untuk "${query}"`);
                }

                const searchSections = [{
                    title: `🔍 Search Results (${searchResults.totalResults})`,
                    rows: searchResults.animeList.slice(0, 20).map((item, i) => ({
                        title: `${i + 1}. ${item.title.substring(0, 30)}${item.title.length > 30 ? '...' : ''}`,
                        description: `${item.type} ${item.episode ? `• ${item.episode}` : ''}`,
                        rowId: `.akanime detail|${item.link}`
                    }))
                }];

                return conn.sendMessage(m.chat, {
                    text: `🔍 *Search Results for "${query}"*\n\nFound ${searchResults.totalResults} anime results`,
                    footer: 'Select anime to view details',
                    title: "SEARCH RESULTS",
                    buttonText: "SELECT ANIME",
                    sections: searchSections
                }, { quoted: m });

            case 'detail':
                if (!query) {
                    return m.reply('❌ Masukkan URL anime!\nContoh: .akanime detail|https://akanime.fun/anime/naruto/');
                }

                const animeData = await scrapeAnimeDetail(query);
                
                let detailMessage = `*🎌 ${animeData.title}*\n\n`;
                
                if (animeData.synopsis) {
                    const shortSynopsis = animeData.synopsis.length > 200 
                        ? animeData.synopsis.substring(0, 200) + '...' 
                        : animeData.synopsis;
                    detailMessage += `📖 *Synopsis:*\n${shortSynopsis}\n\n`;
                }

                detailMessage += `📺 *Total Episodes:* ${animeData.totalEpisodes}\n\n`;
                detailMessage += `Select episode to download:`;

                if (animeData.image) {
                    await conn.sendMessage(m.chat, {
                        image: { url: animeData.image },
                        caption: detailMessage
                    }, { quoted: m });
                } else {
                    await m.reply(detailMessage);
                }

                if (animeData.episodes.length > 0) {
                    const episodeSections = [{
                        title: `📺 All Episodes (${animeData.totalEpisodes})`,
                        rows: animeData.episodes.map((ep) => ({
                            title: `Episode ${ep.episode}: ${ep.title.substring(0, 25)}${ep.title.length > 25 ? '...' : ''}`,
                            description: `Click to get download links`,
                            rowId: `.akanime episode|${ep.link}`
                        }))
                    }];

                    await conn.sendMessage(m.chat, {
                        text: `📺 *${animeData.title}* - Episode List`,
                        footer: 'Select episode to get download links',
                        title: "EPISODE LIST",
                        buttonText: "SELECT EPISODE",
                        sections: episodeSections
                    }, { quoted: m });
                }
                return;

            case 'episode':
                if (!query) {
                    return m.reply('❌ Masukkan URL episode!\nContoh: .akanime episode|https://akanime.fun/naruto-episode-1-sub-indo/');
                }

                const episodeData = await scrapeEpisode(query);
                
                let episodeMessage = `*🎬 ${episodeData.episodeTitle}*\n\n`;
                
                if (episodeData.poster) {
                    await conn.sendMessage(m.chat, {
                        image: { url: episodeData.poster },
                        caption: episodeMessage
                    }, { quoted: m });
                } else {
                    await m.reply(episodeMessage);
                }

                const downloadSections = [];
                
                episodeData.downloadLinks.forEach((format) => {
                    format.resolutions.forEach((resolution) => {
                        downloadSections.push({
                            title: `⬇️ ${format.format} - ${resolution.quality}`,
                            rows: resolution.links.map((link) => ({
                                title: `💾 ${link.provider}`,
                                description: `${resolution.quality} quality via ${link.provider}`,
                                rowId: `.dl ${link.url}`
                            }))
                        });
                    });
                });

                return conn.sendMessage(m.chat, {
                    text: `📥 *Download Options for ${episodeData.episodeTitle}*\n\nSelect your preferred quality and provider:`,
                    footer: 'Links will be sent as direct messages',
                    title: "DOWNLOAD OPTIONS",
                    buttonText: "SELECT DOWNLOAD",
                    sections: downloadSections
                }, { quoted: m });

            default:
                return showMainMenu(m, conn);
        }
    } catch (error) {
        console.error('Akanime handler error:', error);
        return m.reply(`❌ Error: ${error.message}`);
    }
};

handler.help = ['akanime [home|search|detail|episode]'];
handler.tags = ['anime'];
handler.command = /^akanime|aka$/i;
handler.limit = true;

export default handler;