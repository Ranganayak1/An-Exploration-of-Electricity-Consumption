// story.js - renders the three "scene" charts for the data story page.

const storyPalette = { accent: '#ffb545', accent2: '#4fd1c5', accent3: '#f96e6e', purple: '#9b8cff' };
const regionColors = {
  'Northern': '#ffb545', 'Southern': '#4fd1c5', 'Eastern': '#f96e6e',
  'Western': '#9b8cff', 'Northeastern': '#6fc27d',
};
Chart.defaults.color = '#9aa1b9';
Chart.defaults.font.family = "Segoe UI, Roboto, sans-serif";

function fmtMonth(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
}

async function scene1() {
  const res = await fetch('/api/national_trend');
  const rows = await res.json();
  new Chart(document.getElementById('storyChart1').getContext('2d'), {
    type: 'line',
    data: {
      labels: rows.map(r => fmtMonth(r.date)),
      datasets: [{
        label: 'National consumption (MU)',
        data: rows.map(r => r.total_mu),
        borderColor: storyPalette.accent,
        backgroundColor: 'rgba(255,181,69,0.12)',
        fill: true,
        tension: .35,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        annotation: undefined,
      },
    }
  });
}

async function scene2() {
  const res = await fetch('/api/regional_trend');
  const rows = await res.json();
  const regions = [...new Set(rows.map(r => r.region))];
  const dates = [...new Set(rows.map(r => r.date))].sort();
  const datasets = regions.map(r => ({
    label: r,
    data: dates.map(d => (rows.find(x => x.region === r && x.date === d) || {}).total_mu),
    borderColor: regionColors[r],
    backgroundColor: 'transparent',
    tension: .3,
  }));
  new Chart(document.getElementById('storyChart2').getContext('2d'), {
    type: 'line',
    data: { labels: dates.map(fmtMonth), datasets },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
  });
}

async function scene3() {
  const res = await fetch('/api/recovery');
  const rows = await res.json();
  new Chart(document.getElementById('storyChart3').getContext('2d'), {
    type: 'bar',
    data: {
      labels: rows.map(r => r.state),
      datasets: [{
        label: '% of pre-COVID baseline recovered by Q4 2020',
        data: rows.map(r => r.pct_recovered),
        backgroundColor: rows.map(r => regionColors[r.region] || storyPalette.purple),
      }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { font: { size: 9 } } }, x: { title: { display: true, text: '% recovered (100% = fully recovered)' } } }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => { scene1(); scene2(); scene3(); });
