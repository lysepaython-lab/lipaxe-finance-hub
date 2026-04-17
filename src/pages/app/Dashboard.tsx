import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { AccountsList } from '@/components/dashboard/AccountsList';

const Dashboard = () => {
  const { t } = useTranslation();
  const user = useAppSelector(s => s.auth.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {t('dashboard.greeting')}, {user?.firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's a snapshot of your money today.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <BalanceCard />
          <AccountsList />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <QuickActions />
          <SpendingChart />
        </div>
      </div>

      <RecentTransactions />
    </div>
  );
};

export default Dashboard;
