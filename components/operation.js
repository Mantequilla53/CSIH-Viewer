const { extractItemColor } = require('../utils');

const operations = [
    { name: 'Operation Riptide', startDate: new Date('Sep 21, 2021'), endDate: new Date('Feb 21, 2022') },
    { name: 'Operation Broken Fang', startDate: new Date('Dec 3, 2020'), endDate: new Date('May 3, 2021') },
    { name: 'Operation Shattered Web', startDate: new Date('Nov 18, 2019'), endDate: new Date('Mar 31, 2020') },
    { name: 'Operation Hydra', startDate: new Date('May 23, 2017'), endDate: new Date('Nov 13, 2017') }
];

const operationMap = new Map();
operations.forEach((operation) => {
    operationMap.set(operation.name, {
        startDate: operation.startDate,
        endDate: operation.endDate
    });
});

const operationItemNames = {
    'Operation Riptide': {
        'Patches': 'Riptide Patches',
        'Sealed Graffiti': 'Riptide Graffiti',
        'Stickers': 'Riptide & Surf Shop Stickers'
    },
    'Operation Broken Fang': {
        'Patches': 'Skill Group Patches',
        'Sealed Graffiti': 'Recoil Graffiti',
        'Stickers': 'Broken Fang & Recoil Stickers'
    },
    'Operation Shattered Web': {
        'Patches': 'Shattered Web Patches',
        'Sealed Graffiti': 'Shattered Web Graffiti',
        'Stickers': 'Shattered Web Stickers'
    },
    'Operation Hydra': {
        'Patches': 'Hydra Patches',
        'Sealed Graffiti': 'Hydra Graffiti'
    }
};

function showOperationContent(description, entries, contentContainer, tabStatsContainer) {
    const groupedEntries = {};

    operations.forEach((operation) => {
        groupedEntries[operation.name] = [];
    });

    entries.forEach((entry) => {
        const { d } = entry;
        const entryDate = new Date(d);

        for (const [operationName, { startDate, endDate }] of operationMap) {
            if (entryDate >= startDate && entryDate <= endDate) {
                groupedEntries[operationName].push(entry);
                break;
            }
        }
    });

    tabStatsContainer.innerHTML = '<link rel="stylesheet" href="style/weapondrop.css">';

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('operation-buttons');
    tabStatsContainer.appendChild(buttonContainer);

    operations.forEach((operation) => {
        const operationName = operation.name;
        const operationEntries = groupedEntries[operationName];

        if (operationEntries.length > 0) {
            const button = document.createElement('button');
            button.textContent = operationName;
            button.classList.add('operation-button');
            buttonContainer.appendChild(button);

            button.addEventListener('click', () => {
                contentContainer.innerHTML = '';
                tabStatsContainer.querySelectorAll('.operation, .item-stats').forEach(el => el.remove());

                const operationElement = document.createElement('div');
                operationElement.classList.add('operation');
                operationElement.innerHTML = `<h2>${operationName}</h2>`;
                tabStatsContainer.appendChild(operationElement);

                const itemSetStats = {};
                const otherItemStats = {};

                operationEntries.forEach((entry) => {
                    entry.plusItems.forEach((item) => {
                        if (item.itemSetName) {
                            itemSetStats[item.itemSetName] = (itemSetStats[item.itemSetName] || 0) + 1;
                        } else {
                            let itemCategory;
                            if (item.market_name.startsWith('Patch')) {
                                itemCategory = operationItemNames[operationName]['Patches'] || 'Patches';
                            } else if (item.market_name.startsWith('Sealed Graffiti')) {
                                itemCategory = operationItemNames[operationName]['Sealed Graffiti'] || 'Sealed Graffiti';
                            } else if (item.market_name.startsWith('Sticker')) {
                                itemCategory = operationItemNames[operationName]['Stickers'] || 'Stickers';
                            } else if (item.market_name === 'Bonus Rank') {
                                itemCategory = 'Bonus Ranks';
                            } else if (item.market_name.toLowerCase().includes('case')) {
                                itemCategory = item.market_name;
                            } else {
                                itemCategory = item.market_name;
                            }
                            otherItemStats[itemCategory] = (otherItemStats[itemCategory] || 0) + 1;
                        }
                    });
                });

                // Display item statistics
                const statsElement = document.createElement('div');
                statsElement.classList.add('item-stats');
                statsElement.innerHTML = `
                    <div class="card-container">        
                    ${Object.entries(itemSetStats)
                        .filter(([_, count]) => count > 0)
                        .map(([itemName, count]) => `
                            <div class="item-card">
                                <div class="item-info">
                                    <h4>${itemName}</h4>
                                    ${count > 0 ? `<span class="drop-count">Count: ${count}</span>` : ''}
                                </div>
                            </div>
                            `).join('')}
                    ${Object.entries(otherItemStats)
                        .filter(([_, count]) => count > 0)
                        .map(([itemName, count]) => `
                                <div class="item-card">
                                <div class="item-info">
                                    <h4>${itemName}</h4>
                                    ${count > 0 ? `<span class="drop-count">Count: ${count}</span>` : ''}
                                </div>
                            </div>
                            `).join('')}
                    </div>`;
                tabStatsContainer.appendChild(statsElement);

                // Add entries for this operation
                operationEntries.forEach((entry) => {
                    const { d, t, plusItems } = entry;
                    const entryElement = document.createElement('div');
                    entryElement.classList.add('card');

                    const itemColor = plusItems.map(item => extractItemColor(item.itemType));
                    entryElement.style.setProperty('--item-color', itemColor);
                    entryElement.innerHTML = `
                    <div class="card-header">
                        <span class="date-time">${d} ${t}</span>
                    </div>
                    ${plusItems.length > 0 ? `
                    <div class="weapon-given">
                        ${plusItems.map(item => {
                            return `
                                <div class="weapon-given-image-container">
                                    <img src="https://community.akamai.steamstatic.com/economy/image/${item.itemName}/330x192?allow_animated=1">
                                    ${item.itemWear ? `<span class="item-wear">${shortenItemWear(item.itemWear)}</span>` : ''}
                                </div>
                                <span>${item.market_name}</span>
                            `;
                        }).join('')}
                    </div>
                    ` : ''}
                    `;
                    contentContainer.appendChild(entryElement);
                });
            });
        }
    });

    // Trigger click on the first button to show initial content
    const firstButton = buttonContainer.querySelector('.operation-button');
    if (firstButton) {
        firstButton.click();
    }
}

function shortenItemWear(itemWear) {
    const wearMap = {
      'Factory New': 'FN',
      'Minimal Wear': 'MW',
      'Field-Tested': 'FT',
      'Well-Worn': 'WW',
      'Battle-Scarred': 'BS'
    };
    return wearMap[itemWear] || itemWear;
}

module.exports = {
    showOperationContent
};