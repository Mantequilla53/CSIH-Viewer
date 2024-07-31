const { extractItemColor } = require('../utils');

function showDefaultCards(description, entries, contentContainer, tabStatsContainer) {
  let currentPage = 1;
  const itemsPerPage = 50; // Adjust as needed
  let observer;

  tabStatsContainer.innerHTML = `
    <link rel="stylesheet" href="style/weapondrop.css">
    <h3>${description}</h3>
  `;

  function renderContentContainer() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const entriesToRender = entries.slice(startIndex, endIndex);

    entriesToRender.forEach((entry) => {
      const { d, t, plusItems, minusItems, tradeName } = entry;
      const itemFilter = entry.plusItems && entry.plusItems.length > 0 ? 'plusItems' : 'minusItems';
      const items = entry[itemFilter];
      const item = items[0];
      const entryElement = document.createElement('div');
      entryElement.classList.add('card');

      let itemColor;
      if (/^(Graffiti|Sealed Graffiti)/.test(item.market_name)) {
        const colorMatch = item.market_name.match(/\((.+)\)/);
        if (colorMatch) {
          itemColor = extractItemColor(colorMatch[1]);
        } else {
          itemColor = extractItemColor(item.itemType);
        }
      } else {
        itemColor = extractItemColor(item.itemType);
      }
      entryElement.style.setProperty('--item-color', itemColor);

      let displayName = item.market_name;
      let displayCount = '';
      let borderColor = '';

      if (displayName.startsWith('StatTrak')) {
        borderColor = 'rgb(207, 106, 50)';
      } else if (displayName.includes('Souvenir')) {
        borderColor = 'rgb(255, 215, 0)';
      }

      const starMatch = item.market_name.match(/^(\d+) Stars? for (.+)$/);
      if (starMatch) {
        const totalStars = items.reduce((sum, item) => {
          const match = item.market_name.match(/^(\d+) Stars? for /);
          return sum + (match ? parseInt(match[1]) : 0);
        }, 0);
        displayName = `${totalStars} Stars for ${starMatch[2]}`;
      } else if (description === 'Purchased from the store') {
        const { name, count } = removeCoupons(plusItems, minusItems);
        displayName = name;
        if (count > 1) {
          displayCount = `<span class="item-count">Count: ${count}</span>`;
        }
      } else if (items.length > 1) {
        displayCount = `<span class="item-count">Count: ${items.length}</span>`;
      } else if (description === 'Purchased on Community Market') {
        if (tradeName) {
          displayCount = `<span class="item-count">Price: ${tradeName}</span>`;
        } else {
          displayCount = '<span class="item-count-undefined">Price: Undefined</span>';
        }
      }

      entryElement.innerHTML = `
        <div class="card-header">
          <span class="date-time">${d} ${t}</span>
        </div>
        <div class="weapon-given">
          <div class="weapon-given-image-container" style="border-color: ${borderColor}">
            <img src="https://community.akamai.steamstatic.com/economy/image/${item.itemName}/330x192?allow_animated=1">
            ${item.itemWear ? `<span class="item-wear">${shortenItemWear(item.itemWear)}</span>` : ''}
            ${item.stickers && item.stickers.length > 0 ? `
              <div class="sticker-separator"></div>
              <div class="sticker-images">
                ${item.stickers.map((sticker) => `
                  <img src="https://steamcdn-a.akamaihd.net/apps/730/icons/econ/stickers/${sticker.imgSrc}">
                `).join('')}
              </div>
            ` : ''}
          </div>
          <span>${displayName}</span>
          <div>${displayCount}</div>
        </div>
      `;

      contentContainer.appendChild(entryElement);
    });

    // Set up Intersection Observer for the last item
    if (entriesToRender.length > 0) {
      const lastEntry = contentContainer.lastElementChild;
      setupIntersectionObserver(lastEntry);
    }
  }

  function setupIntersectionObserver(target) {
    if (observer) {
      observer.disconnect();
    }

    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMoreItems();
      }
    }, { threshold: 0.1 });

    observer.observe(target);
  }

  function loadMoreItems() {
    currentPage++;
    renderContentContainer();
  }

  // Initial render
  renderContentContainer();
}

function removeCoupons(plusItems, minusItems) {
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

  if (plusItemsCount.size > 0) {
    const [name, count] = [...plusItemsCount.entries()][0];
    return { name, count };
  }
  return { name: '', count: 0 };
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
  showDefaultCards
};