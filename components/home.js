const { shell } = require('electron');
const axios = require('axios');

async function fetchDonationData() {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/Mantequilla53/CSIH-Viewer/main/donations.json');
    return response.data;
  } catch (error) {
    console.error('Error fetching donation data:', error);
    return null;
  }
}

function renderDonationLeaderboard(donations) {
  if (!donations || Object.keys(donations).length === 0) {
    return '<p>No donations yet. Be the first to support us!</p>';
  }

  const sortedDonations = Object.entries(donations).sort((a, b) => parseFloat(b[1].amount.slice(1)) - parseFloat(a[1].amount.slice(1)));
  const topDonations = sortedDonations.slice(0, 5);

  return `
    <ul class="donation-list">
      ${topDonations.map(([id, donation]) => `
        <li>
          <img src="${donation.profilepicture}" class="donor-avatar">
          <div class="donor-info">
            <a href="${donation.profile_url}" class="donor-name" target="_blank">${donation.name}</a>
            <span class="donation-amount">${donation.amount}</span>
          </div>
        </li>
      `).join('')}
    </ul>
  `;
}


async function showHome(contentContainer, tabStatsContainer) {
  tabStatsContainer.innerHTML = `<link rel="stylesheet" href="style/home.css">`
  contentContainer.innerHTML = `
  <div class="hero-section">
    <div class="hero-content">
      <p><span class="name">CSIH-Viewer</span> offers a new solution for viewing and analyzing your Counter Strike inventory history.</p>
      <a href="#" class="demo-button">Demo (Coming Soon...)</a>
    </div>
    <div class="right-image">
    </div>
  </div>

  <div class="how-to-use">
    <div class="header-how">
      <h3>How to use CSIHV</h3>
    </div>
    <div class="home-card-container">
      <div class="home-card">
        <div class="card-number">Step 1.</div>
        <div class="card-icon">
          <img src="./assets/cookie-svgrepo-com.svg">
        </div>
        <div class="card-content">
          <h4>Obtain Your Steam Cookies</h4>
          <p>To get started, you'll need to retrieve your Steam cookies. You can find detailed instructions for this process in two places:</p>
          <ul>
            <li>Our GitHub repository's README file</li>
            <li>Our Discord server's dedicated guide</li>
          </ul>
          <p>Choose whichever option is more convenient for you. These resources will walk you through the steps to securely obtain your Steam cookies.</p>
        </div>
      </div>
      <div class="home-card">
        <div class="card-number">Step 2.</div>
        <div class="card-icon">
          <img src="./assets/file-arrow-down-alt-svgrepo-com.svg">
        </div>
        <div class="card-content">
          <h4>Get your Inventory History Output</h4>
          <p>During this step, CSIHV will actively scrape your inventory data. Here's what to expect:</p>
          <ol>
            <li>While scraping is in progress: You can view your current inventory history in real-time.</li>
            <li>After scraping is complete: You'll receive a file containing your entire inventory history.</li>
          </ol>
          <p><span class="yellow">Note:</span> The larger your Inventory History, the longer this process will take.</p>
        </div>
      </div>
      <div class="home-card">
        <div class="card-number">Step 3.</div>
        <div class="card-icon">
          <img src="./assets/user-search-alt-svgrepo-com.svg">
        </div>
        <div class="card-content">
          <h4>View or share your History output with your friends</h4>
          <p>Now that you have your inventory history output file, you can:</p>
          <ul>
            <li>Review your history: Access your complete inventory history anytime without needing to rescrape data.</li>
            <li>Share with friends: Safely show off your impressive inventory history to your gaming buddies.</li>
          </ul>
          <p>This output file serves as a permanent record of your inventory, making it easy to revisit or share your CS inventory journey whenever you want.</p>
        </div>
      </div>
    </div>
  </div> 
  <div class="donation-section">
    <div class="donation-content">
      <h3>Support CSIHV</h3>
      <p>Your support makes a difference! While CSIHV is freely available and always will be, donations are deeply appreciated. Your contribution, no matter the size, helps:</p>
      <ul>
        <li>Motivate more frequent updates</li>
        <li>Fund the development of new features</li>
        <li>Ensure the continued maintenance and improvement of CSIHV</li>
      </ul>
      <a href="#" class="donate-button" id="donate-link">Steam Trade Link</a>
    </div>
    <div class="donation-leaderboard">
      <h3>Donation Leaderboard</h3>
      <div id="leaderboard-content">Loading...</div>
    </div>
  </div>
  <div class="support-section">
    <h3>Need Help?</h3>
    <p>If you have any questions or issues with the program, our community is here to help!</p>
    <a href="#" class="discord-button" id="discord-link">Join Our Discord Server</a>
  </div>
  `;
  const donationData = await fetchDonationData();
  const leaderboardContent = document.getElementById('leaderboard-content');
  leaderboardContent.innerHTML = renderDonationLeaderboard(donationData);

  document.querySelectorAll('.donor-name').forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      shell.openExternal(event.target.href);
    });
  });

  document.getElementById('donate-link').addEventListener('click', (event) => {
    event.preventDefault();
    shell.openExternal('https://steamcommunity.com/tradeoffer/new/?partner=194995080&token=wHW04ODS');
  });

  document.getElementById('discord-link').addEventListener('click', (event) => {
    event.preventDefault();
    shell.openExternal('https://discord.gg/NDdDzXKqk7');
  });
}

module.exports = {
  showHome
};