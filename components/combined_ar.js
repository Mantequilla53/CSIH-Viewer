function showARContent(description, entries, contentContainer, tabStatsContainer, type) {
    
    tabStatsContainer.innerHTML = `<link rel="stylesheet" href="style/stickerar_new.css">
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
        contentContainer.innerHTML = '';
        entries.forEach((entry) => {
            if (selectedTradeNames.includes(entry.tradeName)) {
                const { d, t, plusItems, minusItems, tradeName } = entry;
                const cardElement = document.createElement('div');

                const tradeNameClass = tradeName.toLowerCase().replace(/ /g, '-');
                cardElement.classList.add('card', tradeNameClass);

                const itemToDisplay = plusItems.length ? plusItems : minusItems;
                const itemColor = itemToDisplay[0]?.itemType ? extractItemColor(itemToDisplay[0].itemType) : 'white';
                cardElement.style.setProperty('--item-color', itemColor);
                cardElement.innerHTML = `
                    <div class="card-header">
                        <span>${d} ${t}</span>
                    </div>
                    <div class="card-content">
                        <div class="item-image-container">
                            <div class="item-image">
                                <img src="${path.join(process.resourcesPath, 'images', `${itemToDisplay[0].itemName}.png`)}" alt="${itemToDisplay[0].market_name}">
                            </div>
                            <div class="item-separator"></div>
                            <div class="sticker-list">
                                ${itemToDisplay[0].stickers.length > 0 ? itemToDisplay[0].stickers.map(sticker => `
                                    <div class="sticker">  
                                        <img src="${path.join(process.resourcesPath, 'images', `${sticker.imgSrc}.png`)}" alt="${sticker.name}">
                                    </div>
                                `).join('') : '<p>No Stickers</p>'}
                            </div>
                        </div>
                        <p>${itemToDisplay[0].market_name}</p>
                    </div>
                    ${findChange(tradeName, plusItems, minusItems, type)}
                `;
                contentContainer.appendChild(cardElement);
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
    showARContent
};