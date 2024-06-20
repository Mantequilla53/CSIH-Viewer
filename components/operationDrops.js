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
              <img data-src="${path.join(process.resourcesPath, 'images', `${item.itemName}.png`)}" class="lazy-image">
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

function extractItemColor(marketName) {
  const itemMap = {
    'Battle Green': '#789d53',
    'Monarch Blue': '#4e7fa9',
    'Monster Purple': '#6e4f9f',
    'Princess Pink': '#9d567a',
    'SWAT Blue': '#4c5b98',
    'Tiger Orange': '#b87148',
    'Tracer Yellow': '#d4c95b',
    'Violent Violet': '#af92df',
    'War Pig Pink': '#e4ccd5',
    'Wire Blue': '#6ba5b2',
    'Bazooka Pink': '#ba68b2',
    'Blood Red': '#b14d4d',
    'Brick Red': '#874444',
    'Cash Green': '#a6c4a5',
    'Desert Amber': '#ae833d',
    'Dust Brown': '#8f7d5d',
    'Frog Green': '#488f80',
    'Jungle Green': '#417a4a',
    'Shark White': '#c1c1c1',
    'Consumer Grade': 'rgb(176, 195, 217)',
    'Industrial Grade': 'rgb(94, 152, 217)',
    'Mil-Spec': 'rgb(75, 105, 255)',
    'High Grade Patch': 'rgb(75, 105, 255)',
    'High Grade Collectible': 'rgb(75, 105, 255)',
    'High Grade Graffiti': 'rgb(75, 105, 255)',
    'High Grade Sticker': 'rgb(75, 105, 255)',
    'Restricted': 'rgb(136, 71, 255)',
    'Remarkable Patch': 'rgb(136, 71, 255)',
    'Remarkable Collectible': 'rgb(136, 71, 255)',
    'Remarkable Graffiti': 'rgb(136, 71, 255)',
    'Remarkable Sticker': 'rgb(136, 71, 255)',
    'Classified': 'rgb(211, 44, 230)',
    'Exotic Patch': 'rgb(211, 44, 230)',
    'Exotic Collectible': 'rgb(211, 44, 230)',
    'Exotic Graffiti': 'rgb(211, 44, 230)',
    'Exotic Sticker': 'rgb(211, 44, 230)',
    'Covert': 'rgb(235, 75, 75)',
    'Extraordinary Collectible': 'rgb(235, 75, 75)',
    'Extraordinary Sticker': 'rgb(235, 75, 75)',
    'Extraordinary': 'rgb(255, 215, 0)'
  };
  return itemMap[marketName] || 'white';
}

  module.exports = {
  showOperationContent
};