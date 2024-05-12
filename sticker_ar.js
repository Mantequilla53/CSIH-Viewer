function showStickerARContent(description, entries, contentContainer, tabStatsContainer) {
    tabStatsContainer.innerHTML = `<link rel="stylesheet" href="stickerar.css">
    <h2>${description}</h2>`;
    
    contentContainer.innerHTML = `<div class="card-container"></div>`;
    const cardContainer = contentContainer.querySelector('.card-container');
    
    entries.forEach((entry) => {
        const { d, t, plusItems, minusItems, tradeName } = entry;
        const cardElement = document.createElement('div');
        cardElement.classList.add('entry-card');
      
        if (tradeName === 'Sticker applied') {
            cardElement.classList.add('sticker-applied');
        } else if (tradeName === 'Sticker removed') {
            cardElement.classList.add('sticker-removed');
        }

        let itemColor = 'white';
        let itemsToDisplay = plusItems.length > 0 ? plusItems : minusItems;
      
        if (itemsToDisplay.length > 0 && itemsToDisplay[0].itemType) {
            itemColor = plusItems.map(item => extractItemColor(item.itemType));
        }
        cardElement.style.setProperty('--item-color', itemColor);
        let footerContent = '';
        
        if (tradeName === 'Sticker applied') {
            try {
              const plusStickers = plusItems[0].stickers;
              const minusItemWithStickers = minusItems.find(item => item.stickers && item.stickers.length > 0);
              
              let appliedSticker = '';
              
              if (minusItemWithStickers) {
                const minusStickers = minusItemWithStickers.stickers;

                // Find the sticker in plusStickers that doesn't have a matching sticker object in the same position in minusStickers
                for (let i = 0; i < plusStickers.length; i++) {
                  const plusSticker = plusStickers[i];
                  const minusSticker = minusStickers[i];
                  
                  if (!minusSticker || plusSticker.name !== minusSticker.name || plusSticker.codename !== minusSticker.codename) {
                    appliedSticker = plusSticker;
                    break;
                  }
                }
              } else {
                appliedSticker = plusStickers[0];
              }
              
              if (appliedSticker) {
                footerContent = `
                  <div class="card-footer">
                    <p>Applied:</p>
                    <img src="./images/${appliedSticker.imgSrc}.png" alt="${appliedSticker.name}" class="sticker-image">
                  </div>
                `;
              } else {
                footerContent = `
                  <div class="card-footer">
                    <p>No new sticker applied</p>
                  </div>
                `;
              }
            }catch (error) {
            console.error('Error processing entry:', entry);
            console.error('Error details:', error);
          }
        } else if (tradeName === 'Sticker removed') {
            try {
              let removedSticker = '';
          
              if (plusItems.length === 0 && minusItems.length > 0) {
                // If there are no plusItems and there is at least one minusItem, assume the sticker on the minusItem is the removed sticker
                const minusStickers = minusItems[0].stickers;
                if (minusStickers.length === 1) {
                  removedSticker = minusStickers[0];
                }
              } else {
                const plusStickers = plusItems[0].stickers;
                const minusStickers = minusItems[0].stickers;
          
                // Find the sticker in minusStickers that doesn't have a matching sticker object in the same position in plusStickers
                for (let i = 0; i < minusStickers.length; i++) {
                  const minusSticker = minusStickers[i];
                  const plusSticker = plusStickers[i];
          
                  if (!plusSticker || minusSticker.name !== plusSticker.name || minusSticker.codename !== plusSticker.codename) {
                    removedSticker = minusSticker;
                    break;
                  }
                }
              }
          
              if (removedSticker) {
                footerContent = `
                  <div class="card-footer">
                    <p>Removed:</p>
                    <img src="./images/${removedSticker.imgSrc}.png" alt="${removedSticker.name}" class="sticker-image">
                  </div>
                `;
              } else {
                footerContent = `
                  <div class="card-footer">
                    <p>No sticker removed</p>
                  </div>
                `;
              }
          } catch (error) {
            console.error('Error processing entry:', entry);
            console.error('Error details:', error);
          }
        }
      
        cardElement.innerHTML = `
            <div class="card-content">
                <div class="card-header">
                    <span>${d} ${t}</span>
                </div>
                ${itemsToDisplay.length > 0 ? `
                    <div class="item-list">
                        ${itemsToDisplay.map(item => `
                            <div class="item">
                                <div class="item-image-container">
                                    <div class="item-image">
                                        <img src="./images/${item.itemName}.png" alt="${item.market_name}">
                                    </div>
                                    <div class="item-separator"></div>
                                    <div class="sticker-list">
                                        ${item.stickers.length > 0 ? item.stickers.map(sticker => `
                                            <div class="sticker">
                                                <img src="./images/${sticker.imgSrc}.png" alt="${sticker.name}">
                                            </div>
                                        `).join('') : '<p>No Stickers</p>'}
                                    </div>
                                </div>
                                <p>${item.market_name}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            ${footerContent}
        `;
      cardContainer.appendChild(cardElement);
    });
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
    showStickerARContent
}