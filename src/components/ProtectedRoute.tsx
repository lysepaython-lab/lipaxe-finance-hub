import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = useAppSelector(s => s.auth.accessToken);
  const user = useAppSelector(s => s.auth.user);
  const location = useLocation();

  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;

  const isAppPath = location.pathname === '/app' || location.pathname.startsWith('/app/');
  const allowedBeforeKyc = location.pathname === '/app' || 
                            location.pathname.startsWith('/app/kyc') || 
                            location.pathname.startsWith('/app/notifications') ||
                            location.pathname.startsWith('/app/settings') ||
                            location.pathname.startsWith('/app/profile');
  if (isAppPath && user?.kycStatus !== 'verified' && !allowedBeforeKyc) {
    return <Navigate to="/app" replace />;
  }

  return children;
};
