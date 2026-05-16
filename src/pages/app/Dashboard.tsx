import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { AccountsList } from '@/components/dashboard/AccountsList';
import { SortableDashboard, type DashboardWidget } from '@/components/dashboard/SortableDashboard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);

  const hour = new Date().getHours();
  const salutation = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon apres-midi' : 'Bonsoir';
  const kycPending = user?.kycStatus !== 'verified';

  const widgets: DashboardWidget[] = [
    { id: 'balance', column: 'side', render: () => <BalanceCard /> },
    { id: 'accounts', column: 'side', render: () => <AccountsList /> },
    { id: 'actions', column: 'main', render: () => <QuickActions /> },
    { id: 'spending', column: 'main', render: () => <SpendingChart /> },
    { id: 'recent', column: 'full', render: () => <RecentTransactions /> },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{salutation}</p>
        <h1 className="font-display text-3xl font-bold tracking-tight lg:text-4xl capitalize">
          {user?.firstName} <span className="text-primary">👋</span>
        </h1>
        <p className="text-sm text-muted-foreground lg:text-base">Voici un apercu de vos finances aujourd'hui.</p>
      </div>

      {kycPending && (
        <div
          className={cn(
            'relative overflow-hidden rounded-3xl border px-5 py-5 shadow-sm',
            user?.kycStatus === 'pending'
              ? 'border-amber-400/35 bg-gradient-to-r from-amber-500/12 via-background to-background'
              : 'border-primary/30 bg-gradient-to-r from-primary/12 via-background to-background',
          )}
        >
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-primary to-emerald-400" />
          <div className="flex flex-col gap-4 pl-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                  user?.kycStatus === 'pending' ? 'bg-amber-500/14 text-amber-300' : 'bg-primary/14 text-primary',
                )}
              >
                {user?.kycStatus === 'pending' ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-1">
                <p className="font-display text-lg font-semibold">
                  {user?.kycStatus === 'pending'
                    ? 'Votre verification KYC est en revue'
                    : t('dashboard.verifyPrompt')}
                </p>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {user?.kycStatus === 'pending'
                    ? "Votre dossier est deja envoye. L'equipe compliance doit prendre la decision finale avant que vous puissiez modifier ou renvoyer vos donnees."
                    : "Votre compte n'est pas encore verifie. Completez votre KYC maintenant pour acceder a toutes les fonctionnalites et relever vos plafonds."}
                </p>
              </div>
            </div>

            <Link to="/app/kyc" className="shrink-0">
              <Button className="min-w-40 bg-gradient-brand shadow-brand">
                {user?.kycStatus === 'pending' ? 'Voir le statut' : t('dashboard.verifyNow')}
              </Button>
            </Link>
          </div>
        </div>
      )}

      <SortableDashboard widgets={widgets} />
    </div>
  );
};

export default Dashboard;
