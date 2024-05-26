function showDropContent(description, entries, contentContainer, tabStatsContainer) {
	const itemCounts = {};
  
	entries.forEach((entry) => {
	  const { plusItems } = entry;
	  plusItems.forEach((item) => {
		const itemName = item.market_name;
		if (itemCounts[itemName]) {
		  itemCounts[itemName].count++;
		} else {
		  itemCounts[itemName] = { count: 1, imgSrc: item.itemName, itemSet: item.itemSetName, itemColor: item.itemType };
		}
	  });
	});
  
	tabStatsContainer.innerHTML = `
    <link rel="stylesheet" href="style/drops.css">
    <h3>${description}</h3>
    <div class="card-container">
      ${Object.entries(itemCounts)
        .map(
          ([item, { count, imgSrc, itemSet, itemColor }]) => {
            const [itemName, itemSubName, itemVariant] = item.split(/\s*\|\s*|\s*\(\s*|\s*\)\s*/);
            const isGraffitiDrop = description === 'Earned a graffiti drop';
            const cardColor = isGraffitiDrop ? extractGraffitiColor(itemVariant) : extractItemColor(itemColor);
            return `
              <div class="item-card" style="--item-color: ${cardColor}">
                <img src="images/${imgSrc}.png" alt="${item}">
                <div class="item-info">
                  <h4>${itemName}</h4>
                  ${itemSubName ? `<p>${itemSubName}</p>` : ''}
                  ${itemVariant ? `<p>${itemVariant}</p>` : ''}
                  ${itemSet ? `<p>${itemSet}</p>` : ''}
                  ${count > 1 ? `<p>Count: ${count}</p>` : ''}
                </div>
              </div>
            `;
          }
        )
        .join('')}
    </div>
  `;

	function renderContentContainer() {
		entries.forEach((entry) => {
			const {
				d,
				t,
				plusItems,
				minusItems,
				tradeName
			} = entry;
			const entryElement = document.createElement('div');
			entryElement.innerHTML = `
          <p>Date: ${d}</p>
          <p>Timestamp: ${t}</p>
          ${tradeName ? `<p>Trade Name: ${tradeName}</p>` : ''}
          ${plusItems.length > 0 ? `
            <p>Given to Inventory:</p>
            <ul>
              ${plusItems.map(item => `<li>${item.market_name} - - ${item.itemType}</li>`).join('')}
            </ul>
          ` : ''}
          ${minusItems.length > 0 ? `
            <p>Taken from Inventory:</p>
            <ul>
              ${minusItems.map(item => `<li>${item.market_name} - - ${item.itemType}</li>`).join('')}
            </ul>
          ` : ''} 
          <hr>
          `;
			contentContainer.appendChild(entryElement);
		});
	}
	renderContentContainer();
}

function extractItemColor(itemType) {
    const colorMap = {
      'Consumer Grade': 'rgb(176, 195, 217)',
      'Industrial Grade': 'rgb(94, 152, 217)',
      'Mil-Spec': 'rgb(75, 105, 255)',
      'Restricted': 'rgb(136, 71, 255)',
      'Classified': 'rgb(211, 44, 230)',
      'Covert': 'rgb(235, 75, 75)',
      'Extraordinary': 'rgb(255, 215, 0)'
    };
    return colorMap[itemType] || 'white';
}
function extractGraffitiColor(graffitiColor) {
	const graffitiMap = {
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
		'Shark White': '#c1c1c1'
	};
	return graffitiMap[graffitiColor];
}
module.exports = {
	showDropContent
};