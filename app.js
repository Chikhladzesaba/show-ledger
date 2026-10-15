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

// 1234.5 -> $1,234.50
function formatUSD(amount) {
  return '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Like formatUSD, but shows a minus for negative numbers: −$50.00
function formatMoney(amount) {
  return (amount < 0 ? '−' : '') + formatUSD(Math.abs(amount));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function newId() {
  return String(Date.now()) + Math.random().toString(36).slice(2, 6);
}

// 2026, 9 -> '2026-09'
function monthKey(year, month) {
  return year + '-' + String(month).padStart(2, '0');
}

// '2026-09' -> 'Sep 2026'
function formatMonth(key) {
  const [year, month] = key.split('-');
  return MONTH_NAMES[Number(month) - 1] + ' ' + year;
}

function sumAmounts(list) {
  return list.reduce((total, entry) => total + entry.amount, 0);
}

// ===== Periods: month, quarter, year =====

let periodType = 'quarter';    // 'month', 'quarter' or 'year'
let anchor = latestAnchor();   // the month the view is centred on

// Start at the latest month that has entries (or this month if none)
function latestAnchor() {
  const now = new Date();
  if (data.entries.length === 0) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const latest = data.entries.map(e => e.month).sort().pop();
  const [year, month] = latest.split('-');
  return { year: Number(year), month: Number(month) };
}

// All month keys inside the period around the anchor
function periodMonths(type, a) {
  if (type === 'month') {
    return [monthKey(a.year, a.month)];
  }
  if (type === 'quarter') {
    const start = Math.floor((a.month - 1) / 3) * 3 + 1;
    return [0, 1, 2].map(i => monthKey(a.year, start + i));
  }
  return Array.from({ length: 12 }, (_, i) => monthKey(a.year, i + 1));
}

// Move the anchor by whole periods (1, 3 or 12 months per step)
function shiftAnchor(type, a, steps) {
  const size = type === 'month' ? 1 : type === 'quarter' ? 3 : 12;
  const total = a.year * 12 + (a.month - 1) + steps * size;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

// A readable name for a period, e.g. { main: 'Q3 2026', sub: 'Jul–Sep' }
function periodLabel(type, a) {
  if (type === 'month') {
    return { main: MONTH_NAMES[a.month - 1] + ' ' + a.year, sub: '' };
  }
  if (type === 'quarter') {
    const q = Math.ceil(a.month / 3);
    const start = (q - 1) * 3;
    return { main: `Q${q} ${a.year}`, sub: `${MONTH_NAMES[start]}–${MONTH_NAMES[start + 2]}` };
  }
  return { main: String(a.year), sub: '' };
}

// Income, costs, profit and return for a list of months
function totalsFor(months) {
  const list = data.entries.filter(e => months.includes(e.month));
  const income = sumAmounts(list.filter(e => e.type === 'income'));
  const costs = sumAmounts(list.filter(e => e.type === 'cost'));
  return {
    income: income,
    costs: costs,
    profit: income - costs,
    ret: costs > 0 ? income / costs : null   // income per $1 spent
  };
}

// '↑ 12% vs Q2 2026'
function changeText(now, before, prevName) {
  if (before === 0) return `— vs ${prevName}`;
  const pct = Math.round((now - before) / Math.abs(before) * 100);
  const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
  return `${arrow} ${Math.abs(pct)}% vs ${prevName}`;
}

// Green when a number went up, red when it went down
function trendClass(now, before) {
  if (before === 0 || now === before) return '';
  return now > before ? 'up' : 'down';
}

function setTile(name, value, valueClass, change, changeClass) {
  const valueEl = document.getElementById('tile-' + name);
  const changeEl = document.getElementById('change-' + name);
  valueEl.textContent = value;
  valueEl.className = 'tile-value ' + valueClass;
  changeEl.textContent = change;
  changeEl.className = 'tile-change ' + changeClass;
}

function renderOverview() {
  // The switch and the period name
  document.querySelectorAll('.period-types button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.type === periodType));
  });
  const label = periodLabel(periodType, anchor);
  document.getElementById('period-label').innerHTML =
    label.sub ? `${label.main} <span>· ${label.sub}</span>` : label.main;

  // This period vs the one before
  const now = totalsFor(periodMonths(periodType, anchor));
  const prevAnchor = shiftAnchor(periodType, anchor, -1);
  const before = totalsFor(periodMonths(periodType, prevAnchor));
  const prevName = periodLabel(periodType, prevAnchor).main;

  setTile('income', formatUSD(now.income), '',
    changeText(now.income, before.income, prevName), trendClass(now.income, before.income));

  // Costs going up isn't automatically good or bad, so no color
  setTile('costs', formatUSD(now.costs), '',
    changeText(now.costs, before.costs, prevName), '');

  setTile('profit', formatMoney(now.profit), now.profit < 0 ? 'loss' : (now.profit > 0 ? 'profit' : ''),
    changeText(now.profit, before.profit, prevName), trendClass(now.profit, before.profit));

  if (now.ret === null) {
    setTile('return', '—', '', 'No costs in this period', '');
  } else if (before.ret === null) {
    setTile('return', '$' + now.ret.toFixed(2), '', `— vs ${prevName}`, '');
  } else {
    const diff = now.ret - before.ret;
    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
    setTile('return', '$' + now.ret.toFixed(2), '',
      `${arrow} $${Math.abs(diff).toFixed(2)} vs ${prevName}`, trendClass(now.ret, before.ret));
  }
}

document.querySelector('.period-types').addEventListener('click', function (event) {
  const type = event.target.dataset.type;
  if (!type) return;
  periodType = type;
  renderAll();
});

document.getElementById('period-prev').addEventListener('click', function () {
  anchor = shiftAnchor(periodType, anchor, -1);
  renderAll();
});

document.getElementById('period-next').addEventListener('click', function () {
  anchor = shiftAnchor(periodType, anchor, 1);
  renderAll();
});

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

  const year = document.getElementById('entry-year').value;
  const month = document.getElementById('entry-month').value;
  const otherName = document.getElementById('other-name').value.trim();
  const category = selectedCategory === 'Other' ? (otherName || 'Other') : selectedCategory;

  data.entries.push({
    id: newId(),
    type: entryType,
    amount: amount,
    month: year + '-' + month,
    category: category,
    note: document.getElementById('entry-note').value.trim(),
    episodeId: ''
  });

  saveData();

  // Show the period this entry belongs to
  anchor = { year: Number(year), month: Number(month) };
  renderAll();

  // Clear only what changes between entries; keep month and type
  document.getElementById('entry-amount').value = '';
  document.getElementById('entry-note').value = '';
  document.getElementById('other-name').value = '';
  document.getElementById('entry-amount').focus();

  // A short "Saved" confirmation on the button
  document.getElementById('save-entry').textContent = 'Saved ✓';
  setTimeout(renderTypeToggle, 1200);
});

// ===== The entries list (only the selected period) =====

function renderEntries() {
  const list = document.getElementById('entries-list');
  const label = periodLabel(periodType, anchor).main;
  const months = periodMonths(periodType, anchor);

  document.getElementById('entries-title').textContent = `Entries · ${label}`;

  if (data.entries.length === 0) {
    list.innerHTML = '<p class="empty">No entries yet. Click "+ Add entry" to start.</p>';
    return;
  }

  const inPeriod = data.entries
    .filter(e => months.includes(e.month))
    .sort((a, b) => b.month.localeCompare(a.month));   // newest month first

  if (inPeriod.length === 0) {
    list.innerHTML = `<p class="empty">No entries in ${label}.</p>`;
    return;
  }

  let rows = '';
  for (const entry of inPeriod) {
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
    renderAll();
  }
});

// ===== Start =====

function renderAll() {
  renderOverview();
  renderEntries();
}

fillPeriodSelects();
setType('income');
renderAll();
