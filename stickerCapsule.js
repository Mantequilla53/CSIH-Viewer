function showStickerCapContent(description, entries, contentContainer, tabStatsContainer) {
  const itemTypeCounts = {
    'High Grade Sticker': 0,
    'Remarkable Sticker': 0,
    'Exotic Sticker': 0,
    'Extraordinary Sticker': 0,
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
              </tr>
            </thead>
            <tbody>
            ${Object.entries(itemTypeCounts)
              .map(([itemType, count]) => {
                const percentage = ((count / totalCount) * 100).toFixed(3);
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
      'High Grade Sticker': 0,
      'Remarkable Sticker': 0,
      'Exotic Sticker': 0,
      'Extraordinary Sticker': 0,
    };
    let updatedTotalCount = 0;
    const contentContainerElement = tabContentElement.querySelector('#content-container');
    contentContainerElement.innerHTML = '';
    
    contentContainerElement.innerHTML = `
      <div class="card-container"></div>
    `;
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
        });
        updatedTotalCount += matchedMinusItems.length;
      
        if (filteredPlusItems.length > 0) {
          const cardElement = document.createElement('div');
          cardElement.classList.add('card');
              
          const itemColor = extractItemColor(filteredPlusItems[0].itemType);
          cardElement.style.setProperty('--item-color', itemColor);

          const { part1, part2 } = formatItemName(removeSticker(filteredPlusItems[0].market_name));

          cardElement.innerHTML = `
          <div class="card-header">
            <span class="date-time">${d} ${t}</span>
          </div>
          <div class="weapon-given">
            <ul class="no-bullet">
            ${filteredPlusItems.map(item => {
              return `<li>
                <img data-src="${path.join(process.resourcesPath, 'images', `${item.itemName}.png`)}" class="lazy-image">
                <span>${part1}<br>${part2}</span>
              </li>`;
            }).join('')}
            </ul>
          </div>
          ${matchedMinusItems.length > 0 ? `
          <div class="card-footer">
            <div class="case-unboxed">
              <span class="item-name">${matchedMinusItems.map(item => {
                let marketName = removeSticker(item.market_name);
                if (part2) {marketName = marketName.replace(part2, '').trim();}
                if (marketName.endsWith('|')) {marketName = marketName.slice(0, -1).trim();}
                return marketName;
              }).join(', ')}</span>
              <img data-src="${path.join(process.resourcesPath, 'images', `${matchedMinusItems[0].itemName}.png`)}" class="lazy-image">
            </div>
          </div>
          ` : ''}
          `;
        cardContainer.appendChild(cardElement);        
      }
      }
    });
    lazyLoadImages();
        // Update the item type table
    const itemTypeTableBody = tabContentElement.querySelector('.item-type-table tbody');
    itemTypeTableBody.querySelectorAll('tr').forEach((row) => {
      const itemType = row.querySelector('.item-type-checkbox').value;
      const count = updatedItemTypeCounts[itemType];
      const percentage = ((count / updatedTotalCount) * 100).toFixed(3);

      row.querySelector('td:nth-child(2)').textContent = `${count}/${updatedTotalCount}`;
      row.querySelector('td:nth-child(3)').textContent = `${percentage}%`;
    });   
    const totalCountElement = tabContentElement.querySelector('.totalCount');
    totalCountElement.textContent = `Total Count: ${updatedTotalCount}`;
  }
}

function removeSticker(marketName) {
  const regex = /\bsticker\s*\|?\s*/i;
  return marketName.replace(regex, '').trim();
}

function formatItemName(itemName) {
  const parts = itemName.split('|');
  if (parts.length > 1) {
    return { part1: parts[0], part2: parts[1].trim() };
  }
  return { part1: itemName, part2: '' };
}
function extractItemColor(itemType) {
  const colorMap = {
    'High Grade Sticker': 'rgb(75, 105, 255)',
    'Remarkable Sticker': 'rgb(136, 71, 255)',
    'Exotic Sticker': 'rgb(211, 44, 230)',
    'Extraordinary Sticker': 'rgb(235, 75, 75)'
  };
  return colorMap[itemType] || 'white';
}

function lazyLoadImages() {
  const lazyImages = document.querySelectorAll('.lazy-image');

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const image = entry.target;
        const src = image.getAttribute('data-src');
        image.setAttribute('src', src);
        image.onerror = () => {
          console.error('Error loading image:', src);
          // Handle the error, e.g., display a default image or remove the image element
        };
        image.onload = () => {
          image.classList.remove('lazy-image');
          observer.unobserve(image);
        };
      }
    });
  });

  lazyImages.forEach(image => {
    observer.observe(image);
  });
}
module.exports = {
    showStickerCapContent
  };