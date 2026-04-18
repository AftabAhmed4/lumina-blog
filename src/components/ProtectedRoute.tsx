import { Navigate, Outlet } from 'react-router-dom';
import { isAdmin } from '../lib/auth';

interface ProtectedRouteProps {
  user: any;
  loading: boolean;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ user, loading, adminOnly }: ProtectedRouteProps) {
  if (loading) return null; // Or a loading spinner

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin(user)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
