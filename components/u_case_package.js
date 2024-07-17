const { extractItemColor } = require('../utils');

// Define item types and expected percentages for cases and packages
const itemTypeConfig = {
  case: {
    types: ['Mil-Spec', 'Restricted', 'Classified', 'Covert', 'Extraordinary'],
    expectedPercentages: {
      'Mil-Spec': 79.923,
      'Restricted': 15.985,
      'Classified': 3.197,
      'Covert': 0.639,
      'Extraordinary': 0.256
    }
  },
  package: {
    types: ['Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert'],
    expectedPercentages: {
      'Consumer Grade': 80,
      'Industrial Grade': 16,
      'Mil-Spec': 3.2,
      'Restricted': 0.64,
      'Classified': 0.128,
      'Covert': 0.0256
    }
  }
};

// Helper function to determine content type from description
const getContentType = (description) => {
  return description.toLowerCase().includes('case') ? 'case' : 'package';
};

// Initialize item type and quality counts, expected percentages, and minus items count
const initializeItemCounts = (contentType) => {
  const itemTypeCounts = {};
  itemTypeConfig[contentType].types.forEach(type => {
    itemTypeCounts[type] = 0;
  });

  return {
    itemTypeCounts,
    expectedPercentages: itemTypeConfig[contentType].expectedPercentages,
    itemQualityCounts: {
      'Factory New': 0,
      'Minimal Wear': 0,
      'Field-Tested': 0,
      'Well-Worn': 0,
      'Battle-Scarred': 0
    },
    minusItemsCount: {},
    totalCount: 0
  };
};

// Update item counts based on entries
const updateItemCounts = (entries, itemCounts) => {
  entries.forEach((entry) => {
    const { plusItems, minusItems } = entry;
    plusItems.forEach((item) => {
      const { itemType, itemWear } = item;
      itemCounts.itemTypeCounts[itemType]++;
      itemCounts.itemQualityCounts[itemWear]++;
    });
    minusItems.forEach((item) => {
      const { market_name } = item;
      itemCounts.minusItemsCount[market_name] = (itemCounts.minusItemsCount[market_name] || 0) + 1;
      itemCounts.totalCount++;
    });
  });
};

// Generate sidebar HTML with checkboxes
const generateSidebarHTML = (itemCounts, contentType) => `
  <h4>${contentType === 'case' ? 'Cases' : 'Packages'} Unboxed:</h4>
  <ul>
    <li>
      <label>
        <input type="checkbox" id="check-all" checked>All ${contentType === 'case' ? 'Cases' : 'Packages'}
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
        <th>Expected</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(itemCounts.itemTypeCounts)
        .map(([itemType, count]) => {
          const percentage = ((count / itemCounts.totalCount) * 100).toFixed(3);
          const expectedPercentage = itemCounts.expectedPercentages[itemType];
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
              <td>${expectedPercentage}%</td>
            </tr>
          `;
        })
        .join('')}
    </tbody>
  </table>
`;

// Generate item quality table HTML
const generateItemQualityTableHTML = (itemCounts) => `
  <table class="item-quality-table">
    <thead>
      <tr>
        <th>Item Quality</th>
        <th>Count</th>
        <th>Pct %</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(itemCounts.itemQualityCounts)
        .map(([itemQuality, count]) => {
          const percentage = ((count / itemCounts.totalCount) * 100).toFixed(3);
          return `
            <tr>
              <td>${itemQuality}</td>
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
const updateContentContainer = (tabContentElement, entries, contentType) => {
  const selectedItemTypes = Array.from(tabContentElement.querySelectorAll('.item-type-checkbox:checked')).map((checkbox) => checkbox.value);
  const checkedItems = Array.from(tabContentElement.querySelectorAll('.item-checkbox:checked')).map((checkbox) => checkbox.value);

  const updatedItemCounts = initializeItemCounts(contentType);
  const contentContainerElement = tabContentElement.querySelector('#content-container');
  contentContainerElement.innerHTML = '<div class="card-container"></div>';
  const cardContainer = contentContainerElement.querySelector('.card-container');

  entries.forEach((entry) => {
    const { d, t, plusItems, minusItems } = entry;
    const matchedMinusItems = minusItems.filter((minusItem) => checkedItems.includes(minusItem.market_name));
    const filteredPlusItems = plusItems.filter((plusItem) => selectedItemTypes.includes(plusItem.itemType));

    if (matchedMinusItems.length > 0) {
      plusItems.forEach((plusItem) => {
        const { itemType, itemWear } = plusItem;
        updatedItemCounts.itemTypeCounts[itemType]++;
        updatedItemCounts.itemQualityCounts[itemWear]++;
      });
      updatedItemCounts.totalCount += matchedMinusItems.length;

      if (filteredPlusItems.length > 0) {
        const cardElement = createCardElement(d, t, filteredPlusItems, matchedMinusItems);
        cardContainer.appendChild(cardElement);
      }
    }
  });

  updateItemTypeTable(tabContentElement, updatedItemCounts);
  updateItemQualityTable(tabContentElement, updatedItemCounts);
};

// Create card element for displaying content
const createCardElement = (date, time, plusItems, matchedMinusItems) => {
  const cardElement = document.createElement('div');
  cardElement.classList.add('card');
  const itemColor = extractItemColor(plusItems[0].itemType);
  cardElement.style.setProperty('--item-color', itemColor);

  let borderColor = '';
  if (plusItems[0].market_name.startsWith('StatTrak™')) {
    borderColor = 'rgb(207, 106, 50)';
  } else if (plusItems[0].market_name.toLowerCase().includes('souvenir')) {
    borderColor = 'rgb(255, 215, 0)';
  }

  cardElement.innerHTML = `
  <div class="card-header">
    <span class="date-time">${date} ${time}</span>
  </div>
  <div class="weapon-given">
    <div class="weapon-given-image-container" ${borderColor ? `style="border-color: ${borderColor};"` : ''}>
      <img src="images/${plusItems[0].itemName}.png" width="120" height="92.4">
      <span class="item-wear">${shortenItemWear(plusItems[0].itemWear)}</span>
    </div>
    <span>${formatItemName(plusItems[0].market_name)}</span>
  </div>
  ${matchedMinusItems.length > 0 ? `
    <div class="card-footer">
      <div class="case-unboxed">
        <span class="item-name">${matchedMinusItems[0].market_name.startsWith('Operation') ? matchedMinusItems[0].market_name.slice(9) : matchedMinusItems[0].market_name}</span>
        <img src="images/${matchedMinusItems[0].itemName}.png" alt="${matchedMinusItems[0].market_name}">
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
    const expectedPercentage = updatedItemCounts.expectedPercentages[itemType];

    row.querySelector('td:nth-child(2)').textContent = `${count}/${updatedItemCounts.totalCount}`;
    row.querySelector('td:nth-child(3)').textContent = `${percentage}%`;
    row.querySelector('td:nth-child(4)').textContent = `${expectedPercentage}%`;
  });
};

// Update item quality table with updated counts and percentages
const updateItemQualityTable = (tabContentElement, updatedItemCounts) => {
  const itemQualityTableBody = tabContentElement.querySelector('.item-quality-table tbody');
  itemQualityTableBody.querySelectorAll('tr').forEach((row) => {
    const itemQuality = row.querySelector('td:first-child').textContent;
    const count = updatedItemCounts.itemQualityCounts[itemQuality];
    const percentage = ((count / updatedItemCounts.totalCount) * 100).toFixed(3);

    row.querySelector('td:nth-child(2)').textContent = `${count}/${updatedItemCounts.totalCount}`;
    row.querySelector('td:nth-child(3)').textContent = `${percentage}%`;
  });
};

// Format item name for display
const formatItemName = (itemName) => {
  const parts = itemName.split('|');
  return parts.length > 1 ? `${parts[0]}<br>${parts[1].trim()}` : itemName;
};

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

// Main function to show content
function showCasePackageContent(description, entries, contentContainer, tabStatsContainer) {
  const contentType = getContentType(description);
  const itemCounts = initializeItemCounts(contentType);
  updateItemCounts(entries, itemCounts);

  const tabContentElement = document.createElement('div');
  tabContentElement.innerHTML = `
    <link rel="stylesheet" href="style/case.css">
    <div class="container">
      <div class="sidebar">
        ${generateSidebarHTML(itemCounts, contentType)}
      </div>
      <div class="main-content">
        <div class="table-container">
          <div class="item-type-container">${generateItemTypeTableHTML(itemCounts)}</div>
          <div class="item-quality-container">${generateItemQualityTableHTML(itemCounts)}</div>
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

  itemTypeCheckboxes.forEach((checkbox) => checkbox.addEventListener('change', () => updateContentContainer(tabContentElement, entries, contentType)));
  checkAllCheckbox.addEventListener('change', (event) => {
    itemCheckboxes.forEach((checkbox) => (checkbox.checked = event.target.checked));
    updateContentContainer(tabContentElement, entries, contentType);
  });
  itemCheckboxes.forEach((checkbox) => checkbox.addEventListener('change', () => updateContentContainer(tabContentElement, entries, contentType)));

  updateContentContainer(tabContentElement, entries, contentType);
}

module.exports = {
  showCasePackageContent
};