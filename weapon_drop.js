function showWeaponDropContent(description, entries, contentContainer, tabStatsContainer) {
  tabStatsContainer.innerHTML = `
    <link rel="stylesheet" href="style/weapondrop.css">
    <h3>${description}</h3>
  `;

  function renderContentContainer() {
    const cardContainerElement = document.createElement('div');
    cardContainerElement.classList.add('card-container');

    entries.forEach((entry) => {
      const { d, t, plusItems } = entry;
  
      const entryElement = document.createElement('div');
      entryElement.classList.add('card');
      const itemColor = extractItemColor(plusItems[0].itemType);
      entryElement.style.setProperty('--item-color', itemColor);
      entryElement.innerHTML = `
      <div class="card-header">
        <span class="date-time">${d} ${t}</span>
      </div>
      <div class="weapon-given">
            <img src="images/${plusItems[0].itemName}.png" width="120" height="92.4">
            <span>${plusItems[0].market_name}</span>
      </div>
    `;
  
      cardContainerElement.appendChild(entryElement);
    });

    contentContainer.appendChild(cardContainerElement);
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

module.exports = {
    showWeaponDropContent
};