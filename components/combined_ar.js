function showARContent(description, entries, contentContainer, tabStatsContainer) {
    const { extractItemColor } = require('../utils');
    let type = '';
    if (description === 'Sticker applied/removed'){
        type = 'Sticker';
    } else {
        type = 'Name Tag';
    }


    tabStatsContainer.innerHTML = `<link rel="stylesheet" href="style/weapondrop.css">
    <h2>${description}</h2>
    <div class="filter-options">
        <label>
            <input type="checkbox" value="${type} applied" id="${type.toLowerCase()}-applied-checkbox" checked>
            ${type} Applied
        </label>
        <label>
            <input type="checkbox" value="${type} removed" id="${type.toLowerCase()}-removed-checkbox" checked>
            ${type} Removed
        </label>
    </div>`;

    function updateCards() {
        const selectedTradeNames = [...tabStatsContainer.querySelectorAll('input[type="checkbox"]:checked')].map(checkbox => checkbox.value);

        const shortenItemWear = (itemWear) => {
            const wearMap = {
              'Factory New': 'FN',
              'Minimal Wear': 'MW',
              'Field-Tested': 'FT',
              'Well-Worn': 'WW',
              'Battle-Scarred': 'BS'
            };
            return wearMap[itemWear] || itemWear;
          };

        contentContainer.innerHTML = '';
        entries.forEach((entry) => {
            if (selectedTradeNames.includes(entry.tradeName)) {
                const { d, t, plusItems, minusItems, tradeName } = entry;
                const entryElement = document.createElement('div');

                const tradeNameClass = tradeName.toLowerCase().replace(/ /g, '-');
                entryElement.classList.add('card', tradeNameClass);

                const itemToDisplay = plusItems.length ? plusItems : minusItems;
                const itemColor = itemToDisplay[0]?.itemType ? extractItemColor(itemToDisplay[0].itemType) : 'white';
                entryElement.style.setProperty('--item-color', itemColor);
                entryElement.innerHTML = `
                    <div class="card-header">
                        <span>${d} ${t}</span>
                    </div>
                    <div class="weapon-given">
                        <div class="weapon-given-image-container">
                            <div class="item-image">
                                <img src="${path.join(process.resourcesPath, 'images', `${itemToDisplay[0].itemName}.png`)}" alt="${itemToDisplay[0].market_name}">
                            </div>
                            ${itemToDisplay[0].itemWear ? `<span class="item-wear">${shortenItemWear(itemToDisplay[0].itemWear)}</span>` : ''}
                            ${itemToDisplay[0].stickers ? `<div class="sticker-separator"></div>
                                   <div class="sticker-images">
                                     ${itemToDisplay[0].stickers.map(sticker => `
                                       <div class="sticker">
                                         <img src="${path.join(process.resourcesPath, 'images', `${sticker.imgSrc}.png`)}" alt="${sticker.name}">
                                       </div>
                                     `).join('')}
                                   </div>`
                                : ''}
                            </div>
                        </div>
                        <span>${itemToDisplay[0].market_name}</span>
                    </div>
                    ${findChange(tradeName, plusItems, minusItems, type)}
                `;
                contentContainer.appendChild(entryElement);
            }
        });
    }
    document.querySelector('.filter-options').addEventListener('change', updateCards);
    updateCards();
}

function findChange(tradeName, plusItems, minusItems, type) {
    const getFooterContent = (value, action) => {
        if (type === 'Name Tag') {
            return value ? `
                <div class="card-footer">
                    <p>${action}:</p>
                    <p>${value}</p>
                </div>
            ` : '';
        } else if (type === 'Sticker') {
            return value ? `
                <div class="card-footer">
                    <p>${action}:</p>
                    <img src="${path.join(process.resourcesPath, 'images', `${value.imgSrc}.png`)}" alt="${value.name}" class="sticker-image">
                </div>
            ` : '';
        }
    };

    if (tradeName === `${type} applied`) {
        if (type === 'Name Tag') {
            const nameTag = plusItems[0]?.tag_name || '';
            return getFooterContent(nameTag, 'Applied');
        } else if (type === 'Sticker') {
            const plusStickers = plusItems[0].stickers;
            const minusStickers = minusItems.find(item => item.stickers && item.stickers.length > 0)?.stickers || [];
            const appliedSticker = getStickerDiff(plusStickers, minusStickers) || plusStickers[0];
            return getFooterContent(appliedSticker, 'Applied');
        }
    } else if (tradeName === `${type} removed`) {
        if (type === 'Name Tag') {
            const nameTag = minusItems[0]?.tag_name || '';
            return getFooterContent(nameTag, 'Removed');
        } else if (type === 'Sticker') {
            if (plusItems.length === 0 && minusItems.length > 0 && minusItems[0].stickers.length === 1) {
                return getFooterContent(minusItems[0].stickers[0], 'Removed');
            } else {
                const plusStickers = plusItems[0]?.stickers || [];
                const minusStickers = minusItems[0]?.stickers || [];
                const removedSticker = getStickerDiff(minusStickers, plusStickers);
                return getFooterContent(removedSticker, 'Removed');
            }
        }
    }

    return '';
}

function getStickerDiff(plusStickers, minusStickers) {
    return plusStickers.find((plusSticker, index) => {
        const minusSticker = minusStickers[index];
        return !minusSticker || plusSticker.name !== minusSticker.name || plusSticker.codename !== minusSticker.codename;
    });
}

module.exports = {
    showARContent
};