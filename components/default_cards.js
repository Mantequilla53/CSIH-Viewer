function showDefaultCards(description, entries, contentContainer, tabStatsContainer) {
	const { extractItemColor } = require('../utils');
	tabStatsContainer.innerHTML = `
    <link rel="stylesheet" href="style/weapondrop.css">
    <h3>${description}</h3>
  `;

	function renderContentContainer() {
		
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

		const itemFilter = entries[0].plusItems && entries[0].plusItems.length > 0 ? 'plusItems' : 'minusItems';

		entries.forEach((entry) => {
			const { d, t, plusItems, minusItems, tradeName } = entry;
			const items = entry[itemFilter];
			const item = items[0];
			const entryElement = document.createElement('div');
			entryElement.classList.add('card');

			let itemColor;
			if (/^(Graffiti|Sealed Graffiti)/.test(item.market_name)) {
				const colorMatch = item.market_name.match(/\((.+)\)/);
				if (colorMatch) {
					itemColor = extractItemColor(colorMatch[1]);
				} else {
					itemColor = extractItemColor(item.itemType);
				}
			} else {
				itemColor = extractItemColor(item.itemType);
			}
			entryElement.style.setProperty('--item-color', itemColor);

			let displayName = item.market_name;
      		let displayCount = '';
      		let borderColor = '';

      		if (displayName.startsWith('StatTrak')) {
        		borderColor = 'rgb(207, 106, 50)';
      		} else if (displayName.includes('Souvenir')) {
       			 borderColor = 'rgb(255, 215, 0)';
      		}

			const starMatch = item.market_name.match(/^(\d+) Stars? for (.+)$/);
			if (starMatch) {
				const totalStars = items.reduce((sum, item) => {
					const match = item.market_name.match(/^(\d+) Stars? for /);
					return sum + (match ? parseInt(match[1]) : 0);
				}, 0);
				displayName = `${totalStars} Stars for ${starMatch[2]}`;
			} else if (description === 'Purchased from the store') {
				const { name, count } = removeCoupons(plusItems, minusItems);
				displayName = name;
				if (count > 1) {
					displayCount = `<span class="item-count">Count: ${count}</span>`;
				  }
			} else if (items.length > 1) {
				displayCount = `<span class="item-count">Count: ${items.length}</span>`;
			} else if (description === 'Purchased on Community Market') {
				if (tradeName) {
					displayCount = `<span class="item-count">Price: ${tradeName}</span>`;
				} else {
					displayCount = '<span class="item-count-undefined">Price: Undefined</span>';
				}
			}

			entryElement.innerHTML = `
        <div class="card-header">
          <span class="date-time">${d} ${t}</span>
        </div>
        <div class="weapon-given">
          <div class="weapon-given-image-container" style="border-color: ${borderColor}">
            <img src="${path.join(process.resourcesPath, 'images', `${item.itemName}.png`)}" width="120" height="92.4">
            ${item.itemWear ? `<span class="item-wear">${shortenItemWear(item.itemWear)}</span>` : ''}
            ${item.stickers && item.stickers.length > 0 ? `
              <div class="sticker-separator"></div>
              <div class="sticker-images">
                ${item.stickers.map((sticker) => `
                  <img src="${path.join(process.resourcesPath, 'images', `${sticker.imgSrc}.png`)}" width="45" height="45">
                `).join('')}
              </div>
            ` : ''}
          </div>
          <span>${displayName}</span>
          <div>${displayCount}</div>
        </div>
      `;

contentContainer.appendChild(entryElement);
		});
	}
	renderContentContainer();
}
function removeCoupons(plusItems, minusItems) {
	const minusItemsCount = new Map();
				minusItems.forEach((item) => {
				  const key = `${item.itemName}-${item.market_name}`;
				  if (minusItemsCount.has(key)) {
					minusItemsCount.set(key, minusItemsCount.get(key) + 1);
				  } else {
					minusItemsCount.set(key, 1);
				  }
				});
		
				const filteredPlusItems = plusItems.filter((item) => {
				  const key = `${item.itemName}-${item.market_name}`;
				  if (minusItemsCount.has(key)) {
					const count = minusItemsCount.get(key);
					if (count > 0) {
					  minusItemsCount.set(key, count - 1);
					  return false;
					}
				  }
				  return true;
				});
		
				const plusItemsCount = new Map();
				filteredPlusItems.forEach((item) => {
				  if (plusItemsCount.has(item.market_name)) {
					plusItemsCount.set(item.market_name, plusItemsCount.get(item.market_name) + 1);
				  } else {
					plusItemsCount.set(item.market_name, 1);
				  }
				});
		
				if (plusItemsCount.size > 0) {
				  const [name, count] = [...plusItemsCount.entries()][0];
				  return { name, count };
				}
				return { name: '', count: 0 };
}

module.exports = {
	showDefaultCards
};