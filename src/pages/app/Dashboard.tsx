import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldCheck, Smartphone } from 'lucide-react';
import { FaApple, FaGooglePlay } from 'react-icons/fa';
import { useAppSelector } from '@/store/hooks';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { AccountsList } from '@/components/dashboard/AccountsList';
import { SortableDashboard, type DashboardWidget } from '@/components/dashboard/SortableDashboard';
import { Button } from '@/components/ui/button';
import { useGetKycDataQuery } from '@/store/api/kycApi';
import { getKycState } from '@/lib/kycStatus';

const AppDownloadBanner = () => (
  <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] border border-primary/20 bg-gradient-to-r from-primary via-brand-700 to-brand-900 p-4 sm:p-5 text-primary-foreground shadow-brand">
    <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
    <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-white/14">
          <Smartphone className="h-5 w-5 sm:h-7 sm:w-7" />
        </div>
        <div>
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold">Lipaxe Mobile</h1>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-primary-foreground/75">
            PIN, biométrie, QR, NFC et wallets toujours avec vous.
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <button className="flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-semibold text-primary shadow-sm">
          <FaApple className="h-4 w-4" /> App Store
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-white/12 px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-semibold text-white ring-1 ring-white/20">
          <FaGooglePlay className="h-4 w-4" /> Play Store
        </button>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const { data: kycData } = useGetKycDataQuery();
  const kycState = getKycState(kycData, user);

  const hour = new Date().getHours();
  const salutation = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const widgets: DashboardWidget[] = [
    { id: 'balance', column: 'side', render: () => <BalanceCard /> },
    { id: 'accounts', column: 'side', render: () => <AccountsList /> },
    { id: 'actions', column: 'main', render: () => <QuickActions /> },
    { id: 'spending', column: 'main', render: () => <SpendingChart /> },
    { id: 'recent', column: 'main', render: () => <RecentTransactions /> },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-3 sm:px-4 md:px-6">
      <div className="sr-only">
        {salutation} {user?.firstName}
      </div>
      
      <AppDownloadBanner />

      {kycState.needsVerification && (
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/12 via-background to-background px-4 sm:px-5 py-4 sm:py-5 shadow-sm">
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-emerald-400 sm:w-1.5" />
          <div className="flex flex-col gap-3 sm:gap-4 pl-1 sm:pl-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-primary/14 text-primary">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-display text-base sm:text-lg font-semibold">
                  {t('dashboard.verifyPrompt')}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('dashboard.kycNotVerified')}
                </p>
              </div>
            </div>

            <Link to="/app/kyc" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto min-w-0 sm:min-w-40 bg-gradient-brand shadow-brand">
                {t('dashboard.verifyNow')}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {kycState.underReview && (
        <div className="rounded-2xl sm:rounded-3xl border border-amber-400/35 bg-gradient-to-r from-amber-500/12 via-background to-background p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-amber-500/14 text-amber-300">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-display text-base sm:text-lg font-semibold">
                  {t('dashboard.kycPendingTitle')}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('dashboard.kycPending')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <SortableDashboard widgets={widgets} />
    </div>
  );
};

export default Dashboard;