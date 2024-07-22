const fs = require('fs');
const path = require('path');
const { extractItemColor } = require('../utils');

function showCraftedContent(description, entries, contentContainer, tabStatsContainer) {
  let currentPage = 1;
  const itemsPerPage = 10; // Adjust as needed
  let observer;
  
  const tradeUpTypeCount = {
    'Industrial Grade': 0,
    'Mil-Spec': 0,
    'Restricted': 0,
    'Classified': 0,
    'Covert': 0
  };

  entries.forEach((entry) => {
    const { plusItems } = entry;
    plusItems.forEach((item) => {
      const tradeUpType = item.itemType;
      if (tradeUpTypeCount.hasOwnProperty(tradeUpType)) {
        tradeUpTypeCount[tradeUpType]++;
      }
    });
  });

  tabStatsContainer.innerHTML = `
    <link rel="stylesheet" href="style/craft.css">
    <h3>${description}</h3>
    <div>
      ${Object.entries(tradeUpTypeCount)
        .map(([type, count]) => {
          const itemColor = extractItemColor(type);
          return `
          <label>
            <input type="checkbox" class="trade-up-type-checkbox" value="${type}" checked>
            <span style="display: inline-block; width: 10px; height: 10px; background-color: ${itemColor}; margin-right: 5px;"></span> ${type}: ${count}
          </label>
        `})
        .join('')}
    </div>
  `;
    
  const tradeUpTypeCheckboxes = tabStatsContainer.querySelectorAll('.trade-up-type-checkbox');
  tradeUpTypeCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      currentPage = 1;
      contentContainer.innerHTML = '';
      updateContentContainer();
    });
  });

  function updateContentContainer() {
    const selectedTradeUpTypes = Array.from(tradeUpTypeCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    const filteredEntries = entries.filter((entry) => 
      entry.plusItems.some((item) => selectedTradeUpTypes.includes(item.itemType))
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const entriesToRender = filteredEntries.slice(startIndex, endIndex);

    entriesToRender.forEach((entry) => {
      const { d, t, plusItems, minusItems } = entry;
      const takenColor = extractItemColor(minusItems[0].itemType);
      const givenColor = extractItemColor(plusItems[0].itemType);
      const inputType = minusItems[0].itemType;
      const entryElement = document.createElement('div');
      entryElement.classList.add('entry');
      entryElement.innerHTML = `
        <div class="entry-header">
          <span>${d} ${t}</span>
        </div>
        <div class="card-container">
          <div class="minus-items-container">
            ${minusItems.map(item => `
              <div class="card taken-item" style="--item-color: ${takenColor};">
                <div class="weapon-given-image-container">
                  <img src="https://community.akamai.steamstatic.com/economy/image/${item.itemName}/330x192?allow_animated=1">
                  ${item.itemWear ? `<span class="item-wear">${shortenItemWear(item.itemWear)}</span>` : ''}
                  ${item.stickers && item.stickers.length > 0 ? `
                    <div class="sticker-separator"></div>
                    <div class="sticker-image">
                      ${item.stickers.map(sticker => `
                        <img src="${sticker.imgSrc}">
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
                <p>${item.market_name}</p>
                <p>${item.itemSetName}</p>
              </div>
            `).join('')}
          </div>
          <div class="plus-items-wrapper">
            <div class="plus-items-top">
              ${plusItems.length > 0 ? `
                <div class="card given-item plus-item" style="--item-color: ${givenColor};">
                  <div class="weapon-given-image-container">
                    <img src="https://community.akamai.steamstatic.com/economy/image/${plusItems[0].itemName}/330x192?allow_animated=1">
                    ${plusItems[0].itemWear ? `<span class="item-wear">${shortenItemWear(plusItems[0].itemWear)}</span>` : ''}
                  </div>
                  <p>${plusItems[0].market_name}</p>
                  <p>${plusItems[0].itemSetName}</p>
                </div>
              ` : ''}
              <div class="card show-outcomes-card">
                <span>Show Possible Outcomes</span>
              </div>
            </div>
            <div class="plus-items-container"></div>
          </div>
        </div>
      `;
      contentContainer.appendChild(entryElement);

      const showOutcomesCard = entryElement.querySelector('.show-outcomes-card');
      const plusItemsTop = entryElement.querySelector('.plus-items-top');
      const plusItemsContainer = entryElement.querySelector('.plus-items-container');

      showOutcomesCard.addEventListener('click', () => {
        plusItemsTop.style.display = 'none';
        const outputText = possibleOutputs(inputType, minusItems, givenColor, plusItems[0]);
        plusItemsContainer.innerHTML = outputText;
      });
    });

    // Set up Intersection Observer for the last item
    if (entriesToRender.length > 0) {
      const lastEntry = contentContainer.lastElementChild;
      setupIntersectionObserver(lastEntry);
    }
  }

  function setupIntersectionObserver(target) {
    if (observer) {
      observer.disconnect();
    }

    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMoreItems();
      }
    }, { threshold: 0.1 });

    observer.observe(target);
  }

  function loadMoreItems() {
    currentPage++;
    updateContentContainer();
  }

  // Initial render
  updateContentContainer();
}

function possibleOutputs(inputType, minusItems, givenColor, plusItem) {
  const itemTypes = ['Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert'];
  const itemSetNames = [...new Set(minusItems.map(item => item.itemSetName))];
  const outputFilePath = path.join(__dirname, '../csihv.json');
  const collectionData = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
  
  let outputItems = itemSetNames.reduce((items, setName) => {
    const collection = collectionData[setName];
    if (collection) {
      const inputTypeIndex = itemTypes.indexOf(inputType);
      const outputType = itemTypes[inputTypeIndex + 1] || 'Covert';
      const outputItemsInCollection = collection[outputType];
      if (outputItemsInCollection) {
        items.push(...outputItemsInCollection);
      }
    }
    return items;
  }, []);
  
  const collectionCounts = minusItems.reduce((counts, item) => {
    const collection = item.itemSetName;
    counts[collection] = (counts[collection] || 0) + 1;
    return counts;
  }, {});
  
  const outputBallots = outputItems.reduce((ballots, item) => {
    const collection = item.collections[0].name;
    ballots[item.name] = collectionCounts[collection] || 0;
    return ballots;
  }, {});
  
  const totalBallots = Object.values(outputBallots).reduce((sum, ballots) => sum + ballots, 0);
  
  const plusItemNameWithoutParentheses = plusItem.market_name.split(' (')[0];

  let matchingPlusItem = null;
  let matchingCollection = null;
  for (const item of outputItems) {
    if (item.name.split(' (')[0] === plusItemNameWithoutParentheses) {
      matchingPlusItem = item;
      matchingCollection = item.collections[0].name;
      break;
    }
  }

  if (matchingPlusItem) {
    outputItems = outputItems.filter(item => item !== matchingPlusItem);

    outputItems.sort((itemA, itemB) => {
      const collectionA = itemA.collections[0].name;
      const collectionB = itemB.collections[0].name;
      if (collectionA === matchingCollection) return -1;
      if (collectionB === matchingCollection) return 1;
      return 0;
    });

    const matchingCollectionIndex = outputItems.findIndex(item => item.collections[0].name === matchingCollection);
    outputItems.splice(matchingCollectionIndex, 0, matchingPlusItem);
  } else {
    console.log(`No matching plusItem found for ${plusItem.market_name}`);
  }

  const outputCards = outputItems.map(item => {
    const itemBallots = outputBallots[item.name] || 0;
    const odds = totalBallots > 0 ? ((itemBallots / totalBallots) * 100).toFixed(2) : '0.00';
    const isPlusItem = item === matchingPlusItem;

    return `
      <div class="card output-item ${isPlusItem ? ' plus-item' : ''}"  style="--item-color: ${givenColor};">
        <div class="weapon-given-image-container">
          <img src="${item.image}">
          ${isPlusItem ? `<span class="item-wear">${shortenItemWear(plusItem.itemWear)}</span>` : ''}
        </div>
        <p>${item.name}</p>
        <div class="collection-stats">
          <img src="${item.collections[0].image}">
          <p>Odds: ${odds}%</p>
        </div>
      </div>
    `;
  });

  return `
    <div class="plus-items-grid">
      ${outputCards.join('')}
    </div>
  `;
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
  showCraftedContent
};
