function showWeaponDropContent(description, entries, contentContainer, tabStatsContainer) {
  const { extractItemColor } = require('../utils');
  const outputData = require('../csihv.json');
  const collectionCounts = {};
  const totalWeaponDrops = entries.length;

  const oldestEntry = entries[entries.length - 1];

  entries.forEach((entry) => {
    const { plusItems } = entry;
    plusItems.forEach((item) => {
      const itemName = item.market_name;
      const { name: itemCollection, image: collectionImage } = getItemCollection(itemName, outputData);
      if (collectionCounts[itemCollection]) {
        collectionCounts[itemCollection].count++;
      } else {
        collectionCounts[itemCollection] = { count: 1, image: collectionImage };
      }
    });
  });

  let selectedCollection = null;

  function getItemCollection(itemName, outputData) {
    const cleanedItemName = itemName.replace(/\s*\(.+\)/, '').trim();
    const itemEntry = Object.values(outputData).flatMap(collection =>
      Object.values(collection).flat()
    ).find((entry) => entry.name === cleanedItemName);
    return itemEntry ? {
      name: itemEntry.collections[0].name,
      image: itemEntry.collections[0].image
    } : {
      name: 'Unknown Collection',
      image: ''
    };
  }

  function renderContentContainer() {
    contentContainer.innerHTML = '';

    entries.forEach((entry) => {
      if (selectedCollection === null || entry.plusItems.some(item => getItemCollection(item.market_name, outputData).name === selectedCollection)) {
        const { d, t, plusItems } = entry;
        const itemColor = extractItemColor(plusItems[0].itemType); 
        const entryElement = document.createElement('div');
        entryElement.classList.add('card');
        entryElement.style.setProperty('--item-color', itemColor);
        entryElement.innerHTML = `
          <div class="card-header">
            <span class="date-time">${d} ${t}</span>
          </div>
          <div class="weapon-given-image-container">
            <div class="weapon-given">
              <img src="https://community.akamai.steamstatic.com/economy/image/${plusItems[0].itemName}/330x192?allow_animated=1" alt="${plusItems[0].market_name}">
              ${plusItems[0].itemWear ? `<span class="drop-item-wear">${shortenItemWear(plusItems[0].itemWear)}</span>` : ''}
            </div>
          </div>
          <div class="entry-case">
            <span>${plusItems[0].market_name}</span>
          </div>
          <div class="entry-collection">
            <span>${plusItems[0].itemSetName}</span>
          </div>
        `;
        contentContainer.appendChild(entryElement);
      }
    });
  }

  function handleCardClick(collection) {
    selectedCollection = collection;
    renderContentContainer();
    renderResetButton();
  }

  function handleResetClick() {
    selectedCollection = null;
    renderContentContainer();
    renderResetButton();
  }

  function renderResetButton() {
    const resetContainer = tabStatsContainer.querySelector('#reset-container');
    if (selectedCollection) {
      resetContainer.style.display = 'flex';
      resetContainer.innerHTML = `
        <span class="button-text">${selectedCollection}</span>
        <button id="reset-button">×</button>
      `;
      const resetButton = resetContainer.querySelector('#reset-button');
      resetButton.addEventListener('click', handleResetClick);
    } else {
      resetContainer.style.display = 'none';
    }
  }

  tabStatsContainer.innerHTML = `
    <link rel="stylesheet" href="style/weapondrop.css">
    <h3>${description}</h3>
    <div class="stats-container">
      <div class="stat-item">
        <span class="stat-label">Total Weapon Drops:</span>
        <span class="stat-value">${totalWeaponDrops}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Oldest Drop:</span>
        <div class="stat-value">
          <div>${oldestEntry.d} - ${oldestEntry.t}</div>
          <div>${oldestEntry.plusItems[0].market_name}</div>
        </div>
      </div>
    </div>
    <div class="card-container">
      ${Object.entries(collectionCounts)
        .map(
          ([collection, { count }]) => {
            const collectionData = Object.values(outputData).flatMap(c =>
              Object.values(c).flat()
            ).find(entry => entry.collections[0].name === collection);
            const collectionImage = collectionData ? collectionData.collections[0].image : '';
            return `
              <div class="item-card" data-item="${collection}">
                  <img src="${collectionImage}" alt="${collection}">
                <div class="item-info">
                  <h4>${collection}</h4>
                  ${count > 1 ? `<span class="drop-count">Count: ${count}</span>` : ''}
                </div>
              </div>
            `;
          }
        )
        .join('')}
    </div>
    <div id="reset-container" style="display: none;">
      <span class="button-text"></span>
      <button id="reset-button">×</button>
    </div>
  `;
  const itemCards = tabStatsContainer.querySelectorAll('.item-card');
    itemCards.forEach(card => {
        card.addEventListener('click', () => {
          const item = card.getAttribute('data-item');
          handleCardClick(item);
        });
    });

  const resetButton = tabStatsContainer.querySelector('#reset-button');
  resetButton.addEventListener('click', handleResetClick);

  renderContentContainer();
  renderResetButton();
}

const shortenItemWear = (itemWear) => {
  const wearMap = {
    'Factory New': 'FN',
    'Minimal Wear': 'MW',
    'Field-Tested': 'FT',
    'Well-Worn': 'WW',
    'Battle-Scarred': 'BS'
  };
  return wearMap[itemWear] || itemWear;
};

module.exports = {
  showWeaponDropContent
};