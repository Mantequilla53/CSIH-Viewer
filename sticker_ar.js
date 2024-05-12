function showStickerARContent(description, entries, contentContainer, tabStatsContainer) {
	tabStatsContainer.innerHTML = `<link rel="stylesheet" href="stickerar.css">
  <h2>${description}</h2>
  <div class="filter-options">
    <label>
      <input type="checkbox" value="Sticker applied" id="sticker-applied-checkbox" checked>
        Sticker Applied
    </label>
    <label>
      <input type="checkbox" value="Sticker removed" id="sticker-removed-checkbox" checked>
      Sticker Removed
    </label>
  </div>`;
	const filterOptions = document.querySelector('.filter-options');

	function updateCards() {
		const selectedTradeNames = [...filterOptions.querySelectorAll('input[type="checkbox"]:checked')].map(checkbox => checkbox.value);
		contentContainer.innerHTML = '';
		entries.forEach((entry) => {
			const { d, t, plusItems, minusItems, tradeName } = entry;
			if (selectedTradeNames.includes(tradeName)) {
				const cardElement = document.createElement('div');
				cardElement.classList.add('entry-card');

				const tradeNameClass = tradeName.toLowerCase().replace(' ', '-');
        cardElement.classList.add(tradeNameClass);

				let itemColor = 'white';
				let itemsToDisplay = plusItems.length > 0 ? plusItems : minusItems;

				if (itemsToDisplay.length > 0 && itemsToDisplay[0].itemType) {
					itemColor = plusItems.map(item => extractItemColor(item.itemType));
				}
				cardElement.style.setProperty('--item-color', itemColor);

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
          ${findStickerChange(tradeName, entry.plusItems, entry.minusItems)}
      `;
				contentContainer.appendChild(cardElement);
			}
		});
	}
	filterOptions.addEventListener('change', updateCards);

	updateCards();
}

function findStickerChange(tradeName, plusItems, minusItems) {
  const getStickerDiff = (plusStickers, minusStickers) => {
    return plusStickers.find((plusSticker, index) => {
      const minusSticker = minusStickers[index];
      return !minusSticker || plusSticker.name !== minusSticker.name || plusSticker.codename !== minusSticker.codename;
    });
  };

  const getFooterContent = (sticker, action) => {
    return sticker ? `
      <div class="card-footer">
        <p>${action}:</p>
        <img src="./images/${sticker.imgSrc}.png" alt="${sticker.name}" class="sticker-image">
      </div>
    ` : '';
  };

  try {
    if (tradeName === 'Sticker applied') {
      const plusStickers = plusItems[0].stickers;
      const minusStickers = minusItems.find(item => item.stickers && item.stickers.length > 0)?.stickers || [];
      const appliedSticker = getStickerDiff(plusStickers, minusStickers) || plusStickers[0];
      return getFooterContent(appliedSticker, 'Applied');
    } else if (tradeName === 'Sticker removed') {
      if (plusItems.length === 0 && minusItems.length > 0 && minusItems[0].stickers.length === 1) {
        return getFooterContent(minusItems[0].stickers[0], 'Removed');
      } else {
        const plusStickers = plusItems[0]?.stickers || [];
        const minusStickers = minusItems[0]?.stickers || [];
        const removedSticker = getStickerDiff(minusStickers, plusStickers);
        return getFooterContent(removedSticker, 'Removed');
      }
    }
  } catch (error) {
    console.error('Error processing entry:', entry);
    console.error('Error details:', error);
  }

  return '';
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