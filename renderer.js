const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

const components = {
  trade: require('./components/trade'),
  u_case_package: require('./components/u_case_package'),
  u_capsule: require('./components/u_capsule'),
  crafted: require('./components/crafted'),
  u_container: require('./components/u_container'),
  combined_ar: require('./components/combined_ar'),
  drop_case: require('./components/drop_case'),
  drop_weapon: require('./components/drop_weapon'),
  default_cards: require('./components/default_cards'),
  home: require('./components/home'),
  stattrak: require('./components/stattrak'),
  basic: require('./components/basic')
};

const $ = (id) => document.getElementById(id);
const elements = {
  tabContainer: $('tab-container'),
  contentContainer: $('content-container'),
  tabStatsContainer: $('tab-stats'),
  fileSelector: $('file-selector'),
  userId: $('userId'),
  scrapeDate: $('scrape-date'),
  avatar: $('avatarImg'),
  inputField: $('input-field'),
  submitButton: $('submit-button'),
  form: document.querySelector('form')
};

let selectedFileName = '';
let existingData = {};
let currentTab = null;

const groupPatterns = {
  'Unlocked': ['Unlocked a'],
  'Earned': ['Earned a', 'Earned'],
  'Market': ['Listed', 'Purchased on Community Market', 'Canceled listing on Community Market', 'Received from the Community Market'],
  'Misc.': ['Received a gift', 'Deleted', 'Leveled up a challenge coin', 'Swapped StatTrak', 'Graffiti']
};

function handleSubmit(event) {
  event.preventDefault();
  if (elements.submitButton.textContent === 'Submit') {
    const userInput = elements.inputField.value;
    elements.inputField.value = '';
    if (userInput.includes('sessionid=')){
      clearContent();
      ipcRenderer.send('set-cookie', userInput);
      elements.submitButton.textContent = 'Stop Scraping';
      elements.inputField.disabled = true;
      elements.fileSelector.disabled = true;
    } else {
      showPopup('Invalid cookie. Please make sure your input contains "sessionid=".');
    }
  } else {
    ipcRenderer.send('stop-scraping');
    elements.submitButton.textContent = 'Submit';
    elements.inputField.disabled = false;
    elements.fileSelector.disabled = false;
    elements.scrapeDate.innerHTML = 'Stopped Scraping';
    requestJsonFiles();
  }
}

function handleFileSelect(event) {
  clearContent();
  selectedFileName = event.target.value;
  if (selectedFileName) {
    elements.submitButton.disabled = true;
    elements.inputField.disabled = true;
    const outputDirectory = './output';
    const filePath = path.join(outputDirectory, selectedFileName);
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading JSON file:', err);
        return;
      }
      try {
        const jsonData = JSON.parse(data);
        const { username, user_imgSrc, outputDate } = jsonData.outputInfo;
        elements.userId.textContent = username;
        elements.scrapeDate.textContent = `Last Output Update: ${outputDate}`;
        elements.avatar.innerHTML = `<img src="${user_imgSrc}" alt="User Avatar">`;
        ipcRenderer.send('process-output', jsonData);
      } catch (error) {
        console.error('Error parsing JSON file:', error);
      }
    });
  } else {
    elements.submitButton.disabled = false;
    elements.submitButton.textContent = 'Submit';
    elements.inputField.disabled = false;
    components.home.showHome(elements.contentContainer, elements.tabStatsContainer);
  }
}

function updateFileSelector(jsonFiles) {
  elements.fileSelector.style.display = jsonFiles.length > 0 ? 'inline-block' : 'none';
  if (jsonFiles.length > 0) {
    elements.fileSelector.innerHTML = '<option value="">Select Output File</option>' +
      jsonFiles.map(file => `<option value="${file}" ${file === selectedFileName ? 'selected' : ''}>${file}</option>`).join('');
  }
}

function requestJsonFiles() {
  ipcRenderer.send('request-json-files');
}

function showPopup(message) {
  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.innerHTML = `
    <div class="popup-content">
      <p>${message}</p>
      <button onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `;
  document.body.appendChild(popup);
}

function clearContent() {
  elements.contentContainer.innerHTML = '';
  elements.tabStatsContainer.innerHTML = '';
  elements.tabContainer.innerHTML = '';
  elements.userId.innerHTML = '';
  elements.scrapeDate.innerHTML = '';
  elements.avatar.innerHTML = '';
  existingData = {};
}

function showTabContent(desc) {
  elements.contentContainer.innerHTML = '';
  elements.tabStatsContainer.innerHTML = '';
  const entries = existingData[desc];
  
  const componentMap = {
    'Unlocked a sticker capsule': components.u_capsule.showStickerCapContent,
    'Unlocked a container': components.u_container.showContainerContent,
    'Unlocked a case': components.u_case_package.showCasePackageContent,
    'Unlocked a package': components.u_case_package.showCasePackageContent,
    'Traded With': components.trade.showTradeContent,
    'Trade Up': components.crafted.showCraftedContent,
    'Earned a weapon drop': components.drop_weapon.showWeaponDropContent,
    'Earned a case drop': components.drop_case.showCaseDropContent,
    'Sticker applied/removed': components.combined_ar.showARContent,
    'Name Tag applied/removed': components.combined_ar.showARContent
  };

  const groupedDescriptions = ['Listed on Community Market', 'Canceled listing on Community Market', 'Purchased on Community Market', 'Received a gift', 'Deleted',
    'Graffiti Used', 'Graffiti Opened', 'Earned a graffiti drop', 'Earned', 'Earned a souvenir drop', 'Used', 
    'Purchased from the store', 'Operation Reward'];
  if (desc.startsWith('Swapped StatTrak')) {
    components.stattrak.showSwapContent(desc, entries, elements.contentContainer, elements.tabStatsContainer);
  } else if (componentMap[desc]) {
    componentMap[desc](desc, entries, elements.contentContainer, elements.tabStatsContainer);
  } else if (groupedDescriptions.includes(desc)) {
    components.default_cards.showDefaultCards(desc, entries, elements.contentContainer, elements.tabStatsContainer);
  } else {
    components.basic.showBasicContent(desc, entries, elements.contentContainer, elements.tabStatsContainer);
  }
}

function updateTabs() {
  const groupedTabs = Object.keys(existingData).reduce((acc, desc) => {
    const groupName = Object.entries(groupPatterns).find(([, patterns]) => 
      patterns.some(pattern => desc.startsWith(pattern))
    )?.[0] || desc;
    
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(desc);
    return acc;
  }, {});

  const sortedGroupNames = Object.keys(groupPatterns).concat(
    Object.keys(groupedTabs).filter(name => !Object.keys(groupPatterns).includes(name))
  );

  elements.tabContainer.innerHTML = '';
  
  sortedGroupNames.forEach((groupName) => {
    const descriptions = groupedTabs[groupName] || [];
    if (descriptions.length === 1) {
      createTabButton(descriptions[0]);
    } else if (descriptions.length > 1) {
      createDropdown(groupName, descriptions);
    }
  });

  if (currentTab && existingData[currentTab]) {
    showTabContent(currentTab);
  } else if (Object.keys(existingData).length > 0) {
    currentTab = Object.keys(existingData)[0];
    showTabContent(currentTab);
  }
}

function createTabButton(description, container = elements.tabContainer) {
  const tabButton = document.createElement('button');
  tabButton.textContent = description;
  tabButton.addEventListener('click', () => {
    currentTab = description;
    showTabContent(description);
  });
  container.appendChild(tabButton);
}

function createDropdown(groupName, descriptions) {
  const dropdownContainer = document.createElement('div');
  dropdownContainer.classList.add('dropdown');

  const dropdownButton = document.createElement('button');
  dropdownButton.textContent = groupName;
  dropdownButton.classList.add('dropdown-button');
  dropdownContainer.appendChild(dropdownButton);

  const dropdownContent = document.createElement('div');
  dropdownContent.classList.add('dropdown-content');
  descriptions.forEach(description => createTabButton(description, dropdownContent));
  dropdownContainer.appendChild(dropdownContent);

  elements.tabContainer.appendChild(dropdownContainer);
}

// Event listeners
elements.form.addEventListener('submit', handleSubmit);
elements.fileSelector.addEventListener('change', handleFileSelect);

// IPC listeners
ipcRenderer.on('json-files', (event, jsonFiles) => {
  updateFileSelector(jsonFiles);
});

ipcRenderer.on('scrape-response', (event, userName, avatarImg) => {
  elements.userId.innerHTML = userName;
  elements.avatar.innerHTML = `<img src="${avatarImg}" alt="User Avatar">`;
});

ipcRenderer.on('scrape-date', (event, date) => {
  elements.scrapeDate.innerHTML = `Currently Scraping: ${date}`;
});

ipcRenderer.on('scrape-complete', () => {
  elements.submitButton.textContent = 'Submit';
  elements.inputField.disabled = false;
  elements.fileSelector.disabled = false;
  elements.scrapeDate.innerHTML = 'Scraping Complete';
  requestJsonFiles();
});

ipcRenderer.on('scraped-data', (event, newDataString) => {
  const newData = JSON.parse(newDataString);
  newData.forEach((entry) => {
    const { d, t, plusItems, minusItems, tradeName, desc } = entry;
    if (!existingData[desc]) existingData[desc] = [];
    existingData[desc].push({ d, t, plusItems, minusItems, tradeName });
  });
  updateTabs();
});

components.home.showHome(elements.contentContainer, elements.tabStatsContainer);