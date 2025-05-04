// === GitHub Pages Base Path ===
const basePath = `${window.location.origin}/coinproject`;

// === Get coin key from URL ===
const params = new URLSearchParams(location.search);
const coinKey = params.get('coin');

if (!coinKey) {
  alert("Missing coin handle. Return to home page.");
  window.location.href = `${basePath}/index.html`;
  throw new Error("Missing ?coin= parameter");
}

// === Fetch coin JSON content ===
const jsonPath = `${basePath}/data/${coinKey}.json`;

fetch(jsonPath)
  .then(response => {
    if (!response.ok) throw new Error("Coin data not found.");
    return response.json();
  })
  .then(data => {
    // Set title and content
    document.title = data.title;
    document.getElementById('coin-title').textContent = data.title;
    document.getElementById('coin-description').textContent = data.description;

    // Render chat messages
    const chatBox = document.getElementById('chat-box');
    data.messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = `message ${msg.type}`;
      div.textContent = msg.text;
      chatBox.appendChild(div);
    });

    // Highlight active menu item
    document.querySelectorAll('#menu li').forEach(item => {
      const coin = item.getAttribute('data-coin');
      if (coin === coinKey) {
        item.classList.add('active');
      }
    });
  })
  .catch(err => {
    console.error(err);
    alert("Failed to load coin content.");
  });

// === Sidebar Menu Navigation ===
document.querySelectorAll('#menu li').forEach(item => {
  item.addEventListener('click', () => {
    const coinPage = item.getAttribute('data-coin');
    localStorage.setItem('lastViewedCoin', coinPage.toUpperCase());
    localStorage.setItem('lastViewedGLB', `${basePath}/models/${coinPage}.glb`);
    window.location.href = `${basePath}/coins/${coinPage}.html`;
  });
});

// === Hamburger Toggle (Mobile Menu) ===
const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('menu');

if (hamburger && menu) {
  hamburger.addEventListener('click', () => {
    menu.classList.toggle('active');
  });
}

// === Scroll-to-Top Button Behavior ===
const scrollTopBtn = document.getElementById('scrollTop');

window.addEventListener('scroll', () => {
  if (window.scrollY > 200) {
    scrollTopBtn.classList.add('visible');
  } else {
    scrollTopBtn.classList.remove('visible');
  }
});

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
