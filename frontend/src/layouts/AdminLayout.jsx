import { Link, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const adminNavItems = [
    { label: 'Admin Dashboard', path: '/admin' },
    { label: 'Return to App', path: '/' },
  ];

  return (
    <div className="layout-root">
      <header className="navbar-container admin-header">
        <div className="navbar-content">
          <div className="brand-group">
            <Link to="/admin" className="brand-logo">
              <span className="brand-accent">Adh</span>yaya
            </Link>
            <span className="badge badge-admin">Admin Console</span>
          </div>

          <div className="nav-actions">
            <span className="user-greeting">
              Admin: {user?.fullName || user?.username || 'Administrator'}
            </span>
            <button
              type="button"
              onClick={logout}
              className="btn btn-outline btn-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="app-shell-body">
        <aside className="sidebar-container admin-sidebar">
          <nav className="sidebar-nav">
            {adminNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="main-content-app">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
