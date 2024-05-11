const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

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
  let imgUrl = urlOrIconUrl;
  const compressedUrl = crypto.createHash('md5').update(imgUrl).digest('hex');
  if (isBuildUrl) {
    if (!urlOrIconUrl || urlOrIconUrl.trim() === '') {
      console.error('Error: iconUrl is blank.');
      return;
    }
    
    imgUrl = `https://community.cloudflare.steamstatic.com/economy/image/${urlOrIconUrl}/96fx96f?allow_animated=1`;
  }

  const directoryPath = './images';

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
  }

  const filePath = path.join(directoryPath, `${compressedUrl}.png`);
  if (fs.existsSync(filePath)) {
    return `${compressedUrl}`;
  }

  try {
    const response = await axios.get(imgUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    return `${compressedUrl}`;
  } catch (error) {
    console.error(`Error downloading image ${compressedUrl}:`, error);
    return null;
  }
}

async function saveJson(scrapeData, scrapedDataFilePath) {
  let existingJson = {
    dumpInfo: {},
    scrapedData: []
  };

  if (fs.existsSync(scrapedDataFilePath)) {
    const fileContent = fs.readFileSync(scrapedDataFilePath, 'utf-8');
    existingJson = JSON.parse(fileContent);
  }

  existingJson.scrapedData.push(scrapeData);

  fs.writeFileSync(scrapedDataFilePath, JSON.stringify(existingJson, null));
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US;q=0.7,en;q=0.3',
  'Referer': 'https://steamcommunity.com/my/'
}

async function scrapeUInfo(cookie) {
  try {
    const response = await axios.get('https://steamcommunity.com/my', {
      headers: {
        ...HEADERS,
        'Cookie': cookie
      },
      maxRedirects: 0, // Disable automatic following of redirects
      validateStatus: function (status) {
        return status >= 200 && status < 303; // Allow status codes from 200 to 302
      }
    });

    return response.headers.location;
  } catch (error) {
    if (error.response && error.response.status === 302) {
      const redirectedUrl = error.response.headers.location;
      return redirectedUrl;
    } else {
      console.error('Error:', error);
      throw error;
    }
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
    const newImgName = await imageDwnld(imgSrc, false);
    if (newImgName) {
      const stickerName = stickerNames[i];
      stickers.push({
        name: stickerName,
        imgSrc: newImgName
      });
    }
  }
  return stickers;
}

async function scrapeIH(userId, cookie, s, time, time_frac) {
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
        'You traded with': (description) => ['You traded with', 'Your trade with', 'Your held trade with'].some(phrase => description.startsWith(phrase)),
        'Unlocked a case': (description, tradeHistoryItem) => description === 'Unlocked a container' && tradeHistoryItem.toLowerCase().includes('case'),
        'Unlocked a sticker capsule': (description, tradeHistoryItem) => description === 'Unlocked a container' && tradeHistoryItem.toLowerCase().includes('sticker |'),
        'Unlocked a package': (description, tradeHistoryItem) => description === 'Unlocked a container' && tradeHistoryItem.toLowerCase().includes('package'),
        'Trade Up': (description) => description === 'Crafted',
        'Earned a case drop': (description, tradeHistoryItem) => ['Earned a new rank and got a drop', 'Got an item drop'].includes(description) && tradeHistoryItem.toLowerCase().includes('case'),
        'Earned a graffiti drop': (description, tradeHistoryItem) => ['Earned a new rank and got a drop', 'Got an item drop'].includes(description) && tradeHistoryItem.toLowerCase().includes('sealed graffiti'),
        'Earned a weapon drop': (description, tradeHistoryItem) => ['Earned a new rank and got a drop', 'Got an item drop'].includes(description) && !(tradeHistoryItem.toLowerCase().includes('case' || 'sealed graffiti')),
        'Sticker applied/removed': (description) => ['Sticker applied', 'Sticker removed'].includes(description),
        'Name Tag applied/removed': (description) => ['Name Tag applied', 'Name Tag removed'].includes(description)
      };
      const imageUrls = [];
      tradeRows.each((index, element) => {
        const dateElement = $(element).find('.tradehistory_date');
        const d = dateElement.contents().first().text().trim();
        const t = dateElement.find('.tradehistory_timestamp').text().trim();
        let description = $(element).find('.tradehistory_event_description').text().trim();
        let tradeName = '';

        const tradeHistoryItem = $(element).find('.tradehistory_items').text();

        for (const [mappedDescription, condition] of Object.entries(descriptionMap)) {
          if (condition(description, tradeHistoryItem)) {
            if (mappedDescription === 'You traded with') {
              tradeName = description.replace(/^(You traded with|Your trade with|Your held trade with)\s*/, '').trim();
            } else if (mappedDescription === 'Sticker applied/removed' || mappedDescription === 'Name Tag applied/removed') {
              tradeName = description;
            }
            description = mappedDescription;
            break;
          }
        }
        if (description === 'Traded') {
          tradeName = 'Missing Trade Name';
          description = 'You traded with';
        } else if (description === 'Moved to Storage Unit') {
          return;
        }
        
        const plusItems = [];
        const minusItems = [];
        $(element).find('.tradehistory_items').each(async (i, itemsElement) => {
          const plusMinus = $(itemsElement).find('.tradehistory_items_plusminus').text().trim();
          const items = await Promise.all($(itemsElement).find('.history_item').map(async (i, el) => {
            const itemName = $(el).find('.history_item_name').text().trim();
            //will pass anything opened with a key to not affect the count of total unboxed
            if (['Unlocked a sticker capsule', 'Unlocked a case'].includes(description) && itemName.toLowerCase().match(/\bkey\b/)) {
              return null;
            }
              const { appid, classid, instanceid } = $(el).data();
              const jsonId = `${classid}_${instanceid}`;
              const itemDescription = jsonData.descriptions?.[appid]?.[jsonId] ?? '';
              if (itemDescription){
                const itemType = jsonData.descriptions[appid][jsonId]['type'];
                const trimmedIT = trimItemType(itemType);
                const itemUrl = jsonData.descriptions[appid][jsonId]['icon_url'];
                //grab sticker_info if it exists might be a better way to do this
                let stickers = [];
                const descriptions = jsonData.descriptions[appid][jsonId]['descriptions'];
                if (descriptions) {
                  const stickerInfoValue = descriptions.find(desc => desc.value.includes('sticker_info'));
                  if (stickerInfoValue) {
                    stickers = await parseStickerInfo(stickerInfoValue.value);
                  }
                }
                
                if (appid === 730) {
                  imageUrls.push(itemUrl);
                }
                return {
                  market_name: itemDescription.market_name,
                  itemType: trimmedIT,
                  itemName: crypto.createHash('md5').update(itemUrl).digest('hex'),
                  stickers: stickers
                };
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
        });
      
        scrapeData.push({
          d,
          t,
          description,
          tradeName,
          plusItems,
          minusItems
        });
      });
      for (const imageUrl of imageUrls) {
        await imageDwnld(imageUrl);
      }
      return { scrapeData, cursor, cursorFound };
    } else {
      console.log('Failed to scrape JSON data');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
  module.exports = { scrapeUInfo, scrapeIH, saveJson };