// Show Ledger — app behavior
// All data is saved in this browser's localStorage under one key.

const STORAGE_KEY = 'showLedger';

// Read saved data from the browser, or start empty
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.error('Could not load saved data:', error);
  }
  return { episodes: [], revenue: [] };
}

// Write current data into the browser
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Could not save data:', error);
    alert('Could not save. Your browser may be blocking storage.');
  }
}

let data = loadData();

// Show a number as dollars, e.g. 1234.5 -> $1,234.50
function formatUSD(amount) {
  return '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Make typed text safe to put inside the page
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Draw the episodes table
function renderEpisodes() {
  const list = document.getElementById('episode-list');

  if (data.episodes.length === 0) {
    list.innerHTML = '<p class="empty">No episodes yet.</p>';
    return;
  }

  // Newest episodes first
  const sorted = [...data.episodes].sort((a, b) => b.date.localeCompare(a.date));

  let rows = '';
  for (const episode of sorted) {
    rows += `
      <tr>
        <td>${escapeHtml(episode.title)}</td>
        <td>${episode.date}</td>
        <td class="number">${formatUSD(episode.cost)}</td>
        <td class="number"><button class="delete" data-id="${episode.id}">Delete</button></td>
      </tr>`;
  }

  list.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Published</th>
          <th class="number">Cost</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// When the form is submitted, add a new episode
document.getElementById('episode-form').addEventListener('submit', function (event) {
  event.preventDefault(); // stop the page from reloading

  const title = document.getElementById('episode-title').value.trim();
  const date = document.getElementById('episode-date').value;
  const cost = Number(document.getElementById('episode-cost').value) || 0;

  if (!title || !date) return;

  data.episodes.push({
    id: String(Date.now()),
    title: title,
    date: date,
    cost: cost
  });

  saveData();
  renderEpisodes();
  event.target.reset();
  document.getElementById('episode-title').focus();
});

// When a Delete button is clicked, remove that episode
document.getElementById('episode-list').addEventListener('click', function (event) {
  if (!event.target.classList.contains('delete')) return;

  const id = event.target.dataset.id;
  const episode = data.episodes.find(e => e.id === id);
  if (!episode) return;

  if (confirm(`Delete "${episode.title}"? This cannot be undone.`)) {
    data.episodes = data.episodes.filter(e => e.id !== id);
    saveData();
    renderEpisodes();
  }
});

// Draw everything when the page first opens
renderEpisodes();
