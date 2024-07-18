function showContainerContent(description, entries, contentContainer, tabStatsContainer) {
  const { extractItemColor } = require('../utils');  
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
        <div class="weapon-given-image-container">        
          <img src="${path.join(process.resourcesPath, 'images', `${plusItems[0].itemName}.png`)}" width="120" height="92.4">
        </div>      
      <span>${plusItems[0].market_name}</span>
      </div>
      ${minusItems.length > 0 ? `
        <div class="card-footer">
          <div class="case-unboxed">
            <span class="item-name">${minusItems[0].market_name}</span>
            <img src="${path.join(process.resourcesPath, 'images', `${minusItems[0].itemName}.png`)}" alt="${minusItems[0].market_name}">
          </div>
        </div>
      ` : ''}
    `;
        cardContainer.appendChild(cardElement);
    });

}

module.exports = {
    showContainerContent
};