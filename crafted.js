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
              ${plusItems.length > 0 ? `
                <div class="card given-item">
                  <div class="card-color" style="background-color: ${givenColor}"></div>
                  <div class="given-item-image">
                    <img src="images/${plusItems[0].itemName}.png">
                  </div>
                  <div class="given-item-text">
                    <p>${plusItems[0].market_name}</p>
                    <p>${plusItems[0].itemSetName}</p>
                  </div>
                </div>
              ` : ''}
                <div class="taken-items-container">
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
              <div class="new-content"></div>
            </div>
          <button class="generate-button">
            <span>Generate Possible Outputs</span>
            <i class="arrow-icon"></i>
          </button>
        `;
        contentContainer.appendChild(entryElement);

        const generateButton = entryElement.querySelector('.generate-button');
const dropContent = entryElement.querySelector('.new-content');
generateButton.addEventListener('click', () => {
  dropContent.classList.toggle('show');
  generateButton.classList.toggle('active');
  if (dropContent.classList.contains('show')) {
    const outputText = possibleOutputs(inputType, minusItems, givenColor);
    dropContent.innerHTML = outputText;
  } else {
    dropContent.innerHTML = '';
  }     
});
      }
    });
  }
  updateContentContainer();
}

function possibleOutputs(inputType, minusItems, givenColor) {
  const itemSetNames = [...new Set(minusItems.map(item => item.itemSetName))];
  const outputFilePath = path.join(__dirname, 'output.json');
  const outputFileContent = fs.readFileSync(outputFilePath, 'utf8');
  const collectionData = JSON.parse(outputFileContent);

  const outputItems = [];

  itemSetNames.forEach(setName => {
    const collection = collectionData[setName];
    if (collection) {
      const inputTypeIndex = getItemTypeIndex(inputType);
      const outputType = getItemTypeByIndex(inputTypeIndex + 1);
      const outputItemsInCollection = collection[outputType];
      if (outputItemsInCollection) {
        outputItems.push(...outputItemsInCollection);
      }
    }
  });

  console.log('Output Items:', outputItems);

  if (outputItems.length === 0) {
    return '<p>No possible outputs found.</p>';
  }

  const collectionCounts = {};

  minusItems.forEach(item => {
    const collection = item.itemSetName;
    collectionCounts[collection] = (collectionCounts[collection] || 0) + 1;
  });

  console.log('Collection Counts:', collectionCounts);

  const outputBallots = {};

  outputItems.forEach(item => {
    const collection = item.collections[0].name;
    const collectionCount = collectionCounts[collection] || 0;
    const outputItemsInCollection = outputItems.filter(outputItem => outputItem.collections[0].name === collection);
    const ballots = collectionCount * outputItemsInCollection.length;
    outputBallots[item.name] = ballots;

    console.log('Item:', item.name);
    console.log('Collection:', collection);
    console.log('Collection Count:', collectionCount);
    console.log('Output Items in Collection:', outputItemsInCollection);
    console.log('Ballots:', ballots);
    console.log('---');
  });

  console.log('Output Ballots:', outputBallots);

  const totalBallots = Object.values(outputBallots).reduce((sum, ballots) => sum + ballots, 0);

  console.log('Total Ballots:', totalBallots);

  const outputCards = outputItems.map(item => {
    const itemBallots = outputBallots[item.name] || 0;
    const odds = totalBallots > 0 ? ((itemBallots / totalBallots) * 100).toFixed(2) : '0.00';

    return `
      <div class="card output-item">
        <div class="card-color" style="background-color: ${givenColor}"></div>
        <div class="card-image-container">
          <img src="${item.image}">
        </div>
        <p>${item.name}</p>
        <p>${item.collections[0].name}</p>
        <p>Odds: ${odds}%</p>
      </div>
    `;
  }).join('');

  return `<div class="output-items-container">${outputCards}</div>`;
}

function getItemTypeIndex(itemType) {
  const itemTypes = ['Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert'];
  return itemTypes.indexOf(itemType);
}

function getItemTypeByIndex(index) {
  const itemTypes = ['Consumer Grade', 'Industrial Grade', 'Mil-Spec Grade', 'Restricted', 'Classified', 'Covert'];
  return itemTypes[index] || 'Covert';
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
