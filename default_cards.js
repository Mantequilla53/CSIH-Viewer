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
        const { d, t } = entry;
        const item = entry[itemFilter][0];
        const entryElement = document.createElement('div');
        entryElement.classList.add('card');
        const itemColor = extractItemColor(item.itemType);
        entryElement.style.setProperty('--item-color', itemColor);
        entryElement.innerHTML = `
          <div class="card-header">
            <span class="date-time">${d} ${t}</span>
          </div>
          <div class="weapon-given">
            <img src="images/${item.itemName}.png" width="120" height="92.4">
            <span>${item.market_name}</span>
          </div>
        `;
  
        cardContainerElement.appendChild(entryElement);
      });
  
      contentContainer.appendChild(cardContainerElement);
    }
  
    renderContentContainer();
  }
  
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
    //blue
    'Mil-Spec': 'rgb(75, 105, 255)',
    'High Grade Patch': 'rgb(75, 105, 255)',
    'High Grade Collectible': 'rgb(75, 105, 255)',
    'High Grade Graffiti': 'rgb(75, 105, 255)',
    'High Grade Sticker': 'rgb(75, 105, 255)',
    //purple
    'Restricted': 'rgb(136, 71, 255)',
    'Remarkable Patch': 'rgb(136, 71, 255)',
    'Remarkable Collectible': 'rgb(136, 71, 255)',
    'Remarkable Graffiti': 'rgb(136, 71, 255)',
    'Remarkable Sticker': 'rgb(136, 71, 255)',
    //pink
    'Classified': 'rgb(211, 44, 230)',
    'Exotic Patch': 'rgb(211, 44, 230)',
    'Exotic Collectible': 'rgb(211, 44, 230)',
    'Exotic Graffiti': 'rgb(211, 44, 230)',
    'Exotic Sticker': 'rgb(211, 44, 230)',
    //red
    'Covert': 'rgb(235, 75, 75)',
    'Extraordinary Collectible': 'rgb(235, 75, 75)',
    'Extraordinary Sticker': 'rgb(235, 75, 75)',
    //yellow
    'Extraordinary': 'rgb(255, 215, 0)'
    };
  
    const colorMatch = marketName.match(/\((.+)\)/);
    const color = colorMatch ? colorMatch[1] : '';
  
    return itemMap[color] || 'white';
  }
  
  module.exports = {
    showDefaultCards
  };