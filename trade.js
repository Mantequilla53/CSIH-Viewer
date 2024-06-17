function showTradeContent(description, entries, contentContainer, tabStatsContainer) {
  const tradeNameCounts = {};

  entries.forEach((entry) => {
    const { tradeName } = entry;
    if (tradeNameCounts[tradeName]) {
      tradeNameCounts[tradeName].push(entry);
    } else {
      tradeNameCounts[tradeName] = [entry];
    }
  });

  tabStatsContainer.innerHTML = `
  <link rel="stylesheet" href="style/trades.css">  
  <h3>${description}</h3>
    <div>
      <select id="trade-name-select">
        <option value="">Select a trade name</option>
        ${Object.keys(tradeNameCounts)
          .map(
            (tradeName) => `
              <option value="${tradeName}">${tradeName} (${tradeNameCounts[tradeName].length})</option>
            `
          )
          .join('')}
      </select>
      <button id="unselect-button" style="display: none;">Unselect</button>
    </div>
    <div>
      <input type="text" id="search-input" placeholder="Search items...">
    </div>
    <div id="selected-trade-name"></div>
  `;

  const $ = (id) => tabStatsContainer.querySelector(id);
  const tradeNameSelect = $('#trade-name-select');
  const unselectButton = $('#unselect-button');
  const selectedTradeNameContainer = $('#selected-trade-name');
  const searchInput = $('#search-input');

  let selectedTradeName = null;


  function searchEntries(query, tradeName) {
    const filteredEntries = tradeName ? tradeNameCounts[tradeName] : entries;
    return filteredEntries.filter((entry) => {
      const { plusItems, minusItems } = entry;
      return plusItems.some((item) => item.market_name.toLowerCase().includes(query.toLowerCase()))
        || minusItems.some((item) => item.market_name.toLowerCase().includes(query.toLowerCase()));
    });
  }

  function renderTrades() {
    const searchQuery = searchInput.value.trim().toLowerCase();
    const filteredEntries = searchQuery ? searchEntries(searchQuery, selectedTradeName) : (selectedTradeName ? tradeNameCounts[selectedTradeName] : entries);

    filteredEntries.forEach((entry) => {
      const { d, t, plusItems, minusItems, tradeName } = entry;
      
      const groupedPlusItems = groupItems(plusItems);
      const groupedMinusItems = groupItems(minusItems);
      
      const entryElement = document.createElement('div');
      entryElement.classList.add('trade-entry');
      entryElement.innerHTML = `
        <div class="entry-header">
          <p>${d} ${t}</p>
          ${selectedTradeName
            ? `<span class="trade-name">${tradeName}</span>`
            : `<span class="trade-name">Trade Name: ${tradeName}</span>`}
        </div>
        <div class="entry-content">
          ${renderItemSection(groupedPlusItems, 'green-card')}
          ${renderItemSection(groupedMinusItems, 'red-card')}
        </div>
      `;
      contentContainer.appendChild(entryElement);
      
      function renderItemSection(groupedItems, cardClass) {
        if (Object.values(groupedItems).length === 0) {
          return '';
        }
      
        return `
          <div class="item-section ${Object.values(groupedPlusItems).length > 0 && Object.values(groupedMinusItems).length > 0 ? 'half-width' : ''}">
            <div class="item-card ${cardClass}">
              <div class="item-grid">
                ${Object.values(groupedItems).map((item) => `
                  <div class="item-entry" style="--item-color: ${extractItemColor(item.itemType)};">
                    <div class="item-image-container">
                      <div class="item-image-wrapper">
                        <img src="${path.join(process.resourcesPath, 'images', `${item.itemName}.png`)}" width="120" height="92.4">
                      </div>
                      ${item.tag_name ? `
                        <div class="tag-indicator" title="${item.tag_name}"></div>
                      ` : ''}
                      ${item.stickers && item.stickers.length > 0 ? `
                        <div class="sticker-separator"></div>
                        <div class="sticker-images">
                          ${item.stickers.map((sticker) => `
                            <img src="${path.join(process.resourcesPath, 'images', `${sticker.imgSrc}.png`)}" width="40" height="30.8">
                          `).join('')}
                        </div>
                      ` : ''}
                    </div>
                    <p>${item.market_name} ${item.count > 1 ? `(count ${item.count})` : ''}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      }
  }); 
  }

  tradeNameSelect.addEventListener('change', (event) => {
    selectedTradeName = event.target.value;
    contentContainer.innerHTML = '';
    //searchInput.value = ''; Clear the search input when changing trade name
    if (selectedTradeName) {
      selectedTradeNameContainer.textContent = `Selected Trade Name: ${selectedTradeName}`;
      unselectButton.style.display = 'inline-block';
    } else {
      selectedTradeNameContainer.innerHTML = '';
      unselectButton.style.display = 'none';
    }
    renderTrades();
  });

  unselectButton.addEventListener('click', () => {
    selectedTradeNameContainer.innerHTML = '';
    tradeNameSelect.value = '';
    unselectButton.style.display = 'none';
    selectedTradeName = null;
    contentContainer.innerHTML = '';
    renderTrades();
  });

  searchInput.addEventListener('input', () => {
    contentContainer.innerHTML = '';
    renderTrades();
  });

  renderTrades();
}

function groupItems(items) {
  return items.reduce((acc, item) => {
    const stickerNames = item.stickers ? item.stickers.map(sticker => sticker.name).join('-') : '';
    const key = `${item.market_name}-${stickerNames}-${item.tag_name || ''}`;
    if (acc[key]) {
      acc[key].count++;
    } else {
      acc[key] = { ...item, count: 1 };
    }
    return acc;
  }, {});
}

function extractItemColor(itemType) {
  const colorMap = {
    'Consumer Grade': 'rgb(176, 195, 217)',
    'Industrial Grade': 'rgb(94, 152, 217)',
    //blue
    'Mil-Spec': 'rgb(75, 105, 255)',
    'High Grade Patch': 'rgb(75, 105, 255)',
    'High Grade Collectible': 'rgb(75, 105, 255)',
    'High Grade Graffiti': 'rgb(75, 105, 255)',
    'High Grade Sticker': 'rgb(75, 105, 255)',
    //purple
    'Restricted': 'rgb(136, 71, 255)',
    'Remarkable Patch': 'rgb(136, 71, 255)',
    'Remarkable Collectible': 'rgb(136, 71, 255)',
    'Remarkable Graffiti': 'rgb(136, 71, 255)',
    'Remarkable Sticker': 'rgb(136, 71, 255)',
    //pink
    'Classified': 'rgb(211, 44, 230)',
    'Exotic Patch': 'rgb(211, 44, 230)',
    'Exotic Collectible': 'rgb(211, 44, 230)',
    'Exotic Graffiti': 'rgb(211, 44, 230)',
    'Exotic Sticker': 'rgb(211, 44, 230)',
    //red
    'Covert': 'rgb(235, 75, 75)',
    'Extraordinary Collectible': 'rgb(235, 75, 75)',
    'Extraordinary Sticker': 'rgb(235, 75, 75)',
    //yellow
    'Extraordinary': 'rgb(255, 215, 0)'
  };
  return colorMap[itemType] || 'white';
}

module.exports = {
  showTradeContent
};