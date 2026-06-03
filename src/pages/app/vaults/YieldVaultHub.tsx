import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Coins, Landmark, Loader2, ShieldAlert, Waves } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { formatMoney } from '@/lib/format';
import {
  useContributeYieldVaultMutation,
  useCreateYieldVaultMutation,
  useYieldVaultPlansQuery,
  useYieldVaultPositionsQuery,
  type YieldVaultPlan,
  type YieldVaultPosition,
} from '@/store/api/yieldVaultApi';

const modeLabel: Record<string, string> = {
  variable: 'Variable',
  projected: 'Projete',
};

const statusTone: Record<string, string> = {
  active: 'default',
  redeeming: 'secondary',
  closed: 'outline',
};

const YieldVaultHub = () => {
  const { t } = useTranslation();
  const { data: plans, isLoading: plansLoading } = useYieldVaultPlansQuery();
  const { data: positions, isLoading: positionsLoading } = useYieldVaultPositionsQuery();
  const [createYieldVault, { isLoading: creating }] = useCreateYieldVaultMutation();
  const [contributeYieldVault, { isLoading: contributing }] = useContributeYieldVaultMutation();
  const pin = usePinGate();

  const [openCreate, setOpenCreate] = useState(false);
  const [openTopup, setOpenTopup] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [principalAmount, setPrincipalAmount] = useState('100');
  const [lockDays, setLockDays] = useState('30');
  const [autoRollover, setAutoRollover] = useState(false);
  const [sourceWalletId, setSourceWalletId] = useState<string>();

  const [topupTarget, setTopupTarget] = useState<YieldVaultPosition | null>(null);
  const [topupWalletId, setTopupWalletId] = useState<string>();
  const [topupAmount, setTopupAmount] = useState('100');

  const selectedPlan = (plans || []).find((plan) => plan.id === selectedPlanId);

  useEffect(() => {
    if (!selectedPlan && plans && plans.length > 0) {
      const fallback = plans[0];
      setSelectedPlanId(fallback.id);
      setCurrency(fallback.currencies[0] || 'USD');
      setPrincipalAmount(String(fallback.suggested_contribution));
      setLockDays(String(fallback.allowed_lock_days[0] || 30));
      setAutoRollover(Boolean(fallback.auto_rollover_allowed));
      setName(fallback.name);
    }
  }, [plans, selectedPlan]);

  useEffect(() => {
    if (!selectedPlan) return;
    setCurrency(selectedPlan.currencies[0] || 'USD');
    setPrincipalAmount(String(selectedPlan.suggested_contribution));
    setLockDays(String(selectedPlan.allowed_lock_days[0] || 30));
    setAutoRollover(Boolean(selectedPlan.auto_rollover_allowed));
    setName(selectedPlan.name);
  }, [selectedPlanId]);

  const stats = useMemo(() => {
    const list = positions || [];
    return {
      principal: list.reduce((sum, item) => sum + item.principal_amount, 0),
      currentValue: list.reduce((sum, item) => sum + item.current_value, 0),
      redeemingCount: list.filter((item) => item.status === 'redeeming').length,
    };
  }, [positions]);

  const submitCreate = () => {
    if (!selectedPlan || !sourceWalletId) {
      toast.error(t('yieldVaults.pickPlanWallet'));
      return;
    }

    pin.guard(async () => {
      try {
        await createYieldVault({
          name: name.trim() || selectedPlan.name,
          plan_id: selectedPlan.id,
          currency,
          principal_amount: Number(principalAmount),
          lock_days: Number(lockDays),
          auto_rollover: autoRollover,
          source_wallet_id: sourceWalletId,
        }).unwrap();
        toast.success(t('yieldVaults.created'));
        setOpenCreate(false);
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  const submitTopup = () => {
    if (!topupTarget || !topupWalletId) {
      toast.error(t('yieldVaults.pickSourceWallet'));
      return;
    }

    pin.guard(async () => {
      try {
        await contributeYieldVault({
          position_id: topupTarget.id,
          wallet_id: topupWalletId,
          amount: Number(topupAmount),
        }).unwrap();
        toast.success(t('yieldVaults.topupDone'));
        setOpenTopup(false);
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('yieldVaults.title')}
        subtitle={t('yieldVaults.subtitle')}
        icon={<Landmark className="h-6 w-6" />}
        actions={
          <Button onClick={() => setOpenCreate(true)} className="bg-gradient-brand shadow-brand">
            <Coins className="mr-2 h-4 w-4" />
            {t('yieldVaults.open')}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t('yieldVaults.totalPrincipal')}</div>
            <div className="mt-2 font-display text-3xl font-bold">{formatMoney(stats.principal)}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t('yieldVaults.currentValue')}</div>
            <div className="mt-2 font-display text-3xl font-bold">{formatMoney(stats.currentValue)}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t('yieldVaults.pendingRedeem')}</div>
            <div className="mt-2 font-display text-3xl font-bold">{stats.redeemingCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardContent className="space-y-4 p-5">
              <div>
                <h2 className="font-display text-xl font-bold">{t('yieldVaults.available')}</h2>
              </div>

              {plansLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-48" />
                  <Skeleton className="h-48" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {(plans || []).map((plan) => (
                    <Card key={plan.id} className="border-border/60 bg-muted/20">
                      <CardContent className="space-y-4 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Badge variant="outline">{modeLabel[plan.yield_mode] || plan.yield_mode}</Badge>
                            <h3 className="mt-3 font-display text-lg font-bold">{plan.name}</h3>
                          </div>
                          <Landmark className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.headline}</p>
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{t('yieldVaults.apyRange')}</span>
                            <span className="font-medium">{plan.target_apy_min}% - {plan.target_apy_max}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{t('yieldVaults.lockDays')}</span>
                            <span className="font-medium">{plan.allowed_lock_days.join(', ')} j</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">{t('yieldVaults.stablecoins')}</span>
                            <span className="font-medium">{plan.stablecoins.join(', ')}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {plan.corridors.slice(0, 3).map((corridor) => (
                            <Badge key={corridor} variant="secondary">{corridor}</Badge>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setSelectedPlanId(plan.id);
                            setOpenCreate(true);
                          }}
                        >
                          {t('yieldVaults.choose')}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="space-y-4 p-5">
              <div>
                <h2 className="font-display text-xl font-bold">{t('yieldVaults.positions')}</h2>
              </div>

              {positionsLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-56" />
                  <Skeleton className="h-56" />
                </div>
              ) : (positions || []).length === 0 ? (
                <Card className="border-dashed border-border bg-muted/10">
                  <CardContent className="space-y-3 p-10 text-center">
                    <Landmark className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="font-display text-xl font-bold">{t('yieldVaults.emptyTitle')}</h3>
                    <p className="text-muted-foreground">{t('yieldVaults.emptyBody')}</p>
                    <Button onClick={() => setOpenCreate(true)} className="bg-gradient-brand shadow-brand">
                      {t('yieldVaults.open')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {(positions || []).map((position) => (
                    <Card key={position.id} className="border-border/60">
                      <CardContent className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Badge variant={statusTone[position.status] as 'default' | 'secondary' | 'outline'}>
                              {t(`yieldVaults.status.${position.status}`)}
                            </Badge>
                            <h3 className="mt-3 font-display text-lg font-bold">{position.name}</h3>
                          </div>
                          <Badge variant="outline">{position.stablecoins.join(', ')}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-xl bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">{t('yieldVaults.principal')}</div>
                            <div className="mt-1 font-semibold">{formatMoney(position.principal_amount, position.currency)}</div>
                          </div>
                          <div className="rounded-xl bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">{t('yieldVaults.accrued')}</div>
                            <div className="mt-1 font-semibold">{formatMoney(position.accrued_yield, position.currency)}</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">{position.lock_days} j</Badge>
                          <Badge variant="outline">{position.notice_period_days} j {t('yieldVaults.notice')}</Badge>
                          <Badge variant="outline">{position.corridors.join(', ')}</Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setTopupTarget(position);
                              setTopupWalletId(position.source_wallet_id);
                              setTopupAmount(String(position.principal_amount));
                              setOpenTopup(true);
                            }}
                          >
                            {t('yieldVaults.addCapital')}
                          </Button>
                          <Button asChild className="flex-1 bg-gradient-brand shadow-brand">
                            <Link to={`/app/strone/vaults/${position.id}`}>
                              {t('yieldVaults.view')}
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
            <CardContent className="space-y-4 p-5">
              <h2 className="font-display text-xl font-bold">{t('yieldVaults.guardrails')}</h2>
              <div className="space-y-3">
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4 text-primary" />{t('yieldVaults.guardrailRisk')}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{t('yieldVaults.guardrailRiskBody')}</p>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="flex items-center gap-2 font-semibold"><Waves className="h-4 w-4 text-primary" />{t('yieldVaults.guardrailLiquidity')}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{t('yieldVaults.guardrailLiquidityBody')}</p>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="flex items-center gap-2 font-semibold"><Coins className="h-4 w-4 text-primary" />{t('yieldVaults.guardrailUse')}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{t('yieldVaults.guardrailUseBody')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden rounded-[2rem] border-0 p-0 shadow-2xl">
          <DialogHeader className="bg-primary px-6 py-5 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-2xl">{t('yieldVaults.open')}</DialogTitle>
                <p className="mt-1 text-sm text-primary-foreground/75">{selectedPlan?.name || t('yieldVaults.plan')}</p>
              </div>
            </div>
          </DialogHeader>
          <div className="max-h-[calc(92vh-10rem)] space-y-5 overflow-y-auto px-6 py-5">
            {selectedPlan && (
              <div className="rounded-3xl border border-primary/15 bg-primary/5 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-xs text-muted-foreground">{t('yieldVaults.apyRange')}</div>
                    <div className="font-display text-xl font-bold">{selectedPlan.apy_min}% - {selectedPlan.apy_max}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t('yieldVaults.lockDays')}</div>
                    <div className="font-display text-xl font-bold">{lockDays} j</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t('yieldVaults.principal')}</div>
                    <div className="font-display text-xl font-bold">{formatMoney(Number(principalAmount || 0), currency)}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t('yieldVaults.plan')}</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(plans || []).map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('yieldVaults.positionName')}</Label>
              <Input className="h-12 rounded-2xl" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t('yieldVaults.currency')}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(selectedPlan?.currencies || ['USD']).map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('yieldVaults.principal')}</Label>
                <Input className="h-12 rounded-2xl text-lg font-semibold" type="number" value={principalAmount} onChange={(e) => setPrincipalAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('yieldVaults.lockDays')}</Label>
                <Select value={lockDays} onValueChange={setLockDays}>
                  <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(selectedPlan?.allowed_lock_days || [30]).map((value) => (
                      <SelectItem key={value} value={String(value)}>{value} jours</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <WalletSelector label={t('yieldVaults.sourceWallet')} value={sourceWalletId} onChange={(id) => setSourceWalletId(id)} filterCurrency={currency} />

            <div className="flex items-center justify-between rounded-3xl border border-border bg-muted/20 p-4">
              <div>
                <div className="font-medium">{t('yieldVaults.autoRollover')}</div>
                <p className="text-sm text-muted-foreground">{t('yieldVaults.autoRolloverHint')}</p>
              </div>
              <Switch checked={autoRollover} onCheckedChange={setAutoRollover} disabled={!selectedPlan?.auto_rollover_allowed} />
            </div>

            {selectedPlan && (
              <div className="space-y-3 rounded-3xl border border-border bg-muted/20 p-4">
                <div className="font-semibold">{t('yieldVaults.rules')}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedPlan.rules.map((rule) => (
                    <div key={rule.title} className="rounded-2xl bg-background/70 p-3 text-sm">
                      <div className="text-xs text-muted-foreground">{rule.title}</div>
                      <div className="mt-1 font-medium">{rule.value}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {selectedPlan.disclosures.map((item) => (
                    <div key={item}>• {item}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="border-t bg-background px-6 py-4">
            <Button variant="outline" className="h-12 rounded-2xl px-6" onClick={() => setOpenCreate(false)}>{t('common.cancel')}</Button>
            <Button onClick={submitCreate} disabled={creating} className="h-12 rounded-2xl bg-primary px-6 shadow-brand hover:bg-primary/90">
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('yieldVaults.open')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openTopup} onOpenChange={setOpenTopup}>
        <DialogContent className="max-w-md overflow-hidden rounded-[2rem] border-0 p-0 shadow-2xl">
          <DialogHeader className="bg-primary px-6 py-5 text-primary-foreground">
            <DialogTitle className="text-2xl">{t('yieldVaults.addCapital')}</DialogTitle>
            <p className="text-sm text-primary-foreground/75">{topupTarget?.name}</p>
          </DialogHeader>
          <div className="grid gap-5 px-6 py-5">
            {topupTarget && (
              <div className="rounded-3xl border border-primary/15 bg-primary/5 p-4">
                <div className="text-xs text-muted-foreground">{t('yieldVaults.currentValue')}</div>
                <div className="font-display text-2xl font-bold">{formatMoney(Number(topupTarget.current_value || 0), topupTarget.currency)}</div>
              </div>
            )}
            <WalletSelector
              label={t('yieldVaults.sourceWallet')}
              value={topupWalletId}
              onChange={(id) => setTopupWalletId(id)}
              filterCurrency={topupTarget?.currency}
            />
            <div className="space-y-2">
              <Label>{t('common.amount')}</Label>
              <Input className="h-12 rounded-2xl text-lg font-semibold" type="number" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="border-t bg-background px-6 py-4">
            <Button variant="outline" className="h-12 rounded-2xl px-6" onClick={() => setOpenTopup(false)}>{t('common.cancel')}</Button>
            <Button onClick={submitTopup} disabled={contributing} className="h-12 rounded-2xl bg-primary px-6 shadow-brand hover:bg-primary/90">
              {contributing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('yieldVaults.addCapital')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default YieldVaultHub;
