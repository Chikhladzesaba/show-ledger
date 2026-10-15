// Show Ledger — app behavior 
// All data is saved in this browser's localStorage under one key.

const STORAGE_KEY = 'showLedger';

// The revenue streams. One list, used everywhere in the app.
const STREAMS = ['Ad revenue', 'Sponsorship', 'Memberships', 'Affiliate', 'Other'];

// ===== Saving and loading =====

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        episodes: parsed.episodes || [],
        revenue: parsed.revenue || []
      };
    }
  } catch (error) {
    console.error('Could not load saved data:', error);
  }
  return { episodes: [], revenue: [] };
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Could not save data:', error);
    alert('Could not save. Your browser may be blocking storage.');
  }
}

let data = loadData();

// ===== Small helpers =====

// Show a number as dollars, e.g. 1234.5 -> $1,234.50 and -20 -> −$20.00
function formatUSD(amount) {
  const sign = amount < 0 ? '−' : '';
  return sign + '$' + Math.abs(amount).toLocaleString('en-US', {
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

// Create a unique id for each new item
function newId() {
  return String(Date.now()) + Math.random().toString(36).slice(2, 6);
}

// Find an episode's title from its id
function episodeTitle(id) {
  const episode = data.episodes.find(e => e.id === id);
  return episode ? episode.title : 'Not tied to an episode';
}

// Episodes sorted newest first
function sortedEpisodes() {
  return [...data.episodes].sort((a, b) => b.date.localeCompare(a.date));
}

// ===== Calculations (worked out fresh, never stored) =====

// Add up one field across a list, e.g. sum(data.revenue, 'amount')
function sum(list, field) {
  return list.reduce((total, item) => total + item[field], 0);
}

// All revenue linked to one episode
function revenueForEpisode(id) {
  return sum(data.revenue.filter(r => r.episodeId === id), 'amount');
}

// Total per stream, biggest first
function streamTotals() {
  return STREAMS
    .map(stream => ({
      stream: stream,
      total: sum(data.revenue.filter(r => r.stream === stream), 'amount')
    }))
    .sort((a, b) => b.total - a.total);
}

// ===== Drawing the page =====

function renderSummary() {
  const totalRevenue = sum(data.revenue, 'amount');
  const totalCost = sum(data.episodes, 'cost');
  const profit = totalRevenue - totalCost;
  const hasData = data.revenue.length > 0 || data.episodes.length > 0;

  document.getElementById('tile-revenue').textContent = hasData ? formatUSD(totalRevenue) : '—';
  document.getElementById('tile-cost').textContent = hasData ? formatUSD(totalCost) : '—';

  const profitTile = document.getElementById('tile-profit');
  profitTile.textContent = hasData ? formatUSD(profit) : '—';
  profitTile.className = 'tile-value' + (hasData ? (profit < 0 ? ' loss' : ' profit') : '');

  const sourceTile = document.getElementById('tile-source');
  const sourceName = document.getElementById('tile-source-name');
  if (totalRevenue > 0) {
    const top = streamTotals()[0];
    sourceTile.textContent = Math.round(top.total / totalRevenue * 100) + '%';
    sourceName.textContent = top.stream;
  } else {
    sourceTile.textContent = '—';
    sourceName.textContent = '';
  }
}

function renderStreams() {
  const list = document.getElementById('stream-list');
  const totalRevenue = sum(data.revenue, 'amount');

  if (totalRevenue === 0) {
    list.innerHTML = '<p class="empty">Add revenue to see how it splits by stream.</p>';
    return;
  }

  let html = '';
  for (const item of streamTotals()) {
    const percent = Math.round(item.total / totalRevenue * 100);
    html += `
      <div class="stream">
        <div class="stream-row">
          <span>${item.stream}</span>
          <span>${formatUSD(item.total)} · ${percent}%</span>
        </div>
        <div class="bar"><div class="bar-fill" style="width: ${percent}%"></div></div>
      </div>`;
  }
  list.innerHTML = html;
}

function renderEpisodes() {
  const list = document.getElementById('episode-list');

  if (data.episodes.length === 0) {
    list.innerHTML = '<p class="empty">No episodes yet.</p>';
    return;
  }

  let rows = '';
  for (const episode of sortedEpisodes()) {
    const revenue = revenueForEpisode(episode.id);
    const profit = revenue - episode.cost;
    rows += `
      <tr>
        <td>${escapeHtml(episode.title)}</td>
        <td>${episode.date}</td>
        <td class="number">${formatUSD(revenue)}</td>
        <td class="number">${formatUSD(episode.cost)}</td>
        <td class="number ${profit < 0 ? 'loss' : 'profit'}">${formatUSD(profit)}</td>
        <td class="number"><button class="delete" data-id="${episode.id}">Delete</button></td>
      </tr>`;
  }

  list.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Published</th>
          <th class="number">Revenue</th>
          <th class="number">Cost</th>
          <th class="number">Profit</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// Fill the Stream dropdown from the STREAMS list
function renderStreamOptions() {
  const select = document.getElementById('revenue-stream');
  select.innerHTML = STREAMS
    .map(stream => `<option value="${stream}">${stream}</option>`)
    .join('');
}

// Fill the Episode dropdown with the current episodes
function renderEpisodeOptions() {
  const select = document.getElementById('revenue-episode');
  const current = select.value;

  let options = '<option value="">Not tied to an episode</option>';
  for (const episode of sortedEpisodes()) {
    options += `<option value="${episode.id}">${escapeHtml(episode.title)}</option>`;
  }
  select.innerHTML = options;

  // Keep the previous choice if that episode still exists
  if (data.episodes.some(e => e.id === current)) {
    select.value = current;
  }
}

function renderRevenue() {
  const list = document.getElementById('revenue-list');

  if (data.revenue.length === 0) {
    list.innerHTML = '<p class="empty">No revenue entries yet.</p>';
    return;
  }

  // Newest entries first
  const sorted = [...data.revenue].sort((a, b) => b.date.localeCompare(a.date));

  let rows = '';
  for (const entry of sorted) {
    rows += `
      <tr>
        <td>${entry.date}</td>
        <td>${entry.stream}</td>
        <td>${escapeHtml(episodeTitle(entry.episodeId))}</td>
        <td>${escapeHtml(entry.note)}</td>
        <td class="number">${formatUSD(entry.amount)}</td>
        <td class="number"><button class="delete" data-id="${entry.id}">Delete</button></td>
      </tr>`;
  }

  list.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Stream</th>
          <th>Episode</th>
          <th>Note</th>
          <th class="number">Amount</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// Redraw everything that depends on the data
function renderAll() {
  renderSummary();
  renderStreams();
  renderEpisodes();
  renderEpisodeOptions();
  renderRevenue();
}

// ===== Episodes: add and delete =====

document.getElementById('episode-form').addEventListener('submit', function (event) {
  event.preventDefault(); // stop the page from reloading

  const title = document.getElementById('episode-title').value.trim();
  const date = document.getElementById('episode-date').value;
  const cost = Number(document.getElementById('episode-cost').value) || 0;

  if (!title || !date) return;

  data.episodes.push({ id: newId(), title: title, date: date, cost: cost });

  saveData();
  renderAll();
  event.target.reset();
  document.getElementById('episode-title').focus();
});

document.getElementById('episode-list').addEventListener('click', function (event) {
  if (!event.target.classList.contains('delete')) return;

  const id = event.target.dataset.id;
  const episode = data.episodes.find(e => e.id === id);
  if (!episode) return;

  const linked = data.revenue.filter(r => r.episodeId === id).length;
  let message = `Delete "${episode.title}"? This cannot be undone.`;
  if (linked > 0) {
    message += `\n\n${linked} revenue entr${linked === 1 ? 'y is' : 'ies are'} linked to it. They will be kept, but no longer tied to an episode.`;
  }

  if (confirm(message)) {
    data.episodes = data.episodes.filter(e => e.id !== id);
    // Keep the money, just unlink it from the deleted episode
    data.revenue.forEach(r => {
      if (r.episodeId === id) r.episodeId = '';
    });
    saveData();
    renderAll();
  }
});

// ===== Revenue: add and delete =====

document.getElementById('revenue-form').addEventListener('submit', function (event) {
  event.preventDefault();

  const date = document.getElementById('revenue-date').value;
  const amount = Number(document.getElementById('revenue-amount').value);
  const stream = document.getElementById('revenue-stream').value;
  const episodeId = document.getElementById('revenue-episode').value;
  const note = document.getElementById('revenue-note').value.trim();

  if (!date || !(amount > 0)) return;

  data.revenue.push({
    id: newId(),
    date: date,
    amount: amount,
    stream: stream,
    episodeId: episodeId,
    note: note
  });

  saveData();
  renderAll();
  event.target.reset();
  document.getElementById('revenue-amount').focus();
});

document.getElementById('revenue-list').addEventListener('click', function (event) {
  if (!event.target.classList.contains('delete')) return;

  const id = event.target.dataset.id;
  const entry = data.revenue.find(r => r.id === id);
  if (!entry) return;

  if (confirm(`Delete this ${formatUSD(entry.amount)} entry? This cannot be undone.`)) {
    data.revenue = data.revenue.filter(r => r.id !== id);
    saveData();
    renderAll();
  }
});
// ===== Export: revenue entries as a spreadsheet (CSV) =====

// Wrap a value in quotes if it contains a comma, quote or line break
function csvCell(value) {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

document.getElementById('csv-button').addEventListener('click', function () {
  if (data.revenue.length === 0) {
    alert('There is no revenue to export yet.');
    return;
  }

  const header = ['Date', 'Stream', 'Episode', 'Note', 'Amount (USD)'];

  // Oldest first, like a normal ledger
  const rows = [...data.revenue]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => [
      r.date,
      r.stream,
      r.episodeId ? episodeTitle(r.episodeId) : '',
      r.note,
      r.amount.toFixed(2)
    ]);

  const csv = [header, ...rows]
    .map(row => row.map(csvCell).join(','))
    .join('\n');

  // '\uFEFF' tells Excel the file is UTF-8, so Georgian text shows correctly
  const file = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const today = new Date().toISOString().slice(0, 10);

  const link = document.createElement('a');
  link.href = url;
  link.download = `show-ledger-revenue-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});
// ===== Start =====

renderStreamOptions();
renderAll();
