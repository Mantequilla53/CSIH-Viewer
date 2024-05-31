const fs = require('fs');
const path = require('path');

function showCraftedContent(description, entries, contentContainer, tabStatsContainer) {
  const tradeUpTypeCount = {
    'Industrial Grade': 0,
    'Mil-Spec': 0,
    'Restricted': 0,
    'Classified': 0,
    'Covert': 0
  };
  let totalTradeUp = 0;

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
    checkbox.addEventListener('change', updateContentContainer);
  });

  function updateContentContainer() {
    const selectedTradeUpTypes = Array.from(tradeUpTypeCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    contentContainer.innerHTML = '';
    entries.forEach((entry) => {
      const filteredPlusItems = entry.plusItems.filter((item) => selectedTradeUpTypes.includes(item.itemType));
      if (filteredPlusItems.length > 0) {
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
        <div class="card taken-item">
          <div class="card-color" style="background-color: ${takenColor}"></div>
          <div class="card-image-container">
            <img src="images/${item.itemName}.png">
            ${item.stickers && item.stickers.length > 0 ? `
              <div class="item-separator"></div>
              <div class="stickers-section">
                ${item.stickers.map(sticker => `
                  <img class="sticker-image" src="images/${sticker.imgSrc}.png">
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
          <div class="card given-item plus-item">
            <div class="card-color" style="background-color: ${givenColor}"></div>
            <div class="card-image-container">
              <img src="images/${plusItems[0].itemName}.png">
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
      }
    });
  }
  updateContentContainer();
}

function possibleOutputs(inputType, minusItems, givenColor, plusItem) {
  const itemTypes = ['Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert'];
  const itemSetNames = [...new Set(minusItems.map(item => item.itemSetName))];
  const outputFilePath = path.join(__dirname, 'output.json');
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
  
  // Remove parentheses from plusItem market_name for matching
  const plusItemNameWithoutParentheses = plusItem.market_name.split(' (')[0];

  // Find the matching plusItem and its collection
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
    // Remove the matching plusItem from its original position
    outputItems = outputItems.filter(item => item !== matchingPlusItem);

    // Sort outputItems by collection, with the matching collection first
    outputItems.sort((itemA, itemB) => {
      const collectionA = itemA.collections[0].name;
      const collectionB = itemB.collections[0].name;
      if (collectionA === matchingCollection) return -1;
      if (collectionB === matchingCollection) return 1;
      return 0;
    });

    // Insert the matching plusItem at the beginning of its collection
    const matchingCollectionIndex = outputItems.findIndex(item => item.collections[0].name === matchingCollection);
    outputItems.splice(matchingCollectionIndex, 0, matchingPlusItem);
  } else {
    console.log(`No matching plusItem found for ${plusItem.market_name}`);
  }

  const outputCards = outputItems.map(item => {
    const itemBallots = outputBallots[item.name] || 0;
    const odds = totalBallots > 0 ? ((itemBallots / totalBallots) * 100).toFixed(2) : '0.00';
    const isPlusItem = item === matchingPlusItem;

    // Add parentheses to the matched item's name
    const displayName = isPlusItem ? `${item.name.split(' (')[0]} (${plusItem.market_name.split(' (')[1]}` : item.name;

    return `
      <div class="card output-item${isPlusItem ? ' plus-item' : ''}">
        <div class="card-color" style="background-color: ${givenColor}"></div>
        <div class="card-image-container">
          <img src="${item.image}">
        </div>
        <p>${displayName}</p>
        <img class="collection-image" src="${item.collections[0].image}">
        <p>Odds: ${odds}%</p>
      </div>
    `;
  });

  return `
    <div class="plus-items-grid">
      ${outputCards.join('')}
    </div>
  `;
}

function extractItemColor(itemType) {
  const colorMap = {
    'Consumer Grade': 'rgb(176, 195, 217)',
    'Industrial Grade': 'rgb(94, 152, 217)',
    'Mil-Spec': 'rgb(75, 105, 255)',
    'Restricted': 'rgb(136, 71, 255)',
    'Classified': 'rgb(211, 44, 230)',
    'Covert': 'rgb(235, 75, 75)'
  };
  return colorMap[itemType] || 'white';
}

module.exports = {
  showCraftedContent
};
