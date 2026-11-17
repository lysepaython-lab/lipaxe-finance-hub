import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, ShieldAlert } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { DashboardPromotions } from '@/components/dashboard/DashboardPromotions';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { AccountsList } from '@/components/dashboard/AccountsList';
import { CurrencyBreakdown } from '@/components/dashboard/CurrencyBreakdown';
import { SortableDashboard, type DashboardWidget } from '@/components/dashboard/SortableDashboard';
import { Button } from '@/components/ui/button';
import { useGetKycDataQuery } from '@/store/api/kycApi';
import { getKycState } from '@/lib/kycStatus';

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
    { id: 'currency-breakdown', column: 'side', render: () => <CurrencyBreakdown /> },
    { id: 'actions', column: 'main', render: () => <QuickActions /> },
    { id: 'promotions', column: 'main', render: () => <DashboardPromotions /> },
    { id: 'recent', column: 'main', render: () => <RecentTransactions /> },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-3 sm:px-4 md:px-6">
      <div className="sr-only">
        {salutation} {user?.firstName}
      </div>
      
      {(kycState.needsVerification || kycState.underReview) && (
        <div
          role="status"
          className="flex flex-col gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] p-4 text-foreground shadow-sm sm:flex-row sm:items-center sm:px-5 sm:py-4"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-600">
              {kycState.underReview ? <ClipboardCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold sm:text-lg">
                {kycState.underReview
                  ? t('dashboard.kycPendingTitle')
                  : kycState.inProgress ? t('dashboard.kycInProgress') : t('kyc.navigationBannerTitle')}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                {kycState.underReview
                  ? t('dashboard.kycPending')
                  : kycState.inProgress ? t('dashboard.kycResume') : t('kyc.navigationBannerBody')}
              </p>
            </div>
          </div>
          <Link to="/app/kyc" className="w-full shrink-0 sm:w-auto">
            <Button className="w-full gap-2 bg-amber-700 text-white hover:bg-amber-800 sm:w-auto">
              {kycState.underReview
                ? t('kyc.viewStatus')
                : kycState.inProgress ? t('dashboard.kycContinue') : t('dashboard.verifyNow')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      <SortableDashboard widgets={widgets} />
    </div>
  );
};

export default Dashboard;
