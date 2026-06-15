import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Eye, EyeOff, Snowflake } from 'lucide-react';
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
  useCardTransactionsQuery,
  useFreezeCardMutation,
  useMyCardsQuery,
  useRechargeCardMutation,
  useWithdrawCardMutation,
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
  const { data: cardTx } = useCardTransactionsQuery(id, { skip: !id });
  const [reveal, setReveal] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('20');
  const [fundWallet, setFundWallet] = useState<string>();
  const [fundMode, setFundMode] = useState<'recharge' | 'withdraw'>('recharge');
  const [rechargeCard] = useRechargeCardMutation();
  const [withdrawCard] = useWithdrawCardMutation();
  const [freezeCard] = useFreezeCardMutation();
  const pin = usePinGate();

  const openFund = (mode: 'recharge' | 'withdraw') => {
    setFundMode(mode);
    setFundOpen(true);
  };

  const submitFund = () => {
    if (!card || !fundWallet) {
      toast.error('Wallet requis');
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
            name={card.name_on_card}
            holder={card.name_on_card}
            masked={reveal && card.card_number ? card.card_number : card.number_masked}
            exp={card.exp}
            muted={card.status === 'frozen'}
            className="mx-auto w-full max-w-[390px] lg:max-w-none"
          />
          {reveal && (
            <div className="grid min-w-0 grid-cols-1 gap-3 rounded-3xl border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">CVV</div>
                <div className="font-bold">{card.cvv || '---'}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Billing</div>
                <div className="truncate font-bold">{card.billing || '---'}</div>
              </div>
            </div>
          )}
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
                <Button variant="outline" className="min-w-0" onClick={() => setReveal((value) => !value)}>
                  {reveal ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {reveal ? t('cards.hide') : t('cards.reveal')}
                </Button>
                <Button variant="outline" className="min-w-0" onClick={() => toggleFreeze(card)} disabled={card.status === 'pending' || card.status === 'inactive'}>
                  <Snowflake className="mr-2 h-4 w-4" /> {card.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                </Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => openFund('recharge')}>Recharge</Button>
                <Button variant="outline" onClick={() => openFund('withdraw')}>Withdrawal</Button>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted/45 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Snowflake className="h-4 w-4" /> Freeze status</span>
                <Switch
                  checked={card.status === 'frozen'}
                  disabled={card.status === 'pending' || card.status === 'inactive'}
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

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default CardDetail;
