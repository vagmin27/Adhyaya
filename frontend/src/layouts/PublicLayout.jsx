import { Link, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export function PublicLayout() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="layout-root">
      <header className="navbar-container">
        <div className="navbar-content">
          <Link to="/" className="brand-logo">
            <span className="brand-accent">Adh</span>yaya
          </Link>

          <nav className="nav-links">
            <Link to="/" className="nav-item">
              Home
            </Link>
            <Link to="/courses" className="nav-item">
              Courses
            </Link>
          </nav>

          <div className="nav-actions">
            {isAuthenticated ? (
              <div className="user-nav-group">
                <Link to="/profile" className="user-profile-badge">
                  {user?.fullName || user?.username || 'Profile'}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-outline btn-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons-group">
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content-public">
        <Outlet />
      </main>

      <footer className="footer-container">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} Adhyaya. Video Learning Platform.</p>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
