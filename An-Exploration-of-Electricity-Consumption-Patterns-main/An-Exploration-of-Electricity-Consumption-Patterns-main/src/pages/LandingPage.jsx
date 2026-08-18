import { Link } from 'react-router-dom';
import { MODULES, SCENARIOS } from '../utils/api';
import Typewriter from '../components/Typewriter';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="hero-badge fade-up">Energy Analytics Platform</span>
          <h1 className="fade-up in">
            Plugging into the <em><Typewriter texts={["Future", "Next-Gen Insights", "Smarter Grids"]} /></em>
          </h1>
          <p>
            An in-depth exploration of electricity consumption patterns across Indian states
            from January 2019 to December 2020 — covering the COVID-19 pandemic and nationwide lockdown.
          </p>
          <div className="hero-actions fade-up">
            <Link to="/dashboard" className="btn btn-primary">
              Launch Dashboard →
            </Link>
            <Link to="/story" className="btn btn-secondary">
              Read the Story
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Analytical Scenarios</h2>
          <p className="section-sub">Three core lenses for understanding India&apos;s energy landscape</p>
          <div className="card-grid card-grid-3">
            {SCENARIOS.map(s => (
              <div key={s.id} className="card">
                <span className="hero-badge" style={{ marginBottom: '0.75rem' }}>Scenario {s.id}</span>
                <h3 style={{ marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2 className="section-title">8 Engineering Modules</h2>
          <p className="section-sub">End-to-end pipeline from data ingestion to web integration</p>
          <div className="card-grid card-grid-2">
            {MODULES.map(m => (
              <div key={m.id} className="card" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{
                  minWidth: 40, height: 40, borderRadius: 10,
                  background: 'var(--electric-soft)', color: 'var(--electric)',
                  display: 'grid', placeItems: 'center', fontWeight: 700,
                }}>
                  {m.id}
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.35rem' }}>{m.title}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 className="section-title">Ready to Analyze?</h2>
          <p className="section-sub" style={{ marginBottom: '1.5rem' }}>
            Filter by state, region, and date range. Export insights as CSV or generate a printable report.
          </p>
          <Link to="/dashboard" className="btn btn-primary">
            Open Analysis Environment
          </Link>
        </div>
      </section>
    </>
  );
}
