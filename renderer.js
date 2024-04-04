const { ipcRenderer } = require('electron');
const { showUnlockedCaseContent } = require('./unlockedCase');
const { showTradeContent } = require('./trade');
const { showCapContainerContent } = require('./capsule_container');

let existingData = {};
let currentTab = null;

const form = document.querySelector('form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const userInput = document.querySelector('#input-field').value;
  console.log('received:', userInput)
  ipcRenderer.send('set-cookie', userInput);
});

const dropArea = document.getElementById('drop-area');

dropArea.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.stopPropagation();
});

dropArea.addEventListener('drop', (event) => {
  event.preventDefault();
  event.stopPropagation();

  const file = event.dataTransfer.files[0];
  if (file && file.type === 'application/json') {
    const reader = new FileReader();
    reader.onload = () => {
      const jsonData = JSON.parse(reader.result);
      ipcRenderer.send('json-file-dropped', jsonData);
    };
    reader.readAsText(file);
  }
});

ipcRenderer.on('scrape-response', (event, item) => {
  console.log(item);
  const userId = document.getElementById('userId');
  userId.innerHTML = item;
});

ipcRenderer.on('scrape-started', () => {
  document.getElementById('stopScraping').style.display = 'block';
});

document.getElementById('stopScraping').addEventListener('click', () => {
  ipcRenderer.send('stop-scraping');
});

ipcRenderer.on('scraped-data', (event, newData) => {
  newData.forEach((entry) => {
    const { date, timestamp, plusItems, minusItems, tradeName, description } = entry;
    if (!existingData[description]) {
      existingData[description] = [];
    }
    existingData[description].push({ date, timestamp, plusItems, minusItems, tradeName });
  });

  const tabContainer = document.getElementById('tab-container');

  tabContainer.innerHTML = '';

  Object.keys(existingData).forEach((description) => {
    const tabButton = document.createElement('button');
    tabButton.textContent = description;
    tabButton.addEventListener('click', () => {
      currentTab = description;
      showTabContent(description);
    });
    tabContainer.appendChild(tabButton);
  });

  function showTabContent(description) {
    const contentContainer = document.getElementById('content-container');
    contentContainer.innerHTML = '';

    const entries = existingData[description];
    if (description === 'Unlocked a case') {
      showUnlockedCaseContent(description, entries, contentContainer);
    } else if (description === 'You traded with') {
      showTradeContent(description, entries, contentContainer);
    }
    else if (description === 'Unlocked a sticker capsule' || description === 'Unlocked a container') {
      showCapContainerContent(description, entries, contentContainer);
    }

      entries.forEach((entry) => {
      const { date, timestamp, plusItems, minusItems, tradeName } = entry;
      const entryElement = document.createElement('div');
      entryElement.innerHTML = `
        <p>Date: ${date}</p>
        <p>Timestamp: ${timestamp}</p>
        ${tradeName ? `<p>Trade Name: ${tradeName}</p>` : ''}
        ${plusItems.length > 0 ? `
          <p>Given to Inventory:</p>
          <ul>
            ${plusItems.map(item => `<li>${item.market_name} - - ${item.itemType}</li>`).join('')}
          </ul>
      ` : ''}
      ${minusItems.length > 0 ? `
          <p>Taken from Inventory:</p>
          <ul>
            ${minusItems.map(item => `<li>${item.market_name} - - ${item.itemType}</li>`).join('')}
          </ul>
      ` : ''} 
        <hr>
        `;
      contentContainer.appendChild(entryElement);
    });
  }
  if (currentTab && existingData[currentTab]) {
    showTabContent(currentTab);
  } else if (Object.keys(existingData).length > 0) {
    currentTab = Object.keys(existingData)[0];
    showTabContent(currentTab);
  }
});