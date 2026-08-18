import express from 'express';
import {
  getFilterMeta,
  getScenario1Trends,
  getScenario2Regional,
  getScenario3Recovery,
  getKPIs,
  getFilteredRaw,
  benchmarkQuery,
} from './analytics.js';

const router = express.Router();

// In-memory store for client-side performance pings (keeps only recent entries)
const clientMetrics = [];

function parseFilters(query) {
  return {
    states: query.states ? query.states.split(',').filter(Boolean) : undefined,
    regions: query.regions ? query.regions.split(',').filter(Boolean) : undefined,
    startDate: query.startDate || undefined,
    endDate: query.endDate || undefined,
    phase: query.phase || undefined,
  };
}

router.get('/meta', (_req, res) => {
  const { result, elapsedMs } = benchmarkQuery(() => getFilterMeta());
  res.json({ data: result, performance: { queryMs: elapsedMs } });
});

router.get('/scenario1', (req, res) => {
  const filters = parseFilters(req.query);
  const { result, elapsedMs } = benchmarkQuery(() => getScenario1Trends(filters));
  res.json({ data: result, filters, performance: { queryMs: elapsedMs } });
});

router.get('/scenario2', (req, res) => {
  const filters = parseFilters(req.query);
  const { result, elapsedMs } = benchmarkQuery(() => getScenario2Regional(filters));
  res.json({ data: result, filters, performance: { queryMs: elapsedMs } });
});

router.get('/scenario3', (req, res) => {
  const filters = parseFilters(req.query);
  const { result, elapsedMs } = benchmarkQuery(() => getScenario3Recovery(filters));
  res.json({ data: result, filters, performance: { queryMs: elapsedMs } });
});

router.get('/kpis', (req, res) => {
  const filters = parseFilters(req.query);
  const { result, elapsedMs } = benchmarkQuery(() => getKPIs(filters));
  res.json({ data: result, filters, performance: { queryMs: elapsedMs } });
});

router.get('/export/csv', (req, res) => {
  const filters = parseFilters(req.query);
  const rows = getFilteredRaw(filters);
  const header = 'State,Region,Date,Usage (MW),Phase\n';
  const body = rows.map(r =>
    `"${r.state}","${r.region_name}","${r.usage_date}",${r.usage},"${r.phase}"`
  ).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="electricity_analysis.csv"');
  res.send(header + body);
});

router.get('/report', (req, res) => {
  const filters = parseFilters(req.query);
  const kpis = getKPIs(filters);
  const scenario1 = getScenario1Trends(filters);
  const scenario2 = getScenario2Regional(filters);
  const scenario3 = getScenario3Recovery(filters);

  const report = {
    generatedAt: new Date().toISOString(),
    filters,
    executiveSummary: {
      totalConsumption: kpis.summary.totalConsumption,
      avgDailyUsage: Math.round(kpis.summary.avgDailyUsage * 100) / 100,
      statesTracked: kpis.summary.statesTracked,
      period: `${kpis.summary.periodStart} to ${kpis.summary.periodEnd}`,
      peakDay: kpis.peakDay,
      topConsumer: kpis.topState,
    },
    scenarioInsights: {
      overallTrend: `Tracked ${scenario1.daily.length} daily data points with ${scenario1.monthly.length} monthly aggregates.`,
      regionalLeader: scenario2.byRegion[0]?.region_name || 'N/A',
      highestDropState: scenario3.reboundScores[0]?.state || 'N/A',
      lockdownImpactPct: scenario3.reboundScores[0]?.dropPct
        ? `${Math.round(scenario3.reboundScores[0].dropPct)}% drop in ${scenario3.reboundScores[0].state}`
        : 'Varies by state',
    },
    phaseBreakdown: kpis.phaseBreakdown,
    topReboundStates: scenario3.reboundScores.slice(0, 5),
  };

  res.json(report);
});

router.get('/performance', (_req, res) => {
  const metrics = [];
  const filters = {};

  for (const [name, fn] of [
    ['filterMeta', () => getFilterMeta()],
    ['scenario1', () => getScenario1Trends(filters)],
    ['scenario2', () => getScenario2Regional(filters)],
    ['scenario3', () => getScenario3Recovery(filters)],
    ['kpis', () => getKPIs(filters)],
  ]) {
    const { elapsedMs } = benchmarkQuery(fn);
    metrics.push({ query: name, elapsedMs });
  }

  const meta = getFilterMeta();
  res.json({
    metrics,
    dataset: { totalRecords: meta.totalRecords, states: meta.states.length },
    renderTarget: '< 200ms per query',
    status: metrics.every(m => m.elapsedMs < 200) ? 'healthy' : 'acceptable',
    clientMetrics: clientMetrics.slice(-10),
  });
});

router.post('/performance/client', (req, res) => {
  try {
    const item = { ts: new Date().toISOString(), ...req.body };
    clientMetrics.push(item);
    // keep only last 200 entries
    if (clientMetrics.length > 200) clientMetrics.splice(0, clientMetrics.length - 200);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
