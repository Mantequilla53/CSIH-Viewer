const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const scraper = require('./scraper');
const { userInfo } = require('os');
const { start } = require('repl');
const fs = require('fs');

/*changes
-coupons to be removed from purchased from store tab(maybe more tabs)
*/
const url = 'https://steamcommunity.com/my';
let s = 0;
let time = 0;
let time_frac = 0;
let cookie;

async function createWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

mainWindow.loadFile(path.join(__dirname, 'renderer.html'));

function sendSData(data) {
  mainWindow.webContents.send('scraped-data', data);
}

ipcMain.on('json-file-dropped', (event, jsonData) => {
  const processedData = processJsonData(jsonData);
  console.log(processedData)
  sendSData(processedData);
});

function processJsonData(jsonData) {
  const processedData = [];

  jsonData.forEach((group) => {
    group.forEach((entry) => {
      const { date, timestamp, description, tradeName, plusItems, minusItems } = entry;
      if (date && timestamp && description) {
        processedData.push({ date, timestamp, description, tradeName, plusItems, minusItems });
      }
    });
  });

  return processedData;
}

const handleScrapedData = async (cookie) => {
  try {
    const { scrapeData, cursor, cursorFound } = await scraper.scrapeIH( userId, cookie, s, time, time_frac);
    sendSData(scrapeData);
    if (cursorFound) {
      s = cursor.s;
      time = cursor.time;
      time_frac = cursor.time_frac;
    } else {
      console.log('scrape done');
    }
    return cursorFound;
  } catch (error) {
    console.error('Error handling scraped data:', error);
  }
};
  
ipcMain.on('set-cookie', async (event, receivedCookie) => {
  try {
    cookie = receivedCookie;
    userId = await scraper.scrapeUInfo(url, receivedCookie);
    event.reply('scrape-response', userId);
    const startScraping = () => {
      scrapeInterval = setInterval(async () => {
        try {
          const cursorFound = await handleScrapedData(cookie);
          if (!cursorFound) {
            clearInterval(scrapeInterval);
            console.log('Scraping completed. No more cursor found.');
          }
        } catch (error) {
          console.error('Error in scrape interval:', error);
        }
      }, 4000);
    };
  startScraping();
  event.reply('scrape-started');
  ipcMain.on('stop-scraping', () => {
    clearInterval(scrapeInterval);
    cursorFound = false;
    console.log('Scraping stopped by user.');
  });
  } catch (error) {
    console.error('cookie error', error);
  }
});
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // Handle macOS dock events...
  });
});