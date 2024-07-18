function showCaseDropContent(description, entries, contentContainer, tabStatsContainer) {
    const itemCounts = {};
    const totalCaseDrops = entries.length;


    const oldestEntry = entries[entries.length - 1];

    let mostDroppedCase = { caseName: '', count: 0 };

    entries.forEach((entry) => {
      const { plusItems } = entry;
      plusItems.forEach((item) => {
        const itemName = item.market_name;
        if (itemCounts[itemName]) {
          itemCounts[itemName].count++;
        } else {
          itemCounts[itemName] = { count: 1, imgSrc: item.itemName, itemSet: item.itemSetName, itemColor: item.itemType };
        }
  
        if (itemCounts[itemName].count > mostDroppedCase.count) {
          mostDroppedCase = { caseName: itemName, count: itemCounts[itemName].count };
        }
      });
    });
  
	let selectedCase = null;

    function renderContentContainer() {
        contentContainer.innerHTML = '';
    
        entries.forEach((entry) => {
          if (selectedCase === null || entry.plusItems.some(item => item.market_name === selectedCase)) {
            const {
              d,
              t,
              plusItems
            } = entry;
            const entryElement = document.createElement('div');
            entryElement.classList.add('card');
            entryElement.innerHTML = `
          <div class="card-header">
            <span class="date-time">${d} ${t}</span>
          </div>
          <div class="weapon-given-image-container">
            <img src="${path.join(process.resourcesPath, 'images', `${plusItems[0].itemName}.png`)}" alt="${plusItems[0].market_name}">
          </div>
          <div class="entry-case">
            <span>${plusItems[0].market_name}</span>
          </div>
        `;
            contentContainer.appendChild(entryElement);
          }
        });
    }
    
    function handleCardClick(item) {
        selectedCase = item;
        renderContentContainer();
        renderResetButton();
    }
    
    function handleResetClick() {
        selectedCase = null;
        renderContentContainer();
        renderResetButton();
    }
    
    function renderResetButton() {
        const resetContainer = tabStatsContainer.querySelector('#reset-container');
        if (selectedCase) {
          resetContainer.style.display = 'flex';
          resetContainer.innerHTML = `
            <span class="button-text">${selectedCase}</span>
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
      <span class="stat-label">Total Case Drops:</span>
      <span class="stat-value">${totalCaseDrops}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Oldest Drop:</span>
      <div class="stat-value">
        <div>${oldestEntry.d} - ${oldestEntry.t}</div>
        <div>${oldestEntry.plusItems[0].market_name}</div>
      </div>
    </div>
    <div class="stat-item">
      <span class="stat-label">Most Dropped Case:</span>
      <span class="stat-value">${mostDroppedCase.caseName} (${mostDroppedCase.count} drops)</span>
    </div>
  </div>
  <div class="card-container">
    ${Object.entries(itemCounts)
      .map(
        ([item, { count, imgSrc }]) => {
          return `
            <div class="item-card" data-item="${item}">
              <img src="${path.join(process.resourcesPath, 'images', `${imgSrc}.png`)}"" alt="${item}">
              <div class="item-info">
                <h4>${item}</h4>
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
module.exports = {
	showCaseDropContent
};