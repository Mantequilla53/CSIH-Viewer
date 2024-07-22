const { extractItemColor } = require('../utils');

function showContainerContent(description, entries, contentContainer, tabStatsContainer) {
  let currentPage = 1;
  const itemsPerPage = 50; // Adjust as needed
  let observer;

  tabStatsContainer.innerHTML = `<link rel="stylesheet" href="style/case.css">
  <h2>${description}</h2>`;
  
  contentContainer.innerHTML = `<div class="card-container"></div>`;
  const cardContainer = contentContainer.querySelector('.card-container');

  function renderCards() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const entriesToRender = entries.slice(startIndex, endIndex);

    entriesToRender.forEach((entry) => {
      const { d, t, plusItems, minusItems } = entry;
      const cardElement = document.createElement('div');
      cardElement.classList.add('card');
      
      const itemColors = plusItems.map(item => extractItemColor(item.itemType));
      cardElement.style.setProperty('--item-color', itemColors);
      
      cardElement.innerHTML = `
      <div class="card-header">
      <span class="date-time">${d} ${t}</span>
    </div>
    <div class="weapon-given">
      <div class="weapon-given-image-container">        
        <img src="https://community.akamai.steamstatic.com/economy/image/${plusItems[0].itemName}/330x192?allow_animated=1">
      </div>      
    <span>${plusItems[0].market_name}</span>
    </div>
    ${minusItems.length > 0 ? `
      <div class="card-footer">
        <div class="case-unboxed">
          <span class="item-name">${minusItems[0].market_name}</span>
          <img src="https://community.akamai.steamstatic.com/economy/image/${minusItems[0].itemName}/330x192?allow_animated=1" alt="${minusItems[0].market_name}">
        </div>
      </div>
    ` : ''}
  `;
      cardContainer.appendChild(cardElement);
    });

    // Set up Intersection Observer for the last item
    if (entriesToRender.length > 0) {
      const lastEntry = cardContainer.lastElementChild;
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
    renderCards();
  }

  // Initial render
  renderCards();
}

module.exports = {
  showContainerContent
};