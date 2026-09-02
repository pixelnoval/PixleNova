import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/admin',            label: 'Dashboard',  end: true },
  { to: '/admin/enquiries',  label: 'Enquiries',  end: false },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [navigate]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="a-shell">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="a-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`a-sidebar${sidebarOpen ? ' a-sidebar--open' : ''}`}>
        <div className="a-sidebar__brand">
          <span className="a-brand">PIXLENOVA</span>
          <span className="a-brand-sub">Admin</span>
        </div>

        <nav className="a-sidebar__nav" aria-label="Admin navigation">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `a-nav-link${isActive ? ' a-nav-link--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {label}
            </NavLink>
          ))}
          {admin?.role === 'SUPER_ADMIN' && (
            <NavLink
              to="/admin/admins"
              className={({ isActive }) => `a-nav-link${isActive ? ' a-nav-link--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              Admin Management
            </NavLink>
          )}
        </nav>


        <button
          className="a-btn a-btn--ghost a-sidebar__logout"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </aside>

      {/* ── MAIN ── */}
      <div className="a-main">
        {/* Top header */}
        <header className="a-header">
          <button
            className="a-hamburger"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle navigation"
            aria-expanded={sidebarOpen}
          >
            <span /><span /><span />
          </button>
          <div className="a-header__info">
            <span className="a-header__email">{admin?.email}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="a-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
