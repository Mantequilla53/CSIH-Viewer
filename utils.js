const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const cheerio = require('cheerio');

function trimItemType(itemType) {
    if (itemType.includes('★')) {
        return 'Extraordinary';
    }
    const keywords = ['Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert'];
    for (const keyword of keywords) {
        if (itemType.includes(keyword)) {
            return keyword;
        }
    }
    return itemType;
}

async function imageDwnld(urlOrIconUrl, isBuildUrl = true) {
    const resourcesPath = process.resourcesPath;
    const directoryPath = path.join(resourcesPath, 'images');
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath);
    }
    let imgUrl = urlOrIconUrl;
    const compressedUrl = crypto.createHash('md5').update(imgUrl).digest('hex');
    if (isBuildUrl) {
        if (!urlOrIconUrl || urlOrIconUrl.trim() === '') {
            console.error('Error: iconUrl is blank.');
            return;
        }
        imgUrl = `https://community.cloudflare.steamstatic.com/economy/image/${urlOrIconUrl}/150fx150f?allow_animated=1`;
    }

    const filePath = path.join(directoryPath, `${compressedUrl}.png`);
    if (fs.existsSync(filePath)) {
        return `${compressedUrl}`;
    }

    try {
        const response = await axios.get(imgUrl, {
            responseType: 'stream'
        });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        if (!isBuildUrl) {
            const sharp = require('sharp');
            const resizedFilePath = path.join(directoryPath, `${compressedUrl}_resized.png`);
            await sharp(filePath)
                .resize(50, 50)
                .toFile(resizedFilePath);
            await fs.promises.unlink(filePath);
            await fs.promises.rename(resizedFilePath, filePath);
        }

        return `${compressedUrl}`;
    } catch (error) {
        console.error(`Error downloading image ${compressedUrl}:`, error);
        return null;
    }
}

async function parseStickerInfo(stickerInfo) {
    const $ = cheerio.load(stickerInfo);
    const imgTags = $('img');
    const stickerNames = $('div').text().trim().replace('Sticker: ', '').split(', ');

    const stickers = [];

    for (let i = 0; i < imgTags.length; i++) {
        const img = imgTags[i];
        const imgSrc = $(img).attr('src');
        if (imgSrc) {
            const stickerName = stickerNames[i];
            stickers.push({
                name: stickerName,
                imgSrc: imgSrc
            });
        }
    }
    return stickers;
}

module.exports = {
    trimItemType,
    imageDwnld,
    parseStickerInfo
};