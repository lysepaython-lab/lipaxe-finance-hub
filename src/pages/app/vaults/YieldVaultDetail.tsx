import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CalendarClock, Coins, Landmark, Loader2, ShieldAlert, Waves } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { formatMoney } from '@/lib/format';
import {
  useContributeYieldVaultMutation,
  useRedeemYieldVaultMutation,
  useYieldVaultPositionQuery,
} from '@/store/api/yieldVaultApi';

const YieldVaultDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: position, isLoading } = useYieldVaultPositionQuery(id || '', { skip: !id });
  const [contributeYieldVault, { isLoading: contributing }] = useContributeYieldVaultMutation();
  const [redeemYieldVault, { isLoading: redeeming }] = useRedeemYieldVaultMutation();
  const pin = usePinGate();

  const [openTopup, setOpenTopup] = useState(false);
  const [openRedeem, setOpenRedeem] = useState(false);
  const [walletId, setWalletId] = useState<string>();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const submitContribution = () => {
    if (!position || !walletId) {
      toast.error(t('yieldVaults.pickSourceWallet'));
      return;
    }
    pin.guard(async () => {
      try {
        await contributeYieldVault({
          position_id: position.id,
          wallet_id: walletId,
          amount: Number(amount || position.principal_amount),
        }).unwrap();
        toast.success(t('yieldVaults.topupDone'));
        setOpenTopup(false);
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  const submitRedeem = () => {
    if (!position) return;
    pin.guard(async () => {
      try {
        await redeemYieldVault({
          position_id: position.id,
          note: note.trim() || undefined,
        }).unwrap();
        toast.success(t('yieldVaults.redeemRequested'));
        setOpenRedeem(false);
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

  if (!position) {
    return (
      <Card className="border-border/60">
        <CardContent className="space-y-3 p-10 text-center">
          <h2 className="font-display text-2xl font-bold">{t('yieldVaults.notFound')}</h2>
          <Button asChild variant="outline">
            <Link to="/app/strone/vaults">{t('yieldVaults.back')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={position.name}
        subtitle={t('yieldVaults.detailSubtitle')}
        icon={<Landmark className="h-6 w-6" />}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/app/strone/vaults">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('yieldVaults.back')}
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setWalletId(position.source_wallet_id);
                setAmount(String(position.principal_amount));
                setOpenTopup(true);
              }}
            >
              {t('yieldVaults.addCapital')}
            </Button>
            <Button
              onClick={() => setOpenRedeem(true)}
              className="bg-gradient-brand shadow-brand"
              disabled={position.status !== 'active'}
            >
              {t('yieldVaults.requestRedeem')}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{position.stablecoins.join(', ')}</Badge>
                    <Badge>{t(`yieldVaults.status.${position.status}`)}</Badge>
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold">{position.plan_name}</h2>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="text-xs text-muted-foreground">{t('yieldVaults.principal')}</div>
                  <div className="mt-2 font-display text-xl font-bold">{formatMoney(position.principal_amount, position.currency)}</div>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="text-xs text-muted-foreground">{t('yieldVaults.currentValue')}</div>
                  <div className="mt-2 font-display text-xl font-bold">{formatMoney(position.current_value, position.currency)}</div>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="text-xs text-muted-foreground">{t('yieldVaults.accrued')}</div>
                  <div className="mt-2 font-display text-xl font-bold">{formatMoney(position.accrued_yield, position.currency)}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="text-xs text-muted-foreground">{t('yieldVaults.apyRange')}</div>
                  <div className="mt-2 font-semibold">{position.target_apy_min}% - {position.target_apy_max}%</div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="text-xs text-muted-foreground">{t('yieldVaults.lockDays')}</div>
                  <div className="mt-2 font-semibold">{position.lock_days} j</div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="text-xs text-muted-foreground">{t('yieldVaults.notice')}</div>
                  <div className="mt-2 font-semibold">{position.notice_period_days} j</div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="text-xs text-muted-foreground">{t('yieldVaults.yieldPercent')}</div>
                  <div className="mt-2 font-semibold">{position.yield_percent}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="space-y-4 p-5">
              <h3 className="font-display text-xl font-bold">{t('yieldVaults.rules')}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {position.rules.map((rule) => (
                  <div key={rule.title} className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="text-xs text-muted-foreground">{rule.title}</div>
                    <div className="mt-2 font-semibold">{rule.value}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                {position.policies.map((policy) => (
                  <div key={policy}>• {policy}</div>
                ))}
              </div>
              <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                {position.disclosures.map((item) => (
                  <div key={item}>• {item}</div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="space-y-4 p-5">
              <h3 className="font-display text-xl font-bold">{t('yieldVaults.ledger')}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="text-sm font-semibold">{t('yieldVaults.recentMovements')}</div>
                  {position.recent_movements?.length ? (
                    position.recent_movements.map((movement) => (
                      <div key={movement.id} className="rounded-xl bg-background/70 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">{movement.kind}</span>
                          <span>{formatMoney(movement.amount, position.currency)}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{movement.created_at?.slice(0, 10)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">{t('yieldVaults.noMovements')}</div>
                  )}
                </div>

                <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="text-sm font-semibold">{t('yieldVaults.recentDistributions')}</div>
                  {position.recent_distributions?.length ? (
                    position.recent_distributions.map((distribution) => (
                      <div key={distribution.id} className="rounded-xl bg-background/70 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">{distribution.snapshot_date || distribution.created_at?.slice(0, 10)}</span>
                          <span>{formatMoney(distribution.amount, position.currency)}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{distribution.share_percent}%</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">{t('yieldVaults.noDistributions')}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardContent className="space-y-4 p-5">
              <h3 className="font-display text-xl font-bold">{t('yieldVaults.controlBoard')}</h3>
              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  {t('yieldVaults.unlockAt')}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{position.unlock_at ? position.unlock_at.slice(0, 10) : '-'}</div>
              </div>
              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <Waves className="h-4 w-4 text-primary" />
                  {t('yieldVaults.nextRedemption')}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{position.next_redemption_at ? position.next_redemption_at.slice(0, 10) : '-'}</div>
              </div>
              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  {t('yieldVaults.reserveRatio')}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{position.reserve_ratio_percent}%</div>
              </div>
              <div className="rounded-2xl bg-muted/20 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <Coins className="h-4 w-4 text-primary" />
                  {t('yieldVaults.clientShare')}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{position.client_yield_share_percent}%</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={openTopup} onOpenChange={setOpenTopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('yieldVaults.addCapital')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <WalletSelector
              label={t('yieldVaults.sourceWallet')}
              value={walletId}
              onChange={(nextId) => setWalletId(nextId)}
              filterCurrency={position.currency}
            />
            <div className="space-y-2">
              <Label>{t('common.amount')}</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTopup(false)}>{t('common.cancel')}</Button>
            <Button onClick={submitContribution} disabled={contributing} className="bg-gradient-brand shadow-brand">
              {contributing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('yieldVaults.addCapital')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openRedeem} onOpenChange={setOpenRedeem}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('yieldVaults.requestRedeem')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              {t('yieldVaults.redeemHint', { days: position.notice_period_days })}
            </div>
            <div className="space-y-2">
              <Label>{t('yieldVaults.note')}</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={255} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenRedeem(false)}>{t('common.cancel')}</Button>
            <Button onClick={submitRedeem} disabled={redeeming} className="bg-gradient-brand shadow-brand">
              {redeeming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('yieldVaults.requestRedeem')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default YieldVaultDetail;
