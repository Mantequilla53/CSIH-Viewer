function showTradeContent(description, entries, contentContainer) {
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
      contentContainer.appendChild(tabContentElement);
      const tradeNameSelect = tabContentElement.querySelector('#trade-name-select');
      const unselectButton = tabContentElement.querySelector('#unselect-button');
      const selectedTradeNameContainer = tabContentElement.querySelector('#selected-trade-name');
      const tradeNameEntriesContainer = tabContentElement.querySelector('#trade-name-entries');
    
      tradeNameSelect.addEventListener('change', (event) => {
        const selectedTradeName = event.target.value;
        if (selectedTradeName) {
          showTradeNameEntries(selectedTradeName);
          unselectButton.style.display = 'inline-block';
        } else {
          selectedTradeNameContainer.innerHTML = '';
          tradeNameEntriesContainer.innerHTML = '';
          unselectButton.style.display = 'none';
        }
      });
    
      unselectButton.addEventListener('click', () => {
        tradeNameSelect.value = '';
        unselectButton.style.display = 'none';
        showAllTrades();
      });
      
      showAllTrades();
      
      function showTradeNameEntries(tradeName) {
        contentContainer.innerHTML = '';
        contentContainer.appendChild(tabContentElement);
        
        selectedTradeNameContainer.textContent = `Selected Trade Name: ${tradeName}`;
        tradeNameEntriesContainer.innerHTML = '';
    
        const tradeNameEntries = tradeNameCounts[tradeName];
        tradeNameEntries.forEach((entry) => {
          const { date, timestamp, plusItems, minusItems } = entry;
          const entryElement = document.createElement('div');
          entryElement.innerHTML = `
            <p>Date: ${date}</p>
            <p>Timestamp: ${timestamp}</p>
            ${plusItems.length > 0 ? `
              <p>Given to Inventory:</p>
              <ul>
                ${plusItems.map(item => `<li>${item.market_name} - - ${item.itemType}</li>`).join('')}
              </ul>
            ` : ''}
            ${minusItems.length > 0 ? `
              <p>Taken from Inventory:</p>
              <ul>
                ${minusItems.map(item => `<li>${item.market_name} - - ${item.itemType}</li>`).join('')}
              </ul>
            ` : ''}
            <hr>
          `;
          tradeNameEntriesContainer.appendChild(entryElement);
        });
      }
      function showAllTrades() {
        selectedTradeNameContainer.innerHTML = '';
        tradeNameEntriesContainer.innerHTML = '';
        entries.forEach((entry) => {
          const { date, timestamp, plusItems, minusItems, tradeName } = entry;
          const entryElement = document.createElement('div');
          entryElement.innerHTML = `
            <p>Date: ${date}</p>
            <p>Timestamp: ${timestamp}</p>
            <p>Trade Name: ${tradeName}</p>
            ${
              plusItems.length > 0
              ? `
              <p>Given to Inventory:</p>
              <ul>
                ${plusItems.map((item) => `<li>${item.market_name} - - ${item.itemType}</li>`).join('')}
              </ul>
              `
              : ''
            }
            ${
              minusItems.length > 0
              ? `
              <p>Taken from Inventory:</p>
              <ul>
                ${minusItems.map((item) => `<li>${item.market_name} - - ${item.itemType}</li>`).join('')}
              </ul>
              `
              : ''
            }
            <hr>
            `;
      tradeNameEntriesContainer.appendChild(entryElement);
    });
  }
}
module.exports = {
    showTradeContent
}