const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

const { showTradeContent } = require('./components/trade');
const { showCasePackageContent } = require('./components/u_case_package');
const { showStickerCapContent } = require('./components/u_capsule');
const { showCraftedContent } = require('./components/crafted');
const { showContainerContent } = require('./components/u_container');
const { showARContent } = require('./components/combined_ar');
const { showCaseDropContent } = require('./components/drop_case');
const { showWeaponDropContent } = require('./components/drop_weapon');
const { showDefaultCards } = require('./components/default_cards');
const { showHome } = require('./components/home');
const { showSwapContent } = require('./components/stattrak');

const $ = (id) => document.getElementById(id);
const tabContainer = $('tab-container');
const contentContainer = $('content-container');
const tabStatsContainer = $('tab-stats');
const fileSelector = $('file-selector');
const userId = $('userId');
const scrapeDate = $('scrape-date');
const avatar = $('avatarImg');
const inputField = $('input-field');
const submitButton = $('submit-button');

let selectedFileName = '';
let existingData = {};
let currentTab = null;

const groupPatterns = {
  'Unlocked': ['Unlocked a'],
  'Earned': ['Earned a', 'Earned'],
  'Market': ['Listed on Community Market', 'Purchased on Community Market', 'Canceled listing on Community Market', 'Listed on the Steam Community Market', 'Received from the Community Market'],
  'Misc.': ['Received a gift', 'Deleted', 'Leveled up a challenge coin', 'Swapped StatTrak', 'Graffiti Opened', 'Graffiti Used']
};

const form = document.querySelector('form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const userInput = inputField.value;
  if (submitButton.textContent === 'Submit') {
    ipcRenderer.send('set-cookie', userInput);
    submitButton.textContent = 'Stop Scraping';
    inputField.disabled = true;
    fileSelector.disabled = true;
  } else {
    ipcRenderer.send('stop-scraping');
    submitButton.textContent = 'Submit';
    inputField.disabled = false;
    fileSelector.disabled = false;
    scrapeDate.innerHTML = 'Stopped Scraping';
  }
});

ipcRenderer.on('json-files', (event, jsonFiles) => {
  if (jsonFiles.length > 0) {
    fileSelector.style.display = 'inline-block';
    
    fileSelector.innerHTML = '<option value="">Select Output File</option>';
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
  clearContent();
  tabContainer.innerHTML = '';
  userId.innerHTML = '';
  scrapeDate.innerHTML = '';
  avatar.innerHTML = '';

  existingData = {};

  selectedFileName = event.target.value;
  if (selectedFileName) {
    submitButton.disabled = true;
    inputField.disabled = true;
    const dumpDirectory = path.join(process.resourcesPath, 'dump');
    const filePath = path.join(dumpDirectory, selectedFileName);
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading JSON file:', err);
        return;
      }
      try {
        const jsonData = JSON.parse(data);
        const { username, user_imgSrc, dumpDate} = jsonData.dumpInfo;
        userId.textContent = `${username}`;
        scrapeDate.textContent = `Last Dump Update: ${dumpDate}`;
        avatar.innerHTML = `<img src="${user_imgSrc}" alt="User Avatar">`;
        ipcRenderer.send('process-dump', jsonData);
      } catch (error) {
        console.error('Error parsing JSON file:', error);
      }
    });
  } else {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit';
    inputField.disabled = false;
    showHome();
  }
});

ipcRenderer.on('scrape-response', (event, userName, avatarImg) => {
  userId.innerHTML = userName;
  avatar.innerHTML = `<img src="${avatarImg}" alt="User Avatar">`;
});


ipcRenderer.on('scrape-date', (event, date) => {
  scrapeDate.innerHTML = `Currently Scraping: ${date}`;
});

ipcRenderer.on('scrape-complete', () => {
  submitButton.textContent = 'Submit';
  inputField.disabled = false;
  fileSelector.disabled = false;
  scrapeDate.innerHTML = 'Scraping Complete';
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

showHome();

function clearContent() {
  contentContainer.innerHTML = '';
  tabStatsContainer.innerHTML = '';
}

function showTabContent(description) {
  clearContent();
  const entries = existingData[description];
    
  if (description === 'Unlocked a sticker capsule') {showStickerCapContent(description, entries, contentContainer, tabStatsContainer)} 
  else if (description === 'Unlocked a container'){showContainerContent(description, entries, contentContainer, tabStatsContainer)}
  else if (['Unlocked a case', 'Unlocked a package'].includes(description)){showCasePackageContent(description, entries, contentContainer, tabStatsContainer)}
  else if (description === 'Traded With') {showTradeContent(description, entries, contentContainer, tabStatsContainer)} 
  else if (description === 'Trade Up') {showCraftedContent(description, entries, contentContainer, tabStatsContainer)} 
  else if (description === 'Earned a weapon drop'){showWeaponDropContent(description, entries, contentContainer, tabStatsContainer)}
  else if (description === 'Earned a case drop'){showCaseDropContent(description, entries, contentContainer, tabStatsContainer)}
  else if (/^Swapped StatTrak\u2122? values$/.test(description)){showSwapContent(description, entries, contentContainer, tabStatsContainer)}
  else if (['Sticker applied/removed', 'Name Tag applied/removed'].includes(description)){showARContent(description, entries, contentContainer, tabStatsContainer)}
  else if (['Listed on Community Market','Canceled listing on Community Market','Purchased on Community Market','Received a gift', 'Deleted',
    'Graffiti Used', 'Graffiti Opened', 'Earned a graffiti drop', 'Earned', 'Earned a souvenir drop', 'Used', 
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