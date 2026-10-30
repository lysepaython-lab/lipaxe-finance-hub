import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useGetKycDataQuery } from '@/store/api/kycApi';
import { useMeQuery } from '@/store/api/authApi';
import { updateUser, logout } from '@/store/slices/authSlice';
import { getKycState } from '@/lib/kycStatus';
import { Button } from '@/components/ui/button';

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = useAppSelector(s => s.auth.accessToken);
  const user = useAppSelector(s => s.auth.user);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: freshUser, isLoading: isUserLoading, isError: userLoadFailed, refetch } = useMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });
  const { data: kycData } = useGetKycDataQuery(undefined, { skip: !token });
  const currentUser = freshUser || user;
  const kycState = getKycState(kycData, currentUser);

  useEffect(() => {
    if (freshUser) dispatch(updateUser(freshUser));
  }, [dispatch, freshUser]);

  if (!token) {
    const redirect = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} state={{ from: location }} replace />;
  }

  const isPinSetupPath = location.pathname === '/app/security/pin-setup';
  const requestedDestination = (location.state as { from?: unknown } | null)?.from;
  const pinSetupDestination = typeof requestedDestination === 'string' && requestedDestination.startsWith('/app/')
    ? requestedDestination
    : '/app';
  if (isUserLoading && currentUser?.isPin === undefined) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (currentUser?.isPin === undefined && userLoadFailed) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="font-display text-xl font-bold">Vérification de sécurité indisponible</h1>
          <p className="text-sm text-muted-foreground">Nous ne pouvons pas confirmer l’état de votre code PIN. Réessayez ou reconnectez-vous pour continuer en sécurité.</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => void refetch()}>Réessayer</Button>
            <Button onClick={() => { dispatch(logout()); navigate('/login', { replace: true }); }}>Se reconnecter</Button>
          </div>
        </div>
      </div>
    );
  }
  if (currentUser?.isPin === false && !isPinSetupPath) {
    return <Navigate to="/app/security/pin-setup" state={{ from: `${location.pathname}${location.search}${location.hash}` }} replace />;
  }
  if (currentUser?.isPin === true && isPinSetupPath) {
    return <Navigate to={pinSetupDestination} replace />;
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
