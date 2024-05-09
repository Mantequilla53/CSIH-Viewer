function showTradeContent(description, entries, contentContainer, tabStatsContainer) {
  const tradeNameCounts = {};

  entries.forEach((entry) => {
    const { tradeName } = entry;
    if (tradeNameCounts[tradeName]) {
      tradeNameCounts[tradeName].push(entry);
    } else {
      tradeNameCounts[tradeName] = [entry];
    }
  });

  const tabContentElement = document.createElement('div');
  tabContentElement.innerHTML = `
  <link rel="stylesheet" href="trades.css">  
  <h3>${description}</h3>
    <div>
      <select id="trade-name-select">
        <option value="">Select a trade name</option>
        ${Object.keys(tradeNameCounts)
          .map(
            (tradeName) => `
              <option value="${tradeName}">${tradeName} (${tradeNameCounts[tradeName].length})</option>
            `
          )
          .join('')}
      </select>
      <button id="unselect-button" style="display: none;">Unselect</button>
    </div>
    <div id="selected-trade-name"></div>
    <div id="trade-name-entries"></div>
  `;
  tabStatsContainer.appendChild(tabContentElement);
  const tradeNameSelect = tabContentElement.querySelector('#trade-name-select');
  const unselectButton = tabContentElement.querySelector('#unselect-button');
  const selectedTradeNameContainer = tabContentElement.querySelector('#selected-trade-name');
  const tradeNameEntriesContainer = tabContentElement.querySelector('#trade-name-entries');

  const entriesPerPage = 100; // Number of entries to load per page
  let currentPage = 1;
  let selectedTradeName = null;
  let isLoading = false;

  function renderTrades() {
    const filteredEntries = selectedTradeName
      ? tradeNameCounts[selectedTradeName]
      : entries;

      const startIndex = (currentPage - 1) * entriesPerPage;
      const endIndex = startIndex + entriesPerPage;
      const entriesToRender = filteredEntries.slice(startIndex, endIndex);

    entriesToRender.forEach((entry) => {
      const { d, t, plusItems, minusItems, tradeName } = entry;
      
      const groupedPlusItems = plusItems.reduce((acc, item) => {
        const key = `${item.market_name}-${item.itemType}`;
        if (acc[key]) {
          acc[key].count++;
        } else {
          acc[key] = { ...item, count: 1 };
        }
        return acc;
      }, {});
  
      // Group minusItems by market_name and itemType
      const groupedMinusItems = minusItems.reduce((acc, item) => {
        const key = `${item.market_name}-${item.itemType}`;
        if (acc[key]) {
          acc[key].count++;
        } else {
          acc[key] = { ...item, count: 1 };
        }
        return acc;
      }, {});
      
      const entryElement = document.createElement('div');
    entryElement.classList.add('trade-entry');
    entryElement.innerHTML = `
  <div class="entry-header">
    <p>${d} ${t}</p>
    ${selectedTradeName ? '' : `<p>Trade Name: ${tradeName}</p>`}
  </div>
  <div class="entry-content">
    ${Object.values(groupedPlusItems).length > 0 ? `
      <div class="item-section ${Object.values(groupedMinusItems).length > 0 ? 'half-width' : ''}">
        <div class="item-card green-card">
          <div class="item-grid">
            ${Object.values(groupedPlusItems).map((item) => `
              <div class="item-entry">
                <img src="images/${item.itemName}.png" width="120" height="92.4">
                <p>${item.market_name}</p>
                <p>${item.itemType}</p>
                ${item.count > 1 ? `<p>Count: ${item.count}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    ` : ''}
    ${Object.values(groupedMinusItems).length > 0 ? `
      <div class="item-section ${Object.values(groupedPlusItems).length > 0 ? 'half-width' : ''}">
        <div class="item-card red-card">
          <div class="item-grid">
            ${Object.values(groupedMinusItems).map((item) => `
              <div class="item-entry">
                <img src="images/${item.itemName}.png" width="120" height="92.4">
                <p>${item.market_name}</p>
                <p>${item.itemType}</p>
                ${item.count > 1 ? `<p>Count: ${item.count}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    ` : ''}
  </div>
`;
    tradeNameEntriesContainer.appendChild(entryElement);
  });
    if (entriesToRender.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !isLoading) {
            loadMoreEntries();
          }
        },
        { threshold: 1 }
      );
      observer.observe(tradeNameEntriesContainer.lastElementChild);
    }
  
  }

  function loadMoreEntries() {
    isLoading = true;
    currentPage++;
    renderTrades();
    isLoading = false;
  }

  function handleScroll() {
    const { scrollTop, clientHeight, scrollHeight } = tradeNameEntriesContainer;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      loadMoreEntries();
    }
  }

  tradeNameSelect.addEventListener('change', (event) => {
    selectedTradeName = event.target.value;
    currentPage = 1;
    tradeNameEntriesContainer.innerHTML = '';
    if (selectedTradeName) {
      selectedTradeNameContainer.textContent = `Selected Trade Name: ${selectedTradeName}`;
      unselectButton.style.display = 'inline-block';
    } else {
      selectedTradeNameContainer.innerHTML = '';
      unselectButton.style.display = 'none';
    }
    renderTrades();
  });

  unselectButton.addEventListener('click', () => {
    selectedTradeNameContainer.innerHTML = '';
    tradeNameSelect.value = '';
    unselectButton.style.display = 'none';
    selectedTradeName = null;
    currentPage = 1;
    tradeNameEntriesContainer.innerHTML = '';
    renderTrades();
  });

  tradeNameEntriesContainer.addEventListener('scroll', handleScroll);

  renderTrades();
}

module.exports = {
  showTradeContent
};