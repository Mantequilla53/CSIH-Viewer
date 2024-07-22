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
            <input type="checkbox" class="capsule-checkbox" value="${item}" checked>
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
        <img src="https://community.akamai.steamstatic.com/economy/image/${plusItems[0].itemName}/330x192?allow_animated=1">
      </div>
      <span>${removeSticker(plusItems[0].market_name)}</span>
    </div>
    ${matchedMinusItems.length > 0 ? `
      <div class="card-footer">
        <div class="case-unboxed">
          <span class="item-name">${matchedMinusItems[0].market_name}</span>
          <img src="https://community.akamai.steamstatic.com/economy/image/${matchedMinusItems[0].itemName}/330x192?allow_animated=1" alt="${matchedMinusItems[0].market_name}">
        </div>
      </div>
    ` : ''}
  `;

  return cardElement;
};

// Update item type table with updated counts and percentages
const updateItemTypeTable = (tabContentElement, updatedItemCounts, filteredTotalCount) => {
  const itemTypeTableBody = tabContentElement.querySelector('.item-type-table tbody');
  itemTypeTableBody.querySelectorAll('tr').forEach((row) => {
    const itemType = row.querySelector('.item-type-checkbox').value;
    const count = updatedItemCounts.itemTypeCounts[itemType];
    const percentage = ((count / filteredTotalCount) * 100).toFixed(3);

    row.querySelector('td:nth-child(2)').textContent = `${count}/${filteredTotalCount}`;
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

  let currentPage = 1;
  const itemsPerPage = 50;
  let observer;
  let filteredEntries = [];
  let displayFilteredEntries = [];

  function updateContainerAndTable() {
    currentPage = 1;
    const cardContainer = tabContentElement.querySelector('.card-container');
    cardContainer.innerHTML = '';
    
    const checkedItems = getCheckedItems();
    const selectedItemTypes = getSelectedItemTypes();
    
    filteredEntries = filterEntriesByCapsules(entries, checkedItems);
    const updatedItemCounts = calculateItemCounts(filteredEntries);
    const filteredTotalCount = calculateTotalCount(filteredEntries);
    
    displayFilteredEntries = filterEntriesByItemTypes(filteredEntries, selectedItemTypes);
    
    renderCards();
    updateItemTypeTable(tabContentElement, updatedItemCounts, filteredTotalCount);
  }

  function getCheckedItems() {
    return Array.from(tabContentElement.querySelectorAll('.capsule-checkbox:checked')).map((checkbox) => checkbox.value);
  }

  function getSelectedItemTypes() {
    return Array.from(tabContentElement.querySelectorAll('.item-type-checkbox:checked')).map((checkbox) => checkbox.value);
  }

  function filterEntriesByCapsules(entries, checkedItems) {
    return entries.filter((entry) => {
      return entry.minusItems.some((minusItem) => checkedItems.includes(minusItem.market_name));
    });
  }

  function filterEntriesByItemTypes(entries, selectedItemTypes) {
    return entries.filter((entry) => {
      return entry.plusItems.some((plusItem) => selectedItemTypes.includes(plusItem.itemType));
    });
  }

  function calculateItemCounts(entries) {
    const counts = initializeItemCounts();
    entries.forEach((entry) => {
      entry.plusItems.forEach((item) => {
        counts.itemTypeCounts[item.itemType]++;
      });
    });
    return counts;
  }

  function calculateTotalCount(entries) {
    return entries.reduce((total, entry) => total + entry.minusItems.length, 0);
  }

  function renderCards() {
    const cardContainer = tabContentElement.querySelector('.card-container');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const entriesToRender = displayFilteredEntries.slice(startIndex, endIndex);

    entriesToRender.forEach((entry) => {
      const { d, t, plusItems, minusItems } = entry;
      const cardElement = createCardElement(d, t, plusItems, minusItems);
      cardContainer.appendChild(cardElement);
    });

    if (entriesToRender.length > 0) {
      const lastEntry = cardContainer.lastElementChild;
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
    renderCards();
  }

  updateContainerAndTable();

  // Event listeners
  tabContentElement.querySelectorAll('.item-type-checkbox, .capsule-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', updateContainerAndTable);
  });

  const checkAllCheckbox = tabContentElement.querySelector('#check-all');
  checkAllCheckbox.addEventListener('change', (event) => {
    tabContentElement.querySelectorAll('.capsule-checkbox').forEach((checkbox) => {
      checkbox.checked = event.target.checked;
    });
    updateContainerAndTable();
  });
}

module.exports = {
  showStickerCapContent
};