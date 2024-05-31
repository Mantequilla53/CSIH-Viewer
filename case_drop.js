function showCaseDropContent(description, entries, contentContainer, tabStatsContainer) {
    const itemCounts = {};
  
	entries.forEach((entry) => {
	  const { plusItems } = entry;
	  plusItems.forEach((item) => {
		const itemName = item.market_name;
		if (itemCounts[itemName]) {
		  itemCounts[itemName].count++;
		} else {
		  itemCounts[itemName] = { count: 1, imgSrc: item.itemName, itemSet: item.itemSetName, itemColor: item.itemType };
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
            entryElement.className = 'entry-container';
            entryElement.innerHTML = `
              <div class="entry-header">
                <p>${d}  - ${t}</p>
              </div>
              <div class="entry-image">
                <img src="images/${plusItems[0].itemName}.png" alt="${plusItems[0].market_name}">
              </div>
              <div class="entry-case">
                <p>${plusItems[0].market_name}</p>
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
      <link rel="stylesheet" href="style/casedrop.css">
      <h3>${description}</h3>
      <div class="card-container">
        ${Object.entries(itemCounts)
          .map(
            ([item, { count, imgSrc }]) => {
              return `
                <div class="item-card" data-item="${item}">
                  <img src="images/${imgSrc}.png" alt="${item}">
                  <div class="item-info">
                    <h4>${item}</h4>
                    ${count > 1 ? `<p>Count: ${count}</p>` : ''}
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