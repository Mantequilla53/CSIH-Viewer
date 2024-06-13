function showGraffitiDrop(description, entries, contentContainer, tabStatsContainer) {
  tabStatsContainer.innerHTML = `
    <link rel="stylesheet" href="style/weapondrop.css">
    <h3>${description}</h3>
  `;

  function renderContentContainer() {
    const cardContainerElement = document.createElement('div');
    cardContainerElement.classList.add('card-container');

    entries.forEach((entry) => {
      const { d, t, plusItems, minusItems } = entry;
      const items = description === 'Graffiti Used' ? minusItems : plusItems;

      const entryElement = document.createElement('div');
      entryElement.classList.add('card');
      const itemColor = extractGraffitiColor(items[0].market_name);
      entryElement.style.setProperty('--item-color', itemColor);
      entryElement.innerHTML = `
        <div class="card-header">
          <span class="date-time">${d} ${t}</span>
        </div>
        <div class="weapon-given">
          <img src="images/${items[0].itemName}.png" width="120" height="92.4">
          <span>${items[0].market_name}</span>
        </div>
      `;

      cardContainerElement.appendChild(entryElement);
    });

    contentContainer.appendChild(cardContainerElement);
  }

  renderContentContainer();
}
  
  function extractGraffitiColor(marketName) {
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
  
    const colorMatch = marketName.match(/\((.+)\)/);
    const color = colorMatch ? colorMatch[1] : '';
  
    return graffitiMap[color] || 'white';
  }
  
  module.exports = {
      showGraffitiDrop
  };