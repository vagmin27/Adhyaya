import { Link, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Courses', path: '/courses' },
    { label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="layout-root">
      <header className="navbar-container">
        <div className="navbar-content">
          <Link to="/" className="brand-logo">
            <span className="brand-accent">Adh</span>yaya
          </Link>

          <div className="nav-actions">
            <span className="user-greeting">
              Welcome, {user?.fullName || user?.username || 'Learner'}
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
        <aside className="sidebar-container">
          <nav className="sidebar-nav">
            {navItems.map((item) => {
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

export default AppLayout;
