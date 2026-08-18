import { useState, useEffect, useCallback, useRef } from 'react';
import FilterPanel from '../components/FilterPanel';
import { TrendChart, RegionalBarChart, RegionalHeatmap, RecoveryChart, PhaseChart } from '../components/Charts';
import ReportModal from '../components/ReportModal';
import { fetchApi, buildFilterParams, formatNumber } from '../utils/api';

const emptyFilters = { states: [], regions: [], state: '', region: '', startDate: '', endDate: '', phase: '' };

export default function DashboardPage() {
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [filterLatency, setFilterLatency] = useState(null);
  const [scenario1, setScenario1] = useState(null);
  const [scenario2, setScenario2] = useState(null);
  const [scenario3, setScenario3] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchApi('/meta').then(res => setMeta(res.data)).catch(console.error);
    fetchApi('/performance').then(res => setPerformance(res)).catch(console.error);
  }, []);

  const loadData = useCallback(async (f) => {
    setLoading(true);
    const params = buildFilterParams(f);
    const start = Date.now();
    try {
      const [s1, s2, s3, k] = await Promise.all([
        fetchApi('/scenario1', params),
        fetchApi('/scenario2', params),
        fetchApi('/scenario3', params),
        fetchApi('/kpis', params),
      ]);
      setScenario1(s1.data);
      setScenario2(s2.data);
      setScenario3(s3.data);
      setKpis(k.data);
      const elapsed = Date.now() - start;
      setFilterLatency(elapsed);
      // send a lightweight ping to server for aggregation (don't block)
      try { fetch('/api/performance/client', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ elapsedMs: elapsed, filters: f }) }); } catch (e) { /* ignore */ }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(applied);
  }, [applied, loadData]);

  // Auto-apply filters with debounce for reactive UX
  const applyTimer = useRef(null);
  useEffect(() => {
    // cancel if identical
    if (JSON.stringify(filters) === JSON.stringify(applied)) return;
    if (applyTimer.current) clearTimeout(applyTimer.current);
    applyTimer.current = setTimeout(() => setApplied({ ...filters }), 350);
    return () => clearTimeout(applyTimer.current);
  }, [filters]);

  const handleApply = () => setApplied({ ...filters });

  const handleExportCsv = () => {
    const params = buildFilterParams(applied);
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    window.open(`/api/export/csv?${query}`, '_blank');
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const params = buildFilterParams(applied);
      const r = await fetchApi('/report', params);
      setReport(r);
      setShowReport(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title">Analytics Dashboard</h1>
        <p className="section-sub">
          Interactive visualization of state-wise electricity consumption with real-time filtering
        </p>

        <FilterPanel
          meta={meta}
          filters={filters}
          onChange={setFilters}
          onApply={handleApply}
          loading={loading}
        />

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={handleGenerateReport} disabled={loading}>
            Generate Report
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCsv}>
            Export CSV
          </button>
          <div style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {filterLatency ? `Last update: ${filterLatency}ms` : loading ? 'Updating…' : 'Idle'}
          </div>
        </div>

        {kpis && !loading && (
          <div className="card-grid card-grid-4" style={{ marginBottom: '1.5rem' }}>
            <div className="card">
              <div className="kpi-value">{formatNumber(kpis.summary?.totalConsumption)}</div>
              <div className="kpi-label">Total Consumption (MW)</div>
            </div>
            <div className="card">
              <div className="kpi-value">{formatNumber(kpis.summary?.avgDailyUsage)}</div>
              <div className="kpi-label">Avg Daily Usage (MW)</div>
            </div>
            <div className="card">
              <div className="kpi-value">{kpis.summary?.statesTracked}</div>
              <div className="kpi-label">States Tracked</div>
            </div>
            <div className="card">
              <div className="kpi-value">{kpis.topState?.state || '—'}</div>
              <div className="kpi-label">Top Consumer State</div>
            </div>
          </div>
        )}

        {/* New small analytics cards derived from scenario data */}
        {scenario1 && !loading && (
          <div className="card-grid card-grid-3" style={{ marginBottom: '1rem' }}>
            <div className="card">
              <div className="kpi-label">Peak Month</div>
              <div style={{ marginTop: '0.5rem', fontWeight: 700 }}>
                {(() => {
                  const months = scenario1.monthly || [];
                  if (!months.length) return '—';
                  const peak = months.reduce((p, c) => (c.total_usage > (p.total_usage || 0) ? c : p), {});
                  return `${peak.month_key} — ${Number(peak.total_usage).toLocaleString()} MW`;
                })()}
              </div>
            </div>
            <div className="card">
              <div className="kpi-label">6‑month Trend</div>
              <div style={{ marginTop: '0.5rem' }}>
                {/* small sparkline */}
                <div style={{ height: 60 }}>
                  <TrendChart data={{ monthly: (scenario1.monthly || []).slice(-12) }} loading={loading} />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="kpi-label">Data Points</div>
              <div style={{ marginTop: '0.5rem', fontWeight: 700 }}>{(kpis?.summary?.dataPoints || kpis?.summary?.totalRecords)?.toLocaleString() || '—'}</div>
            </div>
          </div>
        )}

        {loading && !scenario1 && (
          <div className="card-grid card-grid-2">
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        )}

        <div className="dashboard-grid dashboard-grid-2">
          <div className="chart-card">
            <h3>Scenario 1 <span className="tag">Trends</span></h3>
            <TrendChart data={scenario1} loading={loading} />
          </div>
          <div className="chart-card">
            <h3>Scenario 2 <span className="tag">Regional</span></h3>
            <RegionalBarChart data={scenario2} loading={loading} />
          </div>
          <div className="chart-card">
            <h3>Scenario 2 <span className="tag">Heatmap</span></h3>
            <RegionalHeatmap data={scenario2} loading={loading} />
          </div>
          <div className="chart-card">
            <h3>Scenario 3 <span className="tag">Recovery</span></h3>
            <RecoveryChart data={scenario3} loading={loading} />
          </div>
        </div>

        <div className="dashboard-grid" style={{ marginTop: '1.25rem' }}>
          <div className="chart-card" style={{ maxWidth: 480 }}>
            <h3>Phase Distribution</h3>
            <PhaseChart data={kpis?.phaseBreakdown} loading={loading} />
          </div>
        </div>

        {performance && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Performance Metrics</h3>
            <div className="card-grid card-grid-4">
              {performance.metrics?.map(m => (
                <div key={m.query}>
                  <div className="kpi-value" style={{ fontSize: '1.25rem' }}>{m.elapsedMs}ms</div>
                  <div className="kpi-label">{m.query}</div>
                </div>
              ))}
              <div>
                <div className="kpi-value" style={{ fontSize: '1.25rem', color: performance.status === 'healthy' ? 'var(--success)' : 'var(--accent)' }}>
                  {performance.status}
                </div>
                <div className="kpi-label">{performance.dataset?.totalRecords?.toLocaleString()} records</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showReport && report && (
        <ReportModal report={report} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}
