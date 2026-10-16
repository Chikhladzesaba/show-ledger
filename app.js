// Show Ledger v1.3 — money over time
// Every entry is money in or money out, for a month, a quarter or a year.
// Quarter and year entries are spread evenly across their months.
// Each entry has a stream (or cost category), and optionally a sub-type.

const STORAGE_KEY = 'showLedgerV2';

// ===== Streams, categories and their sub-types =====
// required: true  -> a sub-type must be picked (the first one is pre-selected)
// brand: true     -> the form also asks for a brand name

const INCOME_STREAMS = [
  {
    name: 'Platform revenue', required: true, subLabel: 'Which platform?',
    subs: ['YouTube', 'Facebook', 'Instagram', 'TikTok', 'Twitch', 'Other'],
    hint: 'Money a platform pays you directly, like YouTube or Facebook monetization.',
    note: 'e.g. September {sub} payout',
    subOther: 'e.g. Kick, Snapchat, LinkedIn'
  },
  {
    name: 'Sponsorships', brand: true, subLabel: 'What kind of deal? (optional)',
    subs: ['Integration', 'Dedicated video', 'Product placement', 'Ambassador deal', 'Event / live', 'Other'],
    hint: 'Brands paying you to feature them in your content.',
    note: 'e.g. Deal for episode 14',
    subNotes: {
      'Integration': 'e.g. 60-second mention in episode 14',
      'Dedicated video': 'e.g. Review video, October',
      'Product placement': 'e.g. Product on the desk in episode 14',
      'Ambassador deal': 'e.g. 3-month deal, first payment',
      'Event / live': 'e.g. Hosting a launch event'
    },
    subOther: 'e.g. Giveaway, Newsletter ad'
  },
  {
    name: 'Fan support', subLabel: 'From where? (optional)',
    subs: ['Patreon', 'Donations', 'Paid community', 'Other'],
    hint: 'Money from your audience outside platform payouts.',
    note: 'e.g. Supporter payout, September',
    subNotes: {
      'Patreon': 'e.g. September Patreon payout',
      'Donations': 'e.g. Donations from the live stream',
      'Paid community': 'e.g. Members club, September'
    },
    subOther: 'e.g. Boosty, Buy Me a Coffee'
  },
  {
    name: 'Affiliate', subLabel: 'How? (optional)',
    subs: ['Affiliate links', 'Promo codes', 'Other'],
    hint: 'Commission from your links and promo codes.',
    note: 'e.g. Commission for September',
    subNotes: {
      'Affiliate links': 'e.g. Gear links in video descriptions',
      'Promo codes': 'e.g. Promo code from the October video'
    },
    subOther: 'e.g. Referral bonus'
  },
  {
    name: 'Products', subLabel: 'What did you sell? (optional)',
    subs: ['Merch', 'Courses', 'Digital products', 'Services', 'Other'],
    hint: 'Things you sell: merch, courses, digital products, services.',
    note: 'e.g. Sales in September',
    subNotes: {
      'Merch': 'e.g. Hoodie drop',
      'Courses': 'e.g. Editing course, 12 sales',
      'Digital products': 'e.g. Preset pack',
      'Services': 'e.g. Consulting for a brand'
    },
    subOther: 'e.g. Event tickets, Printed book'
  },
  { name: 'Other', subs: [], hint: '', note: 'e.g. Workshop fee' }
];

const COST_CATEGORIES = [
  {
    name: 'People', subLabel: 'Who? (optional)',
    subs: ['Editor', 'Host / guest fee', 'Camera / crew', 'Designer', 'Other'],
    hint: 'Anyone you pay to make the content.',
    note: 'e.g. Fees for September',
    subNotes: {
      'Editor': 'e.g. Editing 4 episodes, September',
      'Host / guest fee': 'e.g. Guest fee, episode 14',
      'Camera / crew': 'e.g. Camera operator, 2 shoot days',
      'Designer': 'e.g. Thumbnails for September'
    },
    subOther: 'e.g. Scriptwriter, Producer'
  },
  {
    name: 'Production', subLabel: 'What for? (optional)',
    subs: ['Studio / location', 'Props / set', 'Travel', 'Other'],
    hint: 'Costs of shooting: places, sets, travel.',
    note: 'e.g. Shoot costs for episode 14',
    subNotes: {
      'Studio / location': 'e.g. Studio rent, 2 days',
      'Props / set': 'e.g. New set decor',
      'Travel': 'e.g. Taxi to the shoot'
    },
    subOther: 'e.g. Catering, Permits'
  },
  {
    name: 'Equipment', subLabel: 'What kind? (optional)',
    subs: ['Camera', 'Audio', 'Lighting', 'Computer', 'Other'],
    hint: 'Gear you buy or rent.',
    note: 'e.g. New gear for the studio',
    subNotes: {
      'Camera': 'e.g. Second camera body',
      'Audio': 'e.g. Two lapel mics',
      'Lighting': 'e.g. LED panel kit',
      'Computer': 'e.g. Editing laptop'
    },
    subOther: 'e.g. Tripods, Memory cards'
  },
  {
    name: 'Software & tools', subLabel: 'What kind? (optional)',
    subs: ['Editing software', 'Music / stock', 'Subscriptions', 'Other'],
    hint: 'Apps, licenses and monthly subscriptions.',
    note: 'e.g. Tools for September',
    subNotes: {
      'Editing software': 'e.g. Editing app, yearly plan',
      'Music / stock': 'e.g. Music library, monthly',
      'Subscriptions': 'e.g. Cloud storage, monthly'
    },
    subOther: 'e.g. Scheduling tool'
  },
  {
    name: 'Promotion', subLabel: 'What kind? (optional)',
    subs: ['Paid ads', 'Boosted posts', 'Collaborations', 'Other'],
    hint: 'Money spent to grow your audience.',
    note: 'e.g. Ads for episode 14',
    subNotes: {
      'Paid ads': 'e.g. Instagram ads for episode 14',
      'Boosted posts': 'e.g. Boosted trailer post',
      'Collaborations': 'e.g. Shoutout from another creator'
    },
    subOther: 'e.g. Billboard, Flyers'
  },
  { name: 'Other', subs: [], hint: '', note: 'e.g. Insurance' }
];

// Old stream names from earlier versions -> the new stream and sub-type
const RENAMED_STREAMS = {
  'Ad revenue': { category: 'Platform revenue', subtype: 'YouTube' },
  'YouTube revenue': { category: 'Platform revenue', subtype: 'YouTube' },
  'Memberships': { category: 'Fan support', subtype: '' },
  'Sponsorship': { category: 'Sponsorships', subtype: '' }
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ===== Saving and loading =====

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const entries = parsed.entries || [];
      // Move entries saved under old stream names to the new names
      entries.forEach(e => {
        const renamed = e.type === 'income' ? RENAMED_STREAMS[e.category] : null;
        if (renamed) {
          e.category = renamed.category;
          if (!e.subtype) e.subtype = renamed.subtype;
        }
        if (e.subtype === undefined) e.subtype = '';
        if (e.brand === undefined) e.brand = '';
      });
      return { entries: entries };
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

// 'Platform revenue · YouTube'
function formatCategory(entry) {
  return entry.subtype ? `${entry.category} · ${entry.subtype}` : entry.category;
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

// ===== Breakdowns: group the period's money by stream, then by sub-type =====

function groupByCategory(type, months) {
  const groups = {};
  for (const entry of data.entries) {
    if (entry.type !== type) continue;
    const amount = amountIn(entry, months);
    if (amount === 0) continue;
    if (!groups[entry.category]) groups[entry.category] = { total: 0, subs: {} };
    const group = groups[entry.category];
    group.total += amount;
    const sub = entry.subtype || 'Not specified';
    group.subs[sub] = (group.subs[sub] || 0) + amount;
  }
  return Object.entries(groups)
    .map(([name, g]) => ({
      name: name,
      total: g.total,
      subs: Object.entries(g.subs)
        .map(([subName, subTotal]) => ({ name: subName, total: subTotal }))
        .sort((a, b) => b.total - a.total)
    }))
    .sort((a, b) => b.total - a.total);   // biggest first
}

function renderBreakdown(elementId, type) {
  const months = periodMonths(periodType, anchor);
  const label = periodLabel(periodType, anchor).main;
  const groups = groupByCategory(type, months);
  const total = groups.reduce((sum, g) => sum + g.total, 0);
  const defaults = (type === 'income' ? INCOME_STREAMS : COST_CATEGORIES).map(c => c.name);
  const element = document.getElementById(elementId);

  if (total === 0) {
    element.innerHTML = `<p class="empty">No ${type === 'income' ? 'income' : 'costs'} in ${label}.</p>`;
    return;
  }

  element.innerHTML = groups.map(g => {
    const percent = Math.round(g.total / total * 100);
    const own = defaults.includes(g.name) ? '' : ' <span class="own">(your own)</span>';

    // Sub-type line, e.g. "YouTube $500 · Facebook $100" (only when something is specified)
    const specified = g.subs.some(s => s.name !== 'Not specified');
    const subLine = specified
      ? `<p class="sub-line">${g.subs.map(s => `${escapeHtml(s.name)} ${formatUSD(s.total)}`).join(' · ')}</p>`
      : '';

    return `
      <div class="stream">
        <div class="stream-row">
          <span>${escapeHtml(g.name)}${own}</span>
          <span>${formatUSD(g.total)} · ${percent}%</span>
        </div>
        <div class="bar"><div class="bar-fill ${type === 'cost' ? 'cost' : ''}" style="width: ${percent}%"></div></div>
        ${subLine}
      </div>`;
  }).join('');
}

function renderBreakdowns() {
  renderBreakdown('income-breakdown', 'income');
  renderBreakdown('cost-breakdown', 'cost');
}

// ===== The Add entry drawer =====

let entryType = 'income';                 // 'income' or 'cost'
let selectedCategory = 'Platform revenue';
let selectedSub = 'YouTube';              // '' = none picked
let entrySpan = 1;                        // 1 = a month, 3 = a quarter, 12 = a year

function currentChoices() {
  return entryType === 'income' ? INCOME_STREAMS : COST_CATEGORIES;
}

function currentDefinition() {
  return currentChoices().find(c => c.name === selectedCategory);
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
  document.getElementById('other-name').placeholder = isIncome ? 'e.g. Grant, Prize, Licensing' : 'e.g. Insurance, Accounting, Bank fees';
}

// Draw the stream chips, the explanation line and "Name it" for Other
function renderChips() {
  document.getElementById('category-chips').innerHTML = currentChoices()
    .map(c => `<button type="button" class="chip" data-name="${c.name}" aria-pressed="${c.name === selectedCategory}">${c.name}</button>`)
    .join('');
  document.getElementById('other-field').hidden = selectedCategory !== 'Other';

  const definition = currentDefinition();
  const hint = document.getElementById('category-hint');
  hint.textContent = definition.hint;
  hint.hidden = definition.hint === '';

  renderSubChips();
}

// Draw the second row (sub-types) and the Brand field
function renderSubChips() {
  const definition = currentDefinition();
  const fieldset = document.getElementById('sub-fieldset');

  fieldset.hidden = definition.subs.length === 0;
  document.getElementById('sub-legend').textContent = definition.subLabel || '';
  document.getElementById('sub-chips').innerHTML = definition.subs
    .map(name => `<button type="button" class="chip" data-sub="${name}" aria-pressed="${name === selectedSub}">${name}</button>`)
    .join('');
  document.getElementById('sub-other-field').hidden = selectedSub !== 'Other';

  document.getElementById('brand-field').hidden = !definition.brand;

  // The "Name it" example for a sub-type's Other
  document.getElementById('sub-other-name').placeholder = definition.subOther || '';

  // The note example follows the stream and the sub-type
  let platform = selectedSub && selectedSub !== 'Other' ? selectedSub : 'platform';
  if (platform === 'YouTube') platform = 'AdSense';
  const example = (definition.subNotes && definition.subNotes[selectedSub]) || definition.note || '';
  document.getElementById('entry-note').placeholder = example.replace('{sub}', platform);
}

// Suggest brands the creator has used before
function renderBrandList() {
  const brands = [...new Set(data.entries.map(e => e.brand).filter(Boolean))].sort();
  document.getElementById('brand-list').innerHTML = brands
    .map(b => `<option value="${escapeHtml(b)}"></option>`)
    .join('');
}

// "coca cola" -> "Coca-Cola" if that spelling was used before (ignores case and spaces)
function matchBrand(typed) {
  const clean = text => text.toLowerCase().replace(/[\s\-.]/g, '');
  const existing = data.entries.map(e => e.brand).find(b => b && clean(b) === clean(typed));
  return existing || typed;
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

// Pick a stream; required ones pre-select their first sub-type
function selectCategory(name) {
  selectedCategory = name;
  const definition = currentDefinition();
  selectedSub = definition.required ? definition.subs[0] : '';
  renderChips();
}

function setType(type) {
  entryType = type;
  selectCategory(currentChoices()[0].name);
  renderTypeToggle();
}

document.getElementById('type-income').addEventListener('click', () => setType('income'));
document.getElementById('type-cost').addEventListener('click', () => setType('cost'));

document.getElementById('category-chips').addEventListener('click', function (event) {
  if (!event.target.classList.contains('chip')) return;
  selectCategory(event.target.dataset.name);
  if (selectedCategory === 'Other') {
    document.getElementById('other-name').focus();
  }
});

// Sub-type chips: click to pick, click again to un-pick (only when optional)
document.getElementById('sub-chips').addEventListener('click', function (event) {
  if (!event.target.classList.contains('chip')) return;
  const name = event.target.dataset.sub;
  const required = currentDefinition().required;
  selectedSub = (selectedSub === name && !required) ? '' : name;
  renderSubChips();
  if (selectedSub === 'Other') {
    document.getElementById('sub-other-name').focus();
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
  renderBrandList();
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

  const definition = currentDefinition();
  const otherName = document.getElementById('other-name').value.trim();
  const category = selectedCategory === 'Other' ? (otherName || 'Other') : selectedCategory;

  const subOtherName = document.getElementById('sub-other-name').value.trim();
  const subtype = selectedSub === 'Other' ? (subOtherName || 'Other') : selectedSub;

  const typedBrand = document.getElementById('entry-brand').value.trim();
  const brand = definition.brand && typedBrand ? matchBrand(typedBrand) : '';

  data.entries.push({
    id: newId(),
    type: entryType,
    amount: amount,
    month: monthKey(year, firstMonth),
    span: entrySpan,
    category: category,
    subtype: subtype,
    brand: brand,
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
  renderBrandList();

  // Clear only what changes between entries; keep period, type and stream
  document.getElementById('entry-amount').value = '';
  document.getElementById('entry-note').value = '';
  document.getElementById('other-name').value = '';
  document.getElementById('sub-other-name').value = '';
  document.getElementById('entry-brand').value = '';
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
    const details = [entry.brand ? `<strong>${escapeHtml(entry.brand)}</strong>` : '', escapeHtml(entry.note)]
      .filter(Boolean)
      .join(' · ');
    rows += `
      <tr>
        <td>${formatEntryPeriod(entry)}</td>
        <td><span class="badge ${entry.type}">${isIncome ? 'Income' : 'Cost'}</span></td>
        <td>${escapeHtml(formatCategory(entry))}</td>
        <td class="muted">${details}</td>
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
          <th>Brand / note</th>
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
  if (confirm(`Delete this ${formatUSD(entry.amount)} ${label} (${formatCategory(entry)}, ${formatEntryPeriod(entry)})? This cannot be undone.`)) {
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
