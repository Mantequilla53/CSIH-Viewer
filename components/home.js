function showHome() {
    clearContent();
    contentContainer.innerHTML = `<div class="hero-section">
    <div class="hero-content">
      <p><span class="name">CSIH-Viewer</span> offers a new solution for viewing and analyzing your Counter Strike inventory history.</p>
      <a href="#" class="demo-button">Demo (Coming Soon...)</a>
    </div>
    <div class="right-image">
        <img src="./assets/Screenshot_181.png">
    </div>
  </div>
  <div>
    <h3>How to use CSIHV</h3>

  </div
    `;
}

module.exports = {
	showHome
};