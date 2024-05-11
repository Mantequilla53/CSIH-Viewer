function showStickerARContent(description, entries, contentContainer, tabStatsContainer) {
    tabStatsContainer.innerHTML = `<link rel="stylesheet" href="case.css">
    <h2>${description}</h2>`;
    
    entries.forEach((entry) => {
        const { d, t, plusItems, minusItems, tradeName } = entry;
        const entryElement = document.createElement('div');
        entryElement.innerHTML = `
          <p>Date: ${d}</p>
          <p>Time: ${t}</p>
          ${tradeName ? `<p>${tradeName}</p>` : ''}
          ${plusItems.length > 0 ? `
            <p>Given to Inventory:</p>
            <ul>
              ${plusItems.map(item => `<li>${item.market_name} - - ${item.itemType} - - ${item.stickers.map(sticker => sticker.name).join(', ')}</li>`).join('')}
            </ul>
          ` : ''}
          ${minusItems.length > 0 ? `
            <p>Taken from Inventory:</p>
            <ul>
              ${minusItems.map(item => `<li>${item.market_name} - - ${item.itemType} - - ${item.stickers.map(sticker => sticker.name).join(', ')}</li>`).join('')}
            </ul>
          ` : ''} 
          <hr>
          `;
        contentContainer.appendChild(entryElement);
      });
}

module.exports = {
    showStickerARContent
}