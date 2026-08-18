import { formatNumber } from '../utils/api';

export default function ReportModal({ report, onClose }) {
  const handlePrint = () => window.print();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Analysis Report</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Generated: {new Date(report.generatedAt).toLocaleString()}
        </p>

        <div className="report-section">
          <h4>Executive Summary</h4>
          <p>Total Consumption: <strong>{formatNumber(report.executiveSummary.totalConsumption)} MW</strong></p>
          <p>Average Daily Usage: <strong>{formatNumber(report.executiveSummary.avgDailyUsage)} MW</strong></p>
          <p>Analysis Period: <strong>{report.executiveSummary.period}</strong></p>
          <p>Peak Day: <strong>{report.executiveSummary.peakDay?.usage_date}</strong> ({formatNumber(report.executiveSummary.peakDay?.total)} MW)</p>
          <p>Top Consumer: <strong>{report.executiveSummary.topConsumer?.state}</strong> ({formatNumber(report.executiveSummary.topConsumer?.total)} MW total)</p>
        </div>

        <div className="report-section">
          <h4>Scenario Insights</h4>
          <p>{report.scenarioInsights.overallTrend}</p>
          <p>Leading Region: <strong>{report.scenarioInsights.regionalLeader}</strong></p>
          <p>Lockdown Impact: <strong>{report.scenarioInsights.lockdownImpactPct}</strong></p>
        </div>

        <div className="report-section">
          <h4>Phase Breakdown</h4>
          {report.phaseBreakdown?.map(p => (
            <p key={p.phase}>{p.phase}: {formatNumber(p.total)} MW total, {formatNumber(p.avg)} MW avg</p>
          ))}
        </div>

        <div className="report-section">
          <h4>Top Lockdown Impact States</h4>
          {report.topReboundStates?.map(s => (
            <p key={s.state}>{s.state}: {Math.round(s.dropPct)}% drop (Pre: {formatNumber(s.preLockdownAvg)} → Lock: {formatNumber(s.lockdownAvg)} MW)</p>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>Print Report</button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
