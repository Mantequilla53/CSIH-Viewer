function showDefaultCards(description, entries, contentContainer, tabStatsContainer) {
	tabStatsContainer.innerHTML = `
    <link rel="stylesheet" href="style/weapondrop.css">
    <h3>${description}</h3>
  `;

	function renderContentContainer() {
		const cardContainerElement = document.createElement('div');
		cardContainerElement.classList.add('card-container');

		const itemFilter = entries[0].plusItems && entries[0].plusItems.length > 0 ? 'plusItems' : 'minusItems';

		entries.forEach((entry) => {
			const { d, t, plusItems, minusItems } = entry;
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
			}

			entryElement.innerHTML = `
        <div class="card-header">
          <span class="date-time">${d} ${t}</span>
        </div>
        <div class="weapon-given">
          <img src="${path.join(process.resourcesPath, 'images', `${item.itemName}.png`)}" width="120" height="92.4">
          <span>${displayName}</span>
          ${displayCount}
        </div>
      `;

			cardContainerElement.appendChild(entryElement);
		});

		contentContainer.appendChild(cardContainerElement);
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

//
function extractItemColor(marketName) {
	const itemMap = {
		'Battle Green': '#789d53',
		'Monarch Blue': '#4e7fa9',
		'Monster Purple': '#6e4f9f',
		'Princess Pink': '#9d567a',
		'SWAT Blue': '#4c5b98',
		'Tiger Orange': '#b87148',
		'Tracer Yellow': '#d4c95b',
		'Violent Violet': '#af92df',
		'War Pig Pink': '#e4ccd5',
		'Wire Blue': '#6ba5b2',
		'Bazooka Pink': '#ba68b2',
		'Blood Red': '#b14d4d',
		'Brick Red': '#874444',
		'Cash Green': '#a6c4a5',
		'Desert Amber': '#ae833d',
		'Dust Brown': '#8f7d5d',
		'Frog Green': '#488f80',
		'Jungle Green': '#417a4a',
		'Shark White': '#c1c1c1',
		'Consumer Grade': 'rgb(176, 195, 217)',
		'Industrial Grade': 'rgb(94, 152, 217)',
		'Mil-Spec': 'rgb(75, 105, 255)',
		'High Grade Patch': 'rgb(75, 105, 255)',
		'High Grade Collectible': 'rgb(75, 105, 255)',
		'High Grade Graffiti': 'rgb(75, 105, 255)',
		'High Grade Sticker': 'rgb(75, 105, 255)',
		'Restricted': 'rgb(136, 71, 255)',
		'Remarkable Patch': 'rgb(136, 71, 255)',
		'Remarkable Collectible': 'rgb(136, 71, 255)',
		'Remarkable Graffiti': 'rgb(136, 71, 255)',
		'Remarkable Sticker': 'rgb(136, 71, 255)',
		'Classified': 'rgb(211, 44, 230)',
		'Exotic Patch': 'rgb(211, 44, 230)',
		'Exotic Collectible': 'rgb(211, 44, 230)',
		'Exotic Graffiti': 'rgb(211, 44, 230)',
		'Exotic Sticker': 'rgb(211, 44, 230)',
		'Covert': 'rgb(235, 75, 75)',
		'Extraordinary Collectible': 'rgb(235, 75, 75)',
		'Extraordinary Sticker': 'rgb(235, 75, 75)',
		'Extraordinary': 'rgb(255, 215, 0)'
	};
	return itemMap[marketName] || 'white';
}

module.exports = {
	showDefaultCards
};