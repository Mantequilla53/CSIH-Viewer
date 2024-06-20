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

const handleScrapedData = async (userId, cookie, scrapedDataFilePath) => {
  try {
    const { scrapeData, cursor, cursorFound } = await scraper.scrapeIH(userId, cookie, s, time, time_frac, scrapedDataFilePath);
    
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
    if (cursorFound) {
      ({ s, time, time_frac } = cursor);
    } else {
      mainWindow.webContents.send('scrape-date', 'Scrape Finished');
    }
    return cursorFound;
  } catch (error) {
    mainWindow.webContents.send('scrape-date', error);
  }
};

ipcMain.on('set-cookie', async (event, cookie) => {
  try {
    const userId = await scraper.scrapeUInfo(cookie);
    event.reply('scrape-response', userId);
    const dumpDateInfo = generateFilePath();
    const resourcesPath = process.resourcesPath;
    const dumpDirectory = path.join(resourcesPath, 'dump');
    const scrapedDataFilePath = path.join(dumpDirectory, `${dumpDateInfo}.json`);
    const jsonDumpData = {
      dumpInfo: {
        userId: userId,
        dumpDate: dumpDateInfo
      },
      scrapedData: []
    };
    fs.writeFileSync(scrapedDataFilePath, JSON.stringify(jsonDumpData, null));

    let cursorFound = true;

    const startScraping = async () => {
      while (cursorFound) {
        try {
          cursorFound = await handleScrapedData(userId, cookie, scrapedDataFilePath);
          if (cursorFound) {
            await new Promise(resolve => setTimeout(resolve, 4000));
          }
        } catch (error) {
          mainWindow.webContents.send('scrape-date', 'error in scrape loop');
        }
      }
    };

    startScraping();
    event.reply('scrape-started');

    ipcMain.on('stop-scraping', () => {
      cursorFound = false;
    });
  } catch (error) {
    mainWindow.webContents.send('scrape-date', 'cookie error');
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