function showPurchaseContent(description, entries, contentContainer, tabStatsContainer) {
    const cardsContainer = document.createElement('div');
    cardsContainer.classList.add('card-grid');

    const tabContentElement = document.createElement('div');
    tabContentElement.innerHTML = `<link rel="stylesheet" href="op.css">`;
    tabStatsContainer.appendChild(tabContentElement);

    entries.forEach((entry) => {
        const {
            d,
            t,
            plusItems,
            minusItems
        } = entry;

        const minusItemsCount = new Map();
        minusItems.forEach((item) => {
            const key = `${item.itemName}-${item.market_name}`;
            if (minusItemsCount.has(key)) {
                minusItemsCount.set(key, minusItemsCount.get(key) + 1);
            } else {
                minusItemsCount.set(key, 1);
            }
        });

        const filteredPlusItems = plusItems.filter((item) => {
            const key = `${item.itemName}-${item.market_name}`;
            if (minusItemsCount.has(key)) {
                const count = minusItemsCount.get(key);
                if (count > 0) {
                    minusItemsCount.set(key, count - 1);
                    return false;
                }
            }
            return true;
        });

        const plusItemsCount = new Map();
        filteredPlusItems.forEach((item) => {
            if (plusItemsCount.has(item.market_name)) {
                plusItemsCount.set(item.market_name, plusItemsCount.get(item.market_name) + 1);
            } else {
                plusItemsCount.set(item.market_name, 1);
            }
        });

        const entryElement = document.createElement('div');
        entryElement.classList.add('card');
        entryElement.innerHTML = `
            <div class="card-header">
                <p>${d} ${t}</p>
            </div>
            <div class="card-body">
                ${filteredPlusItems.length > 0 ? `
                    <div class="item-grid">
                    ${[...plusItemsCount.entries()].map(([name, count]) => {
                        const item = filteredPlusItems.find(item => item.market_name === name);
                        return `
                    <div class="item-card">
                        <img src="images/${item.itemName}.png" width="120" height="92.4">
                        <p>${name} - - Count: ${count}</p>
                    </div>
                    `;
                }).join('')}
            </div>
             ` : `
            <div class="item-grid">
                ${plusItems.map(item => `
                <div class="item-card">
                    <img src="images/${item.itemName}.png" width="120" height="92.4">
                    <p>${item.market_name}</p>
                </div>
                `).join('')}
            </div>
            `}
        </div>
        `;
        cardsContainer.appendChild(entryElement);
    });
    contentContainer.appendChild(cardsContainer);
}

module.exports = {
    showPurchaseContent
};