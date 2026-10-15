// Show Ledger v1.1 — money over time
// Every entry is money in or money out, for a specific month.

const STORAGE_KEY = 'showLedgerV2';

const INCOME_STREAMS = ['Sponsorship', 'Ad revenue', 'Memberships', 'Affiliate', 'Other'];
const COST_CATEGORIES = ['People', 'Production', 'Equipment', 'Promotion', 'Other'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ===== Saving and loading =====

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { entries: parsed.entries || [] };
    }
  } catch (error) {
    console.error('Could not load saved data:', error);
  }
  return { entries: [] };
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

function formatUSD(amount) {
  return '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function newId() {
  return String(Date.now()) + Math.random().toString(36).slice(2, 6);
}

// '2026-09' -> 'Sep 2026'
function formatMonth(key) {
  const [year, month] = key.split('-');
  return MONTH_NAMES[Number(month) - 1] + ' ' + year;
}

// ===== The Add entry form =====

let entryType = 'income';           // 'income' or 'cost'
let selectedCategory = 'Sponsorship';

function currentChoices() {
  return entryType === 'income' ? INCOME_STREAMS : COST_CATEGORIES;
}

// Fill the month and year dropdowns, and select this month
function fillPeriodSelects() {
  const now = new Date();
  const monthSelect = document.getElementById('entry-month');
  const yearSelect = document.getElementById('entry-year');

  monthSelect.innerHTML = MONTH_NAMES
    .map((name, i) => `<option value="${String(i + 1).padStart(2, '0')}">${name}</option>`)
    .join('');

  let years = '';
  for (let y = now.getFullYear() - 3; y <= now.getFullYear() + 1; y++) {
    years += `<option value="${y}">${y}</option>`;
  }
  yearSelect.innerHTML = years;

  monthSelect.value = String(now.getMonth() + 1).padStart(2, '0');
  yearSelect.value = String(now.getFullYear());
}

// Update everything that depends on Money in / Money out
function renderTypeToggle() {
  const isIncome = entryType === 'income';
  document.getElementById('type-income').setAttribute('aria-pressed', String(isIncome));
  document.getElementById('type-cost').setAttribute('aria-pressed', String(!isIncome));
  document.getElementById('category-legend').textContent = isIncome ? 'Where did it come from?' : 'What was it for?';
  document.getElementById('save-entry').textContent = isIncome ? 'Save income' : 'Save cost';
  document.getElementById('entry-note').placeholder = isIncome ? 'e.g. Sponsor name' : 'e.g. Editor fee for September';
  document.getElementById('other-name').placeholder = isIncome ? 'e.g. Merch, Live event, Grant' : 'e.g. Studio rent, Software';
}

// Draw the chips and show "Name it" only when Other is picked
function renderChips() {
  document.getElementById('category-chips').innerHTML = currentChoices()
    .map(name => `<button type="button" class="chip" data-name="${name}" aria-pressed="${name === selectedCategory}">${name}</button>`)
    .join('');
  document.getElementById('other-field').hidden = selectedCategory !== 'Other';
}

function setType(type) {
  entryType = type;
  selectedCategory = currentChoices()[0];
  renderTypeToggle();
  renderChips();
}

document.getElementById('type-income').addEventListener('click', () => setType('income'));
document.getElementById('type-cost').addEventListener('click', () => setType('cost'));

document.getElementById('category-chips').addEventListener('click', function (event) {
  if (!event.target.classList.contains('chip')) return;
  selectedCategory = event.target.dataset.name;
  renderChips();
  if (selectedCategory === 'Other') {
    document.getElementById('other-name').focus();
  }
});

// Open and close the panel
const panel = document.getElementById('entry-panel');
const openButton = document.getElementById('open-entry');

openButton.addEventListener('click', function () {
  panel.hidden = false;
  openButton.hidden = true;
  document.getElementById('entry-amount').focus();
});

document.getElementById('close-entry').addEventListener('click', function () {
  panel.hidden = true;
  openButton.hidden = false;
});

// Save an entry
document.getElementById('entry-form').addEventListener('submit', function (event) {
  event.preventDefault();

  const amount = Number(document.getElementById('entry-amount').value);
  if (!(amount > 0)) return;

  const month = document.getElementById('entry-year').value + '-' + document.getElementById('entry-month').value;
  const otherName = document.getElementById('other-name').value.trim();
  const category = selectedCategory === 'Other' ? (otherName || 'Other') : selectedCategory;

  data.entries.push({
    id: newId(),
    type: entryType,
    amount: amount,
    month: month,
    category: category,
    note: document.getElementById('entry-note').value.trim(),
    episodeId: ''
  });

  saveData();
  renderEntries();

  // Clear only what changes between entries; keep month and type
  document.getElementById('entry-amount').value = '';
  document.getElementById('entry-note').value = '';
  document.getElementById('other-name').value = '';
  document.getElementById('entry-amount').focus();

  // A short "Saved" confirmation on the button
  const saveButton = document.getElementById('save-entry');
  saveButton.textContent = 'Saved ✓';
  setTimeout(renderTypeToggle, 1200);
});

// ===== The entries list =====

function renderEntries() {
  const list = document.getElementById('entries-list');

  if (data.entries.length === 0) {
    list.innerHTML = '<p class="empty">No entries yet. Click "+ Add entry" to start.</p>';
    return;
  }

  // Newest month first
  const sorted = [...data.entries].sort((a, b) => b.month.localeCompare(a.month));

  let rows = '';
  for (const entry of sorted) {
    const isIncome = entry.type === 'income';
    rows += `
      <tr>
        <td>${formatMonth(entry.month)}</td>
        <td><span class="badge ${entry.type}">${isIncome ? 'Income' : 'Cost'}</span></td>
        <td>${escapeHtml(entry.category)}</td>
        <td class="muted">${escapeHtml(entry.note)}</td>
        <td class="number ${isIncome ? 'money-in' : ''}">${isIncome ? '+' : '−'}${formatUSD(entry.amount)}</td>
        <td class="number"><button class="delete" data-id="${entry.id}">Delete</button></td>
      </tr>`;
  }

  list.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Month</th>
          <th>Type</th>
          <th>Stream / category</th>
          <th>Note</th>
          <th class="number">Amount</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

document.getElementById('entries-list').addEventListener('click', function (event) {
  if (!event.target.classList.contains('delete')) return;

  const entry = data.entries.find(e => e.id === event.target.dataset.id);
  if (!entry) return;

  const label = entry.type === 'income' ? 'income' : 'cost';
  if (confirm(`Delete this ${formatUSD(entry.amount)} ${label} (${entry.category}, ${formatMonth(entry.month)})? This cannot be undone.`)) {
    data.entries = data.entries.filter(e => e.id !== entry.id);
    saveData();
    renderEntries();
  }
});

// ===== Start =====

fillPeriodSelects();
setType('income');
renderEntries();
