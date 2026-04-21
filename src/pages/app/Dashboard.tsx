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

  const hour = new Date().getHours();
  const salutation = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">{salutation}</p>
        <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight">
          {user?.firstName} <span className="text-primary">👋</span>
        </h1>
        <p className="text-muted-foreground text-sm lg:text-base">Voici un aperçu de vos finances aujourd'hui.</p>
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
