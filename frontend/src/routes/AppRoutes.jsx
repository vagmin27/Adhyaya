import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AppLayout from '../layouts/AppLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';

function RoutePlaceholder({ title, description, category }) {
  return (
    <div className="placeholder-container">
      <div className="surface-card placeholder-card">
        {category && <span className="badge badge-primary">{category}</span>}
        <h2 className="placeholder-title">{title}</h2>
        <p className="placeholder-description">{description}</p>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages Layout */}
      <Route element={<PublicLayout />}>
        <Route
          path="/"
          element={
            <RoutePlaceholder
              category="Public"
              title="Welcome to Adhyaya"
              description="A modern video-learning platform foundation. Page implementations will follow in subsequent stages."
            />
          }
        />
        <Route
          path="/courses"
          element={
            <RoutePlaceholder
              category="Public"
              title="Courses Foundation"
              description="Course catalog routing slot ready for upcoming course discovery modules."
            />
          }
        />
        <Route
          path="/login"
          element={
            <RoutePlaceholder
              category="Authentication"
              title="Sign In"
              description="Authentication routing slot ready for login form implementation."
            />
          }
        />
        <Route
          path="/register"
          element={
            <RoutePlaceholder
              category="Authentication"
              title="Create Account"
              description="Registration routing slot ready for user sign-up form implementation."
            />
          }
        />
      </Route>

      {/* Authenticated User Layout (Protected) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/profile"
            element={
              <RoutePlaceholder
                category="Protected User"
                title="User Profile"
                description="Profile routing slot for user details, channel info, and watch history."
              />
            }
          />
        </Route>
      </Route>

      {/* Admin Layout (Protected with Admin requirement) */}
      <Route element={<ProtectedRoute requireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route
            path="/admin"
            element={
              <RoutePlaceholder
                category="Protected Admin"
                title="Admin Console"
                description="Admin routing slot for platform metrics, moderation, and management."
              />
            }
          />
        </Route>
      </Route>

      {/* 404 Route */}
      <Route element={<PublicLayout />}>
        <Route
          path="*"
          element={
            <RoutePlaceholder
              category="404"
              title="Page Not Found"
              description="The requested route does not exist."
            />
          }
        />
      </Route>
    </Routes>
  );
}
