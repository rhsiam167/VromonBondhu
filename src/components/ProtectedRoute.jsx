import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Only shows its page to logged-in users; everyone else goes to Log In.
 * While a saved login is still being checked with the backend, it waits
 * instead of redirecting (so a refresh doesn't bounce you to Log In).
 * Right after logging out on purpose, it goes to the landing page instead.
 */
export default function ProtectedRoute({ children }) {
  const { isLoggedIn, checkingSession, justLoggedOut } = useAuth();
  const location = useLocation();
  if (checkingSession) return null;
  if (!isLoggedIn && justLoggedOut) return <Navigate to="/" replace />;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
