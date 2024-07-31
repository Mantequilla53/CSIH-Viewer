function showSwapContent(description, entries, contentContainer, tabStatsContainer) {
  tabStatsContainer.innerHTML = `
    <link rel="stylesheet" href="style/swap.css">
    <h3>${description}</h3>
  `;

  entries.forEach((entry) => {
    const { d, t, plusItems, minusItems } = entry;
    const entryElement = document.createElement('div');
    entryElement.classList.add('card');

    const swapToolItem = minusItems.find(item => item.market_name.toLowerCase().includes('swap tool'));

    const itemsHtml = plusItems.map((plusItem, index) => {
      const minusItem = minusItems.find(item => item.market_name === plusItem.market_name);
      return `
        <div class="side-side-container">
          <div class="weapon-given-image-container">
            <img src="https://community.akamai.steamstatic.com/economy/image/${plusItem.itemName}/330x192?allow_animated=1" alt="${plusItem.market_name}">
            ${plusItem.stickers && plusItem.stickers.length > 0 ? `
              <div class="sticker-separator"></div>
              <div class="sticker-images">
                ${plusItem.stickers.map((sticker) => `
                  <img src="https://steamcdn-a.akamaihd.net/apps/730/icons/econ/stickers/${sticker.imgSrc}}" width="45" height="45">
                `).join('')}
              </div>
            ` : ''}
          </div>
          <div class="item-info">
            <div class="item-name-container">
              <span class="item-name">${plusItem.market_name}</span>
            </div>
            <div class="item-counts">
              <div class="original-count">
                <span>Original: ${minusItem.stCount}</span>
              </div>
              <div class="new-count">
                <span>New: ${plusItem.stCount}</span>
              </div>
            </div>
          </div>
        </div>
        ${index === 0 ? `
          <div class="icon-container">
            <div class="tool-image">
              <img src="https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXX7gNTPcUhvRpJWF7RTNu-wM7DbEl7KggZs--nLV4ygaDNJztE7ozgzNGIwqTyZ-6AlGpV7Jx10uiQotym2g3k_l0sPT6xjsLSww/360fx360f" alt="Tool Image">
            </div>
            <div class="arrow-icon">
              <img src="./assets/movement-arrows-left-right.svg" alt="Arrow Icon">
            </div>
          </div>
        ` : ''}
      `;
    }).join('');

    entryElement.innerHTML = `
      <div class="card-header">
        <span>${d} ${t}</span>
      </div>
      <div class="weapon-given">
        ${itemsHtml}
      </div>
    `;

    contentContainer.appendChild(entryElement);
  });
}

module.exports = {
  showSwapContent
};