import { NavLink } from 'react-router-dom';

export default function Layout({ children }) {
  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <NavLink to="/" className="logo">
            <img src="/icon.svg" alt="Energy Analytics" className="logo-img" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span>Energy Analytics</span>
          </NavLink>
          <ul className="nav-links">
            <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink></li>
            <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink></li>
            <li><NavLink to="/story" className={({ isActive }) => isActive ? 'active' : ''}>Story</NavLink></li>
            <li><NavLink to="/help" className={({ isActive }) => isActive ? 'active' : ''}>Help</NavLink></li>
          </ul>
        </div>
      </nav>
      <main>{children}</main>
      <footer className="footer">
        <div className="container">
          Plugging into the Future — State-wise Electricity Consumption Analysis (Jan 2019 – Dec 2020)
        </div>
      </footer>
    </>
  );
}
