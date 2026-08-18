import { getRecords, getAllRecords } from './dataStore.js';

function groupBy(arr, keyFn) {
  const map = new Map();
  for (const item of arr) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

export function getFilterMeta() {
  const all = getAllRecords();
  const states = [...new Set(all.map(r => r.state))].sort();
  const regions = [...new Set(all.map(r => r.region_name))].sort();
  const sorted = [...all].sort((a, b) => a.date_iso.localeCompare(b.date_iso));
  const dates = {
    minDate: sorted[0]?.usage_date,
    maxDate: sorted[sorted.length - 1]?.usage_date,
    minIso: sorted[0]?.date_iso,
    maxIso: sorted[sorted.length - 1]?.date_iso,
  };
  const phases = ['Pre-Lockdown', 'Lockdown', 'Recovery'];

  return { states, regions, dates, phases, totalRecords: all.length };
}

export function getScenario1Trends(filters = {}) {
  const rows = getRecords(filters);
  const byDate = groupBy(rows, r => r.usage_date);

  const daily = [...byDate.entries()]
    .map(([usage_date, items]) => ({
      usage_date,
      total_usage: items.reduce((s, r) => s + r.usage, 0),
      avg_usage: items.reduce((s, r) => s + r.usage, 0) / items.length,
      state_count: new Set(items.map(r => r.state)).size,
    }))
    .sort((a, b) => a.usage_date.localeCompare(b.usage_date));

  const byMonth = groupBy(rows, r => r.usage_date.slice(3, 10));
  const monthly = [...byMonth.entries()]
    .map(([month_key, items]) => ({
      month_key,
      total_usage: items.reduce((s, r) => s + r.usage, 0),
      sortKey: items[0].date_iso,
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ month_key, total_usage }) => ({ month_key, total_usage }));

  return { daily, monthly };
}

export function getScenario2Regional(filters = {}) {
  const rows = getRecords(filters);
  const byRegionMap = groupBy(rows, r => r.region_name);

  const byRegion = [...byRegionMap.entries()]
    .map(([region_name, items]) => ({
      region_name,
      total_usage: items.reduce((s, r) => s + r.usage, 0),
      avg_usage: items.reduce((s, r) => s + r.usage, 0) / items.length,
      data_points: items.length,
    }))
    .sort((a, b) => b.total_usage - a.total_usage);

  const heatmapMap = groupBy(rows, r => `${r.region_name}|${r.state}`);
  const heatmap = [...heatmapMap.entries()].map(([key, items]) => {
    const [region_name, state] = key.split('|');
    return {
      region_name,
      state,
      total_usage: items.reduce((s, r) => s + r.usage, 0),
      avg_usage: items.reduce((s, r) => s + r.usage, 0) / items.length,
    };
  }).sort((a, b) => a.region_name.localeCompare(b.region_name) || a.state.localeCompare(b.state));

  const phaseRegionMap = groupBy(rows, r => `${r.region_name}|${r.phase}`);
  const byPhaseRegion = [...phaseRegionMap.entries()].map(([key, items]) => {
    const [region_name, phase] = key.split('|');
    return {
      region_name,
      phase,
      avg_usage: items.reduce((s, r) => s + r.usage, 0) / items.length,
    };
  });

  return { byRegion, heatmap, byPhaseRegion };
}

export function getScenario3Recovery(filters = {}) {
  const { phase, ...rest } = filters;
  const rows = getRecords(rest);

  const avgByStatePhase = (targetPhase) => {
    const filtered = rows.filter(r => r.phase === targetPhase);
    const map = groupBy(filtered, r => r.state);
    return Object.fromEntries(
      [...map.entries()].map(([state, items]) => [
        state,
        items.reduce((s, r) => s + r.usage, 0) / items.length,
      ])
    );
  };

  const preMap = avgByStatePhase('Pre-Lockdown');
  const lockMap = avgByStatePhase('Lockdown');

  const recoveryTrend = rows
    .filter(r => r.phase === 'Lockdown' || r.phase === 'Recovery')
    .map(r => ({ usage_date: r.usage_date, state: r.state, usage: r.usage }))
    .sort((a, b) => a.usage_date.localeCompare(b.usage_date) || a.state.localeCompare(b.state));

  const recoveryMap = groupBy(
    rows.filter(r => ['Pre-Lockdown', 'Lockdown', 'Recovery'].includes(r.phase)),
    r => `${r.state}|${r.region_name}|${r.phase}`
  );
  const recoveryByState = [...recoveryMap.entries()].map(([key, items]) => {
    const [state, region_name, phaseName] = key.split('|');
    return {
      state,
      region_name,
      phase: phaseName,
      avg_usage: items.reduce((s, r) => s + r.usage, 0) / items.length,
    };
  });

  const reboundScores = Object.keys(preMap).map(state => {
    const pre = preMap[state] || 0;
    const lock = lockMap[state] || 0;
    const dropPct = pre > 0 ? ((pre - lock) / pre) * 100 : 0;
    return { state, preLockdownAvg: pre, lockdownAvg: lock, dropPct };
  }).sort((a, b) => b.dropPct - a.dropPct);

  return { recoveryTrend, recoveryByState, reboundScores };
}

export function getKPIs(filters = {}) {
  const rows = getRecords(filters);
  if (!rows.length) {
    return {
      summary: { totalConsumption: 0, avgDailyUsage: 0, statesTracked: 0, daysTracked: 0, periodStart: null, periodEnd: null },
      peakDay: null,
      topState: null,
      phaseBreakdown: [],
    };
  }

  const totalConsumption = rows.reduce((s, r) => s + r.usage, 0);
  const dates = [...new Set(rows.map(r => r.usage_date))];
  const states = new Set(rows.map(r => r.state));

  const byDate = groupBy(rows, r => r.usage_date);
  const peakDay = [...byDate.entries()]
    .map(([usage_date, items]) => ({ usage_date, total: items.reduce((s, r) => s + r.usage, 0) }))
    .sort((a, b) => b.total - a.total)[0];

  const byState = groupBy(rows, r => r.state);
  const topState = [...byState.entries()]
    .map(([state, items]) => ({ state, total: items.reduce((s, r) => s + r.usage, 0) }))
    .sort((a, b) => b.total - a.total)[0];

  const byPhase = groupBy(rows, r => r.phase);
  const phaseBreakdown = [...byPhase.entries()].map(([phase, items]) => ({
    phase,
    total: items.reduce((s, r) => s + r.usage, 0),
    avg: items.reduce((s, r) => s + r.usage, 0) / items.length,
  }));

  const sortedDates = dates.sort((a, b) => {
    const da = rows.find(r => r.usage_date === a);
    const db = rows.find(r => r.usage_date === b);
    return da.date_iso.localeCompare(db.date_iso);
  });

  return {
    summary: {
      totalConsumption,
      avgDailyUsage: totalConsumption / rows.length,
      statesTracked: states.size,
      daysTracked: dates.length,
      periodStart: sortedDates[0],
      periodEnd: sortedDates[sortedDates.length - 1],
    },
    peakDay,
    topState,
    phaseBreakdown,
  };
}

export function getFilteredRaw(filters = {}) {
  return getRecords(filters)
    .slice(0, 5000)
    .map(({ state, region_name, usage_date, usage, phase }) => ({
      state, region_name, usage_date, usage, phase,
    }));
}

export function benchmarkQuery(fn) {
  const start = performance.now();
  const result = fn();
  const elapsed = performance.now() - start;
  return { result, elapsedMs: Math.round(elapsed * 100) / 100 };
}
