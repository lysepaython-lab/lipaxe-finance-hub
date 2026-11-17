import { useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useGetKycDataQuery } from '@/store/api/kycApi';
import { useMeQuery } from '@/store/api/authApi';
import { updateUser, logout } from '@/store/slices/authSlice';
import { getKycState } from '@/lib/kycStatus';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = useAppSelector(s => s.auth.accessToken);
  const user = useAppSelector(s => s.auth.user);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: freshUser, isLoading: isUserLoading, isError: userLoadFailed, refetch } = useMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });
  const { data: kycData, isLoading: isKycLoading } = useGetKycDataQuery(undefined, { skip: !token });
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
                            location.pathname === '/app/security/pin-setup' ||
                            location.pathname.startsWith('/app/kyc') || 
                            location.pathname.startsWith('/app/notifications') ||
                            location.pathname.startsWith('/app/settings') ||
                            location.pathname.startsWith('/app/profile');
  if (isAppPath && !kycState.verified && !allowedBeforeKyc && !isKycLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-5 sm:p-8">
        <div className="w-full max-w-lg rounded-3xl border border-amber-500/20 bg-card p-6 text-center shadow-xl sm:p-9">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Lipaxe · KYC</p>
          <h1 className="mt-2 font-display text-2xl font-bold">{t('kyc.accessRequiredTitle')}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t('kyc.accessRequiredBody')}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="bg-gradient-brand shadow-brand">
              <Link to="/app/kyc">{t('kyc.accessRequiredCta')}</Link>
            </Button>
            <Button asChild variant="outline"><Link to="/app">{t('kyc.backToDashboard')}</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};
