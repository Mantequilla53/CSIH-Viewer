function showCaseContent(description, entries, contentContainer, tabStatsContainer) {
  const itemTypeCounts = {
    'Mil-Spec': 0,
    'Restricted': 0,
    'Classified': 0,
    'Covert': 0,
    'Extraordinary': 0
  };
  const expectedPercentages = {
    'Mil-Spec': 79.923,
    'Restricted': 15.985,
    'Classified': 3.197,
    'Covert': 0.639,
    'Extraordinary': 0.256
  };
  const itemQualityCounts = {
    'Factory New': 0,
    'Minimal Wear': 0,
    'Field-Tested': 0,
    'Well-Worn': 0,
    'Battle-Scarred': 0
  };
  const minusItemsCount = {};
  let totalCount = 0;

  entries.forEach((entry) => {
    const { plusItems, minusItems } = entry;
    plusItems.forEach((item) => {
      const itemType = item.itemType;
      if (itemTypeCounts.hasOwnProperty(itemType)) {
        itemTypeCounts[itemType]++;
      }
      const itemQuality = extractItemQuality(item.market_name);
      if (itemQualityCounts.hasOwnProperty(itemQuality)) {
        itemQualityCounts[itemQuality]++;
      }
    });
    minusItems.forEach((item) => {
      if (minusItemsCount[item.market_name]) {
        minusItemsCount[item.market_name]++;
      } else {
        minusItemsCount[item.market_name] = 1;
      }
      totalCount++;
    });
  });

  const tabContentElement = document.createElement('div');
  tabContentElement.innerHTML = `
    <link rel="stylesheet" href="style/case.css">
    <div class="container">
      <div class="sidebar">
        <h4>Cases Unboxed:</h4>
        <ul>
        <li>
          <label>
            <input type="checkbox" id="check-all" checked>All Cases
          </label>
        </li>
        ${Object.entries(minusItemsCount)
          .map(([item, count]) => `
            <li>
              <label title="${item}">
                <input type="checkbox" class="item-checkbox" value="${item}" checked>
                ${item.startsWith('Operation') ? item.slice(9) : item} (${count})
              </label>
            </li>
          `)
          .join('')}
      </ul>
      </div>
      <div class="content">
      <div class="table-container">
        <div class="item-type-container">
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
            ${Object.entries(itemTypeCounts)
              .map(([itemType, count]) => {
                const percentage = ((count / totalCount) * 100).toFixed(3);
                const expectedPercentage = expectedPercentages[itemType];
                const itemColor = extractItemColor(itemType);
                return `
                  <tr>
                    <td>
                      <label>
                        <input type="checkbox" class="item-type-checkbox" value="${itemType}" checked>
                          <span style="display: inline-block; width: 10px; height: 10px; background-color: ${itemColor}; margin-right: 5px;"></span> ${itemType}
                        <span style="display: inline-block; width: 10px; height: 10px; background-color: ${itemColor}; margin-left: 5px;"></span>
                      </label>
                    </td>
                    <td>${count}/${totalCount}</td>
                    <td>${percentage}%</td>
                    <td>${expectedPercentage}%</td>
                  </tr>
                `;
              })
              .join('')}
            </tbody>
          </table>
        </div>
        <div class="item-quality-container">
          <table class="item-quality-table">
            <thead>
              <tr>
                <th>Item Quality</th>
                <th>Count</th>
                <th>Pct %</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(itemQualityCounts)
                .map(([itemQuality, count]) => {
                  const percentage = ((count / totalCount) * 100).toFixed(3);
                  return `
                    <tr>
                      <td>${itemQuality}</td>
                      <td>${count}/${totalCount}</td>
                      <td>${percentage}%</td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div id="content-container"></div>
    </div>
  </div>
    `;
  tabStatsContainer.appendChild(tabContentElement);

  const itemTypeCheckboxes = tabContentElement.querySelectorAll('.item-type-checkbox');
  const checkAllCheckbox = tabContentElement.querySelector('#check-all');
  const itemCheckboxes = tabContentElement.querySelectorAll('.item-checkbox');

  itemTypeCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', updateContentContainer);
  });

  checkAllCheckbox.addEventListener('change', (event) => {
    const isChecked = event.target.checked;
    itemCheckboxes.forEach((checkbox) => {
      checkbox.checked = isChecked;
    });
    updateContentContainer();
  });

  itemCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', updateContentContainer);
  });

  updateContentContainer();

  function updateContentContainer() {
    const selectedItemTypes = Array.from(itemTypeCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);
    const checkedItems = Array.from(itemCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    const updatedItemTypeCounts = {
      'Mil-Spec': 0,
      'Restricted': 0,
      'Classified': 0,
      'Covert': 0,
      'Extraordinary': 0
    };
    const updatedItemQualityCounts = {
      'Factory New': 0,
      'Minimal Wear': 0,
      'Field-Tested': 0,
      'Well-Worn': 0,
      'Battle-Scarred': 0
    };
    let updatedTotalCount = 0;
    const contentContainerElement = tabContentElement.querySelector('#content-container');
    contentContainerElement.innerHTML = '';

    contentContainerElement.innerHTML = `
    <div class="card-container"></div>`;
    const cardContainer = contentContainerElement.querySelector('.card-container');

    entries.forEach((entry) => {
      const { d, t, plusItems, minusItems } = entry;

      const matchedMinusItems = minusItems.filter((minusItem) =>
        checkedItems.includes(minusItem.market_name)
      );

      const filteredPlusItems = plusItems.filter((plusItem) =>
        selectedItemTypes.includes(plusItem.itemType)
      );

      if (matchedMinusItems.length > 0) {
        plusItems.forEach((plusItem) => {
          const itemType = plusItem.itemType;
          if (updatedItemTypeCounts.hasOwnProperty(itemType)) {
            updatedItemTypeCounts[itemType]++;
          }
          const itemQuality = extractItemQuality(plusItem.market_name);
          if (updatedItemQualityCounts.hasOwnProperty(itemQuality)) {
            updatedItemQualityCounts[itemQuality]++;
          }
        });
        updatedTotalCount += matchedMinusItems.length;

        if (filteredPlusItems.length > 0) {
          const cardElement = document.createElement('div');
          cardElement.classList.add('card');
    
          const itemColor = extractItemColor(filteredPlusItems[0].itemType);
          cardElement.style.setProperty('--item-color', itemColor);
    
          cardElement.innerHTML = `
            <div class="card-header">
              <span class="date-time">${d} ${t}</span>
            </div>
            <div class="weapon-given">
              <ul class="no-bullet">
              ${filteredPlusItems.map(item => {
                return `<li>
                  <img src="images/${item.itemName}.png" width="120" height="92.4">
                  <span>${formatItemName(item.market_name)}</span>
              </li>`;
              }).join('')}
              </ul>
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

          cardContainer.appendChild(cardElement);
        }
      }
    });

    const itemTypeTableBody = tabContentElement.querySelector('.item-type-table tbody');
    itemTypeTableBody.querySelectorAll('tr').forEach((row) => {
      const itemType = row.querySelector('.item-type-checkbox').value;
      const count = updatedItemTypeCounts[itemType];
      const percentage = ((count / updatedTotalCount) * 100).toFixed(3);
      const expectedPercentage = expectedPercentages[itemType];

      row.querySelector('td:nth-child(2)').textContent = `${count}/${updatedTotalCount}`;
      row.querySelector('td:nth-child(3)').textContent = `${percentage}%`;
      row.querySelector('td:nth-child(4)').textContent = `${expectedPercentage}%`;
    });

    const itemQualityTableBody = tabContentElement.querySelector('.item-quality-table tbody');
    itemQualityTableBody.querySelectorAll('tr').forEach((row) => {
      const itemQuality = row.querySelector('td:first-child').textContent;
      const count = updatedItemQualityCounts[itemQuality];
      const percentage = ((count / updatedTotalCount) * 100).toFixed(3);

      row.querySelector('td:nth-child(2)').textContent = `${count}/${updatedTotalCount}`;
      row.querySelector('td:nth-child(3)').textContent = `${percentage}%`;
    });

    const totalCountElement = tabContentElement.querySelector('.totalCount');
    totalCountElement.textContent = `Total Count: ${updatedTotalCount}`;
  }
}

function extractItemQuality(marketName) {
  const matches = marketName.match(/\(([^)]+)\)/);
  return matches ? matches[1] : 'Unknown';
}

function extractItemColor(itemType) {
  const colorMap = {
    'Mil-Spec': 'rgb(75, 105, 255)',
    'Restricted': 'rgb(136, 71, 255)',
    'Classified': 'rgb(211, 44, 230)',
    'Covert': 'rgb(235, 75, 75)',
    'Extraordinary': 'rgb(255, 215, 0)'
  };
  return colorMap[itemType] || 'white';
}


function formatItemName(itemName) {
  const parts = itemName.split('|');
  if (parts.length > 1) {
    return `${parts[0]}<br>${parts[1].trim()}`;
  }
  return itemName;
}
module.exports = {
  showCaseContent
};