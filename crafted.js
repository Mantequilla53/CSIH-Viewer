function showCraftedContent(description, entries, contentContainer, tabStatsContainer) {
    const tradeUpTypeCount = {
        'Industrial Grade': 0,
        'Mil-Spec': 0,
        'Restricted': 0,
        'Classified': 0,
        'Covert': 0 
    }
    let totalTradeUp = 0;

    entries.forEach((entry) => {
        const { plusItems } = entry;
        plusItems.forEach((item) => {
            const tradeUpType = item.itemType;
            if (tradeUpTypeCount.hasOwnProperty(tradeUpType)){
                tradeUpTypeCount[tradeUpType]++;
            }
        });
    });
    const tabContentElement = document.createElement('div');
    tabContentElement.innerHTML = `
    <style>
    .trade-up-type-checkbox {
      margin-left: 20px;
    }
    .entry {
      margin-bottom: 20px;
      padding: 10px;
      border-radius: 4px;
    }

    .entry-header {
      margin-bottom: 10px;
    }

    .card-container {
      display: flex;
      align-items: flex-start;
      position: relative;
    }

    .card {
      padding: 10px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      text-align: center;
      width: 120px;
      position: relative;
    }
    
    .card-color {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 7px;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
    }

    .given-item, .taken-item {
      background-color: #393E46;
    }

    .taken-items-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .card p {
      margin: 0;
    }
    .separator {
      width: 1px;
      background-color: #ccc;
      margin: 0 10px;
      align-self: stretch;
    }
    </style>
    <h3>Trade-Up</h3>
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
    </div>`;
    tabStatsContainer.appendChild(tabContentElement);
    
    const tradeUpTypeCheckboxes = tabContentElement.querySelectorAll('.trade-up-type-checkbox');
    tradeUpTypeCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', updateContentContainer);
    });

    updateContentContainer();
    function updateContentContainer() {
    const selectedTradeUpTypes = Array.from(tradeUpTypeCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    contentContainer.innerHTML = '';
    entries.forEach((entry) => {
      const { d, t, plusItems, minusItems } = entry;
      const filteredPlusItems = plusItems.filter((item) => selectedTradeUpTypes.includes(item.itemType));
      if (filteredPlusItems.length > 0) {
        const entryElement = document.createElement('div');
        entryElement.classList.add('entry');
        entryElement.innerHTML = `
          <div class="entry-header">
            <p>${d} ${t}</p>
          </div>
          <div class="card-container">
            ${plusItems.length > 0 ? `
              <div class="card given-item">
                <div class="card-color" style="background-color: ${extractItemColor(plusItems[0].itemType)}"></div>
                <img src="images/${plusItems[0].itemName}.PNG" width="120" height="92.4">
                <p>${plusItems[0].market_name}</p>
              </div>
            ` : ''}
            <div class="separator"></div>
            <div class="taken-items-container">
              ${minusItems.map(item => `
                <div class="card taken-item">
                  <div class="card-color" style="background-color: ${extractItemColor(item.itemType)}"></div>
                  <img src="images/${item.itemName}.PNG" width="120" height="92.4">
                  <p>${item.market_name}</p>
                </div>
              `).join('')}
            </div>
          </div>
        `;
        contentContainer.appendChild(entryElement);
      }
    });
  }
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