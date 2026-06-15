import { useMemo, useState } from 'react';
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
import { CardArtwork } from '@/components/cards/CardArtwork';
import {
  type UserCard,
  useCardTransactionsQuery,
  useFreezeCardMutation,
  useMyCardsQuery,
  useRechargeCardMutation,
  useWithdrawCardMutation,
} from '@/store/api/cardApi';
import { formatMoney } from '@/lib/format';
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

const MyCards = () => {
  const { t } = useTranslation();
  const { data: cards, isLoading } = useMyCardsQuery();
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const selectedCard = useMemo(
    () => (cards || []).find((card) => card.id === selectedCardId) || null,
    [cards, selectedCardId],
  );
  const { data: cardTx } = useCardTransactionsQuery(selectedCardId!, { skip: !selectedCardId });
  const [rechargeCard] = useRechargeCardMutation();
  const [withdrawCard] = useWithdrawCardMutation();
  const [freezeCard] = useFreezeCardMutation();
  const pin = usePinGate();

  const [fundOpen, setFundOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('20');
  const [fundWallet, setFundWallet] = useState<string>();
  const [fundMode, setFundMode] = useState<'recharge' | 'withdraw'>('recharge');

  const openFund = (mode: 'recharge' | 'withdraw') => {
    setFundMode(mode);
    setFundOpen(true);
  };

  const submitFund = () => {
    if (!selectedCard || !fundWallet) {
      toast.error('Wallet requis');
      return;
    }
    pin.guard(async () => {
      try {
        if (fundMode === 'recharge') {
          const result = await rechargeCard({
            card_id: selectedCard.id,
            amount: Number(fundAmount),
            payment_method: 'wallet',
            wallet_id: fundWallet,
          }).unwrap();
          notifyOperation(result, 'Carte rechargee');
        } else {
          const result = await withdrawCard({ card_id: selectedCard.id, amount: Number(fundAmount), wallet_id: fundWallet }).unwrap();
          notifyOperation(result, 'Retrait effectue');
        }
        setFundOpen(false);
      } catch (error) {
        toast.error(apiMessage(error, t('common.error')));
      }
    });
  };

  const toggleFreeze = (card: UserCard) => {
    pin.guard(async () => {
      try {
        const frozen = card.status === 'frozen';
        const result = await freezeCard({ card_id: card.id, action: frozen ? 'unfreeze' : 'freeze' }).unwrap();
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="aspect-[1.58/1] rounded-[1.65rem]" />
          <Skeleton className="aspect-[1.58/1] rounded-[1.65rem]" />
          <Skeleton className="aspect-[1.58/1] rounded-[1.65rem]" />
        </div>
      ) : (cards || []).length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(cards || []).map((card, index) => (
            <motion.button
              key={card.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => setSelectedCardId(card.id)}
              className="group relative text-left outline-none"
            >
              <CardArtwork
                image={card.image}
                brand={card.brand}
                name={card.name_on_card}
                holder={card.name_on_card}
                masked={card.number_masked}
                exp={card.exp}
                muted={card.status === 'frozen'}
                className="transition-smooth group-hover:-translate-y-1 group-hover:shadow-xl"
              />
              <Badge
                variant={card.status === 'active' ? 'default' : 'secondary'}
                className="absolute right-4 top-4 capitalize shadow-sm"
              >
                {card.status}
              </Badge>
            </motion.button>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">Aucune carte.</CardContent>
        </Card>
      )}

      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCardId(null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-3xl p-0">
          {selectedCard && (
            <>
              <DialogHeader className="border-b border-border px-5 py-4 sm:px-7">
                <DialogTitle className="font-display text-2xl">{selectedCard.name_on_card}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_0.9fr]">
                <div className="space-y-4">
                  <CardArtwork
                    image={selectedCard.image}
                    brand={selectedCard.brand}
                    name={selectedCard.name_on_card}
                    holder={selectedCard.name_on_card}
                    masked={reveal[selectedCard.id] && selectedCard.card_number ? selectedCard.card_number : selectedCard.number_masked}
                    exp={selectedCard.exp}
                    muted={selectedCard.status === 'frozen'}
                  />
                  {reveal[selectedCard.id] && (
                    <div className="grid grid-cols-2 gap-3 rounded-3xl border border-border bg-muted/30 p-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">CVV</div>
                        <div className="font-bold">{selectedCard.cvv || '---'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Billing</div>
                        <div className="truncate font-bold">{selectedCard.billing || '---'}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-border bg-card p-4">
                    <div className="text-xs text-muted-foreground">Balance</div>
                    <div className="font-display text-3xl font-bold">{formatMoney(selectedCard.balance, selectedCard.currency)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => setReveal((value) => ({ ...value, [selectedCard.id]: !value[selectedCard.id] }))}>
                      {reveal[selectedCard.id] ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {reveal[selectedCard.id] ? t('cards.hide') : t('cards.reveal')}
                    </Button>
                    <Button variant="outline" onClick={() => toggleFreeze(selectedCard)} disabled={selectedCard.status === 'pending' || selectedCard.status === 'inactive'}>
                      <Snowflake className="mr-2 h-4 w-4" />
                      {selectedCard.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                    </Button>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => openFund('recharge')}>
                      Recharge
                    </Button>
                    <Button variant="outline" onClick={() => openFund('withdraw')}>
                      Withdrawal
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-muted/45 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Snowflake className="h-4 w-4" /> Freeze status
                    </span>
                    <Switch
                      checked={selectedCard.status === 'frozen'}
                      disabled={selectedCard.status === 'pending' || selectedCard.status === 'inactive'}
                      onCheckedChange={() => toggleFreeze(selectedCard)}
                    />
                  </div>

                  <div className="rounded-3xl border border-border p-4">
                    <div className="mb-3 font-semibold">Transactions</div>
                    <div className="space-y-2">
                      {(cardTx || []).slice(0, 6).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate text-muted-foreground">{tx.description}</span>
                          <span className="font-semibold tabular">{formatMoney(tx.amount, tx.currency)}</span>
                        </div>
                      ))}
                      {(cardTx || []).length === 0 && <p className="py-2 text-center text-xs text-muted-foreground">No transaction</p>}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
