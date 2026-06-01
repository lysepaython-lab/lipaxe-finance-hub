import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, PiggyBank, Loader2, ShieldCheck, CalendarClock, WalletCards, ArrowDownToLine, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { useContributeSavingsMutation, useSavingsAccountQuery, useWithdrawSavingsMutation } from '@/store/api/savingsApi';
import { formatMoney } from '@/lib/format';

const kindLabel: Record<string, string> = {
  flexible: 'Flexible',
  goal: 'Objectif',
  locked: 'Bloque',
};

const statusLabel: Record<string, string> = {
  active: 'Actif',
  paused: 'Suspendu',
  matured: 'Echu',
  closed: 'Ferme',
};

const frequencyLabel: Record<string, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
};

const isEarlySavingsExit = (account: { liquidity: string; maturity_date?: string }) =>
  account.liquidity === 'maturity' && (!account.maturity_date || new Date(account.maturity_date).getTime() > Date.now());

const SavingsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: account, isLoading } = useSavingsAccountQuery(id || '', { skip: !id });
  const [contributeSavings, { isLoading: contributing }] = useContributeSavingsMutation();
  const [withdrawSavings, { isLoading: withdrawing }] = useWithdrawSavingsMutation();
  const pin = usePinGate();

  const [openContribute, setOpenContribute] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [walletId, setWalletId] = useState<string>();
  const [amount, setAmount] = useState('');
  const [withdrawWalletId, setWithdrawWalletId] = useState<string>();
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const submitContribution = () => {
    if (!account || !walletId) {
      toast.error('Choisissez un portefeuille source.');
      return;
    }
    pin.guard(async () => {
      try {
        await contributeSavings({
          savings_id: account.id,
          wallet_id: walletId,
          amount: Number(amount || account.contribution_amount),
        }).unwrap();
        toast.success('Contribution ajoutee.');
        setOpenContribute(false);
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  const submitWithdraw = () => {
    if (!account || !withdrawWalletId) {
      toast.error(t('savings.selectDestinationWallet'));
      return;
    }
    pin.guard(async () => {
      try {
        const result = await withdrawSavings({
          savings_id: account.id,
          wallet_id: withdrawWalletId,
          amount: Number(withdrawAmount || account.current_amount),
        }).unwrap();
        const penalty = Number(result.penalty_amount || 0);
        toast.success(
          penalty > 0
            ? t('savings.withdrawDoneWithPenalty', { amount: result.net_amount, penalty: result.penalty_amount })
            : t('savings.withdrawDone'),
        );
        setOpenWithdraw(false);
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardContent className="p-8">Chargement...</CardContent></Card>
        <Card><CardContent className="p-8">Chargement...</CardContent></Card>
      </div>
    );
  }

  if (!account) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-10 text-center space-y-3">
          <h2 className="font-display text-2xl font-bold">Plan introuvable</h2>
          <Button asChild variant="outline">
            <Link to="/app/savings">Retour aux savings</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={account.name}
        subtitle={t('savings.detailSubtitle')}
        icon={<PiggyBank className="h-6 w-6" />}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/app/savings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('savings.backToSavings')}
              </Link>
            </Button>
            <Button
              variant="outline"
              disabled={account.current_amount <= 0 || account.status === 'closed'}
              onClick={() => {
                setWithdrawWalletId(account.source_wallet_id);
                setWithdrawAmount(String(account.current_amount));
                setOpenWithdraw(true);
              }}
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              {t('savings.withdraw')}
            </Button>
            <Button
              disabled={account.status === 'closed'}
              onClick={() => {
                setWalletId(account.source_wallet_id);
                setAmount(String(account.contribution_amount));
                setOpenContribute(true);
              }}
              className="bg-gradient-brand shadow-brand"
            >
              {t('savings.addContribution')}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{kindLabel[account.kind] || account.kind}</Badge>
                    <Badge variant="outline">{statusLabel[account.status] || account.status}</Badge>
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold">{account.plan_name}</h2>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('savings.savedProgress')}</span>
                  <span className="font-medium">
                    {formatMoney(account.current_amount, account.currency)} / {formatMoney(account.goal_amount, account.currency)}
                  </span>
                </div>
                <Progress value={Math.max(0, Math.min(100, account.progress_percent))} className="h-3" />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="text-xs text-muted-foreground">{t('savings.contribution')}</div>
                  <div className="mt-2 font-display text-xl font-bold">
                    {formatMoney(account.contribution_amount, account.currency)}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{frequencyLabel[account.frequency]}</div>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="text-xs text-muted-foreground">{t('savings.duration')}</div>
                  <div className="mt-2 font-display text-xl font-bold">{account.duration_months} mois</div>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="text-xs text-muted-foreground">{t('savings.nextDebit')}</div>
                  <div className="mt-2 font-display text-xl font-bold">
                    {account.next_contribution_at ? account.next_contribution_at.slice(0, 10) : '-'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-display text-xl font-bold">{t('savings.rulesAndPolicies')}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {account.rules.map((rule) => (
                  <div key={rule.title} className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="text-xs text-muted-foreground">{rule.title}</div>
                    <div className="mt-2 font-semibold">{rule.value}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                {account.policies.map((policy) => (
                  <div key={policy}>• {policy}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-display text-xl font-bold">{t('savings.controlBoard')}</h3>
              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <WalletCards className="h-4 w-4 text-primary" />
                  {t('savings.sourceWallet')}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{account.source_wallet_id}</div>
              </div>
              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  {t('savings.maturity')}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{account.maturity_date ? account.maturity_date.slice(0, 10) : '-'}</div>
              </div>
              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {t('savings.autoDebit')}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{account.auto_debit ? t('common.continue') : t('common.cancel')}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={openContribute} onOpenChange={setOpenContribute}>
        <DialogContent className="max-w-lg overflow-hidden p-0">
          <DialogHeader className="flex-row items-center justify-between bg-primary px-7 py-5 text-primary-foreground">
            <DialogTitle className="flex items-center gap-3 font-display text-2xl">
              <Plus className="h-6 w-6" /> {t('savings.addContribution')}
            </DialogTitle>
            <button onClick={() => setOpenContribute(false)} className="rounded-full p-1 text-primary-foreground/70 hover:text-primary-foreground">
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>
          <div className="grid gap-4 p-7">
            <WalletSelector
              label={t('savings.sourceWallet')}
              value={walletId}
              onChange={(nextId) => setWalletId(nextId)}
              filterCurrency={account.currency}
            />
            <div className="space-y-2">
              <Label>{t('common.amount')}</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="border-t border-border bg-background px-7 py-5">
            <Button variant="outline" onClick={() => setOpenContribute(false)} className="min-w-32 rounded-2xl">{t('common.cancel')}</Button>
            <Button onClick={submitContribution} disabled={contributing} className="min-w-40 rounded-2xl bg-primary text-primary-foreground shadow-brand hover:bg-primary/90">
              {contributing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('savings.addContribution')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openWithdraw} onOpenChange={setOpenWithdraw}>
        <DialogContent className="max-w-lg overflow-hidden p-0">
          <DialogHeader className="flex-row items-center justify-between bg-primary px-7 py-5 text-primary-foreground">
            <DialogTitle className="flex items-center gap-3 font-display text-2xl">
              <ArrowDownToLine className="h-6 w-6" /> {t('savings.withdraw')}
            </DialogTitle>
            <button onClick={() => setOpenWithdraw(false)} className="rounded-full p-1 text-primary-foreground/70 hover:text-primary-foreground">
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>
          <div className="grid gap-4 p-7">
            <WalletSelector
              label={t('savings.destinationWallet')}
              value={withdrawWalletId}
              onChange={(nextId) => setWithdrawWalletId(nextId)}
              filterCurrency={account.currency}
            />
            <div className="space-y-2">
              <Label>{t('common.amount')}</Label>
              <Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                {t('savings.withdrawAvailable', { amount: formatMoney(account.current_amount, account.currency) })}
              </p>
            </div>
            {isEarlySavingsExit(account) ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">
                {t('savings.earlyExitWarning')}
              </div>
            ) : null}
          </div>
          <DialogFooter className="border-t border-border bg-background px-7 py-5">
            <Button variant="outline" onClick={() => setOpenWithdraw(false)} className="min-w-32 rounded-2xl">{t('common.cancel')}</Button>
            <Button onClick={submitWithdraw} disabled={withdrawing} className="min-w-40 rounded-2xl bg-primary text-primary-foreground shadow-brand hover:bg-primary/90">
              {withdrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('savings.confirmWithdraw')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default SavingsDetail;
