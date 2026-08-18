export default function HelpPage() {
  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 className="section-title">Documentation & Help</h1>
        <p className="section-sub">Architecture, dataset schema, and analytical methodology</p>

        <div className="doc-block card">
          <h3>Project Overview</h3>
          <p>
            This application analyzes state-wise electricity consumption in India from January 2019
            to December 5, 2020. Data covers 33 states/UTs across five geographic regions, with
            special tagging for Pre-Lockdown, Lockdown (Mar–Jun 2020), and Recovery phases.
          </p>
        </div>

        <div className="doc-block card">
          <h3>Dataset Schema</h3>
          <ul>
            <li><code>state</code> — Indian state or union territory name</li>
            <li><code>region_code</code> — NR, WR, SR, ER, NER</li>
            <li><code>region_name</code> — Northern, Western, Southern, Eastern, Northeastern</li>
            <li><code>latitude / longitude</code> — Geographic coordinates</li>
            <li><code>usage_date</code> — Date in DD/MM/YYYY format</li>
            <li><code>usage</code> — Electricity consumption in MW</li>
            <li><code>phase</code> — Pre-Lockdown | Lockdown | Recovery</li>
          </ul>
        </div>

        <div className="doc-block card">
          <h3>Architecture</h3>
          <ul>
            <li><strong>Backend:</strong> Express.js API with in-memory indexed data store</li>
            <li><strong>Frontend:</strong> React + Vite with React Router</li>
            <li><strong>Charts:</strong> Plotly.js via react-plotly.js</li>
            <li><strong>Data Source:</strong> <code>long_data_.csv</code> ingested on server startup</li>
          </ul>
        </div>

        <div className="doc-block card">
          <h3>API Endpoints</h3>
          <ul>
            <li><code>GET /api/meta</code> — Filter metadata (states, regions, date range)</li>
            <li><code>GET /api/scenario1</code> — Overall consumption trends</li>
            <li><code>GET /api/scenario2</code> — Regional variations and heatmap data</li>
            <li><code>GET /api/scenario3</code> — Lockdown recovery analysis</li>
            <li><code>GET /api/kpis</code> — Summary KPIs for active filters</li>
            <li><code>GET /api/report</code> — JSON analysis report</li>
            <li><code>GET /api/export/csv</code> — CSV data export</li>
            <li><code>GET /api/performance</code> — Query latency benchmarks</li>
          </ul>
        </div>

        <div className="doc-block card">
          <h3>Analytical Methods</h3>
          <ul>
            <li><strong>Scenario 1:</strong> Daily and monthly aggregation of total consumption</li>
            <li><strong>Scenario 2:</strong> Regional grouping with state-level heatmap averages</li>
            <li><strong>Scenario 3:</strong> Pre-lockdown vs lockdown average comparison with drop percentage</li>
          </ul>
        </div>

        <div className="doc-block card">
          <h3>Running Locally</h3>
          <ul>
            <li><code>npm install</code> — Install dependencies</li>
            <li><code>npm run dev</code> — Start API (port 3001) and frontend (port 5173)</li>
            <li><code>npm run build && npm start</code> — Production build served by Express</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
