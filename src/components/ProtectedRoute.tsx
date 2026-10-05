import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { useGetKycDataQuery } from '@/store/api/kycApi';
import { getKycState } from '@/lib/kycStatus';

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = useAppSelector(s => s.auth.accessToken);
  const user = useAppSelector(s => s.auth.user);
  const location = useLocation();
  const { data: kycData } = useGetKycDataQuery(undefined, { skip: !token });
  const kycState = getKycState(kycData, user);

  if (!token) {
    const redirect = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} state={{ from: location }} replace />;
  }

  const isAppPath = location.pathname === '/app' || location.pathname.startsWith('/app/');
  const allowedBeforeKyc = location.pathname === '/app' || 
                            location.pathname.startsWith('/app/kyc') || 
                            location.pathname.startsWith('/app/notifications') ||
                            location.pathname.startsWith('/app/settings') ||
                            location.pathname.startsWith('/app/profile');
  if (isAppPath && !kycState.verified && !allowedBeforeKyc) {
    return <Navigate to="/app" replace />;
  }

  return children;
};
