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
        const entryElement = document.createElement('div');
        entryElement.classList.add('entry');
        entryElement.innerHTML = `
            <div class="entry-header">
              <span>${d} ${t}</span>
            </div>
            <div class="card-container">
              ${plusItems.length > 0 ? `
                <div class="card given-item">
                  <div class="card-color" style="background-color: ${extractItemColor(plusItems[0].itemType)}"></div>
                  <div class="given-item-image">
                    <img src="images/${plusItems[0].itemName}.png">
                  </div>
                  <div class="given-item-text">
                    <p>${plusItems[0].market_name}</p>
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
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="new-content"></div>
          <button class="generate-button">
            <span>Generate Possible Outputs</span>
            <i class="fas fa-chevron-down"></i>
          </button>
        `;
        contentContainer.appendChild(entryElement);

        const generateButton = entryElement.querySelector('.generate-button');
        const dropContent = entryElement.querySelector('.new-content');
        generateButton.addEventListener('click', () => {
          dropContent.classList.toggle('show');
          if (dropContent.classList.contains('show')) {
            const outputText = possibleOutputs(minusItems);
            dropContent.textContent = outputText;
          } else {
            dropContent.textContent = '';
          }
        });
      }
    });
  }
  updateContentContainer();
}

function possibleOutputs(minusItems) {
  return 'Coming soon';
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
