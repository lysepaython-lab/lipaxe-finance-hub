import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertTriangle, Download, ShieldCheck, Smartphone } from 'lucide-react';
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
  <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-r from-primary via-brand-700 to-brand-900 p-5 text-primary-foreground shadow-brand">
    <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
    <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/14">
          <Smartphone className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-black lg:text-3xl">Lipaxe Mobile</h1>
          <p className="mt-1 text-sm text-primary-foreground/75">PIN, biometrie, QR, NFC et wallets toujours avec vous.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-primary shadow-sm">
          <Download className="h-4 w-4" /> App Store
        </button>
        <button className="flex items-center gap-2 rounded-2xl bg-white/12 px-4 py-3 text-sm font-black text-white ring-1 ring-white/20">
          <Download className="h-4 w-4" /> Play Store
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
  const salutation = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon apres-midi' : 'Bonsoir';

  const widgets: DashboardWidget[] = [
    { id: 'balance', column: 'side', render: () => <BalanceCard /> },
    { id: 'accounts', column: 'side', render: () => <AccountsList /> },
    { id: 'actions', column: 'main', render: () => <QuickActions /> },
    { id: 'spending', column: 'main', render: () => <SpendingChart /> },
    { id: 'recent', column: 'full', render: () => <RecentTransactions /> },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="sr-only">
        {salutation} {user?.firstName}
      </div>
      <AppDownloadBanner />

      {kycState.needsVerification && (
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/12 via-background to-background px-5 py-5 shadow-sm">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-primary to-emerald-400" />
          <div className="flex flex-col gap-4 pl-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/14 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-lg font-semibold">{t('dashboard.verifyPrompt')}</p>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {t('dashboard.kycNotVerified')}
                </p>
              </div>
            </div>

            <Link to="/app/kyc" className="shrink-0">
              <Button className="min-w-40 bg-gradient-brand shadow-brand">
                {t('dashboard.verifyNow')}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {kycState.underReview && (
        <div className="rounded-3xl border border-amber-400/35 bg-gradient-to-r from-amber-500/12 via-background to-background p-5 shadow-sm">
          <div className="flex flex-col gap-4 pl-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/14 text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-lg font-semibold">
                  {t('dashboard.kycPendingTitle')}
                </p>
                <p className="max-w-2xl text-sm text-muted-foreground">
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
