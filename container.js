function showContainerContent(description, entries, contentContainer, tabStatsContainer) {
    //used to display patches, pins and graffiti boxes
    tabStatsContainer.innerHTML = `<link rel="stylesheet" href="style/case.css">
    <h2>${description}</h2>`;
    
    contentContainer.innerHTML = `<div class="card-container"></div>`;
    const cardContainer = contentContainer.querySelector('.card-container');

    entries.forEach((entry) => {
        const { d, t, plusItems, minusItems } = entry;
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        
        const itemColors = plusItems.map(item => extractItemColor(item.itemType));
        cardElement.style.setProperty('--item-color', itemColors);
        
        cardElement.innerHTML = `
        <div class="card-header">
        <span class="date-time">${d} ${t}</span>
      </div>
      <div class="weapon-given">
        <ul class="no-bullet">
          ${plusItems.map(item => {
            return `<li>
              <img src="images/${item.itemName}.png" width="120" height="92.4">
              <span>${item.market_name}</span>
            </li>`;
          }).join('')}
        </ul>
      </div>
      ${minusItems.length > 0 ? `
        <div class="card-footer">
          <div class="case-unboxed">
            <span class="item-name">${minusItems[0].market_name}</span>
            <img src="images/${minusItems[0].itemName}.png" alt="${minusItems[0].market_name}">
          </div>
        </div>
      ` : ''}
    `;
        cardContainer.appendChild(cardElement);
    });

}

function extractItemColor(itemType) {
    const colorMap = {
    //patches
    'High Grade Patch': 'rgb(75, 105, 255)',
    'Remarkable Patch': 'rgb(136, 71, 255)',
    'Exotic Patch': 'rgb(211, 44, 230)',
    //pins
    'High Grade Collectible': 'rgb(75, 105, 255)',
    'Remarkable Collectible': 'rgb(136, 71, 255)',
    'Exotic Collectible': 'rgb(211, 44, 230)',
    'Extraordinary Collectible': 'rgb(235, 75, 75)',
    //Graffiti
    'High Grade Graffiti': 'rgb(75, 105, 255)',
    'Remarkable Graffiti': 'rgb(136, 71, 255)',
    'Exotic Graffiti': 'rgb(235, 75, 75)'
    };
    return colorMap[itemType] || 'white';
}
module.exports = {
    showContainerContent
};