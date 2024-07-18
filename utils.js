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

function extractItemColor(marketName) {
	const itemMap = {
		'Battle Green': '#789d53',
		'Monarch Blue': '#4e7fa9',
		'Monster Purple': '#6e4f9f',
		'Princess Pink': '#9d567a',
		'SWAT Blue': '#4c5b98',
		'Tiger Orange': '#b87148',
		'Tracer Yellow': '#d4c95b',
		'Violent Violet': '#af92df',
		'War Pig Pink': '#e4ccd5',
		'Wire Blue': '#6ba5b2',
		'Bazooka Pink': '#ba68b2',
		'Blood Red': '#b14d4d',
		'Brick Red': '#874444',
		'Cash Green': '#a6c4a5',
		'Desert Amber': '#ae833d',
		'Dust Brown': '#8f7d5d',
		'Frog Green': '#488f80',
		'Jungle Green': '#417a4a',
		'Shark White': '#c1c1c1',
		'Consumer Grade': 'rgb(176, 195, 217)',
		'Industrial Grade': 'rgb(94, 152, 217)',
		'Mil-Spec': 'rgb(75, 105, 255)',
		'High Grade Patch': 'rgb(75, 105, 255)',
		'High Grade Collectible': 'rgb(75, 105, 255)',
		'Genuine High Grade Collectible': 'rgb(75, 105, 255)',
		'High Grade Graffiti': 'rgb(75, 105, 255)',
		'High Grade Sticker': 'rgb(75, 105, 255)',
		'High Grade Music Kit': 'rgb(75, 105, 255)',
        'Restricted': 'rgb(136, 71, 255)',
		'Remarkable Patch': 'rgb(136, 71, 255)',
		'Remarkable Collectible': 'rgb(136, 71, 255)',
		'Genuine Remarkable Collection': 'rgb(136, 71, 255)',
		'Remarkable Graffiti': 'rgb(136, 71, 255)',
		'Remarkable Sticker': 'rgb(136, 71, 255)',
		'Classified': 'rgb(211, 44, 230)',
		'Exotic Patch': 'rgb(211, 44, 230)',
		'Exotic Collectible': 'rgb(211, 44, 230)',
		'Genuine Exotic Collectible': 'rgb(211, 44, 230)',
		'Exotic Graffiti': 'rgb(211, 44, 230)',
		'Exotic Sticker': 'rgb(211, 44, 230)',
		'Covert': 'rgb(235, 75, 75)',
		'Extraordinary Collectible': 'rgb(235, 75, 75)',
		'Genuine Extraordinary Collectible': 'rgb(235, 75, 75)',
		'Extraordinary Sticker': 'rgb(235, 75, 75)',
		'Extraordinary': 'rgb(255, 215, 0)'
	};
	return itemMap[marketName] || 'white';
}

module.exports = {
    trimItemType,
    imageDwnld,
    parseStickerInfo,
    extractItemColor
};