const { extractItemColor } = require('../utils');

// Initialize item type counts and minus items count
const initializeItemCounts = () => ({
  itemTypeCounts: {
    'High Grade Sticker': 0,
    'Remarkable Sticker': 0,
    'Exotic Sticker': 0,
    'Extraordinary Sticker': 0,
  },
  minusItemsCount: {},
  totalCount: 0
});

// Update item counts based on entries
const updateItemCounts = (entries, itemCounts) => {
  entries.forEach((entry) => {
    const { plusItems, minusItems } = entry;
    plusItems.forEach((item) => {
      const { itemType } = item;
      itemCounts.itemTypeCounts[itemType]++;
    });
    minusItems.forEach((item) => {
      const { market_name } = item;
      itemCounts.minusItemsCount[market_name] = (itemCounts.minusItemsCount[market_name] || 0) + 1;
      itemCounts.totalCount++;
    });
  });
};

// Generate sidebar HTML with case checkboxes
const generateSidebarHTML = (itemCounts) => `
  <h4>Capsules Unboxed:</h4>
  <ul>
    <li>
      <label>
        <input type="checkbox" id="check-all" checked>All Cases
      </label>
    </li>
    ${Object.entries(itemCounts.minusItemsCount)
      .map(([item, count]) => `
        <li>
          <label title="${item}">
            <input type="checkbox" class="item-checkbox" value="${item}" checked>
            ${item.startsWith('Operation') ? item.slice(9) : item} <span class="count">(${count})</span>
          </label>
        </li>
      `)
      .join('')}
  </ul>
`;

// Generate item type table HTML
const generateItemTypeTableHTML = (itemCounts) => `
  <table class="item-type-table">
    <thead>
      <tr>
        <th>Item Type</th>
        <th>Count</th>
        <th>Pct %</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(itemCounts.itemTypeCounts)
        .map(([itemType, count]) => {
          const percentage = ((count / itemCounts.totalCount) * 100).toFixed(3);
          const itemColor = extractItemColor(itemType);
          return `
            <tr>
              <td>
                <label>
                  <input type="checkbox" class="item-type-checkbox" value="${itemType}" checked>
                  <span style="display: inline-block; width: 10px; height: 10px; background-color: ${itemColor}; margin-right: 5px;"></span>
                  ${itemType}
                  <span style="display: inline-block; width: 10px; height: 10px; background-color: ${itemColor}; margin-left: 5px;"></span>
                </label>
              </td>
              <td>${count}/${itemCounts.totalCount}</td>
              <td>${percentage}%</td>
            </tr>
          `;
        })
        .join('')}
    </tbody>
  </table>
`;

// Update content container based on selected item types and checked items
const updateContentContainer = (tabContentElement, entries) => {
  const selectedItemTypes = Array.from(tabContentElement.querySelectorAll('.item-type-checkbox:checked')).map((checkbox) => checkbox.value);
  const checkedItems = Array.from(tabContentElement.querySelectorAll('.item-checkbox:checked')).map((checkbox) => checkbox.value);

  const updatedItemCounts = initializeItemCounts();
  const contentContainerElement = tabContentElement.querySelector('#content-container');
  contentContainerElement.innerHTML = '<div class="card-container"></div>';
  const cardContainer = contentContainerElement.querySelector('.card-container');

  entries.forEach((entry) => {
    const { d, t, plusItems, minusItems } = entry;
    const matchedMinusItems = minusItems.filter((minusItem) => checkedItems.includes(minusItem.market_name));
    const filteredPlusItems = plusItems.filter((plusItem) => selectedItemTypes.includes(plusItem.itemType));

    if (matchedMinusItems.length > 0) {
      plusItems.forEach((plusItem) => {
        const { itemType } = plusItem;
        updatedItemCounts.itemTypeCounts[itemType]++;
      });
      updatedItemCounts.totalCount += matchedMinusItems.length;

      if (filteredPlusItems.length > 0) {
        const cardElement = createCardElement(d, t, filteredPlusItems, matchedMinusItems);
        cardContainer.appendChild(cardElement);
      }
    }
  });
  return updatedItemCounts;
};

// Create card element for displaying sticker capsule content
const createCardElement = (date, time, plusItems, matchedMinusItems) => {
  const cardElement = document.createElement('div');
  cardElement.classList.add('card');
  const itemColor = extractItemColor(plusItems[0].itemType);
  cardElement.style.setProperty('--item-color', itemColor);

  cardElement.innerHTML = `
    <div class="card-header">
      <span class="date-time">${date} ${time}</span>
    </div>
    <div class="weapon-given">
      <div class="weapon-given-image-container">
        <img src="${path.join(process.resourcesPath, 'images', `${plusItems[0].itemName}.png`)}" width="120" height="92.4">
      </div>
      <span>${removeSticker(plusItems[0].market_name)}</span>
    </div>
    ${matchedMinusItems.length > 0 ? `
      <div class="card-footer">
        <div class="case-unboxed">
          <span class="item-name">${matchedMinusItems[0].market_name}</span>
          <img src="${path.join(process.resourcesPath, 'images', `${matchedMinusItems[0].itemName}.png`)}" alt="${matchedMinusItems[0].market_name}">
        </div>
      </div>
    ` : ''}
  `;


  return cardElement;
};

// Update item type table with updated counts and percentages
const updateItemTypeTable = (tabContentElement, updatedItemCounts) => {
  const itemTypeTableBody = tabContentElement.querySelector('.item-type-table tbody');
  itemTypeTableBody.querySelectorAll('tr').forEach((row) => {
    const itemType = row.querySelector('.item-type-checkbox').value;
    const count = updatedItemCounts.itemTypeCounts[itemType];
    const percentage = ((count / updatedItemCounts.totalCount) * 100).toFixed(3);

    row.querySelector('td:nth-child(2)').textContent = `${count}/${updatedItemCounts.totalCount}`;
    row.querySelector('td:nth-child(3)').textContent = `${percentage}%`;
  });
};

// Remove "sticker" from market name
const removeSticker = (marketName) => {
  const regex = /\bsticker\s*\|?\s*/i;
  return marketName.replace(regex, '').trim();
};


// Main function to show sticker capsule content
function showStickerCapContent(description, entries, contentContainer, tabStatsContainer) {
  const itemCounts = initializeItemCounts();
  updateItemCounts(entries, itemCounts);

  const tabContentElement = document.createElement('div');
  tabContentElement.innerHTML = `
    <link rel="stylesheet" href="style/case.css">
    <div class="container">
      <div class="sidebar">
        ${generateSidebarHTML(itemCounts)}
      </div>
      <div class="main-content">
        <div class="table-container">
          <div class="item-type-container">${generateItemTypeTableHTML(itemCounts)}</div>
          <div class="item-quality-container"></div>
        </div>
        <div id="content-container">
          <div class="card-container"></div>
        </div>
      </div>
    </div>
  `;
  tabStatsContainer.appendChild(tabContentElement);

  const itemTypeCheckboxes = tabContentElement.querySelectorAll('.item-type-checkbox');
  const checkAllCheckbox = tabContentElement.querySelector('#check-all');
  const itemCheckboxes = tabContentElement.querySelectorAll('.item-checkbox');

  itemTypeCheckboxes.forEach((checkbox) => checkbox.addEventListener('change', updateContainerAndTable));
  checkAllCheckbox.addEventListener('change', (event) => {
    itemCheckboxes.forEach((checkbox) => (checkbox.checked = event.target.checked));
    updateContainerAndTable();
  });
  itemCheckboxes.forEach((checkbox) => checkbox.addEventListener('change', updateContainerAndTable));

  updateContainerAndTable();

  function updateContainerAndTable() {
    const updatedItemCounts = updateContentContainer(tabContentElement, entries);
    updateItemTypeTable(tabContentElement, updatedItemCounts);
  }
}

module.exports = {
  showStickerCapContent
};