const cheerio = require('cheerio');
const axios = require('axios');
const crypto = require('crypto');
const {
    trimItemType,
    imageDwnld,
    parseStickerInfo
} = require('./utils');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US;q=0.7,en;q=0.3',
    'Referer': 'https://steamcommunity.com/my/'
}

async function scrapeMarketHistory(cookie) {
    let start = 0;
    const count = 500;
    let totalCount = 0;
    const purchasedItems = [];

    do {
        const response = await axios.get(`https://steamcommunity.com/market/myhistory/render/?query=&start=${start}&count=${count}`, {
            headers: {
                ...HEADERS,
                'Cookie': cookie
            }
        });
        const data = response.data;
        totalCount = data.total_count;

        const resultsHtml = data.results_html;

        const $ = cheerio.load(resultsHtml);

        const listingRows = $('.market_listing_row');

        listingRows.each((index, element) => {
            const gameName = $(element).find('.market_listing_game_name').text().trim();
            if (gameName === 'Counter-Strike 2') {
                const itemName = $(element).find('.market_listing_item_name').text().trim();
                const price = $(element).find('.market_listing_price').text().trim();
                const gainOrLoss = $(element).find('.market_listing_gainorloss').text().trim();
                if (gainOrLoss === '+') {
                    const purchasedItem = {
                        itemName,
                        price,
                    };

                    purchasedItems.push(purchasedItem);
                }
            }
        });

        start += count;
    } while (start < totalCount);
    return purchasedItems;
}

async function scrapeUInfo(cookie) {
    try {
        const response = await axios.get('https://steamcommunity.com/my', {
            headers: {
                ...HEADERS,
                'Cookie': cookie
            },
            maxRedirects: 5,
            validateStatus: function(status) {
                return status >= 200 && status < 400;
            }
        });

        const finalUrl = response.request.res.responseUrl || response.config.url;

        const $ = cheerio.load(response.data);
        const avatarElement = $('.user_avatar.playerAvatar');
        let avatarUrl = avatarElement.find('img').attr('src');
        const username = avatarElement.find('img').attr('alt');
        avatarUrl = avatarUrl.replace(/(\.\w+)$/, '_medium$1');
        return {
            finalUrl,
            avatarUrl,
            username
        };
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
        throw error;
    }
}

async function scrapeIH(userId, cookie, s, time, time_frac, purchasedItems) {
    const sessionId = cookie.match(/sessionid=([^;]+)/i)?.[1] || null;
    const ih_url = `${userId}inventoryhistory/?ajax=1&cursor%5Btime%5D=${time}&cursor%5Btime_frac%5D=${time_frac}&cursor%5Bs%5D=${s}&sessionid=${sessionId}&app%5B%5D=730`;

    try {
        const response = await axios.get(ih_url, {
            headers: {
                ...HEADERS,
                'Cookie': cookie
            }
        });

        const jsonData = response.data;

        if (jsonData && jsonData.success) {
            const cursorFound = jsonData.cursor !== undefined;
            const cursor = jsonData.cursor;
            console.log(cursor, cursorFound);

            const htmlData = jsonData.html;
            const cleanhtmlData = htmlData.replace(/[\t\n\r]/g, '');

            const $ = cheerio.load(cleanhtmlData);
            const tradeRows = $('.tradehistoryrow');
            const scrapeData = [];

            const descriptionMap = {
                'Traded With': (description) => ['You traded with', 'Your trade with', 'Your held trade with'].some(phrase => description.startsWith(phrase)),
                'Unlocked a case': (description, tradeHistoryItem) => description === 'Unlocked a container' && tradeHistoryItem.toLowerCase().includes('case'),
                'Unlocked a sticker capsule': (description, tradeHistoryItem) => description === 'Unlocked a container' && tradeHistoryItem.toLowerCase().includes('sticker |'),
                'Unlocked a package': (description, tradeHistoryItem) => description === 'Unlocked a container' && tradeHistoryItem.toLowerCase().includes('package'),
                'Trade Up': (description) => description === 'Crafted',
                'Earned a case drop': (description, tradeHistoryItem) => ['Earned a new rank and got a drop', 'Got an item drop'].includes(description) && (tradeHistoryItem.toLowerCase().includes('case' || 'capsule')),
                'Earned a graffiti drop': (description, tradeHistoryItem) => ['Earned a new rank and got a drop', 'Got an item drop'].includes(description) && tradeHistoryItem.toLowerCase().includes('sealed graffiti'),
                'Earned a weapon drop': (description, tradeHistoryItem) => ['Earned a new rank and got a drop', 'Got an item drop'].includes(description) && !(tradeHistoryItem.toLowerCase().includes('case' || 'sealed graffiti')),
                'Earned': (description) => ['Earned a promotional item', 'Received by entering product code', 'Leveled up a challenge coin'].includes(description),
                'Sticker applied/removed': (description) => ['Sticker applied', 'Sticker removed'].includes(description),
                'Name Tag applied/removed': (description) => ['Name Tag applied', 'Name Tag removed'].includes(description),
                'Used': (description) => description === 'Used',
                'Graffiti Opened': (description) => description === 'Unsealed',
                'Operation Reward': (description) => description === 'Mission reward',
                'Listed on Community Market': (description) => description === 'You listed an item on the Community Market.',
                'Purchased on Community Market': (description) => description === 'You purchased an item on the Community Market.',
                'Canceled listing on Community Market': (description) => description === 'You canceled a listing on the Community Market. The item was returned to you.',
                'Deleted': (description) => description === 'You deleted'
            };
            const imageUrls = [];
            const scrapedEntries = await Promise.all(tradeRows.map(async (index, element) => {
                const dateElement = $(element).find('.tradehistory_date');
                const d = dateElement.contents().first().text().trim();
                const t = dateElement.find('.tradehistory_timestamp').text().trim();
                let description = $(element).find('.tradehistory_event_description').text().trim();
                let tradeName = '';

                if (description !== 'Moved to Storage Unit') {
                    const tradeHistoryItem = $(element).find('.tradehistory_items').text();

                    if (description === 'Traded') {
                        tradeName = 'Missing Trade Name';
                        description = 'Traded With';
                    }

                    const plusItems = [];
                    const minusItems = [];

                    await Promise.all($(element).find('.tradehistory_items').map(async (i, itemsElement) => {
                        const plusMinus = $(itemsElement).find('.tradehistory_items_plusminus').text().trim();
                        const items = await Promise.all($(itemsElement).find('.history_item').map(async (i, el) => {
                            const itemName = $(el).find('.history_item_name').text().trim();
                            if (description === 'Unlocked a container' && itemName.toLowerCase().match(/\bkey\b/)) {
                                return null;
                            }
                            const {
                                appid,
                                classid,
                                instanceid
                            } = $(el).data();
                            const jsonId = `${classid}_${instanceid}`;
                            const itemDescription = jsonData.descriptions?.[appid]?.[jsonId] ?? '';
                            if (itemDescription) {
                                const itemType = jsonData.descriptions[appid][jsonId]['type'];
                                const trimmedIT = trimItemType(itemType);
                                const itemUrl = jsonData.descriptions[appid][jsonId]['icon_url'];

                                let stickers = [];
                                let nametag = '';
                                let itemSetName = '';
                                let stCount = '';
                                const descriptions = jsonData.descriptions[appid][jsonId]['descriptions'];
                                if (descriptions) {
                                    const stickerInfoValue = descriptions.find(desc => desc.value.includes('sticker_info'));
                                    const nameTagDesc = descriptions.find(desc => desc.value.includes('Name Tag:'));
                                    const itemSetDesc = descriptions.find(desc => desc.app_data && desc.app_data.is_itemset_name === 1);
                                    const stDescValue = descriptions.find(desc => desc.value.includes('StatTrak™ Confirmed Kills') || desc.value.includes('This item tracks Confirmed Kills'));
                                    if (stDescValue) {
                                        const stCountMatch = stDescValue.value.match(/StatTrak™ Confirmed Kills: (\d+)/);
                                        if (stCountMatch) {
                                            stCount = stCountMatch[1];
                                        } else if (stDescValue.value.includes('This item tracks Confirmed Kills')) {
                                            stCount = '0';
                                        }
                                    }
                                    if (nameTagDesc) {
                                        nametag = nameTagDesc.value.split('Name Tag: ')[1].trim();
                                    }
                                    if (stickerInfoValue) {
                                        const parsedStickers = await parseStickerInfo(stickerInfoValue.value);
                                        stickers = parsedStickers.map(sticker => ({
                                            name: sticker.name,
                                            imgSrc: crypto.createHash('md5').update(sticker.imgSrc).digest('hex')
                                        }));
                                        imageUrls.push(...parsedStickers.map(sticker => ({
                                            url: sticker.imgSrc,
                                            isBuildUrl: false
                                        })));
                                    }
                                    if (itemSetDesc) {
                                        itemSetName = itemSetDesc.value.trim();
                                    }
                                }
                                let market_name = itemDescription.market_name;
                                let itemWear = '';
                                const wearQualities = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];
                                const wearRegex = new RegExp(`\\((${wearQualities.join('|')})\\)$`);
                                const wearMatch = market_name.match(wearRegex);

                                if (wearMatch) {
                                    itemWear = wearMatch[1];
                                    market_name = market_name.replace(wearRegex, '').trim();
                                }
                                if (appid === 730) {
                                    imageUrls.push({
                                        url: itemUrl,
                                        isBuildUrl: true
                                    });
                                }
                                const itemData = {
                                    market_name: market_name
                                };
        
                                if (itemWear) itemData.itemWear = itemWear;
                                if (nametag) itemData.tag_name = nametag;
                                if (trimmedIT) itemData.itemType = trimmedIT;
                                if (stCount) itemData.stCount = stCount;
                                if (itemUrl) itemData.itemName = crypto.createHash('md5').update(itemUrl).digest('hex');
                                if (stickers && stickers.length > 0) itemData.stickers = stickers;
                                if (itemSetName) itemData.itemSetName = itemSetName;
        
                                return itemData;
                            } else {
                                console.log('item description not found');
                                return null;
                            }
                        }).get());

                        const filteredItems = items.filter(item => item !== null);

                        if (plusMinus === '+') {
                            plusItems.push(...filteredItems);
                        } else if (plusMinus === '-') {
                            minusItems.push(...filteredItems);
                        }
                    }).get());

                    let descriptionChanged = false;
                    for (const [mappedDescription, condition] of Object.entries(descriptionMap)) {
                        if (condition(description, tradeHistoryItem)) {
                            if (mappedDescription === 'Traded With') {
                                tradeName = description.replace(/^(You traded with|Your trade with|Your held trade with)\s*/, '').trim();
                            } else if (mappedDescription === 'Sticker applied/removed' || mappedDescription === 'Name Tag applied/removed') {
                                tradeName = description;
                            } else if (mappedDescription === 'Used') {
                                const hasGraffitiItem = minusItems.some(item => item.market_name && item.market_name.startsWith('Sealed Graffiti'));
                                if (hasGraffitiItem) {
                                    return undefined;
                                }
                                if (minusItems.length === 1 && minusItems[0].market_name && minusItems[0].market_name.startsWith('Graffiti')) {
                                    description = 'Graffiti Used';
                                    descriptionChanged = true;
                                }
                            } else if (mappedDescription === 'Earned a weapon drop') {
                                if (plusItems.length > 0 && plusItems[0]?.market_name && !plusItems[0].market_name.includes('|')) {
                                    description = 'Earned';
                                    descriptionChanged = true;
                                }
                            }
                            if (!descriptionChanged) {
                                description = mappedDescription;
                            }
                            break;
                        }
                    }
                    if (description === 'Purchased on Community Market') {
                        const matchingItemIndex = purchasedItems.findIndex(item => item && plusItems[0]?.market_name.startsWith(item.itemName));
                        if (matchingItemIndex !== -1) {
                            tradeName = purchasedItems[matchingItemIndex].price;
                            delete purchasedItems[matchingItemIndex];
                        } else {
                            console.log('no matching item found');
                        }
                    }

                    return {
                        d,
                        t,
                        description,
                        tradeName,
                        plusItems,
                        minusItems
                    };
                }
            }).get());

            scrapeData.push(...scrapedEntries.filter(entry => entry !== undefined));
            for (const {
                    url,
                    isBuildUrl
                }
                of imageUrls) {
                await imageDwnld(url, isBuildUrl);
            }
            return {
                scrapeData,
                cursor,
                cursorFound
            };
        } else {
            console.log('Failed to scrape JSON data');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
module.exports = {
    scrapeUInfo,
    scrapeIH,
    scrapeMarketHistory
};