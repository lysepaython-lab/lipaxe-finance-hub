import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = useAppSelector(s => s.auth.accessToken);
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};
