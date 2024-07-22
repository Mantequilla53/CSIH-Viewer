const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const scraper = require('./scraper');
const fs = require('fs');

let scrapingInProgress = false;

//const outputDirectory = path.join(process.resourcesPath, 'output');
const outputDirectory = './output';

function getJsonFiles() {
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
  }
  return fs.readdirSync(outputDirectory).filter(file => path.extname(file) === '.json');
}

function sendSData(mainWindow, data) {
  if (data.length > 0) {
    const dateElement = `${data[0].d}-${data[0].t}`;
    mainWindow.webContents.send('scrape-date', dateElement);
  }
  mainWindow.webContents.send('scraped-data', JSON.stringify(data));
}

function generateFilePath() {
  const now = new Date();
  return `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
}

async function startScraping(mainWindow, cookie, userId, scrapedDataFilePath) {
  scrapingInProgress = true;
  let s, time, time_frac = 0;

  const purchasedItems = await scraper.scrapeMarketHistory(cookie);
  
  while (scrapingInProgress) {
    try {
      const startTime = Date.now();
      const { scrapeData, cursor } = await scraper.scrapeIH(userId.finalUrl, cookie, s, time, time_frac, purchasedItems);
      
      let existingJson = JSON.parse(fs.readFileSync(scrapedDataFilePath, 'utf-8'));
      existingJson.scrapedData.push(scrapeData);
      fs.writeFileSync(scrapedDataFilePath, JSON.stringify(existingJson, null, 2));
      
      sendSData(mainWindow, scrapeData);
      
      if (cursor) {
        ({ s, time, time_frac } = cursor);
      } else {
        scrapingInProgress = false;
      }
      
      const endTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, Math.max(5000 - (endTime - startTime), 0)));
    } catch (error) {
      console.error('Error in scrape loop:', error);
      scrapingInProgress = false;
    }
  }
  
  mainWindow.webContents.send('scrape-complete');
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
  await mainWindow.loadFile(path.join(__dirname, 'renderer.html'));

  mainWindow.webContents.send('json-files', getJsonFiles());
  
  ipcMain.on('process-output', (event, jsonData) => {
    const processedData = jsonData.scrapedData.flat();
    mainWindow.webContents.send('scraped-data', JSON.stringify(processedData));
  });

  ipcMain.on('set-cookie', async (event, cookie) => {
    try {
      const userId = await scraper.scrapeUInfo(cookie);
      event.reply('scrape-response', userId.username, userId.avatarUrl);
      
      const outputDateInfo = generateFilePath();
      const scrapedDataFilePath = path.join(outputDirectory, `${outputDateInfo}.json`);
      
      const jsonOutputData = {
        outputInfo: {
          userId: userId.finalUrl,
          user_imgSrc: userId.avatarUrl,
          username: userId.username,
          outputDate: outputDateInfo
        },
        scrapedData: []
      };
      fs.writeFileSync(scrapedDataFilePath, JSON.stringify(jsonOutputData, null, 2));

      startScraping(mainWindow, cookie, userId, scrapedDataFilePath);
    } catch (error) {
      console.error('Cookie error:', error);
    }
  });

  ipcMain.on('request-json-files', (event) => {
    const jsonFiles = getJsonFiles();
    event.reply('json-files', jsonFiles);
  });

  ipcMain.on('stop-scraping', () => {
    scrapingInProgress = false;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});