import { useState, useEffect } from 'react';
import { TrendChart, RecoveryChart } from '../components/Charts';
import { fetchApi } from '../utils/api';

const SCENES = [
  {
    phase: 'pre',
    label: 'Pre-Lockdown',
    title: 'Steady Growth Across India',
    period: 'January 2019 – February 2020',
    text: 'Before the pandemic, electricity consumption followed predictable seasonal patterns. Industrial states like Maharashtra and Gujarat led demand, while agricultural states showed cyclical peaks. National usage grew steadily, reflecting economic expansion and expanding energy access.',
  },
  {
    phase: 'lock',
    label: 'Lockdown',
    title: 'The Great Disruption',
    period: 'March 2020 – June 2020',
    text: 'Nationwide lockdowns caused unprecedented drops in industrial and commercial electricity demand. Manufacturing hubs saw steep declines as factories shut down. Some residential consumption rose as people stayed home, but the net effect was a dramatic reduction in total national usage.',
  },
  {
    phase: 'recovery',
    label: 'Recovery',
    title: 'Uneven Rebound',
    period: 'July 2020 – December 2020',
    text: 'Recovery was far from uniform. Western industrial states bounced back quickly as manufacturing resumed. Tourism-dependent and smaller northeastern states lagged. By December 2020, most major states approached pre-lockdown levels, but the trajectory revealed structural vulnerabilities in India\'s energy ecosystem.',
  },
];

export default function StoryPage() {
  const [activeScene, setActiveScene] = useState(0);
  const [scenario1, setScenario1] = useState(null);
  const [scenario3, setScenario3] = useState(null);

  useEffect(() => {
    fetchApi('/scenario1').then(r => setScenario1(r.data));
    fetchApi('/scenario3').then(r => setScenario3(r.data));
  }, []);

  const scene = SCENES[activeScene];

  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title">The Energy Story</h1>
        <p className="section-sub">
          A curated walkthrough of how COVID-19 lockdowns reshaped India&apos;s electricity landscape
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {SCENES.map((s, i) => (
            <button
              key={s.label}
              className={`btn ${activeScene === i ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveScene(i)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className={`story-scene ${activeScene % 2 === 1 ? 'reverse' : ''}`}>
          <div>
            <span className={`story-phase phase-${scene.phase}`}>{scene.label}</span>
            <h3>{scene.title}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{scene.period}</p>
            <p style={{ lineHeight: 1.7 }}>{scene.text}</p>
          </div>
          <div className="chart-card">
            {activeScene === 0 && <TrendChart data={scenario1} loading={!scenario1} />}
            {activeScene === 1 && <RecoveryChart data={scenario3} loading={!scenario3} />}
            {activeScene === 2 && <TrendChart data={scenario1} loading={!scenario1} />}
          </div>
        </div>

        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Key Takeaways</h3>
          <ul style={{ color: 'var(--text-muted)', paddingLeft: '1.25rem', lineHeight: 1.8 }}>
            <li>Agriculture accounted for the highest share (17.89%) of electric energy usage in India during 2015–16.</li>
            <li>India&apos;s per capita electricity consumption remains below global averages despite relatively low tariffs.</li>
            <li>Lockdowns shifted consumption patterns from industrial/transportation sectors toward residential zones.</li>
            <li>Regional disparities in recovery highlight uneven industrial presence and climate-driven demand.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
