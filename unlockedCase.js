function showUnlockedCaseContent(description, entries, contentContainer) {
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
  
      // Render the item type counts and minus items count for the "Unlocked a case" tab
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
                    <td>${itemType}</td>
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
        <p>Total Count: ${totalCount}</p>
        <hr>
      `;
      contentContainer.appendChild(tabContentElement);
      const checkAllCheckbox = tabContentElement.querySelector('#check-all');
      const itemCheckboxes = tabContentElement.querySelectorAll('.item-checkbox');
    
      checkAllCheckbox.addEventListener('change', (event) => {
        const isChecked = event.target.checked;
        itemCheckboxes.forEach((checkbox) => {
          checkbox.checked = isChecked;
        });
        updateMinusItemsCount();
      });
    
      itemCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', updateMinusItemsCount);
      });
    
      // Update the minus items count based on the checked checkboxes
      function updateMinusItemsCount() {
        const checkedItems = Array.from(itemCheckboxes)
          .filter((checkbox) => checkbox.checked)
          .map((checkbox) => checkbox.value);
      
        const updatedMinusItemsCount = {};
        let updatedTotalCount = 0;
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
      
        entries.forEach((entry) => {
          const { plusItems, minusItems } = entry;
      
          const matchedMinusItems = minusItems.filter((minusItem) =>
            checkedItems.includes(minusItem.market_name)
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
      
            matchedMinusItems.forEach((minusItem) => {
              if (updatedMinusItemsCount[minusItem.market_name]) {
                updatedMinusItemsCount[minusItem.market_name]++;
              } else {
                updatedMinusItemsCount[minusItem.market_name] = 1;
              }
              updatedTotalCount++;
            });
          }
        });
      
        const itemTypeTableBody = tabContentElement.querySelector('.item-type-counts tbody');
        itemTypeTableBody.innerHTML = Object.entries(updatedItemTypeCounts)
          .map(([itemType, count]) => {
            const percentage = ((count / updatedTotalCount) * 100).toFixed(3);
            const expectedPercentage = expectedPercentages[itemType];
            return `
              <tr>
                <td>${itemType}</td>
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
        const totalCountElement = tabContentElement.querySelector('p:last-child');
        totalCountElement.textContent = `Total Count: ${updatedTotalCount}`;
    }
}
function extractItemQuality(marketName) {
  const matches = marketName.match(/\(([^)]+)\)/);
  return matches ? matches[1] : 'Unknown';
}

module.exports = {
    showUnlockedCaseContent
};