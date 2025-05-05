// === GitHub Pages Base Path ===
const basePath = `${window.location.origin}/coin-project`;

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
  })
  .catch(err => {
    console.error(err);
    alert("Failed to load coin content.");
  });