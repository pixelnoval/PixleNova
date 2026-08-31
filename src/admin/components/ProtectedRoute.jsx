import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Wraps any admin route that requires authentication.
 * - While auth state is resolving: shows a full-screen spinner
 * - If unauthenticated: redirects to /admin/login
 * - If authenticated: renders children
 *
 * /admin/login must NEVER be wrapped by this component.
 */
export default function ProtectedRoute({ children }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="a-loading-screen" role="status" aria-label="Checking authentication">
        <div className="a-spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
