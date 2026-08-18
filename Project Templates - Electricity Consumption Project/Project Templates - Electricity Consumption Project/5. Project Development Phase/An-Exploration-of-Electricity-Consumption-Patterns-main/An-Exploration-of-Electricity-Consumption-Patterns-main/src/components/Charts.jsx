import { useEffect, useState } from 'react';

// Dynamically load react-plotly to reduce initial bundle size
function usePlotly() {
  const [Plot, setPlot] = useState(null);
  useEffect(() => {
    let mounted = true;
    import('react-plotly.js').then(mod => { if (mounted) setPlot(() => mod.default); }).catch(() => { if (mounted) setPlot(null); });
    return () => { mounted = false; };
  }, []);
  return Plot;
}

const darkLayout = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { color: '#94a3b8', family: 'DM Sans, sans-serif', size: 11 },
  margin: { l: 50, r: 20, t: 30, b: 50 },
  xaxis: { gridcolor: 'rgba(148,163,184,0.1)', zerolinecolor: 'rgba(148,163,184,0.1)' },
  yaxis: { gridcolor: 'rgba(148,163,184,0.1)', zerolinecolor: 'rgba(148,163,184,0.1)' },
  colorway: ['#38bdf8', '#f59e0b', '#34d399', '#a78bfa', '#f87171'],
};

export function TrendChart({ data, loading }) {
  const Plot = usePlotly();
  if (loading) return <div className="skeleton" />;
  if (!data?.monthly?.length) return <div className="chart-loading">No data for selected filters</div>;
  if (!Plot) return <div className="skeleton" style={{ minHeight: 340 }} />;

  return (
    <Plot
      data={[{
        x: data.monthly.map(d => d.month_key),
        y: data.monthly.map(d => d.total_usage),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Monthly Consumption',
        line: { color: '#38bdf8', width: 2 },
        marker: { size: 5 },
      }]}
      layout={{
        ...darkLayout,
        title: { text: 'National Consumption Trend', font: { size: 13, color: '#f1f5f9' } },
        yaxis: { ...darkLayout.yaxis, title: 'Usage (MW)' },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: 340 }}
      useResizeHandler
    />
  );
}

export function RegionalBarChart({ data, loading }) {
  const Plot = usePlotly();
  if (loading) return <div className="skeleton" />;
  if (!data?.byRegion?.length) return <div className="chart-loading">No regional data</div>;
  if (!Plot) return <div className="skeleton" style={{ minHeight: 340 }} />;

  return (
    <Plot
      data={[{
        x: data.byRegion.map(d => d.region_name),
        y: data.byRegion.map(d => d.total_usage),
        type: 'bar',
        marker: { color: ['#38bdf8', '#f59e0b', '#34d399', '#a78bfa', '#f87171'] },
      }]}
      layout={{
        ...darkLayout,
        title: { text: 'Consumption by Region', font: { size: 13, color: '#f1f5f9' } },
        yaxis: { ...darkLayout.yaxis, title: 'Total Usage (MW)' },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: 340 }}
      useResizeHandler
    />
  );
}

export function RegionalHeatmap({ data, loading }) {
  const Plot = usePlotly();
  if (loading) return <div className="skeleton" />;
  if (!data?.heatmap?.length) return <div className="chart-loading">No heatmap data</div>;
  if (!Plot) return <div className="skeleton" style={{ minHeight: 400 }} />;

  const regions = [...new Set(data.heatmap.map(d => d.region_name))];
  const states = [...new Set(data.heatmap.map(d => d.state))];
  const z = regions.map(region =>
    states.map(state => {
      const row = data.heatmap.find(d => d.region_name === region && d.state === state);
      return row ? row.avg_usage : null;
    })
  );

  return (
    <Plot
      data={[{
        z,
        x: states,
        y: regions,
        type: 'heatmap',
        colorscale: 'YlOrRd',
        hoverongaps: false,
      }]}
      layout={{
        ...darkLayout,
        title: { text: 'State × Region Heatmap (Avg Usage)', font: { size: 13, color: '#f1f5f9' } },
        xaxis: { ...darkLayout.xaxis, tickangle: -45 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: 400 }}
      useResizeHandler
    />
  );
}

export function RecoveryChart({ data, loading }) {
  const Plot = usePlotly();
  if (loading) return <div className="skeleton" />;
  if (!data?.reboundScores?.length) return <div className="chart-loading">No recovery data</div>;
  if (!Plot) return <div className="skeleton" style={{ minHeight: 380 }} />;

  const top10 = data.reboundScores.slice(0, 10);

  return (
    <Plot
      data={[
        {
          x: top10.map(d => d.state),
          y: top10.map(d => d.preLockdownAvg),
          name: 'Pre-Lockdown Avg',
          type: 'bar',
          marker: { color: '#34d399' },
        },
        {
          x: top10.map(d => d.state),
          y: top10.map(d => d.lockdownAvg),
          name: 'Lockdown Avg',
          type: 'bar',
          marker: { color: '#f87171' },
        },
      ]}
      layout={{
        ...darkLayout,
        barmode: 'group',
        title: { text: 'Lockdown Impact — Top 10 States by Drop', font: { size: 13, color: '#f1f5f9' } },
        yaxis: { ...darkLayout.yaxis, title: 'Avg Usage (MW)' },
        xaxis: { ...darkLayout.xaxis, tickangle: -45 },
        legend: { orientation: 'h', y: 1.15 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: 380 }}
      useResizeHandler
    />
  );
}

export function PhaseChart({ data, loading }) {
  if (loading) return <div className="skeleton" />;
  if (!data?.length) return null;
  const Plot = usePlotly();
  if (!Plot) return <div className="skeleton" style={{ minHeight: 300 }} />;

  return (
    <Plot
      data={[{
        labels: data.map(d => d.phase),
        values: data.map(d => d.total),
        type: 'pie',
        hole: 0.45,
        marker: { colors: ['#34d399', '#f87171', '#38bdf8'] },
      }]}
      layout={{
        ...darkLayout,
        title: { text: 'Consumption by Phase', font: { size: 13, color: '#f1f5f9' } },
        showlegend: true,
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: 300 }}
      useResizeHandler
    />
  );
}

export function Sparkline({ data, loading, height = 60 }) {
  if (loading) return <div className="skeleton" style={{ minHeight: height }} />;
  if (!data?.monthly?.length) return <div className="chart-loading" style={{ minHeight: height }}>No data</div>;

  return (
    <Plot
      data={[{
        x: data.monthly.map(d => d.month_key),
        y: data.monthly.map(d => d.total_usage),
        type: 'scatter',
        mode: 'lines',
        line: { color: '#38bdf8', width: 2 },
        hoverinfo: 'none',
      }]}
      layout={{
        ...darkLayout,
        margin: { l: 10, r: 10, t: 6, b: 10 },
        xaxis: { showgrid: false, zeroline: false, showticklabels: false },
        yaxis: { showgrid: false, zeroline: false, showticklabels: false },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height }}
      useResizeHandler
    />
  );
}
