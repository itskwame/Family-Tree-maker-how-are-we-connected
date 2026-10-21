import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
const FamilyPrototype = __FAMILYCONNECT_DEMO__ ? lazy(() => import('./family/FamilyPrototype.jsx')) : null;

const navLinkClass = ({ isActive }) =>
  `react-nav__link${isActive ? ' react-nav__link--active' : ''}`;

export default function App() {
  const location = useLocation();
  if (__FAMILYCONNECT_DEMO__ && ['localhost','127.0.0.1'].includes(window.location.hostname) && location.pathname === '/tree-prototype') {
    return <Suspense fallback={<p>Loading family prototype…</p>}><FamilyPrototype /></Suspense>;
  }
  return (
    <div className="react-app-shell">
      <header className="react-nav">
        <div className="react-nav__brand">
          <i className="fas fa-users-line" aria-hidden="true" />
          <span>FamilyConnect React</span>
        </div>
        <nav className="react-nav__links" aria-label="Primary">
          <NavLink className={navLinkClass} to="/">
            Home
          </NavLink>
          <NavLink className={navLinkClass} to="/auth/login">
            Login
          </NavLink>
          <NavLink className={navLinkClass} to="/auth/signup">
            Sign Up
          </NavLink>
        </nav>
      </header>
      <main className="react-app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
        </Routes>
      </main>
    </div>
  );
}
