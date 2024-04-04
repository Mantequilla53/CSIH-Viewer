const { userInfo } = require('node:os');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

const keywordMap = {
  'Mil-Spec': 'Mil-Spec (Blue)',
  'Consumer Grade': 'Consumer Grade (Light Gray)',
  'Industrial Grade': 'Industrial Grade (Light Blue)',
  'Restricted': 'Restricted (Purple)',
  'Classified': 'Classified (Pink)',
  '★': 'Extraordinary (Knife/Glove)',
  'Covert': 'Covert (Red)'
};
//Used to clean up weapon quality(probably a better way to do this)
function trimItemType(itemType) {
  const keywords = Object.keys(keywordMap);
  if (keywords.some(keyword => itemType.includes(keyword))) {
    for (const keyword in keywordMap) {
      if (itemType.includes(keyword)) {
        return keywordMap[keyword];
      }
    }
  }
  return itemType;
}

async function saveJson(scrapeData) {
  let existingData = [];
  if (fs.existsSync('testdump.json')) {
    const fileContent = fs.readFileSync('testdump.json', 'utf-8');
    existingData = JSON.parse(fileContent);
  }
  const updateJson = [...existingData, scrapeData]
  fs.writeFileSync('testdump.json', JSON.stringify(updateJson, null));
  console.log('new data saved');
}

async function scrapeUInfo(url, cookie) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'Cookie': cookie,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Charset': 'UTF-8',
    'Accept-Language': 'en-US;q=0.7,en;q=0.3'
  });
  try {
    await page.goto(url);
    const userId = await (await page.waitForSelector('a.persona_level_btn', { timeout: 5000 })).evaluate(el => el.href.slice(0, -6));
    return userId;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function scrapeIH(userId, cookie, s, time, time_frac) {
  const sessionIdPair = cookie.split('; ').find(pair => pair.startsWith('sessionid='));
  const sessionId = sessionIdPair ? sessionIdPair.split('=')[1] : null;
  const ih_url = `${userId}inventoryhistory/?ajax=1&cursor%5Btime%5D=${time}&cursor%5Btime_frac%5D=${time_frac}&cursor%5Bs%5D=${s}&sessionid=${sessionId}&app%5B%5D=730`;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'Cookie': cookie,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US;q=0.7,en;q=0.3',
    'Referer': 'https://steamcommunity.com/id/my'
  });
  try {{
    await page.goto(ih_url, { waitUntil: 'networkidle0'});
    console.log(ih_url);
    const preTag = await page.evaluate(() => document.querySelector('pre').textContent);
    const jsonData = JSON.parse(preTag);
    const cursorFound = jsonData.cursor !== undefined;
    const cursor = jsonData.cursor;
    console.log(cursor);
    console.log(cursorFound);

    const htmlData = jsonData.html;
    const cleanhtmlData = htmlData.replace(/[\t\n\r]/g, '');
    
    const $ = cheerio.load(cleanhtmlData);
    const tradeRows = $('.tradehistoryrow');
    const scrapeData = [];
    
    tradeRows.each((index, element) => {
      const dateElement = $(element).find('.tradehistory_date');
      const date = dateElement.contents().first().text().trim();
      const timestamp = dateElement.find('.tradehistory_timestamp').text().trim();
      let description = $(element).find('.tradehistory_event_description').text().trim();
      let tradeName = '';
      //allows all trades to be combined in 1 tab
      if (description.startsWith('You traded with')) {
        tradeName = description.replace('You traded with ', '').trim();
        description = 'You traded with';
      }
      //splits cases / sticker capsules, leaves packages as containers
      if (description.startsWith('Unlocked a container')) {
        const tradeHistoryItem = $(element).find('.tradehistory_items').text();
        if (tradeHistoryItem && tradeHistoryItem.toLowerCase().includes('case')) {
          description = 'Unlocked a case';
        } else if (tradeHistoryItem && tradeHistoryItem.toLowerCase().includes('sticker |')) {
          description = 'Unlocked a sticker capsule';
    }
      }
      const plusItems = [];
      const minusItems = [];
      $(element).find('.tradehistory_items').each((i, itemsElement) => {
        const plusMinus = $(itemsElement).find('.tradehistory_items_plusminus').text().trim();
        const items = $(itemsElement).find('.history_item').map((i, el) => {
          const itemName = $(el).find('.history_item_name').text().trim();
          //will pass anything opened with a key to not affect the count of total unboxed
          if (!((description === 'Unlocked a sticker capsule' || description === 'Unlocked a case') && itemName.toLowerCase().match(/\bkey\b/))) {
            const appid = $(el).data('appid');
            const classId = $(el).data('classid');
            const instanceId = $(el).data('instanceid');
            const jsonId = `${classId}_${instanceId}`;
            const itemDescription = jsonData.descriptions?.[appid]?.[jsonId] ?? ''
            if (itemDescription){
              const itemType = jsonData.descriptions[appid][jsonId]['type'];
              const trimmedIT = trimItemType(itemType)
              return {
                market_name: itemDescription.market_name,
                itemType: trimmedIT
              };
            } else {
              console.log('item description not found')
              return null;
            }
          };
        })
        if (plusMinus === '+') {
          plusItems.push(...items);
        } else if (plusMinus === '-') {
          minusItems.push(...items);
        }
      });
      
      scrapeData.push({
        date,
        timestamp,
        description,
        tradeName,
        plusItems,
        minusItems
      });
    });
    await saveJson(scrapeData);
    return { scrapeData, cursor, cursorFound};
  };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await browser.close();
  }};

module.exports = { scrapeUInfo, scrapeIH };