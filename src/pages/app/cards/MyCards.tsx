import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Eye, EyeOff, Snowflake } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import {
  useCardTransactionsQuery,
  useFreezeCardMutation,
  useMyCardsQuery,
  useRechargeCardMutation,
  useWithdrawCardMutation,
} from '@/store/api/cardApi';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
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

const UserCardVisual = ({
  brand,
  number,
  holder,
  exp,
  reveal,
  frozen,
}: {
  brand: 'Visa' | 'Mastercard';
  number: string;
  holder: string;
  exp: string;
  reveal: boolean;
  frozen?: boolean;
}) => (
  <div className={cn('relative overflow-hidden rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-brand', frozen && 'grayscale')}>
    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
    <div className="flex items-center justify-between">
      <span className="font-display text-lg font-bold">Lipaxe</span>
      <span className="text-xs font-semibold tracking-[0.12em]">{brand}</span>
    </div>
    <div className="mt-8 font-mono text-lg tracking-[0.18em]">
      {reveal ? number : `**** **** **** ${number.replace(/\s/g, '').slice(-4) || '0000'}`}
    </div>
    <div className="mt-7 flex items-end justify-between text-xs">
      <div>
        <div className="opacity-70">CARD HOLDER</div>
        <div className="font-bold">{holder}</div>
      </div>
      <div className="text-right">
        <div className="opacity-70">EXP</div>
        <div className="font-bold">{exp}</div>
      </div>
    </div>
  </div>
);

const MyCards = () => {
  const { t } = useTranslation();
  const { data: cards, isLoading } = useMyCardsQuery();
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const { data: cardTx } = useCardTransactionsQuery(activeCardId!, { skip: !activeCardId });
  const [rechargeCard] = useRechargeCardMutation();
  const [withdrawCard] = useWithdrawCardMutation();
  const [freezeCard] = useFreezeCardMutation();
  const pin = usePinGate();

  const [fundOpen, setFundOpen] = useState(false);
  const [fundCardId, setFundCardId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('20');
  const [fundWallet, setFundWallet] = useState<string>();
  const [fundMode, setFundMode] = useState<'recharge' | 'withdraw'>('recharge');

  const submitFund = () => {
    if (!fundCardId || !fundWallet) {
      toast.error('Wallet requis');
      return;
    }
    pin.guard(async () => {
      try {
        if (fundMode === 'recharge') {
          const result = await rechargeCard({
            card_id: fundCardId,
            amount: Number(fundAmount),
            payment_method: 'wallet',
            wallet_id: fundWallet,
          }).unwrap();
          notifyOperation(result, 'Carte rechargee');
        } else {
          const result = await withdrawCard({ card_id: fundCardId, amount: Number(fundAmount), wallet_id: fundWallet }).unwrap();
          notifyOperation(result, 'Retrait effectue');
        }
        setFundOpen(false);
      } catch (error) {
        toast.error(apiMessage(error, t('common.error')));
      }
    });
  };

  const toggleFreeze = (id: string, frozen: boolean) => {
    pin.guard(async () => {
      try {
        const result = await freezeCard({ card_id: id, action: frozen ? 'unfreeze' : 'freeze' }).unwrap();
        notifyOperation(result, frozen ? 'Carte activee' : 'Carte gelee');
      } catch (error) {
        toast.error(apiMessage(error, t('common.error')));
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('cards.myCards')} subtitle="" icon={<CreditCard className="h-6 w-6" />} />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      ) : (cards || []).length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(cards || []).map((card, index) => (
            <motion.div key={card.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Card className="border-border/60 bg-gradient-card shadow-sm">
                <CardContent className="space-y-3 p-4">
                  <UserCardVisual
                    brand={card.brand}
                    number={card.number_masked}
                    holder={card.name_on_card}
                    exp={card.exp}
                    reveal={!!reveal[card.id]}
                    frozen={card.status === 'frozen'}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant={card.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {card.status}
                    </Badge>
                    <div className="font-display text-lg font-bold tabular">{formatMoney(card.balance, card.currency)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setReveal((value) => ({ ...value, [card.id]: !value[card.id] }))}>
                      {reveal[card.id] ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {reveal[card.id] ? t('cards.hide') : t('cards.reveal')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setActiveCardId(activeCardId === card.id ? null : card.id)}>
                      Transactions
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => {
                        setFundCardId(card.id);
                        setFundMode('recharge');
                        setFundOpen(true);
                      }}
                    >
                      Recharge
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFundCardId(card.id);
                        setFundMode('withdraw');
                        setFundOpen(true);
                      }}
                    >
                      Withdrawal
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-muted/45 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Snowflake className="h-4 w-4" /> Freeze
                    </span>
                    <Switch
                      checked={card.status === 'frozen'}
                      disabled={card.status === 'pending' || card.status === 'inactive'}
                      onCheckedChange={() => toggleFreeze(card.id, card.status === 'frozen')}
                    />
                  </div>
                  {activeCardId === card.id && (
                    <div className="space-y-2 border-t border-border pt-3">
                      {(cardTx || []).slice(0, 5).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate text-muted-foreground">{tx.description}</span>
                          <span className="font-semibold tabular">{formatMoney(tx.amount, tx.currency)}</span>
                        </div>
                      ))}
                      {(cardTx || []).length === 0 && <p className="py-2 text-center text-xs text-muted-foreground">No transaction</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">Aucune carte.</CardContent>
        </Card>
      )}

      <Dialog open={fundOpen} onOpenChange={setFundOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {fundMode === 'recharge' ? 'Recharge card' : 'Withdraw from card'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <WalletSelector label="Wallet" value={fundWallet} onChange={(id) => setFundWallet(id)} />
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" min={0} value={fundAmount} onChange={(event) => setFundAmount(event.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setFundOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitFund} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default MyCards;
