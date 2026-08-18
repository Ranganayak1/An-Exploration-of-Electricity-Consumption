import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import StoryPage from './pages/StoryPage';
import HelpPage from './pages/HelpPage';
import React, { Suspense, lazy } from 'react';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard"
          element={(
            <Suspense fallback={<div className="container" style={{ padding: '2rem' }}>Loading dashboard…</div>}>
              <DashboardPage />
            </Suspense>
          )}
        />
        <Route path="/story" element={<StoryPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </Layout>
  );
}
