function showDropContent(description, entries, contentContainer, tabStatsContainer) {
	const itemCounts = {};

	entries.forEach((entry) => {
		const {
			plusItems
		} = entry;
		plusItems.forEach((item) => {
			const itemName = item.market_name
			if (itemCounts[itemName]) {
				itemCounts[itemName]++;
			} else {
				itemCounts[itemName] = 1;
			}
		});
	});

	tabStatsContainer.innerHTML = `
  <h3>${description}</h3>
  <ul>
    ${Object.entries(itemCounts)
      .map(([item, count]) => `<li>${item}${count > 1 ? ` (${count})` : ''}</li>`)
      .join('')}
  </ul>
`;

	function renderContentContainer() {
		entries.forEach((entry) => {
			const {
				d,
				t,
				plusItems,
				minusItems,
				tradeName
			} = entry;
			const entryElement = document.createElement('div');
			entryElement.innerHTML = `
          <p>Date: ${d}</p>
          <p>Timestamp: ${t}</p>
          ${tradeName ? `<p>Trade Name: ${tradeName}</p>` : ''}
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
			contentContainer.appendChild(entryElement);
		});
	}
	renderContentContainer();
}
module.exports = {
	showDropContent
};