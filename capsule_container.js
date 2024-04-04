function showCapContainerContent(description, entries, contentContainer) {
    const minusItemsCount = {};
      let totalCount = 0;
  
      entries.forEach((entry) => {
        const { minusItems } = entry;
  
        minusItems.forEach((item) => {
          if (minusItemsCount[item.market_name]) {
            minusItemsCount[item.market_name]++;
          } else {
            minusItemsCount[item.market_name] = 1;
          }
          totalCount++;
        });
      });
  
      // Render the minus items count for the "Unlocked a sticker capsule" and "Unlocked a container" tabs
      const tabContentElement = document.createElement('div');
      tabContentElement.innerHTML = `
        <h3>${description}</h3>
        <h4>Item Unboxed:</h4>
        <ul>
          ${Object.entries(minusItemsCount)
            .map(([item, count]) => `<li>${item} (${count})</li>`)
            .join('')}
        </ul>
        <p>Total Count: ${totalCount}</p>
        <hr>
      `;
      contentContainer.appendChild(tabContentElement);

}
module.exports = {
    showCapContainerContent
};