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
  const empty = {
    entries: [], series: [],
    channels: [{ id: 'main', name: 'My channel' }],
    settings: { mainCurrency: 'USD', gelPerUsd: 0, activeChannel: 'all' }
  };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const entries = parsed.entries || [];
      const series = parsed.series || [];
      const channels = parsed.channels && parsed.channels.length ? parsed.channels : empty.channels;
      const settings = Object.assign({}, empty.settings, parsed.settings || {});
      const firstChannel = channels[0].id;

      // Move entries saved under old stream names to the new names,
      // and fill in fields that older versions didn't have
      entries.forEach(e => {
        const renamed = e.type === 'income' ? RENAMED_STREAMS[e.category] : null;
        if (renamed) {
          e.category = renamed.category;
          if (!e.subtype) e.subtype = renamed.subtype;
        }
        if (e.subtype === undefined) e.subtype = '';
        if (e.brand === undefined) e.brand = '';
        if (!e.status) e.status = 'paid';
        if (!e.currency) e.currency = 'USD';
        if (!e.channelId) e.channelId = firstChannel;
      });
      series.forEach(s => {
        if (!s.currency) s.currency = 'USD';
        if (!s.channelId) s.channelId = firstChannel;
      });
      return { entries, series, channels, settings };
    }
  } catch (error) {
    console.error('Could not load saved data:', error);
  }
  return empty;
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

// ===== Currencies =====

const CURRENCY_SYMBOLS = { USD: '$', GEL: '₾' };

function mainCurrency() {
  return data.settings.mainCurrency;
}

function currencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency || mainCurrency()];
}

// 1234.5, 'GEL' -> ₾1,234.50
function formatIn(amount, currency) {
  return currencySymbol(currency) + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// In the creator's main currency
function formatMain(amount) {
  return formatIn(amount, mainCurrency());
}

// Convert between USD and GEL with a rate (GEL per 1 USD)
function convert(amount, from, to, gelPerUsd) {
  if (from === to) return amount;
  if (!(gelPerUsd > 0)) return amount;          // no rate known: leave as is
  return from === 'USD' ? amount * gelPerUsd : amount / gelPerUsd;
}

// An entry's full amount in the main currency, using the rate typed for it
function valueInMain(entry) {
  const rate = entry.gelPerUsd || data.settings.gelPerUsd;
  return convert(entry.amount, entry.currency || 'USD', mainCurrency(), rate);
}

// ===== Channels =====

function channelName(id) {
  const channel = data.channels.find(c => c.id === id);
  return channel ? channel.name : '';
}

// The entries of the chosen channel (or all of them)
function visibleEntries() {
  const active = data.settings.activeChannel;
  if (active === 'all' || !data.channels.some(c => c.id === active)) return data.entries;
  return data.entries.filter(e => e.channelId === active);
}

// Like formatMain, but shows a minus for negative numbers: −$50.00
function formatMoney(amount) {
  return (amount < 0 ? '−' : '') + formatMain(Math.abs(amount));
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
  return valueInMain(entry) / covered.length * inside;
}

// Total of one type ('income' or 'cost') inside a list of months
// Expected payments are shown separately; totals count paid money only
function isPaid(entry) {
  return entry.status !== 'expected';
}

function totalIn(type, months) {
  return visibleEntries()
    .filter(e => e.type === type && isPaid(e))
    .reduce((sum, e) => sum + amountIn(e, months), 0);
}

// This month as '2026-10'
function todayKey() {
  const now = new Date();
  return monthKey(now.getFullYear(), now.getMonth() + 1);
}

// '2026-11' + 2 -> '2027-01'
function addMonths(key, n) {
  const [year, month] = key.split('-').map(Number);
  const total = year * 12 + (month - 1) + n;
  return monthKey(Math.floor(total / 12), (total % 12) + 1);
}

// The last month an entry covers (a quarter entry for Q3 ends in Sep)
function lastMonth(entry) {
  return entryMonths(entry).pop();
}

// Expected, and its period is already over
function isOverdue(entry) {
  return entry.status === 'expected' && lastMonth(entry) < todayKey();
}

// ===== Recurring entries =====
// A series remembers the details; each month up to now gets its own entry.
// Copies arrive as Expected, so the creator confirms them with "Mark paid".

function generateRecurring() {
  const now = todayKey();
  let added = 0;
  for (const s of data.series) {
    const last = s.end && s.end < now ? s.end : now;
    for (let month = addMonths(s.start, 1); month <= last; month = addMonths(month, 1)) {
      const exists = data.entries.some(e => e.seriesId === s.id && e.month === month);
      if (exists || s.skipped.includes(month)) continue;
      data.entries.push({
        id: newId(), type: s.type, amount: s.amount, month: month, span: 1,
        category: s.category, subtype: s.subtype, brand: s.brand, note: s.note,
        currency: s.currency || 'USD', gelPerUsd: s.gelPerUsd || 0, channelId: s.channelId,
        status: 'expected', seriesId: s.id, episodeId: ''
      });
      added++;
    }
  }
  if (added > 0) saveData();
}

function findSeries(entry) {
  return entry.seriesId ? data.series.find(s => s.id === entry.seriesId) : null;
}

// Still repeating after this entry's month?
function repeatsAfter(entry) {
  const s = findSeries(entry);
  return Boolean(s && (!s.end || s.end > entry.month));
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
let showPendingOnly = false;   // true after "Show pending": the list shows all pending entries
let anchor = latestAnchor();   // the month the view is centred on

// Start at the latest month that has entries (or this month if none)
function latestAnchor() {
  const now = new Date();
  if (data.entries.length === 0) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  // The newest starting month (a year entry starts in Jan, so it doesn't jump the view to Dec)
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

  document.getElementById('return-label').textContent = `Return per ${currencySymbol()}1 spent`;

  // This period vs the one before
  const now = totalsFor(periodMonths(periodType, anchor));
  const prevAnchor = shiftAnchor(periodType, anchor, -1);
  const before = totalsFor(periodMonths(periodType, prevAnchor));
  const prevName = periodLabel(periodType, prevAnchor).main;

  setTile('income', formatMain(now.income), '',
    changeText(now.income, before.income, prevName), trendClass(now.income, before.income));

  // Costs going up isn't automatically good or bad, so no color
  setTile('costs', formatMain(now.costs), '',
    changeText(now.costs, before.costs, prevName), '');

  setTile('profit', formatMoney(now.profit), now.profit < 0 ? 'loss' : (now.profit > 0 ? 'profit' : ''),
    changeText(now.profit, before.profit, prevName), trendClass(now.profit, before.profit));

  if (now.ret === null) {
    setTile('return', '—', '', 'No costs in this period', '');
  } else if (before.ret === null) {
    setTile('return', currencySymbol() + now.ret.toFixed(2), '', `— vs ${prevName}`, '');
  } else {
    const diff = now.ret - before.ret;
    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
    setTile('return', currencySymbol() + now.ret.toFixed(2), '',
      `${arrow} ${currencySymbol()}${Math.abs(diff).toFixed(2)} vs ${prevName}`, trendClass(now.ret, before.ret));
  }
}

document.querySelector('.period-types').addEventListener('click', function (event) {
  const type = event.target.dataset.type;
  if (!type) return;
  periodType = type;
  showPendingOnly = false;
  renderAll();
});

document.getElementById('period-prev').addEventListener('click', function () {
  anchor = shiftAnchor(periodType, anchor, -1);
  showPendingOnly = false;
  renderAll();
});

document.getElementById('period-next').addEventListener('click', function () {
  anchor = shiftAnchor(periodType, anchor, 1);
  showPendingOnly = false;
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
  // Heights in % of the chart area, so bars fit on any screen size
  const height = value => (max > 0 ? Math.round(value / max * 100) : 0);
  const bar = (value, kind) => value > 0
    ? `<i class="${kind}" style="height: ${Math.max(height(value), 2)}%"></i>`
    : '<i class="none" style="height: 2px"></i>';

  document.getElementById('month-chart').innerHTML = months.map(m => {
    const isSelected = selected.includes(m.key);
    return `
      <button type="button" class="month-col ${isSelected ? 'selected' : 'dim'}" data-month="${m.key}"
        aria-label="${m.name} ${year}: income ${formatMain(m.income)}, costs ${formatMain(m.costs)}. Show this month.">
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
  showPendingOnly = false;
  renderAll();
});

// ===== Breakdowns: group the period's money by stream, then by sub-type =====

function groupByCategory(type, months) {
  const groups = {};
  for (const entry of visibleEntries()) {
    if (entry.type !== type || !isPaid(entry)) continue;
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
      ? `<p class="sub-line">${g.subs.map(s => `${escapeHtml(s.name)} ${formatMain(s.total)}`).join(' · ')}</p>`
      : '';

    return `
      <div class="stream">
        <div class="stream-row">
          <span>${escapeHtml(g.name)}${own}</span>
          <span>${formatMain(g.total)} · ${percent}%</span>
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
let entryStatus = 'paid';                 // 'paid' or 'expected'
let entryCurrency = 'USD';                // the currency this entry was paid in
let editingId = null;                     // the id of the entry being edited, or null when adding
let beforeEdit = null;                    // the form choices to bring back after editing
let repeatsWhenOpened = false;            // the "Repeats" box when the edit started

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
  document.getElementById('save-entry').textContent = editingId ? 'Save changes' : (isIncome ? 'Save income' : 'Save cost');
  document.getElementById('drawer-title').textContent = editingId ? 'Edit entry' : 'Add entry';
  document.getElementById('other-name').placeholder = isIncome ? 'e.g. Grant, Prize, Licensing' : 'e.g. Insurance, Accounting, Bank fees';
  renderStatus();
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
  renderStatus();
}

// Paid / Expected switch and the "Repeats every month" row
function renderStatus() {
  const isIncome = entryType === 'income';
  document.getElementById('status-legend').textContent = isIncome ? 'Has it arrived?' : 'Has it been paid?';
  document.getElementById('status-paid').setAttribute('aria-pressed', String(entryStatus === 'paid'));
  document.getElementById('status-expected').setAttribute('aria-pressed', String(entryStatus === 'expected'));
  document.getElementById('status-expected').textContent = isIncome ? 'Expected' : 'To pay';

  // Only single months can repeat
  const row = document.getElementById('repeat-row');
  const box = document.getElementById('entry-repeats');
  row.hidden = entrySpan !== 1;
  if (entrySpan !== 1) box.checked = false;

  const hint = document.getElementById('repeat-hint');
  hint.hidden = !box.checked;
  hint.textContent = editingId
    ? 'Changes also apply to future monthly copies. Untick to stop after this month.'
    : 'Each new month a copy is added as Expected. Confirm it with Mark paid.';
}

function renderSpreadHint() {
  const hint = document.getElementById('spread-hint');
  const amount = Number(document.getElementById('entry-amount').value);
  hint.hidden = entrySpan === 1;
  if (entrySpan === 1) {
    hint.textContent = '';
  } else if (amount > 0) {
    hint.textContent = `Spread evenly: ${formatIn(amount / entrySpan, entryCurrency)} per month.`;
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

document.getElementById('status-paid').addEventListener('click', function () {
  entryStatus = 'paid';
  renderStatus();
});
document.getElementById('status-expected').addEventListener('click', function () {
  entryStatus = 'expected';
  renderStatus();
});
document.getElementById('entry-repeats').addEventListener('change', renderStatus);

// Open and close the drawer
const drawer = document.getElementById('entry-drawer');

function showDrawer() {
  renderBrandList();
  drawer.showModal();
  document.body.classList.add('drawer-open');
  document.getElementById('entry-amount').focus();
}

// Empty the fields that differ between entries
function clearEntryFields() {
  ['entry-amount', 'entry-note', 'other-name', 'sub-other-name', 'entry-brand']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('entry-repeats').checked = false;
  renderSpreadHint();
}

// "+ Add entry": a fresh form, pointed at the period on screen
function openForNew() {
  if (editingId) {
    editingId = null;
    clearEntryFields();
  }
  syncFormToView();
  document.getElementById('entry-rate').value = data.settings.gelPerUsd || '';
  fillChannelSelect(data.settings.activeChannel !== 'all' ? data.settings.activeChannel : lastChannel);
  renderTypeToggle();
  renderCurrency();
  showDrawer();
}

document.getElementById('open-entry').addEventListener('click', openForNew);
document.getElementById('welcome-start').addEventListener('click', openForNew);

// Make sure a year exists in the Year dropdown (for old entries)
function ensureYearOption(year) {
  const select = document.getElementById('entry-year');
  if (![...select.options].some(o => o.value === String(year))) {
    select.add(new Option(String(year), String(year)));
  }
}

// Open the drawer filled in with an existing entry
function openForEdit(entry) {
  // Remember the choices from before, to restore them when editing ends
  if (!editingId) {
    beforeEdit = { entryType, selectedCategory, selectedSub, entrySpan, entryStatus, entryCurrency };
  }
  editingId = entry.id;
  entryType = entry.type;

  // Stream: a known one, or Other with the creator's own name
  const known = currentChoices().find(c => c.name === entry.category && c.name !== 'Other');
  selectedCategory = known ? known.name : 'Other';
  document.getElementById('other-name').value = known || entry.category === 'Other' ? '' : entry.category;

  // Sub-type: a known one, or Other with the creator's own name
  const definition = currentDefinition();
  document.getElementById('sub-other-name').value = '';
  if (entry.subtype && definition.subs.includes(entry.subtype) && entry.subtype !== 'Other') {
    selectedSub = entry.subtype;
  } else if (entry.subtype && definition.subs.length > 0) {
    selectedSub = 'Other';
    document.getElementById('sub-other-name').value = entry.subtype === 'Other' ? '' : entry.subtype;
  } else {
    selectedSub = definition.required ? definition.subs[0] : '';
  }

  // Period
  const [year, month] = entry.month.split('-').map(Number);
  entrySpan = entry.span || 1;
  ensureYearOption(year);
  document.getElementById('entry-year').value = String(year);
  document.getElementById('entry-month').value = String(month);
  document.getElementById('entry-quarter').value = String(Math.ceil(month / 3));

  // Amount, brand, note
  document.getElementById('entry-amount').value = entry.amount;
  document.getElementById('entry-brand').value = entry.brand || '';
  document.getElementById('entry-note').value = entry.note || '';

  // Currency, rate and channel
  entryCurrency = entry.currency || 'USD';
  document.getElementById('entry-rate').value = entry.gelPerUsd || data.settings.gelPerUsd || '';
  fillChannelSelect(entry.channelId);
  renderCurrency();

  // Status and repeating
  entryStatus = entry.status || 'paid';
  repeatsWhenOpened = repeatsAfter(entry);
  document.getElementById('entry-repeats').checked = repeatsWhenOpened;

  renderChips();
  renderSpan();
  renderTypeToggle();
  showDrawer();
}

document.getElementById('close-entry').addEventListener('click', () => drawer.close());

// Runs for the Close button, the Escape key, and clicks outside the drawer
drawer.addEventListener('close', function () {
  document.body.classList.remove('drawer-open');
  // Leaving edit mode: the next "+ Add entry" starts clean
  if (editingId) {
    editingId = null;
    clearEntryFields();
    if (beforeEdit) {
      entryType = beforeEdit.entryType;
      selectedCategory = beforeEdit.selectedCategory;
      selectedSub = beforeEdit.selectedSub;
      entrySpan = beforeEdit.entrySpan;
      entryStatus = beforeEdit.entryStatus;
      entryCurrency = beforeEdit.entryCurrency;
      beforeEdit = null;
    }
    renderChips();
    renderSpan();
    renderTypeToggle();
  }
});
drawer.addEventListener('click', function (event) {
  if (event.target === drawer) drawer.close();   // click on the dimmed area
});

// Save an entry
document.getElementById('entry-form').addEventListener('submit', function (event) {
  event.preventDefault();

  const amount = Number(document.getElementById('entry-amount').value);
  if (!(amount > 0)) return;

  // A rate is needed when the entry isn't in the main currency
  const typedRate = Number(document.getElementById('entry-rate').value);
  if (entryCurrency !== mainCurrency() && !(typedRate > 0)) {
    const hint = document.getElementById('convert-hint');
    hint.textContent = 'Please type the rate, e.g. 2.70, so this can be converted.';
    hint.classList.add('error');
    document.getElementById('entry-rate').focus();
    return;
  }
  const gelPerUsd = typedRate > 0 ? typedRate : (data.settings.gelPerUsd || 0);
  if (typedRate > 0) data.settings.gelPerUsd = typedRate;   // remember it for next time

  const channelId = document.getElementById('entry-channel').value || data.channels[0].id;
  lastChannel = channelId;

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

  const fields = {
    type: entryType,
    amount: amount,
    month: monthKey(year, firstMonth),
    span: entrySpan,
    category: category,
    subtype: subtype,
    brand: brand,
    note: document.getElementById('entry-note').value.trim(),
    status: entryStatus,
    currency: entryCurrency,
    gelPerUsd: gelPerUsd,
    channelId: channelId
  };
  const repeats = entrySpan === 1 && document.getElementById('entry-repeats').checked;

  // The details a series copies into each new month
  const template = () => ({
    type: fields.type, amount: fields.amount, category: fields.category,
    subtype: fields.subtype, brand: fields.brand, note: fields.note,
    currency: fields.currency, gelPerUsd: fields.gelPerUsd, channelId: fields.channelId
  });
  const startSeries = entry => {
    const s = Object.assign({ id: newId(), start: entry.month, end: '', skipped: [] }, template());
    data.series.push(s);
    entry.seriesId = s.id;
  };

  const wasEditing = Boolean(editingId);
  if (wasEditing) {
    // Change the existing entry, keep its id
    const entry = data.entries.find(e => e.id === editingId);
    if (entry) {
      const oldMonth = entry.month;
      Object.assign(entry, fields);
      const s = findSeries(entry);
      if (s) {
        // Moved to another month: don't let a copy reappear in the old one
        if (oldMonth !== entry.month && !s.skipped.includes(oldMonth)) s.skipped.push(oldMonth);
        if (repeats) {
          // Future copies use the new details
          Object.assign(s, template());
          if (!repeatsWhenOpened) s.end = '';   // the box was just ticked: start repeating again
        } else if (repeatsWhenOpened) {
          // The box was just unticked: stop after this month,
          // and remove copies after it that aren't paid yet
          s.end = entry.month;
          data.entries = data.entries.filter(e =>
            !(e.seriesId === s.id && e.month > s.end && e.status === 'expected'));
        }
      } else if (repeats) {
        startSeries(entry);
      }
    }
  } else {
    const entry = Object.assign({ id: newId(), episodeId: '' }, fields);
    if (repeats) startSeries(entry);
    data.entries.push(entry);
  }

  generateRecurring();
  saveData();

  // Show the period this entry belongs to. If it covers more than the
  // current view (a year entry while looking at a month), widen the view.
  anchor = { year: year, month: firstMonth };
  if (entrySpan > PERIOD_SIZE[periodType]) {
    periodType = entrySpan === 12 ? 'year' : 'quarter';
  }
  renderAll();
  renderBrandList();

  // After an edit, close the drawer: the change is done
  if (wasEditing) {
    drawer.close();
    return;
  }

  // Clear only what changes between entries; keep period, type and stream
  document.getElementById('entry-amount').value = '';
  document.getElementById('entry-note').value = '';
  document.getElementById('other-name').value = '';
  document.getElementById('sub-other-name').value = '';
  document.getElementById('entry-brand').value = '';
  document.getElementById('entry-repeats').checked = false;
  renderSpreadHint();
  renderStatus();
  document.getElementById('entry-amount').focus();

  // A short "Saved" confirmation on the button
  document.getElementById('save-entry').textContent = 'Saved ✓';
  setTimeout(renderTypeToggle, 1200);
});

// ===== The entries list (the selected period, or all pending) =====


function renderEntries() {
  const list = document.getElementById('entries-list');
  const label = periodLabel(periodType, anchor).main;
  const months = periodMonths(periodType, anchor);

  document.getElementById('entries-title').textContent = showPendingOnly ? 'Pending payments' : `Entries · ${label}`;
  document.getElementById('entries-back').hidden = !showPendingOnly;

  if (data.entries.length === 0) {
    list.innerHTML = '<p class="empty">No entries yet. Click "+ Add entry" to start.</p>';
    return;
  }

  const shown = visibleEntries()
    .filter(e => showPendingOnly ? e.status === 'expected' : amountIn(e, months) > 0)
    .sort((a, b) => b.month.localeCompare(a.month));   // newest first

  if (shown.length === 0) {
    list.innerHTML = showPendingOnly
      ? '<p class="empty">Nothing pending. Everything is paid.</p>'
      : `<p class="empty">No entries in ${label}.</p>`;
    return;
  }

  let rows = '';
  for (const entry of shown) {
    const isIncome = entry.type === 'income';
    const expected = entry.status === 'expected';
    const part = showPendingOnly ? entry.amount : amountIn(entry, months);
    const isPartial = Math.abs(part - valueInMain(entry)) > 0.005;   // only part of a quarter/year
    const sign = isIncome ? '+' : '−';
    const showChannel = data.settings.activeChannel === 'all' && data.channels.length > 1;
    const channelTag = showChannel ? `<span class="channel-tag">${escapeHtml(channelName(entry.channelId))}</span>` : '';
    const details = channelTag + [entry.brand ? `<strong>${escapeHtml(entry.brand)}</strong>` : '', escapeHtml(entry.note)]
      .filter(Boolean)
      .join(' · ');

    // Paid in another currency: show the original amount and its rate
    const foreign = (entry.currency || 'USD') !== mainCurrency()
      ? `<span class="small">${formatIn(entry.amount, entry.currency)} · 1 USD = ${entry.gelPerUsd || data.settings.gelPerUsd} GEL</span>`
      : '';

    let badges = `<span class="badge ${entry.type}">${isIncome ? 'Income' : 'Cost'}</span>`;
    if (isOverdue(entry)) badges += '<span class="badge overdue">Overdue</span>';
    else if (expected) badges += `<span class="badge expected">${isIncome ? 'Expected' : 'To pay'}</span>`;

    const repeating = entry.seriesId ? '<span class="small">Repeats monthly</span>' : '';
    const markPaid = expected ? `<button class="mark-paid" data-id="${entry.id}">Mark paid</button>` : '';

    rows += `
      <tr data-id="${entry.id}" class="${expected ? 'is-expected' : ''}">
        <td>${formatEntryPeriod(entry)}</td>
        <td>${badges}</td>
        <td>${escapeHtml(formatCategory(entry))}${repeating}</td>
        <td class="muted">${details}</td>
        <td class="number ${isIncome ? 'money-in' : ''}">${sign}${formatMain(part)}${isPartial ? `<span class="small">of ${formatMain(valueInMain(entry))}</span>` : ''}${foreign}</td>
        <td class="number row-actions">${markPaid}<button class="edit" data-id="${entry.id}">Edit</button><button class="delete" data-id="${entry.id}">Delete</button></td>
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
  const row = event.target.closest('tr[data-id]');
  if (!row) return;
  const entry = data.entries.find(e => e.id === row.dataset.id);
  if (!entry) return;

  // Mark paid: one tap confirms an expected payment
  if (event.target.classList.contains('mark-paid')) {
    entry.status = 'paid';
    saveData();
    renderAll();
    return;
  }

  // Delete button
  if (event.target.classList.contains('delete')) {
    const label = entry.type === 'income' ? 'income' : 'cost';
    const series = findSeries(entry);
    const extra = series ? '\n\nOnly this month is deleted. To stop the monthly copies, edit an entry and untick "Repeats every month".' : '';
    if (confirm(`Delete this ${formatIn(entry.amount, entry.currency)} ${label} (${formatCategory(entry)}, ${formatEntryPeriod(entry)})? This cannot be undone.${extra}`)) {
      // Don't let the monthly copy come back for this month
      if (series && !series.skipped.includes(entry.month)) series.skipped.push(entry.month);
      data.entries = data.entries.filter(e => e.id !== entry.id);
      saveData();
      renderAll();
    }
    return;
  }

  // Edit button, or a click anywhere else on the row
  openForEdit(entry);
});

document.getElementById('entries-back').addEventListener('click', function () {
  showPendingOnly = false;
  renderAll();
});

// ===== Pending bar: money still owed, and bills still to pay =====

function renderPending() {
  const pending = visibleEntries().filter(e => e.status === 'expected');
  document.getElementById('pending').hidden = pending.length === 0;
  if (pending.length === 0) {
    showPendingOnly = false;
    return;
  }

  const fill = (type, valueId, noteId) => {
    const list = pending.filter(e => e.type === type);
    const overdue = list.filter(isOverdue);
    document.getElementById(valueId).textContent = formatMain(list.reduce((sum, e) => sum + valueInMain(e), 0));
    const note = document.getElementById(noteId);
    if (list.length === 0) {
      note.textContent = 'Nothing pending';
      note.className = 'pending-note';
    } else if (overdue.length > 0) {
      note.textContent = `${list.length} pending · ${overdue.length} overdue (${formatMain(overdue.reduce((sum, e) => sum + valueInMain(e), 0))})`;
      note.className = 'pending-note overdue';
    } else {
      note.textContent = `${list.length} pending`;
      note.className = 'pending-note';
    }
  };
  fill('income', 'pending-in', 'pending-in-note');
  fill('cost', 'pending-out', 'pending-out-note');
}

document.getElementById('pending-show').addEventListener('click', function () {
  showPendingOnly = true;
  renderEntries();
  document.getElementById('entries-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ===== Currency in the entry form =====

let lastChannel = '';   // the channel used for the last saved entry

function renderCurrency() {
  document.querySelectorAll('.currency-types button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.currency === entryCurrency));
  });
  // The rate is only needed when the entry isn't in the main currency
  document.getElementById('rate-field').hidden = entryCurrency === mainCurrency();
  renderConvertHint();
  renderSpreadHint();
}

// "= $370.37" under the rate, updated while typing
function renderConvertHint() {
  const hint = document.getElementById('convert-hint');
  hint.classList.remove('error');
  const amount = Number(document.getElementById('entry-amount').value);
  const rate = Number(document.getElementById('entry-rate').value);
  hint.textContent = amount > 0 && rate > 0
    ? `= ${formatMain(convert(amount, entryCurrency, mainCurrency(), rate))} in your main currency`
    : 'Type the rate your bank or platform used.';
}

document.querySelector('.currency-types').addEventListener('click', function (event) {
  const currency = event.target.dataset.currency;
  if (!currency) return;
  entryCurrency = currency;
  renderCurrency();
});
document.getElementById('entry-amount').addEventListener('input', renderConvertHint);
document.getElementById('entry-rate').addEventListener('input', renderConvertHint);

// The Channel dropdown in the form (only shown with two or more channels)
function fillChannelSelect(selectedId) {
  const select = document.getElementById('entry-channel');
  select.innerHTML = data.channels
    .map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
    .join('');
  select.value = data.channels.some(c => c.id === selectedId) ? selectedId : data.channels[0].id;
  document.getElementById('channel-field').hidden = data.channels.length < 2;
}

// ===== Channel switcher in the header =====

function renderChannelSwitch() {
  const wrap = document.getElementById('channel-switch-wrap');
  const select = document.getElementById('channel-switch');
  wrap.hidden = data.channels.length < 2;
  if (!data.channels.some(c => c.id === data.settings.activeChannel)) data.settings.activeChannel = 'all';
  select.innerHTML = '<option value="all">All channels</option>' + data.channels
    .map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
    .join('');
  select.value = data.settings.activeChannel;
}

document.getElementById('channel-switch').addEventListener('change', function (event) {
  data.settings.activeChannel = event.target.value;
  showPendingOnly = false;
  saveData();
  renderAll();
});

// ===== Settings: main currency and channels =====

const settingsDrawer = document.getElementById('settings-drawer');

function renderSettings() {
  document.querySelectorAll('.main-currency-types button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.main === mainCurrency()));
  });
  document.getElementById('default-rate').value = data.settings.gelPerUsd || '';
  const hint = document.getElementById('default-rate-hint');
  hint.classList.remove('error');
  hint.textContent = 'Used for entries that have no rate of their own.';

  // One row per channel: rename in place, delete only when it has no entries
  document.getElementById('channel-list').innerHTML = data.channels.map(c => {
    const count = data.entries.filter(e => e.channelId === c.id).length;
    const canDelete = data.channels.length > 1 && count === 0;
    return `
      <li>
        <input type="text" value="${escapeHtml(c.name)}" data-channel="${c.id}" aria-label="Channel name">
        <span class="count">${count} ${count === 1 ? 'entry' : 'entries'}</span>
        ${canDelete ? `<button type="button" class="delete" data-delete-channel="${c.id}">Delete</button>` : ''}
      </li>`;
  }).join('');
}

document.getElementById('open-settings').addEventListener('click', function () {
  renderSettings();
  settingsDrawer.showModal();
  document.body.classList.add('drawer-open');
});
document.getElementById('close-settings').addEventListener('click', () => settingsDrawer.close());
settingsDrawer.addEventListener('close', () => document.body.classList.remove('drawer-open'));
settingsDrawer.addEventListener('click', function (event) {
  if (event.target === settingsDrawer) settingsDrawer.close();
});

// Main currency: switching to GEL needs a usual rate for old USD entries
document.querySelector('.main-currency-types').addEventListener('click', function (event) {
  const currency = event.target.dataset.main;
  if (!currency || currency === mainCurrency()) return;
  if (!(data.settings.gelPerUsd > 0) && data.entries.length > 0) {
    const hint = document.getElementById('default-rate-hint');
    hint.textContent = 'Type a usual rate first, so your existing entries can be converted.';
    hint.classList.add('error');
    document.getElementById('default-rate').focus();
    return;
  }
  data.settings.mainCurrency = currency;
  saveData();
  renderSettings();
  renderAll();
});

document.getElementById('default-rate').addEventListener('change', function (event) {
  const rate = Number(event.target.value);
  data.settings.gelPerUsd = rate > 0 ? rate : 0;
  saveData();
  renderSettings();
  renderAll();
});

// Rename a channel when its name field loses focus
document.getElementById('channel-list').addEventListener('change', function (event) {
  const id = event.target.dataset.channel;
  if (!id) return;
  const channel = data.channels.find(c => c.id === id);
  const name = event.target.value.trim();
  if (channel && name) channel.name = name;
  saveData();
  renderSettings();
  renderAll();
});

document.getElementById('channel-list').addEventListener('click', function (event) {
  const id = event.target.dataset.deleteChannel;
  if (!id) return;
  data.channels = data.channels.filter(c => c.id !== id);
  saveData();
  renderSettings();
  renderAll();
});

function addChannel() {
  const input = document.getElementById('new-channel');
  const name = input.value.trim();
  if (!name) return;
  data.channels.push({ id: newId(), name: name });
  input.value = '';
  saveData();
  renderSettings();
  renderAll();
}
document.getElementById('add-channel').addEventListener('click', addChannel);
document.getElementById('new-channel').addEventListener('keydown', function (event) {
  if (event.key === 'Enter') addChannel();
});

// ===== Welcome card: only before the first entry =====

function renderWelcome() {
  document.getElementById('welcome').hidden = data.entries.length > 0;
}

// ===== Start =====

function renderAll() {
  renderChannelSwitch();
  renderWelcome();
  renderOverview();
  renderPending();
  renderChart();
  renderBreakdowns();
  renderEntries();
}

generateRecurring();
fillPeriodSelects();
fillChannelSelect(data.channels[0].id);
setType('income');
entryCurrency = mainCurrency();
renderSpan();
renderAll();
