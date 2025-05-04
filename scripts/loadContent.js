// === Get coin key from URL ===
const params = new URLSearchParams(location.search);
const coinKey = params.get('coin');

if (!coinKey) {
  alert("Missing coin handle. Return to home page.");
  window.location.href = '../index.html';
  throw new Error("Missing ?coin= parameter");
}

// === Fetch coin JSON content ===
const jsonPath = `${location.origin}/coinproject/data/${coinKey}.json`;

fetch(jsonPath)
  .then(response => {
    if (!response.ok) throw new Error("Coin data not found.");
    return response.json();
  })
  .then(data => {
    // Set document title and content
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
    const menuItems = document.querySelectorAll('#menu li');
    menuItems.forEach(item => {
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

// === Menu navigation ===
document.querySelectorAll('#menu li').forEach(item => {
  item.addEventListener('click', () => {
    const coinPage = item.getAttribute('data-coin');
    localStorage.setItem('lastViewedCoin', coinPage.toUpperCase());
    localStorage.setItem('lastViewedGLB', `${location.origin}/coinproject/models/${coinPage}.glb`);
    window.location.href = `../coins/${coinPage}.html`;
  });
});

// === Hamburger menu toggle ===
const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('menu');

if (hamburger && menu) {
  hamburger.addEventListener('click', () => {
    menu.classList.toggle('active');
  });
}

// === Scroll-to-top button behavior ===
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
