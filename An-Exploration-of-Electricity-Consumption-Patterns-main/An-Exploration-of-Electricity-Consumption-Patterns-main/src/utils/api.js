export async function fetchApi(endpoint, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length) query.set(key, value.join(','));
    } else {
      query.set(key, value);
    }
  });

  const qs = query.toString();
  const url = `/api${endpoint}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function buildFilterParams(filters) {
  return {
    states: filters.states?.length ? filters.states : undefined,
    regions: filters.regions?.length ? filters.regions : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    phase: filters.phase || undefined,
  };
}

export function formatNumber(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(n);
}

export const MODULES = [
  { id: 1, title: 'Data Collection', desc: 'CSV ingestion into indexed in-memory store with 16,600+ state-wise electricity records.' },
  { id: 2, title: 'Data Preparation', desc: 'Cleaning, regional bucketing (NR/WR/SR/ER/NER), and lockdown phase tagging.' },
  { id: 3, title: 'Visualization', desc: 'Interactive Plotly charts for trends, regional heatmaps, and recovery slopes.' },
  { id: 4, title: 'Dashboard', desc: 'Unified analytics viewport with global State, Region, and Date filters.' },
  { id: 5, title: 'Story', desc: 'Narrative walkthrough of the 2019–2020 timeline and lockdown impact.' },
  { id: 6, title: 'Performance', desc: 'Query latency benchmarking and dataset rendering metrics.' },
  { id: 7, title: 'Web Integration', desc: 'Express API bound to React frontend with real-time filter coordination.' },
  { id: 8, title: 'Documentation', desc: 'In-app help covering schemas, architecture, and analytical methods.' },
];

export const SCENARIOS = [
  {
    id: 1,
    title: 'Overall Consumption Trends',
    desc: 'Month-by-month tracking from Jan 2019 to Dec 2020, highlighting national shifts and lockdown anomalies.',
  },
  {
    id: 2,
    title: 'Regional Variations',
    desc: 'Compare Northern, Southern, Eastern, Western, and Northeastern demand driven by climate and industry.',
  },
  {
    id: 3,
    title: 'Lockdown Recovery',
    desc: 'Evaluate post-lockdown rebound pace — which states recovered fastest vs. those still lagging.',
  },
];
