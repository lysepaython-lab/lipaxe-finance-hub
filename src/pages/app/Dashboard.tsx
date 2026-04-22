import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { AccountsList } from '@/components/dashboard/AccountsList';
import { SortableDashboard, type DashboardWidget } from '@/components/dashboard/SortableDashboard';

const Dashboard = () => {
  const { t } = useTranslation();
  const user = useAppSelector(s => s.auth.user);

  const hour = new Date().getHours();
  const salutation = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const widgets: DashboardWidget[] = [
    { id: 'balance',  column: 'side', render: () => <BalanceCard /> },
    { id: 'accounts', column: 'side', render: () => <AccountsList /> },
    { id: 'actions',  column: 'main', render: () => <QuickActions /> },
    { id: 'spending', column: 'main', render: () => <SpendingChart /> },
    { id: 'recent',   column: 'full', render: () => <RecentTransactions /> },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">{salutation}</p>
        <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight">
          {user?.firstName} <span className="text-primary">👋</span>
        </h1>
        <p className="text-muted-foreground text-sm lg:text-base">Voici un aperçu de vos finances aujourd'hui.</p>
      </div>

      <SortableDashboard widgets={widgets} />
    </div>
  );
};

export default Dashboard;

