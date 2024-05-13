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
  tabStatsContainer.innerHTML = `<link rel="stylesheet" href="style/op.css">`;

  operations.forEach((operation) => {
    const operationName = operation.name;
    const operationEntries = groupedEntries[operationName];
  
    const operationElement = document.createElement('div');
    operationElement.classList.add('operation');
    operationElement.innerHTML = `<h2>${operationName}</h2>`;
    contentContainer.appendChild(operationElement);
  
    const cardGrid = document.createElement('div');
    cardGrid.classList.add('card-grid');
    contentContainer.appendChild(cardGrid);
  
    operationEntries.forEach((entry) => {
      const { d, t, plusItems } = entry;
      const entryElement = document.createElement('div');
      entryElement.classList.add('card');
  
      const itemColors = plusItems.map(item => extractItemColor(item.itemType));
          
      entryElement.innerHTML = `
      <div class="card-color" style="background-color: ${itemColors};"></div>
        <div class="card-header">
          <p>${d} ${t}</p>
        </div>
        ${plusItems.length > 0 ? `
        <div class="card-body">
          ${plusItems.map(item => {
            return `<div class="item">
              <div class="item-image">
              <img data-src="images/${item.itemName}.png" class="lazy-image">
              </div>
              <div class="item-name">
                <span>${item.market_name}</span>
              </div>
          </div>`;}).join('')}
        </div>
        ` : ''}
      `;
      cardGrid.appendChild(entryElement);
    });
  });
  lazyLoadImages();
}

function lazyLoadImages() {
  const lazyImages = document.querySelectorAll('.lazy-image');

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const image = entry.target;
        const src = image.getAttribute('data-src');
        image.setAttribute('src', src);
        image.onerror = () => {
          console.error('Error loading image:', src);
        };
        image.onload = () => {
          image.classList.remove('lazy-image');
          observer.unobserve(image);
        };
      }
    });
  });

  lazyImages.forEach(image => {
    observer.observe(image);
  });
}

function extractItemColor(itemType) {
  const colorMap = {
    'Consumer Grade': 'rgb(176, 195, 217)',
    'Industrial Grade': 'rgb(94, 152, 217)',
    'Mil-Spec': 'rgb(75, 105, 255)',
    'Restricted': 'rgb(136, 71, 255)',
    'Classified': 'rgb(211, 44, 230)',
    'Covert': 'rgb(235, 75, 75)',
    'Extraordinary': 'rgb(255, 215, 0)',
    'High Grade Sticker': 'rgb(75, 105, 255)',
    'Remarkable Sticker': 'rgb(136, 71, 255)',
    'Exotic Sticker': 'rgb(211, 44, 230)',
    'Extraordinary Sticker': 'rgb(235, 75, 75)'
  };
  return colorMap[itemType] || 'white';
}

  module.exports = {
  showOperationContent
};