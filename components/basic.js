function showBasicContent(desc, entries, contentContainer, tabStatsContainer) {
    tabStatsContainer.innerHTML = `
    <h3>${desc}</h3>
    <p>If you're seeing this message on an unstyled tab, it could mean one of two things:</p>
    <p>1. This is an inventory history description that isn't currently known. We're working with a limited set of known descriptions.</p>
    <p>2. This is a market tab with incomplete entry data. Specifically, the 'Listed' and 'Received' market tabs may have incomplete item information. To maintain data integrity, we don't add this partial information to the main 'Listed' and 'Purchased' sections.</p>
    <p>Disclaimer: If you're encountering situation #1 (unknown inventory history description), please report the description name and upload your output file to our Discord server. This will help us expand CSIHV and improve the app for all users.</p>
    <hr>
    `
    entries.forEach((entry) => {
        const { d, t, plusItems, minusItems } = entry;
        const entryElement = document.createElement('div');
        entryElement.innerHTML = `
          <p>Date: ${d} ${t}</p>
          ${plusItems.length > 0 ? `
            <p>Given to Inventory:</p>
            <ul>
              ${plusItems.map(item => `<li>${item.market_name}</li>`).join('')}
            </ul>
          ` : ''}
          ${minusItems.length > 0 ? `
            <p>Taken from Inventory:</p>
            <ul>
              ${minusItems.map(item => `<li>${item.market_name}</li>`).join('')}
            </ul>
          ` : ''} 
          <hr>
        `;
        contentContainer.appendChild(entryElement);
      });
}

module.exports = {
    showBasicContent
};