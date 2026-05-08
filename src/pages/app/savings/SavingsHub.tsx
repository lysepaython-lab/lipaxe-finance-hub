import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PiggyBank, Plus, ShieldCheck, TimerReset, WalletCards, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import {
  useContributeSavingsMutation,
  useCreateSavingsMutation,
  useSavingsAccountsQuery,
  useSavingsPlansQuery,
  type SavingsAccount,
  type SavingsFrequency,
} from '@/store/api/savingsApi';
import { formatMoney } from '@/lib/format';

const frequencyLabel: Record<SavingsFrequency, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
};

const kindTone: Record<string, string> = {
  flexible: 'bg-brand-500/10 text-brand-700 dark:text-brand-300',
  goal: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  locked: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
};

const SavingsHub = () => {
  const { t } = useTranslation();
  const { data: plans, isLoading: plansLoading } = useSavingsPlansQuery();
  const { data: accounts, isLoading: accountsLoading } = useSavingsAccountsQuery();
  const [createSavings, { isLoading: creating }] = useCreateSavingsMutation();
  const [contributeSavings, { isLoading: contributing }] = useContributeSavingsMutation();
  const pin = usePinGate();

  const [openCreate, setOpenCreate] = useState(false);
  const [openContribute, setOpenContribute] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [goalAmount, setGoalAmount] = useState('500');
  const [contributionAmount, setContributionAmount] = useState('25');
  const [durationMonths, setDurationMonths] = useState('6');
  const [frequency, setFrequency] = useState<SavingsFrequency>('weekly');
  const [autoDebit, setAutoDebit] = useState(true);
  const [sourceWalletId, setSourceWalletId] = useState<string>();

  const [contributeTarget, setContributeTarget] = useState<SavingsAccount | null>(null);
  const [contributeWalletId, setContributeWalletId] = useState<string>();
  const [contributeAmount, setContributeAmount] = useState('25');

  const selectedPlan = (plans || []).find((plan) => plan.id === selectedPlanId);

  useEffect(() => {
    if (!selectedPlan && plans && plans.length > 0) {
      const fallback = plans[0];
      setSelectedPlanId(fallback.id);
      setCurrency(fallback.currencies[0] || 'USD');
      setContributionAmount(String(fallback.suggested_contribution));
      setGoalAmount(String(Math.max(fallback.suggested_contribution * 8, 250)));
      setDurationMonths(String(fallback.allowed_durations_months[0] || 3));
      setFrequency(fallback.frequencies[0] || 'weekly');
      setName(fallback.name);
    }
  }, [plans, selectedPlan]);

  useEffect(() => {
    if (!selectedPlan) return;
    setCurrency(selectedPlan.currencies[0] || currency);
    setContributionAmount(String(selectedPlan.suggested_contribution));
    setGoalAmount(String(Math.max(selectedPlan.suggested_contribution * 8, 250)));
    setDurationMonths(String(selectedPlan.allowed_durations_months[0] || 3));
    setFrequency(selectedPlan.frequencies[0] || 'weekly');
    setName(selectedPlan.name);
  }, [selectedPlanId]);

  const stats = useMemo(() => {
    const list = accounts || [];
    const totalSaved = list.reduce((sum, item) => sum + item.current_amount, 0);
    const committedMonthly = list.reduce((sum, item) => {
      if (item.frequency === 'daily') return sum + item.contribution_amount * 30;
      if (item.frequency === 'weekly') return sum + item.contribution_amount * 4;
      return sum + item.contribution_amount;
    }, 0);
    return {
      totalSaved,
      activeCount: list.filter((item) => item.status === 'active').length,
      committedMonthly,
    };
  }, [accounts]);

  const submitCreate = () => {
    if (!selectedPlan || !sourceWalletId) {
      toast.error('Choisissez un plan et un portefeuille source.');
      return;
    }
    pin.guard(async () => {
      try {
        await createSavings({
          name: name.trim() || selectedPlan.name,
          plan_id: selectedPlan.id,
          currency,
          goal_amount: Number(goalAmount),
          contribution_amount: Number(contributionAmount),
          duration_months: Number(durationMonths),
          frequency,
          auto_debit: autoDebit,
          source_wallet_id: sourceWalletId,
        }).unwrap();
        toast.success('Plan d epargne ouvert.');
        setOpenCreate(false);
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  const submitContribute = () => {
    if (!contributeTarget || !contributeWalletId) {
      toast.error('Selectionnez un portefeuille pour contribuer.');
      return;
    }
    pin.guard(async () => {
      try {
        await contributeSavings({
          savings_id: contributeTarget.id,
          wallet_id: contributeWalletId,
          amount: Number(contributeAmount),
        }).unwrap();
        toast.success('Contribution enregistree.');
        setOpenContribute(false);
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.savings')}
        subtitle={t('savings.subtitle')}
        icon={<PiggyBank className="h-6 w-6" />}
        actions={
          <Button onClick={() => setOpenCreate(true)} className="bg-gradient-brand shadow-brand">
            <Plus className="mr-2 h-4 w-4" />
            {t('savings.openPlan')}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t('savings.totalSaved')}</div>
            <div className="mt-2 font-display text-3xl font-bold">{formatMoney(stats.totalSaved)}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t('savings.activePlans')}</div>
            <div className="mt-2 font-display text-3xl font-bold">{stats.activeCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t('savings.monthlyCommitment')}</div>
            <div className="mt-2 font-display text-3xl font-bold">{formatMoney(stats.committedMonthly)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold">{t('savings.availablePlans')}</h2>
                  <p className="text-sm text-muted-foreground">{t('savings.availablePlansHint')}</p>
                </div>
              </div>

              {plansLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-48" />
                  <Skeleton className="h-48" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {(plans || []).map((plan) => (
                    <Card key={plan.id} className="border-border/60 bg-muted/20">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${kindTone[plan.kind] || kindTone.flexible}`}>
                              {t(`savings.kind.${plan.kind}`)}
                            </div>
                            <h3 className="mt-3 font-display text-lg font-bold">{plan.name}</h3>
                          </div>
                          <PiggyBank className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.headline}</p>
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{t('savings.minContribution')}</span>
                            <span className="font-medium">{formatMoney(plan.min_contribution, plan.currencies[0] || 'USD')}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{t('savings.duration')}</span>
                            <span className="font-medium">{plan.allowed_durations_months.join(', ')} mois</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{t('savings.liquidity')}</span>
                            <span className="font-medium">
                              {plan.liquidity === 'on_demand' ? t('savings.liquidityOnDemand') : t('savings.liquidityMaturity')}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setSelectedPlanId(plan.id);
                            setOpenCreate(true);
                          }}
                        >
                          {t('savings.choosePlan')}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-5 space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold">{t('savings.mySavings')}</h2>
                <p className="text-sm text-muted-foreground">{t('savings.mySavingsHint')}</p>
              </div>

              {accountsLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-56" />
                  <Skeleton className="h-56" />
                </div>
              ) : (accounts || []).length === 0 ? (
                <Card className="border-dashed border-border bg-muted/10">
                  <CardContent className="p-10 text-center">
                    <PiggyBank className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-4 font-display text-xl font-bold">{t('savings.emptyTitle')}</h3>
                    <p className="mt-2 text-muted-foreground">{t('savings.emptyBody')}</p>
                    <Button onClick={() => setOpenCreate(true)} className="mt-5 bg-gradient-brand shadow-brand">
                      {t('savings.openPlan')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {(accounts || []).map((account) => (
                    <Card key={account.id} className="border-border/60">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${kindTone[account.kind] || kindTone.flexible}`}>
                              {t(`savings.kind.${account.kind}`)}
                            </div>
                            <h3 className="mt-3 font-display text-lg font-bold">{account.name}</h3>
                          </div>
                          <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                            {t(`savings.status.${account.status}`)}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('savings.savedProgress')}</span>
                            <span className="font-medium">
                              {formatMoney(account.current_amount, account.currency)} / {formatMoney(account.goal_amount, account.currency)}
                            </span>
                          </div>
                          <Progress value={Math.max(0, Math.min(100, account.progress_percent))} className="h-2.5" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-xl bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">{t('savings.contribution')}</div>
                            <div className="mt-1 font-semibold">
                              {formatMoney(account.contribution_amount, account.currency)} / {frequencyLabel[account.frequency]}
                            </div>
                          </div>
                          <div className="rounded-xl bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">{t('savings.maturity')}</div>
                            <div className="mt-1 font-semibold">{account.maturity_date ? account.maturity_date.slice(0, 10) : '-'}</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {account.rules.slice(0, 3).map((rule) => (
                            <Badge key={rule.title} variant="outline" className="font-normal">
                              {rule.title}: {rule.value}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setContributeTarget(account);
                              setContributeWalletId(account.source_wallet_id);
                              setContributeAmount(String(account.contribution_amount));
                              setOpenContribute(true);
                            }}
                          >
                            {t('savings.addContribution')}
                          </Button>
                          <Button asChild className="flex-1 bg-gradient-brand shadow-brand">
                            <Link to={`/app/savings/${account.id}`}>
                              {t('savings.viewPlan')}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardContent className="p-5 space-y-4">
              <h2 className="font-display text-xl font-bold">{t('savings.policyBoard')}</h2>
              <div className="space-y-3">
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />{t('savings.policyCapital')}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{t('savings.policyCapitalBody')}</p>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="flex items-center gap-2 font-semibold"><TimerReset className="h-4 w-4 text-primary" />{t('savings.policyDuration')}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{t('savings.policyDurationBody')}</p>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="flex items-center gap-2 font-semibold"><WalletCards className="h-4 w-4 text-primary" />{t('savings.policyFunding')}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{t('savings.policyFundingBody')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('savings.openPlan')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>{t('savings.plan')}</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(plans || []).map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('savings.planName')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('savings.currency')}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(selectedPlan?.currencies || ['USD']).map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('savings.frequency')}</Label>
                <Select value={frequency} onValueChange={(value) => setFrequency(value as SavingsFrequency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(selectedPlan?.frequencies || ['weekly']).map((item) => (
                      <SelectItem key={item} value={item}>{frequencyLabel[item]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t('savings.goalAmount')}</Label>
                <Input type="number" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('savings.contribution')}</Label>
                <Input type="number" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('savings.duration')}</Label>
                <Select value={durationMonths} onValueChange={setDurationMonths}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(selectedPlan?.allowed_durations_months || [3]).map((month) => (
                      <SelectItem key={month} value={String(month)}>{month} mois</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <WalletSelector label={t('savings.sourceWallet')} value={sourceWalletId} onChange={(id) => setSourceWalletId(id)} filterCurrency={currency} />

            <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4">
              <div>
                <div className="font-medium">{t('savings.autoDebit')}</div>
                <p className="text-sm text-muted-foreground">{t('savings.autoDebitHint')}</p>
              </div>
              <Switch
                checked={autoDebit}
                onCheckedChange={setAutoDebit}
                disabled={!selectedPlan?.auto_debit_allowed}
              />
            </div>

            {selectedPlan && (
              <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                <div className="font-semibold">{t('savings.rulesAndPolicies')}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedPlan.rules.map((rule) => (
                    <div key={rule.title} className="rounded-xl bg-background/70 p-3 text-sm">
                      <div className="text-xs text-muted-foreground">{rule.title}</div>
                      <div className="mt-1 font-medium">{rule.value}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {selectedPlan.policies.map((policy) => (
                    <div key={policy}>• {policy}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>{t('common.cancel')}</Button>
            <Button onClick={submitCreate} disabled={creating} className="bg-gradient-brand shadow-brand">
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('savings.openPlan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openContribute} onOpenChange={setOpenContribute}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('savings.addContribution')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <WalletSelector
              label={t('savings.sourceWallet')}
              value={contributeWalletId}
              onChange={(id) => setContributeWalletId(id)}
              filterCurrency={contributeTarget?.currency}
            />
            <div className="space-y-2">
              <Label>{t('common.amount')}</Label>
              <Input type="number" value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenContribute(false)}>{t('common.cancel')}</Button>
            <Button onClick={submitContribute} disabled={contributing} className="bg-gradient-brand shadow-brand">
              {contributing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('savings.addContribution')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default SavingsHub;
