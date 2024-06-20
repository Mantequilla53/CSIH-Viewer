const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

const { showTradeContent } = require('./components/trade');
const { showPackageContent } = require('./components/capsule_container');
const { showCaseContent } = require('./components/newUnlockedCase');
const { showStickerCapContent } = require('./components/stickerCapsule');
const { showCraftedContent } = require('./components/crafted');
const { showOperationContent } = require('./components/operationDrops');
const { showContainerContent } = require('./components/container');
const { showARContent } = require('./components/combined_ar');
const { showCaseDropContent } = require('./components/case_drop');
const { showDefaultCards } = require('./components/default_cards');

const $ = (id) => document.getElementById(id);
const tabContainer = $('tab-container');
const contentContainer = $('content-container');
const tabStatsContainer = $('tab-stats');
const fileSelector = $('file-selector');
const user_id = $('dump-user-id');
const dump_date = $('dump-date');
const userId = $('userId');


let selectedFileName = '';
let existingData = {};
let currentTab = null;

const groupPatterns = {
  'Unlocked': ['Unlocked a'],
  'Earned': ['Earned a', 'Earned'],
  'Market': ['Listed on Community Market', 'Purchased on Community Market', 'Canceled listing on Community Market', 'Listed on the Steam Community Market', 'Received from the Community Market'],
  'Misc.': ['Received a gift', 'Deleted', 'Leveled up a challenge coin', 'Swapped StatTrak', 'Graffiti']
};

const form = document.querySelector('form');
const submitButton = document.querySelector('#submit-button');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const userInput = document.querySelector('#input-field').value;
  console.log('received:', userInput);
  ipcRenderer.send('set-cookie', userInput);
});

ipcRenderer.on('json-files', (event, jsonFiles) => {
  if (jsonFiles.length > 0) {
    fileSelector.style.display = 'inline-block';
    fileSelector.innerHTML = '<option value="">Select JSON Dump</option>';
    jsonFiles.forEach(file => {
      const option = document.createElement('option');
      option.value = file;
      option.textContent = file;
      if (file === selectedFileName) {
        option.selected = true;
      }
      fileSelector.appendChild(option);
    });
  } else {
    fileSelector.style.display = 'none';
  }
});

fileSelector.addEventListener('change', (event) => {
  contentContainer.innerHTML = '';
  tabStatsContainer.innerHTML = '';
  tabContainer.innerHTML = '';
  user_id.innerHTML = '';
  dump_date.innerHTML = '';

  existingData = {};

  selectedFileName = event.target.value;
  $('selected-file').textContent = selectedFileName;
  console.log(selectedFileName);
  if (selectedFileName) {
    submitButton.textContent = 'Update File';
    const dumpDirectory = path.join(process.resourcesPath, 'dump');
    const filePath = path.join(dumpDirectory, selectedFileName);
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading JSON file:', err);
        return;
      }
      try {
        const jsonData = JSON.parse(data);
        const { userId, dumpDate} = jsonData.dumpInfo;
        user_id.textContent = `UserID: ${userId}`;
        dump_date.textContent = `Last Dump Update: ${dumpDate}`;
        ipcRenderer.send('process-dump', jsonData);
      } catch (error) {
        console.error('Error parsing JSON file:', error);
      }
    });
  } else {
    submitButton.textContent = 'Submit';
    console.log('none');
  }
});

ipcRenderer.on('scrape-response', (event, item) => {
  userId.innerHTML = item;
});

ipcRenderer.on('scrape-started', () => {
  $('stopScraping').style.display = 'block';
});

$('stopScraping').addEventListener('click', () => {
  $('scrape-date').innerHTML = '';
  ipcRenderer.send('stop-scraping');
  $('scrape-date').innerHTML = 'Stopped Scraping';
});

ipcRenderer.on('scrape-date', (event, date) => {
  $('scrape-date').innerHTML = `Currently Scraping: ${date}`;
});

ipcRenderer.on('scraped-data', (event, newDataString) => {
  const newData = JSON.parse(newDataString);
  newData.forEach((entry) => {
    const { d, t, plusItems, minusItems, tradeName, description } = entry;
    if (!existingData[description]) {
      existingData[description] = [];
    }
    existingData[description].push({ d, t, plusItems, minusItems, tradeName });
  });

  updateTabs();
});

function showTabContent(description) {
  contentContainer.innerHTML = '';
  tabStatsContainer.innerHTML = '';
  const entries = existingData[description];
    
  if (description === 'Unlocked a case') {showCaseContent(description, entries, contentContainer, tabStatsContainer)} 
  else if (description === 'Unlocked a sticker capsule') {showStickerCapContent(description, entries, contentContainer, tabStatsContainer)} 
  else if (description === 'Unlocked a package') {showPackageContent(description, entries, contentContainer, tabStatsContainer)} 
  else if (description === 'Unlocked a container'){showContainerContent(description, entries, contentContainer, tabStatsContainer)}
  
  else if (description === 'Traded With') {showTradeContent(description, entries, contentContainer, tabStatsContainer)} 
  else if (description === 'Trade Up') {showCraftedContent(description, entries, contentContainer, tabStatsContainer)} 
  else if (description === 'Earned a case drop'){showCaseDropContent(description, entries, contentContainer, tabStatsContainer)}

  else if (description === 'Sticker applied/removed'){showARContent(description, entries, contentContainer, tabStatsContainer, 'Sticker')}
  else if (description === 'Name Tag applied/removed'){showARContent(description, entries, contentContainer, tabStatsContainer, 'Name Tag')}

  //else if (description === 'Operation Reward'){showOperationContent(description, entries, contentContainer, tabStatsContainer)}
  else if (['Listed on Community Market','Canceled listing on Community Market','Purchased on Community Market','Received a gift', 'Deleted',
    'Graffiti Used', 'Graffiti Opened', 'Earned a graffiti drop', 'Earned', 'Earned a souvenir drop', 'Earned a weapon drop', 'Used', 
    'Purchased from the store', 'Operation Reward'].includes(description))
    {showDefaultCards(description, entries, contentContainer, tabStatsContainer)}
  else {
    entries.forEach((entry) => {
      const { d, t, plusItems, minusItems, tradeName } = entry;
      const entryElement = document.createElement('div');
      entryElement.innerHTML = `
        <p>Date: ${d}</p>
        <p>Time: ${t}</p>
        ${tradeName ? `<p>${tradeName}</p>` : ''}
        ${plusItems.length > 0 ? `
          <p>Given to Inventory:</p>
          <ul>
            ${plusItems.map(item => `<li>${item.market_name}</li>`).join('')}
          </ul>
        ` : ''}
        ${minusItems.length > 0 ? `
          <p>Taken from Inventory:</p>
          <ul>
            ${minusItems.map(item => `<li>${item.market_name}</li>`).join('')}
          </ul>
        ` : ''} 
        <hr>
        `;
      contentContainer.appendChild(entryElement);
    });
  }
}

function updateTabs() {
  const groupedTabs = {};
  
  Object.keys(existingData).forEach((description) => {
    let groupName = description;
      
    for (const [group, patterns] of Object.entries(groupPatterns)) {
      if (patterns.some(pattern => description.startsWith(pattern))) {
        groupName = group;
        break;
      }
    }
  
    if (!groupedTabs[groupName]) {
      groupedTabs[groupName] = [];
    }
    groupedTabs[groupName].push(description);
  });
  
  tabContainer.innerHTML = '';
  
  const sortedGroupNames = Object.keys(groupedTabs).sort((a, b) => {
    const aIsGrouped = Object.keys(groupPatterns).includes(a);
    const bIsGrouped = Object.keys(groupPatterns).includes(b);
    if (aIsGrouped && !bIsGrouped) return -1;
    if (!aIsGrouped && bIsGrouped) return 1;
    return 0;
  });
  
  sortedGroupNames.forEach((groupName) => {
    const descriptions = groupedTabs[groupName];
    if (descriptions.length === 1) {
      const tabButton = document.createElement('button');
      tabButton.textContent = descriptions[0];
      tabButton.addEventListener('click', () => {
        currentTab = descriptions[0];
        showTabContent(descriptions[0]);
      });
      tabContainer.appendChild(tabButton);
    } else {
      const dropdownContainer = document.createElement('div');
      dropdownContainer.classList.add('dropdown');
  
      const dropdownButton = document.createElement('button');
      dropdownButton.textContent = groupName;
      dropdownButton.classList.add('dropdown-button');
      dropdownContainer.appendChild(dropdownButton);
  
      const dropdownContent = document.createElement('div');
      dropdownContent.classList.add('dropdown-content');
      descriptions.forEach(description => {
        const tabButton = document.createElement('button');
        tabButton.textContent = description;
        tabButton.addEventListener('click', () => {
          currentTab = description;
          showTabContent(description);
        });
        dropdownContent.appendChild(tabButton);
      });
      dropdownContainer.appendChild(dropdownContent);
  
      tabContainer.appendChild(dropdownContainer);
    }
  });
  
  if (currentTab && existingData[currentTab]) {
    showTabContent(currentTab);
  } else if (Object.keys(existingData).length > 0) {
    currentTab = Object.keys(existingData)[0];
    showTabContent(currentTab);
  }
}