function caseContentRewrite(description, entries, contentContainer, tabStatsContainer) {
    const itemTypeCounts = {
      'Mil-Spec (Blue)': 0,
      'Restricted (Purple)': 0,
      'Classified (Pink)': 0,
      'Covert (Red)': 0,
      'Extraordinary (Knife/Glove)': 0
    };
    const expectedPercentages = {
      'Mil-Spec (Blue)': 79.923,
      'Restricted (Purple)': 15.985,
      'Classified (Pink)': 3.197,
      'Covert (Red)': 0.639,
      'Extraordinary (Knife/Glove)': 0.256
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
    <style>
    th, td {
      padding: 10px;
      text-align: middle;
    }
    .container {
      display: flex;
      justify-content: space-between;
    }
    .table-container {
      flex: 1;
      margin-right: 20px;
    }
    .item-type-counts,
    .item-quality-counts {
      margin-bottom: 20px
    }
    .minus-items {
      flex: 1;
    }
    </style>
  
      <h3>${description}</h3>
      <div class="container">
        <div class="table-container">
          <div class="item-type-counts">
            <h4>Item Type Counts:</h4>
            <table>
              <thead>
                <tr>
                  <th>Item Type</th>
                  <th>Count</th>
                  <th>Percentage</th>
                  <th>Expected Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(itemTypeCounts)
                  .map(([itemType, count]) => {
                    const percentage = ((count / totalCount) * 100).toFixed(3);
                    const expectedPercentage = expectedPercentages[itemType];
                    return `
                      <tr>
                        <td>
                          <label>
                            <input type="checkbox" class="item-type-checkbox" value="${itemType}" checked> ${itemType}
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
          <div class="item-quality-counts">
            <h4>Item Quality Counts:</h4>
            <table>
              <thead>
                <tr>
                  <th>Item Quality</th>
                  <th>Count</th>
                  <th>Percentage</th>
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
        <div class="minus-items">
          <h4>Cases Unboxed:</h4>
          <label>
            <input type="checkbox" id="check-all" checked>All Cases
          </label>
          ${Object.entries(minusItemsCount)
            .map(([item, count]) => `
              <li>
                <label>
                  <input type="checkbox" class="item-checkbox" value="${item}" checked> ${item} (${count})
                </label>
              </li>
            `)
            .join('')}
        </div>
      </div>
      <p class="totalCount">Total Count: ${totalCount}</p>
      <hr>
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
          'Mil-Spec (Blue)': 0,
          'Restricted (Purple)': 0,
          'Classified (Pink)': 0,
          'Covert (Red)': 0,
          'Extraordinary (Knife/Glove)': 0
        };
        const updatedItemQualityCounts = {
          'Factory New': 0,
          'Minimal Wear': 0,
          'Field-Tested': 0,
          'Well-Worn': 0,
          'Battle-Scarred': 0
        };
        let updatedTotalCount = 0;
      
        contentContainer.innerHTML = '';
      
        entries.forEach((entry) => {
          const { date, timestamp, plusItems, minusItems } = entry;
      
          const matchedMinusItems = minusItems.filter((minusItem) =>
            checkedItems.includes(minusItem.market_name)
          );
      
          if (matchedMinusItems.length > 0) {
            const filteredPlusItems = plusItems.filter((plusItem) =>
              selectedItemTypes.includes(plusItem.itemType)
            );
      
            if (filteredPlusItems.length > 0) {
              filteredPlusItems.forEach((plusItem) => {
                const itemType = plusItem.itemType;
                if (updatedItemTypeCounts.hasOwnProperty(itemType)) {
                  updatedItemTypeCounts[itemType]++;
                }
                const itemQuality = extractItemQuality(plusItem.market_name);
                if (updatedItemQualityCounts.hasOwnProperty(itemQuality)) {
                  updatedItemQualityCounts[itemQuality]++;
                }
              });
              updatedTotalCount += filteredPlusItems.length;
      
              const entryElement = document.createElement('div');
              entryElement.innerHTML = `
                <p>Date: ${date}</p>
                <p>Timestamp: ${timestamp}</p>
                ${filteredPlusItems.length > 0 ? `
                  <p>Given to Inventory:</p>
                  <ul>
                    ${filteredPlusItems.map(item => `<li>${item.market_name} - - ${item.itemType}</li>`).join('')}
                  </ul>
                ` : ''}
                ${matchedMinusItems.length > 0 ? `
                  <p>Taken from Inventory:</p>
                  <ul>
                    ${matchedMinusItems.map(item => `<li>${item.market_name} - - ${item.itemType}</li>`).join('')}
                  </ul>
                ` : ''}
                <hr>
              `;
              contentContainer.appendChild(entryElement);
            }
          }
        });
      
        const itemTypeTableBody = tabContentElement.querySelector('.item-type-counts tbody');
        itemTypeTableBody.innerHTML = Object.entries(updatedItemTypeCounts)
          .map(([itemType, count]) => {
            const percentage = ((count / updatedTotalCount) * 100).toFixed(3);
            const expectedPercentage = expectedPercentages[itemType];
            return `
              <tr>
                <td>
                  <label>
                    <input type="checkbox" class="item-type-checkbox" value="${itemType}" ${selectedItemTypes.includes(itemType) ? 'checked' : ''}> ${itemType}
                  </label>
                </td>
                <td>${count}/${updatedTotalCount}</td>
                <td>${percentage}%</td>
                <td>${expectedPercentage}%</td>
              </tr>
            `;
          })
          .join('');
      
        const itemQualityTableBody = tabContentElement.querySelector('.item-quality-counts tbody');
        itemQualityTableBody.innerHTML = Object.entries(updatedItemQualityCounts)
          .map(([itemQuality, count]) => {
            const percentage = ((count / updatedTotalCount) * 100).toFixed(3);
            return `
              <tr>
                <td>${itemQuality}</td>
                <td>${count}/${updatedTotalCount}</td>
                <td>${percentage}%</td>
              </tr>
            `;
          })
          .join('');
      
        const totalCountElement = tabContentElement.querySelector('.totalCount');
        totalCountElement.textContent = `Total Count: ${updatedTotalCount}`;
      }
  }
  
  function extractItemQuality(marketName) {
    const matches = marketName.match(/\(([^)]+)\)/);
    return matches ? matches[1] : 'Unknown';
  }
  
  module.exports = {
    caseContentRewrite
  };