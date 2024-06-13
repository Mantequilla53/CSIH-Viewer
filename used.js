function showUsedContent(description, entries, contentContainer, tabStatsContainer) {
    tabStatsContainer.innerHTML = `
    <link rel="stylesheet" href="style/weapondrop.css">
    <h3>${description}</h3>
  `;

  function renderContentContainer() {
    const cardContainerElement = document.createElement('div');
    cardContainerElement.classList.add('card-container');

    entries.forEach((entry) => {
      const { d, t, minusItems } = entry;
  
      const entryElement = document.createElement('div');
      entryElement.classList.add('card');
      entryElement.style.setProperty('--item-color', 'white');
      entryElement.innerHTML = `
      <div class="card-header">
        <span class="date-time">${d} ${t}</span>
      </div>
      <div class="weapon-given">
            <img src="images/${minusItems[0].itemName}.png" width="120" height="92.4">
            <span>${minusItems[0].market_name}</span>
      </div>
    `;
  
      cardContainerElement.appendChild(entryElement);
    });

    contentContainer.appendChild(cardContainerElement);
  }
  renderContentContainer();
}

module.exports = { showUsedContent };