// Show Ledger v1.2 — money over time
// Every entry is money in or money out, for a month, a quarter or a year.
// Quarter and year entries are spread evenly across their months.

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

// ===== Entries that cover one, three or twelve months =====

// All month keys an entry covers. Old entries have no span, so they count as 1.
function entryMonths(entry) {
  const span = entry.span || 1;
  const [year, month] = entry.month.split('-').map(Number);
  return Array.from({ length: span }, (_, i) => {
    const total = year * 12 + (month - 1) + i;
    return monthKey(Math.floor(total / 12), (total % 12) + 1);
  });
}

// How much of an entry falls inside a list of months (spread evenly)
function amountIn(entry, months) {
  const covered = entryMonths(entry);
  const inside = covered.filter(key => months.includes(key)).length;
  return entry.amount / covered.length * inside;
}

// Total of one type ('income' or 'cost') inside a list of months
function totalIn(type, months) {
  return data.entries
    .filter(e => e.type === type)
    .reduce((sum, e) => sum + amountIn(e, months), 0);
}

// 'Sep 2026', 'Q3 2026' or '2026 · full year'
function formatEntryPeriod(entry) {
  const span = entry.span || 1;
  const [year, month] = entry.month.split('-').map(Number);
  if (span === 12) return `${year} · full year`;
  if (span === 3) return `Q${Math.ceil(month / 3)} ${year}`;
  return formatMonth(entry.month);
}

// ===== Periods: month, quarter, year =====

const PERIOD_SIZE = { month: 1, quarter: 3, year: 12 };

let periodType = 'quarter';    // 'month', 'quarter' or 'year'
let anchor = latestAnchor();   // the month the view is centred on

// Start at the latest month that has entries (or this month if none)
function latestAnchor() {
  const now = new Date();
  if (data.entries.length === 0) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const latest = data.entries.flatMap(entryMonths).sort().pop();
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
  const total = a.year * 12 + (a.month - 1) + steps * PERIOD_SIZE[type];
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
  const income = totalIn('income', months);
  const costs = totalIn('cost', months);
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

// ===== Monthly chart: the whole year of the selected period =====

function renderChart() {
  const year = anchor.year;
  const selected = periodMonths(periodType, anchor);
  document.getElementById('chart-title').textContent = `${year} by month`;

  const months = Array.from({ length: 12 }, (_, i) => {
    const key = monthKey(year, i + 1);
    return {
      key: key,
      name: MONTH_NAMES[i],
      income: totalIn('income', [key]),
      costs: totalIn('cost', [key])
    };
  });

  // The tallest bar in the year gets the full height
  const max = Math.max(...months.map(m => Math.max(m.income, m.costs)), 0);
  const height = value => (max > 0 ? Math.round(value / max * 160) : 0);
  const bar = (value, kind) => value > 0
    ? `<i class="${kind}" style="height: ${Math.max(height(value), 3)}px"></i>`
    : '<i class="none" style="height: 2px"></i>';

  document.getElementById('month-chart').innerHTML = months.map(m => {
    const isSelected = selected.includes(m.key);
    return `
      <button type="button" class="month-col ${isSelected ? 'selected' : 'dim'}" data-month="${m.key}"
        aria-label="${m.name} ${year}: income ${formatUSD(m.income)}, costs ${formatUSD(m.costs)}. Show this month.">
        <span class="bars">${bar(m.income, 'income')}${bar(m.costs, 'cost')}</span>
        <span>${m.name}</span>
      </button>`;
  }).join('');
}

// Clicking a month opens its Month view
document.getElementById('month-chart').addEventListener('click', function (event) {
  const column = event.target.closest('.month-col');
  if (!column) return;
  const [year, month] = column.dataset.month.split('-');
  anchor = { year: Number(year), month: Number(month) };
  periodType = 'month';
  renderAll();
});

// ===== Breakdowns: group the period's money by name =====

function groupByCategory(type, months) {
  const totals = {};
  for (const entry of data.entries) {
    if (entry.type !== type) continue;
    const amount = amountIn(entry, months);
    if (amount === 0) continue;
    totals[entry.category] = (totals[entry.category] || 0) + amount;
  }
  return Object.entries(totals)
    .map(([name, total]) => ({ name: name, total: total }))
    .sort((a, b) => b.total - a.total);   // biggest first
}

function renderBreakdown(elementId, type) {
  const months = periodMonths(periodType, anchor);
  const label = periodLabel(periodType, anchor).main;
  const groups = groupByCategory(type, months);
  const total = groups.reduce((sum, g) => sum + g.total, 0);
  const defaults = type === 'income' ? INCOME_STREAMS : COST_CATEGORIES;
  const element = document.getElementById(elementId);

  if (total === 0) {
    element.innerHTML = `<p class="empty">No ${type === 'income' ? 'income' : 'costs'} in ${label}.</p>`;
    return;
  }

  element.innerHTML = groups.map(g => {
    const percent = Math.round(g.total / total * 100);
    const own = defaults.includes(g.name) ? '' : ' <span class="own">(your own)</span>';
    return `
      <div class="stream">
        <div class="stream-row">
          <span>${escapeHtml(g.name)}${own}</span>
          <span>${formatUSD(g.total)} · ${percent}%</span>
        </div>
        <div class="bar"><div class="bar-fill ${type === 'cost' ? 'cost' : ''}" style="width: ${percent}%"></div></div>
      </div>`;
  }).join('');
}

function renderBreakdowns() {
  renderBreakdown('income-breakdown', 'income');
  renderBreakdown('cost-breakdown', 'cost');
}

// ===== The Add entry drawer =====

let entryType = 'income';            // 'income' or 'cost'
let selectedCategory = 'Sponsorship';
let entrySpan = 1;                   // 1 = a month, 3 = a quarter, 12 = a year

function currentChoices() {
  return entryType === 'income' ? INCOME_STREAMS : COST_CATEGORIES;
}

// Fill the month and year dropdowns, and select this month
function fillPeriodSelects() {
  const now = new Date();
  const monthSelect = document.getElementById('entry-month');
  const yearSelect = document.getElementById('entry-year');

  monthSelect.innerHTML = MONTH_NAMES
    .map((name, i) => `<option value="${i + 1}">${name}</option>`)
    .join('');

  // Newest year first, going back 6 years for past yearly totals
  let years = '';
  for (let y = now.getFullYear() + 1; y >= now.getFullYear() - 6; y--) {
    years += `<option value="${y}">${y}</option>`;
  }
  yearSelect.innerHTML = years;

  monthSelect.value = String(now.getMonth() + 1);
  document.getElementById('entry-quarter').value = String(Math.ceil((now.getMonth() + 1) / 3));
  yearSelect.value = String(now.getFullYear());
}

// Point the form at the period that's on screen, so entries land where you look
function syncFormToView() {
  document.getElementById('entry-year').value = String(anchor.year);
  document.getElementById('entry-month').value = String(anchor.month);
  document.getElementById('entry-quarter').value = String(Math.ceil(anchor.month / 3));
}

// Update everything that depends on Money in / Money out
function renderTypeToggle() {
  const isIncome = entryType === 'income';
  document.getElementById('type-income').setAttribute('aria-pressed', String(isIncome));
  document.getElementById('type-cost').setAttribute('aria-pressed', String(!isIncome));
  document.getElementById('category-legend').textContent = isIncome ? 'Where did it come from?' : 'What was it for?';
  document.getElementById('save-entry').textContent = isIncome ? 'Save income' : 'Save cost';
  document.getElementById('entry-note').placeholder = isIncome ? 'e.g. Sponsor name' : 'e.g. Editor fee';
  document.getElementById('other-name').placeholder = isIncome ? 'e.g. Merch, Live event, Grant' : 'e.g. Studio rent, Software';
}

// Draw the chips and show "Name it" only when Other is picked
function renderChips() {
  document.getElementById('category-chips').innerHTML = currentChoices()
    .map(name => `<button type="button" class="chip" data-name="${name}" aria-pressed="${name === selectedCategory}">${name}</button>`)
    .join('');
  document.getElementById('other-field').hidden = selectedCategory !== 'Other';
}

// Month / quarter / year pickers and the "spread evenly" hint
function renderSpan() {
  document.querySelectorAll('.span-types button').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.span) === entrySpan));
  });
  document.getElementById('month-field').hidden = entrySpan !== 1;
  document.getElementById('quarter-field').hidden = entrySpan !== 3;
  renderSpreadHint();
}

function renderSpreadHint() {
  const hint = document.getElementById('spread-hint');
  const amount = Number(document.getElementById('entry-amount').value);
  hint.hidden = entrySpan === 1;
  if (entrySpan === 1) {
    hint.textContent = '';
  } else if (amount > 0) {
    hint.textContent = `Spread evenly: ${formatUSD(amount / entrySpan)} per month.`;
  } else {
    hint.textContent = `The amount is spread evenly across ${entrySpan} months.`;
  }
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

document.querySelector('.span-types').addEventListener('click', function (event) {
  const span = event.target.dataset.span;
  if (!span) return;
  entrySpan = Number(span);
  renderSpan();
});

document.getElementById('entry-amount').addEventListener('input', renderSpreadHint);

// Open and close the drawer
const drawer = document.getElementById('entry-drawer');

document.getElementById('open-entry').addEventListener('click', function () {
  syncFormToView();
  drawer.showModal();
  document.body.classList.add('drawer-open');
  document.getElementById('entry-amount').focus();
});

document.getElementById('close-entry').addEventListener('click', () => drawer.close());

// Runs for the Close button, the Escape key, and clicks outside the drawer
drawer.addEventListener('close', () => document.body.classList.remove('drawer-open'));
drawer.addEventListener('click', function (event) {
  if (event.target === drawer) drawer.close();   // click on the dimmed area
});

// Save an entry
document.getElementById('entry-form').addEventListener('submit', function (event) {
  event.preventDefault();

  const amount = Number(document.getElementById('entry-amount').value);
  if (!(amount > 0)) return;

  const year = Number(document.getElementById('entry-year').value);
  let firstMonth = 1;
  if (entrySpan === 1) firstMonth = Number(document.getElementById('entry-month').value);
  if (entrySpan === 3) firstMonth = (Number(document.getElementById('entry-quarter').value) - 1) * 3 + 1;

  const otherName = document.getElementById('other-name').value.trim();
  const category = selectedCategory === 'Other' ? (otherName || 'Other') : selectedCategory;

  data.entries.push({
    id: newId(),
    type: entryType,
    amount: amount,
    month: monthKey(year, firstMonth),
    span: entrySpan,
    category: category,
    note: document.getElementById('entry-note').value.trim(),
    episodeId: ''
  });

  saveData();

  // Show the period this entry belongs to. If it covers more than the
  // current view (a year entry while looking at a month), widen the view.
  anchor = { year: year, month: firstMonth };
  if (entrySpan > PERIOD_SIZE[periodType]) {
    periodType = entrySpan === 12 ? 'year' : 'quarter';
  }
  renderAll();

  // Clear only what changes between entries; keep period and type
  document.getElementById('entry-amount').value = '';
  document.getElementById('entry-note').value = '';
  document.getElementById('other-name').value = '';
  renderSpreadHint();
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
    .filter(e => amountIn(e, months) > 0)
    .sort((a, b) => b.month.localeCompare(a.month));   // newest first

  if (inPeriod.length === 0) {
    list.innerHTML = `<p class="empty">No entries in ${label}.</p>`;
    return;
  }

  let rows = '';
  for (const entry of inPeriod) {
    const isIncome = entry.type === 'income';
    const part = amountIn(entry, months);
    const isPartial = Math.abs(part - entry.amount) > 0.005;
    const sign = isIncome ? '+' : '−';
    rows += `
      <tr>
        <td>${formatEntryPeriod(entry)}</td>
        <td><span class="badge ${entry.type}">${isIncome ? 'Income' : 'Cost'}</span></td>
        <td>${escapeHtml(entry.category)}</td>
        <td class="muted">${escapeHtml(entry.note)}</td>
        <td class="number ${isIncome ? 'money-in' : ''}">${sign}${formatUSD(part)}${isPartial ? `<span class="small">of ${formatUSD(entry.amount)}</span>` : ''}</td>
        <td class="number"><button class="delete" data-id="${entry.id}">Delete</button></td>
      </tr>`;
  }

  list.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>For</th>
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
  if (confirm(`Delete this ${formatUSD(entry.amount)} ${label} (${entry.category}, ${formatEntryPeriod(entry)})? This cannot be undone.`)) {
    data.entries = data.entries.filter(e => e.id !== entry.id);
    saveData();
    renderAll();
  }
});

// ===== Start =====

function renderAll() {
  renderOverview();
  renderChart();
  renderBreakdowns();
  renderEntries();
}

fillPeriodSelects();
setType('income');
renderSpan();
renderAll();
