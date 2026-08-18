export default function FilterPanel({ meta, filters, onChange, onApply, loading }) {
  if (!meta) return null;

  return (
    <div className="filter-panel">
      <div className="filter-row">
        <div className="filter-group">
          <label>State</label>
          <select
            value={filters.state || ''}
            onChange={(e) => onChange({ ...filters, state: e.target.value, states: e.target.value ? [e.target.value] : [] })}
          >
            <option value="">All States</option>
            {meta.states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Region</label>
          <select
            value={filters.region || ''}
            onChange={(e) => onChange({ ...filters, region: e.target.value, regions: e.target.value ? [e.target.value] : [] })}
          >
            <option value="">All Regions</option>
            {meta.regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            min={meta.dates?.minIso}
            max={meta.dates?.maxIso}
            value={filters.startDate}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            min={meta.dates?.minIso}
            max={meta.dates?.maxIso}
            value={filters.endDate}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>Phase</label>
          <select value={filters.phase} onChange={(e) => onChange({ ...filters, phase: e.target.value })}>
            <option value="">All Phases</option>
            {meta.phases.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onApply} disabled={loading}>
          Apply Filters
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onChange({ states: [], regions: [], state: '', region: '', startDate: '', endDate: '', phase: '' })}
        >
          Reset
        </button>
      </div>
      <div className={`filter-status ${loading ? 'loading' : ''}`}>
        {loading ? (
          <>
            <span className="spinner" />
            Updating visualizations…
          </>
        ) : (
          <>Showing data from {meta.totalRecords?.toLocaleString()} indexed records</>
        )}
      </div>
    </div>
  );
}
