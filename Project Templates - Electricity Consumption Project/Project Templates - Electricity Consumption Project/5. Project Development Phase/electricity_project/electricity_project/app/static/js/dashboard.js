// dashboard.js - fetches data from the Flask /api/* endpoints and renders
// interactive Chart.js visualizations. Filters (region/state) trigger
// re-fetch + re-render of the relevant charts.

const palette = {
  accent: '#ffb545',
  accent2: '#4fd1c5',
  accent3: '#f96e6e',
  purple: '#9b8cff',
  grid: 'rgba(255,255,255,0.06)',
  text: '#9aa1b9',
};

Chart.defaults.color = palette.text;
Chart.defaults.borderColor = palette.grid;
Chart.defaults.font.family = "Segoe UI, Roboto, sans-serif";

const regionColors = {
  'Northern': '#ffb545',
  'Southern': '#4fd1c5',
  'Eastern': '#f96e6e',
  'Western': '#9b8cff',
  'Northeastern': '#6fc27d',
};

function fmtMonth(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
}

let charts = {};

function upsertChart(id, config) {
  if (charts[id]) { charts[id].destroy(); }
  const ctx = document.getElementById(id).getContext('2d');
  charts[id] = new Chart(ctx, config);
}

// ---------------------------------------------------------------------------
async function loadKpis() {
  const res = await fetch('/api/kpis');
  const d = await res.json();
  document.getElementById('kpiTotal2020').textContent = Math.round(d.total_2020_mu).toLocaleString();
  document.getElementById('kpiYoy').textContent = (d.yoy_growth_pct >= 0 ? '+' : '') + d.yoy_growth_pct + '%';
  document.getElementById('kpiAprDrop').textContent = d.april_lockdown_drop_pct + '%';
  document.getElementById('kpiRecovery').textContent = d.avg_q4_recovery_pct + '%';
  document.getElementById('kpiStates').textContent = d.states_covered;
}

// ---------------------------------------------------------------------------
async function loadNational() {
  const res = await fetch('/api/national_trend');
  const rows = await res.json();
  const y2019 = rows.filter(r => r.date.startsWith('2019')).map(r => r.total_mu);
  const y2020 = rows.filter(r => r.date.startsWith('2020')).map(r => r.total_mu);
  const labels = rows.filter(r => r.date.startsWith('2019')).map(r => fmtMonth(r.date).split(' ')[0]);

  upsertChart('chartNational', {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: '2019', data: y2019, borderColor: palette.accent2, backgroundColor: 'transparent', tension: .35 },
        { label: '2020', data: y2020, borderColor: palette.accent3, backgroundColor: 'transparent', tension: .35 },
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
  });
}

async function loadYoy() {
  const res = await fetch('/api/yoy_comparison');
  const rows = await res.json();
  const labels = rows.map(r => new Date(2020, r.month - 1, 1).toLocaleString('en-US', { month: 'short' }));
  const data = rows.map(r => r.yoy_change_pct);
  upsertChart('chartYoy', {
    type: 'bar',
    data: { labels, datasets: [{ label: 'YoY % Change', data, backgroundColor: data.map(v => v >= 0 ? palette.accent2 : palette.accent3) }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
}

async function loadRegional(region) {
  const res = await fetch('/api/regional_trend?region=' + encodeURIComponent(region));
  const rows = await res.json();
  const regions = [...new Set(rows.map(r => r.region))];
  const dates = [...new Set(rows.map(r => r.date))].sort();
  const datasets = regions.map(r => ({
    label: r,
    data: dates.map(d => (rows.find(x => x.region === r && x.date === d) || {}).total_mu),
    borderColor: regionColors[r] || palette.purple,
    backgroundColor: 'transparent',
    tension: .3,
  }));
  upsertChart('chartRegional', {
    type: 'line',
    data: { labels: dates.map(fmtMonth), datasets },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { boxWidth: 12 } } } }
  });
}

async function loadRegionShare() {
  const res = await fetch('/api/regional_share_2020');
  const rows = await res.json();
  upsertChart('chartRegionShare', {
    type: 'doughnut',
    data: {
      labels: rows.map(r => r.region),
      datasets: [{ data: rows.map(r => r.pct_share), backgroundColor: rows.map(r => regionColors[r.region] || palette.purple) }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
  });
}

async function loadStateTrend(state) {
  const res = await fetch('/api/state_trend?state=' + encodeURIComponent(state));
  const rows = await res.json();
  upsertChart('chartStateTrend', {
    type: 'line',
    data: {
      labels: rows.map(r => fmtMonth(r.date)),
      datasets: [{ label: state + ' (MU)', data: rows.map(r => r.consumption_mu), borderColor: palette.accent, backgroundColor: 'rgba(255,181,69,0.12)', fill: true, tension: .3 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });

  upsertChart('chartPerCapita', {
    type: 'line',
    data: {
      labels: rows.map(r => fmtMonth(r.date)),
      datasets: [{ label: state + ' per-capita (kWh)', data: rows.map(r => r.per_capita_kwh), borderColor: palette.purple, backgroundColor: 'rgba(155,140,255,0.12)', fill: true, tension: .3 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
}

async function loadLockdown() {
  const res = await fetch('/api/lockdown_impact');
  const rows = await res.json();
  upsertChart('chartLockdown', {
    type: 'bar',
    data: {
      labels: rows.map(r => r.state),
      datasets: [{ label: '% change Apr19->Apr20', data: rows.map(r => r.pct_change), backgroundColor: rows.map(r => regionColors[r.region] || palette.purple) }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { font: { size: 9 } } } }
    }
  });
}

async function loadRecovery() {
  const res = await fetch('/api/recovery');
  const rows = await res.json();
  upsertChart('chartRecovery', {
    type: 'bar',
    data: {
      labels: rows.map(r => r.state),
      datasets: [{ label: '% of pre-COVID recovered', data: rows.map(r => r.pct_recovered), backgroundColor: rows.map(r => regionColors[r.region] || palette.purple) }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { font: { size: 9 } } } }
    }
  });
}

async function loadTopBottom() {
  const res = await fetch('/api/top_bottom_states');
  const d = await res.json();
  const topBody = document.querySelector('#topTable tbody');
  const bottomBody = document.querySelector('#bottomTable tbody');
  topBody.innerHTML = d.top.map(r => `<tr><td>${r.state}</td><td>${r.region}</td><td>${r.total_2020.toLocaleString()}</td></tr>`).join('');
  bottomBody.innerHTML = d.bottom.map(r => `<tr><td>${r.state}</td><td>${r.region}</td><td>${r.total_2020.toLocaleString()}</td></tr>`).join('');
}

// ---------------------------------------------------------------------------
function wireFilters() {
  document.getElementById('regionFilter').addEventListener('change', (e) => {
    loadRegional(e.target.value);
  });
  document.getElementById('stateFilter').addEventListener('change', (e) => {
    loadStateTrend(e.target.value);
  });
}

async function init() {
  wireFilters();
  await Promise.all([
    loadKpis(),
    loadNational(),
    loadYoy(),
    loadRegional('All'),
    loadRegionShare(),
    loadStateTrend(document.getElementById('stateFilter').value),
    loadLockdown(),
    loadRecovery(),
    loadTopBottom(),
  ]);
}

document.addEventListener('DOMContentLoaded', init);
