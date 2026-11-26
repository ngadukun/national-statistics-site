/* Statistik Indonesia — dashboard logic.
   All data is embedded: the page makes no network request and works
   offline from its own files. Figures are published BPS aggregates
   (see the Sources section); values marked approx. are rounded estimates. */
'use strict';

/* ---- Data: BPS — Statistics Indonesia, 2019–2024 ---- */
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];

const INDICATORS = {
  growth: {
    title: 'GDP growth, 2019–2024',
    sub: 'Real GDP growth, percent year on year · BPS',
    unit: '%',
    values: { 2019: 5.02, 2020: -2.07, 2021: 3.70, 2022: 5.31, 2023: 5.05, 2024: 5.03 },
    format: (v) => v.toFixed(2) + '%',
    readout: (y, v) => 'In ' + y + ', real GDP grew <strong>' + v.toFixed(2) + '%</strong> year on year.'
  },
  inflation: {
    title: 'Inflation, 2019–2024',
    sub: 'Consumer price index, December year on year (%) · BPS',
    unit: '%',
    values: { 2019: 2.72, 2020: 1.68, 2021: 1.87, 2022: 5.51, 2023: 2.61, 2024: 1.57 },
    format: (v) => v.toFixed(2) + '%',
    readout: (y, v) => 'In December ' + y + ', consumer prices were <strong>' + v.toFixed(2) + '%</strong> higher than a year earlier.'
  },
  unemployment: {
    title: 'Unemployment, 2019–2024',
    sub: 'Open unemployment rate, August of each year (%) · BPS Sakernas',
    unit: '%',
    values: { 2019: 5.28, 2020: 7.07, 2021: 6.49, 2022: 5.86, 2023: 5.32, 2024: 4.91 },
    format: (v) => v.toFixed(2) + '%',
    readout: (y, v) => 'In August ' + y + ', the open unemployment rate was <strong>' + v.toFixed(2) + '%</strong>.'
  },
  poverty: {
    title: 'Poverty rate, 2019–2024',
    sub: 'Share of population below the poverty line, September (%) · BPS',
    unit: '%',
    values: { 2019: 9.22, 2020: 10.19, 2021: 9.71, 2022: 9.57, 2023: 9.36, 2024: 8.57 },
    format: (v) => v.toFixed(2) + '%',
    readout: (y, v) => 'In September ' + y + ', <strong>' + v.toFixed(2) + '%</strong> of Indonesians lived below the poverty line.'
  }
};

/* GDP shares by sector, 2024, percent of nominal GDP (approx., BPS). */
const SECTORS = [
  ['Manufacturing', 18.9],
  ['Wholesale & retail trade', 12.9],
  ['Agriculture, forestry & fishing', 12.5],
  ['Construction', 9.9],
  ['Mining & quarrying', 9.4],
  ['Transport & storage', 6.1],
  ['Information & communication', 4.5],
  ['Financial services', 4.1]
];

/* Largest provinces, Population Census 2020 (millions), BPS. */
const PROVINCES = [
  { name: 'West Java', pop: 48.27, island: 'Java' },
  { name: 'East Java', pop: 40.67, island: 'Java' },
  { name: 'Central Java', pop: 36.52, island: 'Java' },
  { name: 'North Sumatra', pop: 14.80, island: 'Sumatra' },
  { name: 'Banten', pop: 11.90, island: 'Java' },
  { name: 'Jakarta', pop: 10.56, island: 'Java' },
  { name: 'South Sulawesi', pop: 9.07, island: 'Sulawesi' },
  { name: 'Lampung', pop: 9.01, island: 'Sumatra' },
  { name: 'South Sumatra', pop: 8.47, island: 'Sumatra' },
  { name: 'Riau', pop: 6.39, island: 'Sumatra' },
  { name: 'West Sumatra', pop: 5.53, island: 'Sumatra' },
  { name: 'West Nusa Tenggara', pop: 5.32, island: 'Lesser Sunda' }
];
const CENSUS_TOTAL = 270.20; /* million, 2020 census */

/* ---- Small canvas chart helpers (no libraries, no network) ---- */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(280, Math.round(rect.width));
  const height = parseInt(canvas.getAttribute('height'), 10) || 300;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

function niceTicks(min, max, count) {
  const span = max - min || 1;
  const step = Math.pow(10, Math.floor(Math.log10(span / count)));
  const candidates = [1, 2, 2.5, 5, 10];
  let best = step;
  for (const c of candidates) {
    if (span / (step * c) <= count + 0.5) { best = step * c; break; }
    best = step * c;
  }
  const lo = Math.floor(min / best) * best;
  const ticks = [];
  for (let v = lo; v <= max + 1e-9; v += best) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

function drawBarLineChart(canvas, labels, values, opts) {
  const { ctx, width, height } = setupCanvas(canvas);
  const ink = cssVar('--ink') || '#16222e';
  const muted = cssVar('--muted') || '#5b6b7a';
  const grid = cssVar('--grid') || '#e6ebef';
  const bar = cssVar('--bar') || '#0e7c7b';
  const neg = cssVar('--bar-neg') || '#c8102e';
  const padL = 46, padR = 14, padT = 26, padB = 30;
  const plotW = width - padL - padR, plotH = height - padT - padB;
  const min = Math.min(0, ...values), max = Math.max(0, ...values);
  const span = (max - min) || 1;
  const y = (v) => padT + (1 - (v - min) / span) * plotH;
  const x = (i) => padL + (i + 0.5) * (plotW / labels.length);

  ctx.font = '12px -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const t of niceTicks(min, max, 5)) {
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, y(t)); ctx.lineTo(width - padR, y(t)); ctx.stroke();
    ctx.fillStyle = muted;
    ctx.fillText(opts.formatTick ? opts.formatTick(t) : String(t), padL - 8, y(t));
  }
  /* zero line */
  ctx.strokeStyle = muted; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padL, y(0)); ctx.lineTo(width - padR, y(0)); ctx.stroke();

  const bw = Math.min(46, (plotW / labels.length) * 0.58);
  values.forEach((v, i) => {
    const bx = x(i) - bw / 2;
    ctx.fillStyle = v < 0 ? neg : bar;
    const top = Math.min(y(v), y(0));
    const h = Math.max(2, Math.abs(y(v) - y(0)));
    ctx.beginPath();
    ctx.roundRect(bx, top, bw, h, 3);
    ctx.fill();
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(opts.formatValue(v), x(i), top - 4);
  });
  ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  labels.forEach((lab, i) => ctx.fillText(lab, x(i), height - padB + 8));

  /* highlight the focused year, if any */
  if (opts.focusIndex != null && opts.focusIndex >= 0) {
    ctx.strokeStyle = cssVar('--red') || '#c8102e'; ctx.lineWidth = 2;
    ctx.strokeRect(x(opts.focusIndex) - bw / 2 - 5, padT - 4, bw + 10, plotH + 8);
  }
}

function drawHBarChart(canvas, rows, opts) {
  const { ctx, width, height } = setupCanvas(canvas);
  const ink = cssVar('--ink') || '#16222e';
  const muted = cssVar('--muted') || '#5b6b7a';
  const bar = cssVar('--bar') || '#0e7c7b';
  const max = Math.max(...rows.map((r) => r[1]));
  const labelW = opts.labelWidth || 168;
  const padR = 64, padT = 8, rowH = (height - padT - 8) / rows.length;
  ctx.font = '12px -apple-system, "Segoe UI", Roboto, sans-serif';
  rows.forEach(([label, value], i) => {
    const cy = padT + i * rowH + rowH / 2;
    const bw = ((width - labelW - padR) * value) / max;
    ctx.fillStyle = ink; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(label, labelW - 10, cy);
    ctx.fillStyle = bar;
    ctx.beginPath();
    ctx.roundRect(labelW, cy - Math.min(15, rowH * 0.32), Math.max(2, bw), Math.min(30, rowH * 0.64), 3);
    ctx.fill();
    ctx.fillStyle = muted; ctx.textAlign = 'left';
    ctx.fillText(opts.formatValue(value), labelW + bw + 8, cy);
  });
}

/* ---- Page state and interactions ---- */
const state = {
  indicator: 'growth',
  range: 'all',
  focusYear: 2024,
  provinceQuery: '',
  provinceSort: { key: 'pop', dir: -1 }
};

function visibleYears() {
  return state.range === 'recent' ? YEARS.filter((y) => y >= 2021) : YEARS.slice();
}

function renderMainChart() {
  const ind = INDICATORS[state.indicator];
  const years = visibleYears();
  const values = years.map((y) => ind.values[y]);
  document.getElementById('chart-title').textContent = ind.title;
  document.getElementById('chart-sub').textContent = ind.sub;
  drawBarLineChart(document.getElementById('main-chart'), years.map(String), values, {
    formatValue: ind.format,
    formatTick: (t) => t + '%',
    focusIndex: years.indexOf(state.focusYear)
  });
  document.getElementById('chart-readout').innerHTML =
    ind.readout(state.focusYear, ind.values[state.focusYear]);
}

function renderSectorChart() {
  drawHBarChart(document.getElementById('sector-chart'), SECTORS, {
    formatValue: (v) => v.toFixed(1) + '%'
  });
}

function renderPovertyChart() {
  const years = YEARS;
  drawBarLineChart(document.getElementById('poverty-chart'), years.map(String),
    years.map((y) => INDICATORS.poverty.values[y]), {
      formatValue: (v) => v.toFixed(2) + '%',
      formatTick: (t) => t + '%',
      focusIndex: years.indexOf(state.focusYear)
    });
}

function renderProvinceChart() {
  const top = PROVINCES.slice(0, 10);
  drawHBarChart(document.getElementById('province-chart'),
    top.map((p) => [p.name, p.pop]), { formatValue: (v) => v.toFixed(2) + 'm' });
}

function renderYearTable() {
  const tbody = document.querySelector('#year-table tbody');
  tbody.innerHTML = '';
  YEARS.slice().reverse().forEach((y) => {
    const tr = document.createElement('tr');
    if (y === state.focusYear) tr.classList.add('focused');
    tr.tabIndex = 0;
    const cells = [
      y,
      INDICATORS.growth.values[y].toFixed(2),
      INDICATORS.inflation.values[y].toFixed(2),
      INDICATORS.unemployment.values[y].toFixed(2),
      INDICATORS.poverty.values[y].toFixed(2)
    ];
    cells.forEach((c, i) => {
      const td = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) td.scope = 'row';
      if (i > 0) td.className = 'num';
      td.textContent = c;
      tr.appendChild(td);
    });
    tr.addEventListener('click', () => setFocusYear(y));
    tr.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFocusYear(y); }
    });
    tbody.appendChild(tr);
  });
}

function setFocusYear(year) {
  state.focusYear = year;
  const sel = document.getElementById('year-select');
  if (sel.value !== String(year)) sel.value = String(year);
  document.querySelectorAll('.kpi-year').forEach((el) => { el.textContent = year; });
  document.getElementById('kpi-growth').textContent = INDICATORS.growth.values[year].toFixed(2) + '%';
  document.getElementById('kpi-inflation').textContent = INDICATORS.inflation.values[year].toFixed(2) + '%';
  document.getElementById('kpi-unemployment').textContent = INDICATORS.unemployment.values[year].toFixed(2) + '%';
  document.getElementById('kpi-poverty').textContent = INDICATORS.poverty.values[year].toFixed(2) + '%';
  renderMainChart();
  renderPovertyChart();
  renderYearTable();
}

function sortedProvinces() {
  const q = state.provinceQuery.trim().toLowerCase();
  const rows = PROVINCES.filter((p) =>
    !q || p.name.toLowerCase().includes(q) || p.island.toLowerCase().includes(q));
  const { key, dir } = state.provinceSort;
  rows.sort((a, b) => {
    const av = key === 'share' ? (a.pop / CENSUS_TOTAL) * 100 : a[key];
    const bv = key === 'share' ? (b.pop / CENSUS_TOTAL) * 100 : b[key];
    if (typeof av === 'string') return dir * av.localeCompare(bv);
    return dir * (av - bv);
  });
  return rows;
}

function renderProvinceTable() {
  const tbody = document.querySelector('#province-table tbody');
  const rows = sortedProvinces();
  tbody.innerHTML = '';
  rows.forEach((p) => {
    const tr = document.createElement('tr');
    const name = document.createElement('td'); name.textContent = p.name;
    const pop = document.createElement('td'); pop.className = 'num'; pop.textContent = p.pop.toFixed(2);
    const share = document.createElement('td'); share.className = 'num';
    share.textContent = ((p.pop / CENSUS_TOTAL) * 100).toFixed(1) + '%';
    const island = document.createElement('td'); island.textContent = p.island;
    tr.append(name, pop, share, island);
    tbody.appendChild(tr);
  });
  document.getElementById('province-count').textContent =
    rows.length === PROVINCES.length
      ? 'Showing the 12 largest of 38 provinces. The remaining 26 provinces hold ' +
        (CENSUS_TOTAL - PROVINCES.reduce((s, p) => s + p.pop, 0)).toFixed(2) +
        ' million people combined.'
      : 'Showing ' + rows.length + ' of 12 listed provinces matching your search.';
  document.querySelectorAll('#province-table .sort-btn').forEach((btn) => {
    btn.classList.remove('sorted-asc', 'sorted-desc');
    if (btn.dataset.key === state.provinceSort.key) {
      btn.classList.add(state.provinceSort.dir === 1 ? 'sorted-asc' : 'sorted-desc');
    }
  });
}

function renderAllCharts() {
  renderMainChart();
  renderSectorChart();
  renderPovertyChart();
  renderProvinceChart();
}

function init() {
  /* Indicator tabs */
  document.querySelectorAll('[data-indicator]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.indicator = btn.dataset.indicator;
      document.querySelectorAll('[data-indicator]').forEach((b) =>
        b.classList.toggle('active', b === btn));
      renderMainChart();
    });
  });
  /* Range tabs */
  document.querySelectorAll('.range-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.range = btn.dataset.range;
      document.querySelectorAll('.range-tab').forEach((b) =>
        b.classList.toggle('active', b === btn));
      renderMainChart();
    });
  });
  /* Year selector */
  document.getElementById('year-select').addEventListener('change', (e) => {
    setFocusYear(parseInt(e.target.value, 10));
  });
  /* Province search + sorting */
  document.getElementById('province-search').addEventListener('input', (e) => {
    state.provinceQuery = e.target.value;
    renderProvinceTable();
  });
  document.querySelectorAll('#province-table .sort-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      if (state.provinceSort.key === key) {
        state.provinceSort.dir = -state.provinceSort.dir;
      } else {
        state.provinceSort = { key, dir: key === 'name' || key === 'island' ? 1 : -1 };
      }
      renderProvinceTable();
    });
  });
  /* Theme toggle */
  const toggle = document.getElementById('theme-toggle');
  toggle.addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') !== 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    toggle.textContent = dark ? 'Light mode' : 'Dark mode';
    toggle.setAttribute('aria-pressed', String(dark));
    renderAllCharts();
  });
  /* Active nav link on scroll */
  const links = Array.from(document.querySelectorAll('.nav-link'));
  const sections = links.map((a) => document.querySelector(a.getAttribute('href')));
  const onScroll = () => {
    let current = sections[0];
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= 90) current = s; });
    links.forEach((a) =>
      a.classList.toggle('active', a.getAttribute('href') === '#' + current.id));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  /* Redraw charts on resize (debounced) */
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderAllCharts, 150);
  });

  renderYearTable();
  renderProvinceTable();
  renderAllCharts();
  onScroll();
}

document.addEventListener('DOMContentLoaded', init);
