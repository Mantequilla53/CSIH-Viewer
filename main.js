const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const scraper = require('./scraper');
const fs = require('fs');

//find out if there is a way to have a default value for the initial scrape
let s = 0;
let time = 0;
let time_frac = 0;

function getJsonFiles() {
  const resourcesPath = process.resourcesPath;
  const dumpDirectory = path.join(resourcesPath, 'dump');

  if (!fs.existsSync(dumpDirectory)) {
    fs.mkdirSync(dumpDirectory);
  }
  
  const files = fs.readdirSync(dumpDirectory);
  const jsonFiles = files.filter(file => path.extname(file) === '.json');
  return jsonFiles;
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
    }
  });
  mainWindow.maximize();
mainWindow.loadFile(path.join(__dirname, 'renderer.html'));

mainWindow.webContents.on('did-finish-load', () => {
  const jsonFiles = getJsonFiles();
  mainWindow.webContents.send('json-files', jsonFiles);
});

function sendSData(data, includeDateElement = false) {
  const newData = JSON.stringify(data);
  if (includeDateElement && data.length > 0) {
    const firstEntry = data[0];
    const dateElement = `${firstEntry.d}-${firstEntry.t}`;
    mainWindow.webContents.send('scrape-date', dateElement);
  }
  mainWindow.webContents.send('scraped-data', newData);
}

ipcMain.on('process-dump', (event, jsonData) => {
  const processedData = [];
  
  const scrapedData = jsonData.scrapedData
  scrapedData.forEach((group) => {
    group.forEach((entry) => {
      const { d, t, description, tradeName, plusItems, minusItems } = entry;
      if (d && t && description) {
        processedData.push({ d, t, description, tradeName, plusItems, minusItems });
      }
    });
  });
  
  sendSData(processedData);
});
ipcMain.on('set-cookie', async (event, cookie) => {
  try {
    const userId = await scraper.scrapeUInfo(cookie);
    event.reply('scrape-response', userId.username, userId.avatarUrl);
    const dumpDateInfo = generateFilePath();
    const resourcesPath = process.resourcesPath;
    const dumpDirectory = path.join(resourcesPath, 'dump');
    const scrapedDataFilePath = path.join(dumpDirectory, `${dumpDateInfo}.json`);
    const jsonDumpData = {
      dumpInfo: {
        userId: userId.finalUrl,
        user_imgSrc: userId.avatarUrl,
        username: userId.username,
        dumpDate: dumpDateInfo
      },
      scrapedData: []
    };
    fs.writeFileSync(scrapedDataFilePath, JSON.stringify(jsonDumpData, null));

    let cursorFound = true;

    const startScraping = async () => {
      
      const purchasedItems = await scraper.scrapeMarketHistory(cookie);
      while (cursorFound) {
        try {
          const startTime = Date.now();
          const { scrapeData, cursor, cursorFound: newCursorFound } = await scraper.scrapeIH(userId.finalUrl, cookie, s, time, time_frac, purchasedItems);
          
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
          sendSData(scrapeData, true);
          
          if (newCursorFound) {
            ({ s, time, time_frac } = cursor);
          } else {
            mainWindow.webContents.send('scrape-complete');
            console.log('scrape done');
          }
          
          cursorFound = newCursorFound;
          
          const endTime = Date.now();
          const scrapeDuration = endTime - startTime;
          
          if (cursorFound) {
            const waitTime = Math.max(6000 - scrapeDuration, 0);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            console.log('Scraping completed. No more cursor found.');
          }
        } catch (error) {
          console.error('Error in scrape loop:', error);
        }
      }
    };

    startScraping();

    ipcMain.on('stop-scraping', () => {
      cursorFound = false;
      console.log('Scraping stopped by user.');
    });
  } catch (error) {
    console.error('cookie error', error);
  }
});
}

const generateFilePath = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const filePath = `${day}-${month}-${year}_${hours}-${minutes}`;
  return filePath;
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // Handle macOS dock events...
  });
});