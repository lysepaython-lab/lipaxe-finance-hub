import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Eye, EyeOff, Loader2, Snowflake, XCircle, AlertTriangle, Banknote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { CardArtwork } from '@/components/cards/CardArtwork';
import {
  type UserCard,
  type RevealedCardDetails,
  useCardTransactionsQuery,
  useFreezeCardMutation,
  useMyCardsQuery,
  useRevealScarabPayCardMutation,
  useRechargeCardMutation,
  useWithdrawCardMutation,
  useTerminateScarabPayCardMutation,
  useScarabPayCardWithdrawalRequestQuery,
  useRequestScarabPayCardWithdrawalMutation,
  useSimulateScarabPayCardMutation,
} from '@/store/api/cardApi';
import { formatDate, formatMoney } from '@/lib/format';
import { toast } from 'sonner';

const apiMessage = (error: unknown, fallback: string) => {
  const data = (error as { data?: { detail?: string; message?: string; error?: string } })?.data;
  return data?.message || data?.detail || data?.error || fallback;
};

const notifyOperation = (result: { status?: string; message?: string; detail?: string; reference?: string }, success: string) => {
  if (result?.status === 'pending') {
    toast.warning(result.message || `Operation en verification fournisseur. Reference: ${result.reference || '-'}`);
    return;
  }
  toast.success(result?.message || result?.detail || success);
};

const CardDetail = () => {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const { data: cards, isLoading } = useMyCardsQuery();
  const card = useMemo(() => (cards || []).find((item) => item.id === id) || null, [cards, id]);
  const isScarabPay = card?.provider === 'scarabpay';
  const { data: cardTx } = useCardTransactionsQuery(id, { skip: !id });
  const [reveal, setReveal] = useState(false);
  const [revealedDetails, setRevealedDetails] = useState<RevealedCardDetails | null>(null);
  const [fundOpen, setFundOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('20');
  const [fundWallet, setFundWallet] = useState<string>();
  const [fundMode, setFundMode] = useState<'recharge' | 'withdraw'>('recharge');
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalWallet, setWithdrawalWallet] = useState<string>();
  const [terminationReason, setTerminationReason] = useState<'lost' | 'stolen' | 'fraud' | 'no_longer_needed' | 'other'>('no_longer_needed');
  const [rechargeCard] = useRechargeCardMutation();
  const [withdrawCard] = useWithdrawCardMutation();
  const [freezeCard] = useFreezeCardMutation();
  const [revealScarabPayCard, revealRequest] = useRevealScarabPayCardMutation();
  const [terminateScarabPayCard] = useTerminateScarabPayCardMutation();
  const [requestScarabPayCardWithdrawal, withdrawalRequestMutation] = useRequestScarabPayCardWithdrawalMutation();
  const [simulateScarabPayCard, simulationMutation] = useSimulateScarabPayCardMutation();
  const { data: withdrawalRequestData } = useScarabPayCardWithdrawalRequestQuery(id, {
    skip: !id || !isScarabPay,
    pollingInterval: isScarabPay ? 30_000 : 0,
  });
  const withdrawalRequest = withdrawalRequestData?.request;
  const withdrawalPreview = withdrawalRequestData?.preview;
  const withdrawalOpenStatus = withdrawalRequest?.status === 'pending' || withdrawalRequest?.status === 'needs_review';
  const fullCardBalanceCents = Math.round(Number(withdrawalPreview?.card_balance ?? card?.balance ?? 0) * 100);
  const enteredWithdrawalCents = Math.round(Number(withdrawalAmount || 0) * 100);
  const minimumWithdrawalCents = Math.round(Number(withdrawalPreview?.minimum_withdrawal ?? 1) * 100);
  const withdrawalFeeBps = withdrawalPreview?.withdrawal_fee_bps ?? 100;
  const estimatedWithdrawalFeeCents = Math.ceil((enteredWithdrawalCents * withdrawalFeeBps) / 10000);
  const estimatedWalletCreditCents = Math.max(0, enteredWithdrawalCents - estimatedWithdrawalFeeCents);
  const withdrawalAmountIsValid = enteredWithdrawalCents >= minimumWithdrawalCents && enteredWithdrawalCents <= fullCardBalanceCents;
  const pin = usePinGate();
  const detailsVisible = isScarabPay ? Boolean(revealedDetails) : reveal;
  const activeReveal = isScarabPay ? revealedDetails : null;
  const isFrozen = card?.status === 'frozen';
  const canMoveFunds = card?.status === 'active';

  const openFund = (mode: 'recharge' | 'withdraw') => {
    if (isFrozen) {
      const canTopUpProtectionFreeze = mode === 'recharge' && isScarabPay && card?.is_freezon_by_system;
      if (!canTopUpProtectionFreeze) {
        toast.error('Cette carte est gelée. Rechargez-la si le gel a été déclenché après un refus de solde, puis réactivez-la.');
        return;
      }
    }
    if (!canMoveFunds) {
      toast.error('Cette carte ne peut pas encore recevoir cette operation.');
      return;
    }
    setFundMode(mode);
    setFundOpen(true);
  };

  const submitFund = () => {
    if (!card || !fundWallet) {
      toast.error('Wallet requis');
      return;
    }
    if (card.status !== 'active') {
      toast.error('Cette carte doit etre active pour effectuer cette operation.');
      return;
    }
    pin.guard(async () => {
      try {
        if (fundMode === 'recharge') {
          const result = await rechargeCard({
            card_id: card.id,
            amount: Number(fundAmount),
            payment_method: 'wallet',
            wallet_id: fundWallet,
          }).unwrap();
          notifyOperation(result, 'Carte rechargee');
        } else {
          const result = await withdrawCard({ card_id: card.id, amount: Number(fundAmount), wallet_id: fundWallet }).unwrap();
          notifyOperation(result, 'Retrait effectue');
        }
        setFundOpen(false);
      } catch (error) {
        toast.error(apiMessage(error, t('common.error')));
      }
    });
  };

  const toggleFreeze = (target: UserCard) => {
    pin.guard(async () => {
      try {
        const frozen = target.status === 'frozen';
        const result = await freezeCard({ card_id: target.id, action: frozen ? 'unfreeze' : 'freeze' }).unwrap();
        notifyOperation(result, frozen ? 'Carte activee' : 'Carte gelee');
      } catch (error) {
        toast.error(apiMessage(error, t('common.error')));
      }
    });
  };

  const submitTermination = () => {
    if (!card || !isScarabPay) return;
    pin.guard(async (pinCode) => {
      try {
        if (!pinCode) return;
        const result = await terminateScarabPayCard({ card_id: card.id, reason: terminationReason, pin: pinCode }).unwrap();
        notifyOperation(result, 'Carte résiliée');
        setTerminateOpen(false);
      } catch (error) {
        toast.error(apiMessage(error, 'Impossible de résilier cette carte.'));
      }
    });
  };

  const submitCardWithdrawalRequest = () => {
    if (!card || !withdrawalWallet) {
      toast.error('Sélectionnez un wallet USD de destination.');
      return;
    }
    if (!withdrawalAmountIsValid) {
      toast.error(`Le montant doit être au moins de ${withdrawalPreview?.minimum_withdrawal ?? '1.00'} USD et ne pas dépasser le solde disponible.`);
      return;
    }
    pin.guard(async (pinCode) => {
      if (!pinCode) return;
      try {
        const result = await requestScarabPayCardWithdrawal({
          card_id: card.id,
          wallet_id: withdrawalWallet,
          amount: Number(withdrawalAmount),
          pin: pinCode,
        }).unwrap();
        toast.success(result.message || 'Votre demande a été transmise à notre équipe.');
        setWithdrawalOpen(false);
      } catch (error) {
        toast.error(apiMessage(error, 'Impossible d’envoyer la demande.'));
      }
    });
  };

  const simulateSandboxPurchase = () => {
    if (!card || card.provider_mode !== 'sandbox') return;
    pin.guard(async (pinCode) => {
      if (!pinCode) return;
      try {
        const result = await simulateScarabPayCard({
          card_id: card.id,
          type: 'purchase',
          amount: 1,
          pin: pinCode,
          merchant_name: 'Lipaxe Test Store',
        }).unwrap();
        notifyOperation(result, 'Test sandbox effectué. Actualisez les transactions pour voir le résultat.');
      } catch (error) {
        toast.error(apiMessage(error, 'La simulation sandbox a échoué.'));
      }
    });
  };

  const toggleReveal = () => {
    if (detailsVisible) {
      setReveal(false);
      setRevealedDetails(null);
      revealRequest.reset();
      return;
    }
    pin.guard(async (pinCode) => {
      if (!card) return;
      if (!isScarabPay) {
        setReveal(true);
        return;
      }
      if (!pinCode) return;
      try {
        const details = await revealScarabPayCard({ card_id: card.id, pin: pinCode }).unwrap();
        setRevealedDetails(details);
      } catch (error) {
        toast.error(apiMessage(error, 'Impossible d’afficher les détails de la carte.'));
      } finally {
        revealRequest.reset();
      }
    });
  };

  useEffect(() => {
    if (!revealedDetails) return;
    const hide = () => setRevealedDetails(null);
    const timer = window.setTimeout(hide, 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') hide();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', hide);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', hide);
    };
  }, [revealedDetails]);

  useEffect(() => {
    setReveal(false);
    setRevealedDetails(null);
    revealRequest.reset();
    // The card id is the only route value that should reset revealed data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="space-y-5">
        <Link to="/app/cards/my" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t('cards.myCards')}
        </Link>
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">Carte introuvable.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <PageHeader
        title={card.name_on_card}
        subtitle=""
        icon={<CreditCard className="h-6 w-6" />}
        actions={(
          <Link to="/app/cards/my">
            <Button variant="outline" className="rounded-2xl">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t('cards.myCards')}
            </Button>
          </Link>
        )}
      />

      <div className="grid min-w-0 gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        <div className="min-w-0 space-y-4">
          <CardArtwork
            image={card.image}
            brand={card.brand}
            name={activeReveal?.cardholder_name || card.name_on_card}
            holder={activeReveal?.cardholder_name || card.name_on_card}
            masked={activeReveal?.card_number || (reveal && card.card_number ? card.card_number : card.number_masked)}
            exp={activeReveal?.expiry || card.exp}
            balance={formatMoney(card.balance, card.currency)}
            muted={card.status === 'frozen'}
            className="mx-auto w-full max-w-[390px] lg:max-w-none"
          />
          {detailsVisible && (
            <div className="grid min-w-0 grid-cols-1 gap-3 rounded-3xl border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">CVV</div>
                <div className="font-bold">{activeReveal?.cvv || card.cvv || '---'}</div>
              </div>
              {!isScarabPay && <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Billing</div>
                <div className="truncate font-bold">{card.billing || '---'}</div>
              </div>}
            </div>
          )}
          {isScarabPay && detailsVisible && <p className="px-1 text-xs text-muted-foreground">{t('cards.revealNotice')}</p>}
        </div>

        <div className="min-w-0 space-y-4">
          <Card className="border-border/60">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Balance</div>
                  <div className="truncate font-display text-2xl font-bold sm:text-3xl">{formatMoney(card.balance, card.currency)}</div>
                </div>
                <Badge variant={card.status === 'active' ? 'default' : 'secondary'} className="capitalize">{card.status}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button variant="outline" className="min-w-0" onClick={toggleReveal} disabled={revealRequest.isLoading}>
                  {revealRequest.isLoading
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : detailsVisible ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {detailsVisible ? t('cards.hide') : t('cards.reveal')}
                </Button>
                <Button variant="outline" className="min-w-0" onClick={() => toggleFreeze(card)} disabled={card.status === 'pending' || card.status === 'inactive' || (withdrawalOpenStatus && card.status === 'frozen')}>
                  <Snowflake className="mr-2 h-4 w-4" /> {card.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                </Button>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  onClick={() => openFund('recharge')}
                  disabled={!canMoveFunds && !(isScarabPay && isFrozen && card.is_freezon_by_system)}
                >
                  Recharge
                </Button>
                {!isScarabPay && <Button variant="outline" onClick={() => openFund('withdraw')} disabled={!canMoveFunds}>
                  Withdrawal
                </Button>}
                {isScarabPay && <Button variant="outline" onClick={() => { setWithdrawalAmount(''); setWithdrawalOpen(true); }} disabled={card.status !== 'active' || withdrawalOpenStatus || !withdrawalPreview}>
                  <Banknote className="mr-2 h-4 w-4" /> {withdrawalOpenStatus ? 'Retrait en cours' : 'Retirer vers mon wallet'}
                </Button>}
                {isScarabPay && card.provider_mode === 'sandbox' && <Button variant="outline" onClick={simulateSandboxPurchase} disabled={simulationMutation.isLoading || card.status !== 'active'}>
                  {simulationMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Tester un paiement sandbox
                </Button>}
                {isScarabPay && <Button variant="destructive" onClick={() => setTerminateOpen(true)} disabled={!['active', 'frozen'].includes(card.status) || withdrawalOpenStatus}>
                  <XCircle className="mr-2 h-4 w-4" /> Terminate card
                </Button>}
              </div>
              {isScarabPay && card.provider_decline_limit > 0 && card.provider_decline_count > 0 && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                  {`Refus émetteur : ${card.provider_decline_count}/${card.provider_decline_limit}. Lipaxe gèle la carte dès un refus pour solde insuffisant. ScarabPay peut facturer certains refus répétés et fermer la carte au seuil prévu; vérifiez le solde avant de la réactiver.`}
                </div>
              )}
              {isScarabPay && isFrozen && card.is_freezon_by_system && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                  Carte gelée automatiquement après un refus pour solde insuffisant. Rechargez-la, puis réactivez-la lorsque le nouveau solde est visible. Aucun frais Lipaxe de réactivation ne s’applique à ce gel préventif.
                </div>
              )}
              {isScarabPay && Number(card.daily_limit || 0) > 0 && (
                <div className={`rounded-2xl border p-3 text-sm ${card.is_daily_limit_frozen ? 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200' : 'border-primary/20 bg-primary/5'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                    <span>Daily spending cap</span>
                    <span>{formatMoney(Number(card.daily_spend_today || 0), card.currency)} / {formatMoney(Number(card.daily_limit), card.currency)}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {card.is_daily_limit_frozen
                      ? 'Daily cap reached. The card will be reactivated automatically after the daily reset.'
                      : `${formatMoney(Number(card.daily_limit_remaining ?? card.daily_limit), card.currency)} remaining today. Lipaxe applies this cap using transaction updates reported by the issuer.`}
                  </p>
                </div>
              )}
              {isScarabPay && withdrawalRequest && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
                  <div className="font-semibold">Retrait carte · {withdrawalRequest.status === 'needs_review' ? 'vérification requise' : withdrawalRequest.status === 'pending' ? 'en cours' : withdrawalRequest.status === 'completed' ? 'terminé' : 'échoué'}</div>
                  <p className="mt-1 text-muted-foreground">
                    {withdrawalRequest.status === 'pending' && `${withdrawalRequest.amount} USD demandé. Le crédit de votre wallet attend la confirmation de ScarabPay.`}
                    {withdrawalRequest.status === 'needs_review' && 'Le montant net doit être vérifié avant tout crédit. Aucun montant n’est ajouté tant que le rapprochement n’est pas confirmé.'}
                    {withdrawalRequest.status === 'completed' && `${withdrawalRequest.credited_amount || '0.00'} USD ont été crédités sur votre wallet Lipaxe.`}
                    {withdrawalRequest.status === 'failed' && 'ScarabPay n’a pas exécuté ce retrait. Aucun crédit n’a été effectué.'}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between rounded-2xl bg-muted/45 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Snowflake className="h-4 w-4" /> Freeze status</span>
                <Switch
                  checked={card.status === 'frozen'}
                  disabled={card.status === 'pending' || card.status === 'inactive' || (withdrawalOpenStatus && card.status === 'frozen')}
                  onCheckedChange={() => toggleFreeze(card)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-2xl sm:text-3xl">Transactions</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0 space-y-2 p-4 pt-0 sm:p-5 sm:pt-0">
              {(cardTx || []).map((tx) => (
                <div key={tx.id} className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-muted/35 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{tx.description}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</div>
                  </div>
                  <span className="max-w-[96px] shrink-0 truncate text-right font-semibold tabular sm:max-w-none">{formatMoney(tx.amount, tx.currency)}</span>
                </div>
              ))}
              {(cardTx || []).length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucune transaction carte.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={fundOpen} onOpenChange={setFundOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">{fundMode === 'recharge' ? 'Recharge card' : 'Withdraw from card'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <WalletSelector label="Wallet" value={fundWallet} onChange={(walletId) => setFundWallet(walletId)} />
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" min={0} value={fundAmount} onChange={(event) => setFundAmount(event.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setFundOpen(false)}>Cancel</Button>
              <Button onClick={submitFund} className="bg-primary text-primary-foreground hover:bg-primary/90">Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Withdraw the card balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">Retrait partiel ou total, sans résilier la carte.</p>
                  <p className="mt-1 text-muted-foreground">ScarabPay facture 1 % en production, déduit du montant retiré. En sandbox, les opérations sont gratuites. Le wallet Lipaxe sera crédité uniquement après confirmation signée du montant net.</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scarabpay-withdrawal-amount">Montant à retirer (USD)</Label>
              <Input
                id="scarabpay-withdrawal-amount"
                type="number"
                inputMode="decimal"
                min={withdrawalPreview?.minimum_withdrawal ?? '1.00'}
                max={withdrawalPreview?.card_balance ?? card.balance}
                step="0.01"
                value={withdrawalAmount}
                onChange={(event) => setWithdrawalAmount(event.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">Solde disponible : {formatMoney(Number(withdrawalPreview?.card_balance ?? card.balance), 'USD')}. Minimum : {formatMoney(Number(withdrawalPreview?.minimum_withdrawal ?? 1), 'USD')}. ScarabPay limite les retraits à un par minute et par carte.</p>
            </div>
            <WalletSelector label="USD destination wallet" value={withdrawalWallet} onChange={(walletId) => setWithdrawalWallet(walletId)} filterCurrency="USD" />
            <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Card balance</span><span className="font-medium">{formatMoney(Number(withdrawalPreview?.card_balance ?? card.balance), 'USD')}</span></div>
                <div className="flex justify-between gap-4 border-t border-border pt-2"><span>Montant demandé</span><span className="font-medium">{formatMoney(enteredWithdrawalCents / 100, 'USD')}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Frais ScarabPay estimés ({withdrawalFeeBps / 100} %)</span><span>{formatMoney(estimatedWithdrawalFeeCents / 100, 'USD')}</span></div>
                <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold"><span>Crédit estimé sur le wallet</span><span>{formatMoney(estimatedWalletCreditCents / 100, 'USD')}</span></div>
                <p className="text-xs text-muted-foreground">Le montant final est celui du webhook signé ScarabPay; si le montant reçu diffère de l’estimation, Lipaxe crédite le montant confirmé et conserve le détail pour rapprochement.</p>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setWithdrawalOpen(false)}>Cancel</Button>
              <Button onClick={submitCardWithdrawalRequest} disabled={withdrawalRequestMutation.isLoading || !withdrawalWallet || !withdrawalAmountIsValid}>
                {withdrawalRequestMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue to PIN
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={terminateOpen} onOpenChange={setTerminateOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Terminate this card?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">This action cannot be undone. ScarabPay may return an eligible remaining balance after its termination fee; Lipaxe will credit it to your USD wallet after provider confirmation.</p>
            <div className="space-y-2">
              <Label htmlFor="termination-reason">Reason</Label>
              <select id="termination-reason" value={terminationReason} onChange={(event) => setTerminationReason(event.target.value as typeof terminationReason)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option value="no_longer_needed">No longer needed</option>
                <option value="lost">Lost</option>
                <option value="stolen">Stolen</option>
                <option value="fraud">Fraud concern</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setTerminateOpen(false)}>Keep card</Button>
              <Button variant="destructive" onClick={submitTermination}>Confirm termination</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default CardDetail;
