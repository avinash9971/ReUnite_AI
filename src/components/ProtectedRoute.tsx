import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (requiredRole === 'admin') {
          navigate('/admin-login');
        } else {
          navigate('/user-login');
        }
        return;
      }

      if (requiredRole && profile && profile.role !== requiredRole) {
        navigate('/');
      }
    }
  }, [user, profile, loading, navigate, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (requiredRole && profile && profile.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
