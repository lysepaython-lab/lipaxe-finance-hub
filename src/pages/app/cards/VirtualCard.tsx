import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CreditCard, Eye, EyeOff, Snowflake, Plus, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';
import {
  useCardOffersQuery,
  useMyCardsQuery,
  useCardTransactionsQuery,
  useOrderCardMutation,
  useRechargeCardMutation,
  useWithdrawCardMutation,
  useFreezeCardMutation,
} from '@/store/api/cardApi';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';

const apiMessage = (error: unknown, fallback: string) => {
  const data = (error as { data?: { detail?: string; message?: string; error?: string } })?.data;
  return data?.message || data?.detail || data?.error || fallback;
};

const notifyOperation = (result: { status?: string; message?: string; detail?: string; reference?: string }, successMessage: string) => {
  if (result?.status === 'pending') {
    toast.warning(result.message || `Operation en verification fournisseur. Reference: ${result.reference || '-'}`);
    return;
  }
  toast.success(result?.message || result?.detail || successMessage);
};

const VirtualCardVisual = ({
  brand, number, holder, exp, cvv, reveal, frozen,
}: {
  brand: 'Visa' | 'Mastercard'; number: string; holder: string; exp: string; cvv?: string; reveal: boolean; frozen?: boolean;
}) => (
  <motion.div
    whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
    transition={{ type: 'spring', stiffness: 200 }}
    className={cn(
      'relative aspect-[1.6/1] rounded-2xl bg-gradient-hero text-primary-foreground p-5 shadow-brand overflow-hidden',
      frozen && 'opacity-60 grayscale',
    )}
  >
    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
    <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-primary-foreground/10 blur-2xl" />
    <div className="relative flex justify-between items-start">
      <div>
        <span className="font-display text-lg font-bold">Lipaxe</span>
        {frozen && <Badge className="ml-2 bg-primary-foreground/30 border-0 text-primary-foreground text-[10px]">FROZEN</Badge>}
      </div>
      <span className="text-xs uppercase tracking-widest opacity-80">{brand}</span>
    </div>
    <div className="relative mt-8 font-mono text-lg tracking-[0.18em] tabular-nums">
      {reveal ? number : '•••• •••• •••• ' + number.replace(/\s/g, '').slice(-4)}
    </div>
    <div className="relative mt-5 flex items-end justify-between text-xs">
      <div>
        <div className="opacity-70">CARD HOLDER</div>
        <div className="font-semibold tracking-wide">{holder}</div>
      </div>
      <div className="text-right">
        <div className="opacity-70">EXP</div>
        <div className="font-semibold">{exp}</div>
      </div>
      {cvv !== undefined && (
        <div className="text-right">
          <div className="opacity-70">CVV</div>
          <div className="font-semibold">{reveal ? cvv : '•••'}</div>
        </div>
      )}
    </div>
  </motion.div>
);

const VirtualCard = () => {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const { data: offers } = useCardOffersQuery();
  const { data: cards, isLoading } = useMyCardsQuery();
  const [orderCard, { isLoading: ordering }] = useOrderCardMutation();
  const [rechargeCard] = useRechargeCardMutation();
  const [withdrawCard] = useWithdrawCardMutation();
  const [freezeCard] = useFreezeCardMutation();
  const pin = usePinGate();

  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const { data: cardTx } = useCardTransactionsQuery(activeCardId!, { skip: !activeCardId });

  // Order modal state
  const [orderOpen, setOrderOpen] = useState(false);
  const [offerId, setOfferId] = useState('');
  const [walletId, setWalletId] = useState<string>();
  const [funding, setFunding] = useState('50');
  const [nameOnCard, setNameOnCard] = useState((user ? `${user.firstName} ${user.lastName}` : '').toUpperCase());

  // Fund modal state
  const [fundOpen, setFundOpen] = useState(false);
  const [fundCardId, setFundCardId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('20');
  const [fundWallet, setFundWallet] = useState<string>();
  const [fundMode, setFundMode] = useState<'recharge' | 'withdraw'>('recharge');

  const selectedOffer = useMemo(() => offers?.find((o) => o.id === offerId), [offers, offerId]);

  const submitOrder = () => {
    if (!offerId || !walletId) { toast.error('Sélectionnez une offre et un portefeuille'); return; }
    pin.guard(async () => {
      try {
        const result = await orderCard({ id: offerId, amount: selectedOffer?.price || 0, name_on_card: nameOnCard, funding_amount: Number(funding), wallet_id: walletId }).unwrap();
        notifyOperation(result as { status?: string; message?: string; detail?: string; reference?: string }, t('cards.virtualCreated'));
        setOrderOpen(false);
      } catch (e) {
        toast.error(apiMessage(e, t('common.error')));
      }
    });
  };

  const submitFund = () => {
    if (!fundCardId || !fundWallet) { toast.error('Portefeuille requis'); return; }
    pin.guard(async () => {
      try {
        if (fundMode === 'recharge') {
          const result = await rechargeCard({ card_id: fundCardId, amount: Number(fundAmount), payment_method: 'wallet', wallet_id: fundWallet }).unwrap();
          notifyOperation(result, 'Carte rechargee');
        } else {
          const result = await withdrawCard({ card_id: fundCardId, amount: Number(fundAmount), wallet_id: fundWallet }).unwrap();
          notifyOperation(result, 'Retrait effectue');
        }
        setFundOpen(false);
      } catch (e) {
        toast.error(apiMessage(e, t('common.error')));
      }
    });
  };

  const toggleFreeze = (id: string, frozen: boolean) => {
    pin.guard(async () => {
      try {
        const result = await freezeCard({ card_id: id, action: frozen ? 'unfreeze' : 'freeze' }).unwrap();
        notifyOperation(result, frozen ? 'Carte activee' : 'Carte gelee');
      } catch (e) {
        toast.error(apiMessage(e, t('common.error')));
      }
    });
  };

  return (
    <div>
      <PageHeader
        title={t('nav.virtualCard')}
        subtitle={t('cards.virtualSubtitle')}
        icon={<CreditCard className="h-6 w-6" />}
        actions={<Button onClick={() => setOrderOpen(true)} className="bg-gradient-brand shadow-brand"><Plus className="mr-2 h-4 w-4" />{t('cards.create')}</Button>}
      />

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {(cards || []).map((c, idx) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className="bg-gradient-card border-border/60">
                <CardContent className="p-6 space-y-5">
                  <VirtualCardVisual
                    brand={c.brand}
                    number={c.number_masked}
                    holder={c.name_on_card}
                    exp={c.exp}
                    reveal={!!reveal[c.id]}
                    frozen={c.status === 'frozen'}
                  />
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {c.status === 'pending' ? 'verification fournisseur' : c.status}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setReveal((r) => ({ ...r, [c.id]: !r[c.id] }))}>
                      {reveal[c.id] ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {reveal[c.id] ? t('cards.hide') : t('cards.reveal')}
                    </Button>
                    <div className="flex items-center gap-2 text-sm">
                      <Snowflake className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('cards.freeze')}</span>
                      <Switch
                        checked={c.status === 'frozen'}
                        disabled={c.status === 'pending' || c.status === 'inactive'}
                        onCheckedChange={() => toggleFreeze(c.id, c.status === 'frozen')}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Solde carte</div>
                      <div className="font-display text-xl font-bold tabular">{formatMoney(c.balance, c.currency)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setFundCardId(c.id); setFundMode('recharge'); setFundOpen(true); }}>Recharger</Button>
                      <Button size="sm" variant="outline" onClick={() => { setFundCardId(c.id); setFundMode('withdraw'); setFundOpen(true); }}>Retirer</Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveCardId(activeCardId === c.id ? null : c.id)}>
                    {activeCardId === c.id ? 'Masquer' : 'Voir'} les transactions
                  </Button>
                  {activeCardId === c.id && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      {(cardTx || []).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            <div className="truncate">{tx.description}</div>
                            <Badge
                              variant={tx.status === 'completed' ? 'default' : 'secondary'}
                              className="mt-1 text-[10px] capitalize"
                            >
                              {tx.status}
                            </Badge>
                          </div>
                          <span className="shrink-0 tabular font-medium">{formatMoney(tx.amount, tx.currency)}</span>
                        </div>
                      ))}
                      {(cardTx || []).length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Aucune transaction</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {(cards || []).length === 0 && (
            <Card className="lg:col-span-2 p-12 text-center">
              <Sparkles className="h-10 w-10 mx-auto text-primary mb-3" />
              <h3 className="font-display text-xl font-bold mb-2">Aucune carte</h3>
              <p className="text-muted-foreground mb-4">Créez votre première carte virtuelle Lipaxe.</p>
              <Button onClick={() => setOrderOpen(true)} className="bg-gradient-brand shadow-brand"><Plus className="mr-2 h-4 w-4" />{t('cards.create')}</Button>
            </Card>
          )}
        </div>
      )}

      {/* Order modal */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Commander une carte virtuelle</DialogTitle>
            <DialogDescription>Choisissez une offre et financez la carte depuis votre portefeuille.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              {(offers || []).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOfferId(o.id)}
                  className={cn(
                    'rounded-xl border-2 p-3 text-left transition-colors',
                    offerId === o.id ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/40',
                  )}
                >
                  <div className="flex justify-between">
                    <span className="font-semibold">{o.name}</span>
                    <span className="text-sm tabular">{formatMoney(o.price, o.currency)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{o.description}</p>
                </button>
              ))}
            </div>
            <WalletSelector label="Portefeuille de financement" value={walletId} onChange={(id) => setWalletId(id)} />
            <div className="space-y-2">
              <Label>Nom sur la carte</Label>
              <Input value={nameOnCard} onChange={(e) => setNameOnCard(e.target.value.toUpperCase())} maxLength={26} />
            </div>
            <div className="space-y-2">
              <Label>Montant initial à charger</Label>
              <Input type="number" min={0} value={funding} onChange={(e) => setFunding(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderOpen(false)}>Annuler</Button>
            <Button onClick={submitOrder} disabled={ordering} className="bg-gradient-brand shadow-brand">
              {ordering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fund/Withdraw modal */}
      <Dialog open={fundOpen} onOpenChange={setFundOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{fundMode === 'recharge' ? 'Recharger la carte' : 'Retirer de la carte'}</DialogTitle>
            <DialogDescription>
              {fundMode === 'recharge' ? 'Transférez des fonds depuis un portefeuille vers la carte.' : 'Renvoyez les fonds de la carte vers un portefeuille.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p>
                {fundMode === 'withdraw'
                  ? 'Le wallet est credite uniquement apres confirmation Payscribe. Si le fournisseur retourne pending, on garde la transaction en verification.'
                  : 'Les fonds sont reserves avant la recharge. Si Payscribe refuse definitivement, le wallet est rembourse automatiquement.'}
              </p>
            </div>
            <WalletSelector label="Portefeuille" value={fundWallet} onChange={(id) => setFundWallet(id)} />
            <div className="space-y-2">
              <Label>Montant</Label>
              <Input type="number" min={0} value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFundOpen(false)}>Annuler</Button>
            <Button onClick={submitFund} className="bg-gradient-brand shadow-brand">Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default VirtualCard;
