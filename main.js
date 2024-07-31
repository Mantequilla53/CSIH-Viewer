const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const scraper = require('./scraper');
const fs = require('fs');

let scrapingInProgress = false;

const outputDirectory = path.join(process.resourcesPath, 'output');
//const outputDirectory = path.join(__dirname, 'output');

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

function sanitizeFileName(fileName) {
  return fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
                 .replace(/^\.+/, '')
                 .replace(/\s+/g, '_')
                 .trim();
}

function generateUniqueFileName(baseName) {
  let fileName = `${baseName}.json`;
  let counter = 1;
  while (fs.existsSync(path.join(outputDirectory, fileName))) {
    fileName = `${baseName}_${counter}.json`;
    counter++;
  }
  return fileName;
}

function generateFileDate() {
  const now = new Date();
  return `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
}

async function updateExistingFile(mainWindow, cookie, selectedFile) {
  const filePath = path.join(outputDirectory, selectedFile);
  const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  const userId = fileContent.outputInfo.userId;
  const firstEntry = fileContent.scrapedData[0][0];
  
  scrapingInProgress = true;
  let s, time, time_frac = 0;

  const purchasedItems = await scraper.scrapeMarketHistory(cookie);
  
  let newScrapedData = [];

  while (scrapingInProgress) {
    try {
      const { scrapeData, cursor } = await scraper.scrapeIH(userId, cookie, s, time, time_frac, purchasedItems);
      
      if (scrapeData.length === 0) {
        console.log('Received empty scrapeData, skipping this batch');
        if (cursor) {
          ({ s, time, time_frac } = cursor);
          continue;
        } else {
          scrapingInProgress = false;
          break;
        }
      }

      const stopIndex = scrapeData.findIndex(entry => 
        entry.d === firstEntry.d && 
        entry.t === firstEntry.t && 
        entry.desc === firstEntry.desc
      );
      
      if (stopIndex !== -1) {
        const relevantData = scrapeData.slice(0, stopIndex);
        if (relevantData.length > 0) {
          newScrapedData.push(relevantData);
          sendSData(mainWindow, relevantData);
        }
        scrapingInProgress = false;
      } else {
        newScrapedData.push(scrapeData);
        sendSData(mainWindow, scrapeData);
      }
      
      if (cursor && scrapingInProgress) {
        ({ s, time, time_frac } = cursor);
      } else {
        scrapingInProgress = false;
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('Error in update scrape loop:', error);
      scrapingInProgress = false;
    }
  }
  
  if (newScrapedData.length > 0) {
    fileContent.scrapedData = newScrapedData.concat(fileContent.scrapedData);
    fs.writeFileSync(filePath, JSON.stringify(fileContent, null));
  } else {
    console.log('No new data to add to the file');
  }
  
  mainWindow.webContents.send('update-complete');
}

async function startScraping(mainWindow, cookie, userId, scrapedDataFilePath) {
  scrapingInProgress = true;
  let s, time, time_frac = 0;

  const purchasedItems = await scraper.scrapeMarketHistory(cookie);
  
  while (scrapingInProgress) {
    try {
      const startTime = Date.now();
      const { scrapeData, cursor } = await scraper.scrapeIH(userId.finalUrl, cookie, s, time, time_frac, purchasedItems);
      
      if (scrapeData && scrapeData.length > 0) {
        let existingJson = JSON.parse(fs.readFileSync(scrapedDataFilePath, 'utf-8'));
        existingJson.scrapedData.push(scrapeData);
        fs.writeFileSync(scrapedDataFilePath, JSON.stringify(existingJson, null));
        
        sendSData(mainWindow, scrapeData);
      } else {
        console.log('Received empty scrapeData, skipping this batch');
      }
      
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
    },
  });
  mainWindow.setMenu(null);
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
      
      const outputDateInfo = generateFileDate();
      const sanitizedUsername = sanitizeFileName(userId.username);
      const uniqueFileName = generateUniqueFileName(sanitizedUsername);
      const scrapedDataFilePath = path.join(outputDirectory, uniqueFileName);
      
      const jsonOutputData = {
        outputInfo: {
          userId: userId.finalUrl,
          user_imgSrc: userId.avatarUrl,
          username: userId.username,
          outputDate: outputDateInfo
        },
        scrapedData: []
      };
      fs.writeFileSync(scrapedDataFilePath, JSON.stringify(jsonOutputData, null));
      startScraping(mainWindow, cookie, userId, scrapedDataFilePath);
    } catch (error) {
      console.error('Cookie error:', error);
    }
  });

  ipcMain.on('update-output', (event, cookie, selectedFile) => {
    updateExistingFile(mainWindow, cookie, selectedFile)
      .catch(error => {
        console.error('Error updating output:', error);
        event.reply('update-error', error.message);
      });
  });

  ipcMain.on('request-json-files', (event) => {
    const jsonFiles = getJsonFiles();
    event.reply('json-files', jsonFiles);
  });

  ipcMain.on('open-file-explorer', (event) => {
    if (fs.existsSync(outputDirectory)) {
      shell.openPath(outputDirectory);
      event.reply('file-explorer-opened', true);
    } else {
      event.reply('file-explorer-opened', false);
    }
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