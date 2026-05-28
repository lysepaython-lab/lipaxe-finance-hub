import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Apple,
  Check,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Minus,
  Plus,
  Shield,
  Snowflake,
  WalletCards,
  X,
} from 'lucide-react';
import { FaGoogle, FaMeta, FaTiktok } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { useAppSelector } from '@/store/hooks';
import {
  type CardOffer,
  useCardOffersQuery,
  useCardTransactionsQuery,
  useFreezeCardMutation,
  useMyCardsQuery,
  useOrderCardMutation,
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

const CardBrandMark = ({ brand }: { brand: 'Visa' | 'Mastercard' }) => {
  if (brand === 'Visa') return <span className="font-display text-3xl font-black italic text-[#1a4f9c]">VISA</span>;
  return (
    <span className="relative block h-12 w-20">
      <span className="absolute left-4 top-1 h-10 w-10 rounded-full bg-[#eb001b]" />
      <span className="absolute left-9 top-1 h-10 w-10 rounded-full bg-[#f79e1b] mix-blend-multiply" />
    </span>
  );
};

const CheckState = ({ enabled }: { enabled?: boolean }) =>
  enabled ? (
    <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400 text-emerald-500">
      <Check className="h-3.5 w-3.5" />
    </span>
  ) : (
    <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-white/10">
      <Minus className="h-3.5 w-3.5" />
    </span>
  );

const offerLabel = (offer: CardOffer, index: number) => {
  const type = offer.card_type?.toLowerCase() || '';
  if (type.includes('credit')) return 'Credit card';
  if (type.includes('debit')) return 'Debit card';
  return index === 2 ? 'Credit card' : index === 1 ? 'Debit card' : 'Prepaid card';
};

const offerDescription = (offer: CardOffer, index: number) =>
  offer.description ||
  [
    'Prepaid card for digital ads and online payments',
    'Debit card 3D Secure for ads and subscriptions',
    'Contactless card for Apple Pay and Google Pay',
  ][index] ||
  'Virtual card for secure online payments';

const money = (amount?: number, currency = 'USD') => formatMoney(Number(amount || 0), currency);

const OfferCard = ({
  offer,
  index,
  onCreate,
}: {
  offer: CardOffer;
  index: number;
  onCreate: (offer: CardOffer) => void;
}) => (
  <div className="flex min-h-[430px] flex-col items-center border-border/70 px-8 py-9 text-center lg:border-l first:lg:border-l-0">
    <Badge
      className={cn(
        'mb-4 rounded-full px-5 py-1 text-[11px] font-black uppercase tracking-widest',
        index === 0 && 'bg-primary text-primary-foreground',
        index === 1 && 'bg-slate-800 text-white',
        index >= 2 && 'bg-amber-800 text-white',
      )}
    >
      {offerLabel(offer, index)}
    </Badge>
    <div className="mb-5 flex h-20 w-28 items-center justify-center rounded-2xl bg-muted/70">
      <CardBrandMark brand={offer.brand} />
    </div>
    <h3 className="font-display text-2xl font-black tracking-tight">{offer.name}</h3>
    <p className="mt-3 min-h-12 max-w-xs text-sm font-medium text-muted-foreground">{offerDescription(offer, index)}</p>
    <div className="my-7">
      <div className="flex items-start justify-center font-display font-black text-6xl tracking-tight">
        <span className="mt-2 text-2xl text-primary">$</span>
        {Number(offer.creation_fixed_fee || offer.price || 0).toFixed(0)}
      </div>
      <Badge className="mt-2 bg-primary px-4 py-1 text-primary-foreground">{offer.currency}</Badge>
    </div>
    <div className="mb-6 flex flex-wrap justify-center gap-2">
      {offer.supports_3ds && (
        <Badge variant="secondary" className="gap-1.5 rounded-lg px-3 py-1">
          <Shield className="h-3.5 w-3.5" /> 3D Secure
        </Badge>
      )}
      {offer.supports_apple_pay && (
        <Badge variant="secondary" className="gap-1.5 rounded-lg px-3 py-1">
          <Apple className="h-3.5 w-3.5" /> Apple Pay
        </Badge>
      )}
      {offer.supports_google_pay && (
        <Badge variant="secondary" className="gap-1.5 rounded-lg px-3 py-1">
          <FaGoogle className="h-3.5 w-3.5" /> Google Pay
        </Badge>
      )}
    </div>
    <Button onClick={() => onCreate(offer)} className="mt-auto h-12 w-full rounded-2xl bg-primary text-primary-foreground shadow-brand hover:bg-primary/90">
      Create <Plus className="ml-2 h-4 w-4" />
    </Button>
    <p className="mt-4 text-sm font-semibold text-muted-foreground">Payscribe provider</p>
  </div>
);

const CompareRow = ({ label, values }: { label: string; values: React.ReactNode[] }) => (
  <div className="grid min-w-[760px] grid-cols-[240px_repeat(3,minmax(160px,1fr))] border-t border-border/70">
    <div className="bg-muted/35 px-6 py-5 text-sm font-bold text-muted-foreground">{label}</div>
    {values.slice(0, 3).map((value, index) => (
      <div key={index} className="border-l border-border/70 px-6 py-5 text-center text-sm font-bold">
        {value}
      </div>
    ))}
  </div>
);

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
      <span className="font-display text-lg font-black">Lipaxe</span>
      <span className="text-xs font-bold uppercase tracking-[0.2em]">{brand}</span>
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

const VirtualCard = () => {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const { data: offers, isLoading: loadingOffers } = useCardOffersQuery();
  const { data: cards, isLoading } = useMyCardsQuery();
  const [orderCard, { isLoading: ordering }] = useOrderCardMutation();
  const [rechargeCard] = useRechargeCardMutation();
  const [withdrawCard] = useWithdrawCardMutation();
  const [freezeCard] = useFreezeCardMutation();
  const pin = usePinGate();

  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const { data: cardTx } = useCardTransactionsQuery(activeCardId!, { skip: !activeCardId });

  const [orderOpen, setOrderOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<CardOffer | null>(null);
  const [walletId, setWalletId] = useState<string>();
  const [funding, setFunding] = useState('5');
  const [nameOnCard, setNameOnCard] = useState((user ? `${user.firstName} ${user.lastName}` : '').toUpperCase());

  const [fundOpen, setFundOpen] = useState(false);
  const [fundCardId, setFundCardId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('20');
  const [fundWallet, setFundWallet] = useState<string>();
  const [fundMode, setFundMode] = useState<'recharge' | 'withdraw'>('recharge');

  const visibleOffers = useMemo(() => (offers || []).slice(0, 3), [offers]);
  const issuanceFee = Number(selectedOffer?.creation_fixed_fee || selectedOffer?.price || 0);
  const initialBalance = Number(funding || 0);
  const orderTotal = issuanceFee + initialBalance;

  const openCreate = (offer: CardOffer) => {
    setSelectedOffer(offer);
    setFunding(String(offer.min_funding || 5));
    setOrderOpen(true);
  };

  const submitOrder = () => {
    if (!selectedOffer || !walletId) {
      toast.error('Selectionnez une offre et un wallet');
      return;
    }
    pin.guard(async () => {
      try {
        const result = await orderCard({
          id: selectedOffer.id,
          amount: issuanceFee,
          name_on_card: nameOnCard,
          funding_amount: initialBalance,
          wallet_id: walletId,
        }).unwrap();
        notifyOperation(result as { status?: string; message?: string; detail?: string; reference?: string }, t('cards.virtualCreated'));
        setOrderOpen(false);
      } catch (error) {
        toast.error(apiMessage(error, t('common.error')));
      }
    });
  };

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
    <div className="space-y-8">
      <PageHeader
        title={t('nav.virtualCard')}
        subtitle=""
        icon={<CreditCard className="h-6 w-6" />}
        actions={
          visibleOffers[0] && (
            <Button onClick={() => openCreate(visibleOffers[0])} className="bg-primary text-primary-foreground shadow-brand hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> {t('cards.create')}
            </Button>
          )
        }
      />

      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-elegant">
        <div className="grid lg:grid-cols-[250px_1fr]">
          <div className="flex flex-col justify-center border-b border-border/70 bg-muted/35 p-8 lg:border-b-0 lg:border-r">
            <h2 className="font-display text-2xl font-black">Compare cards</h2>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Fees, limits and payment rails.
            </p>
          </div>
          <div className="grid md:grid-cols-3">
            {loadingOffers
              ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="m-6 h-[360px] rounded-3xl" />)
              : visibleOffers.map((offer, index) => (
                  <OfferCard key={offer.id} offer={offer} index={index} onCreate={openCreate} />
                ))}
          </div>
        </div>
      </section>

      {visibleOffers.length > 0 && (
        <section className="overflow-x-auto rounded-[1.75rem] border border-border/70 bg-card shadow-sm">
          <div className="min-w-[760px] border-b border-border/70 bg-muted/35 px-6 py-4 text-sm font-black uppercase tracking-wider text-muted-foreground">
            Pricing & fees
          </div>
          <CompareRow label="Card issuance fee" values={visibleOffers.map((o) => money(o.creation_fixed_fee || o.price, o.currency))} />
          <CompareRow label="Card funding fee" values={visibleOffers.map((o) => `${o.funding_fee_percent || 2.5}%`)} />
          <CompareRow label="Settlement fee" values={visibleOffers.map((o) => (Number(o.settlement_fee || 0) === 0 ? <Badge className="bg-emerald-100 text-emerald-700">Free</Badge> : money(o.settlement_fee, o.currency)))} />
          <CompareRow label="Authorization fee" values={visibleOffers.map((o) => (o.authorization_fee ? money(o.authorization_fee, o.currency) : <Minus className="mx-auto h-4 w-4 text-muted-foreground" />))} />
          <CompareRow label="Cross-border fee" values={visibleOffers.map((o) => `${o.cross_border_fee_percent || 2.5}%`)} />
          <CompareRow label="Maintenance fee" values={visibleOffers.map((o) => money(o.monthly_fee || 1, o.currency) + '/mo')} />
          <CompareRow label="Withdrawal fee" values={visibleOffers.map((o) => `${o.withdrawal_fee_percent || 1.5}%`)} />

          <div className="min-w-[760px] border-y border-border/70 bg-muted/35 px-6 py-4 text-sm font-black uppercase tracking-wider text-muted-foreground">
            Security & payments
          </div>
          <CompareRow label="3D Secure (3DS)" values={visibleOffers.map((o) => <CheckState enabled={o.supports_3ds} />)} />
          <CompareRow label="Apple Pay" values={visibleOffers.map((o) => <CheckState enabled={o.supports_apple_pay} />)} />
          <CompareRow label="Google Pay" values={visibleOffers.map((o) => <CheckState enabled={o.supports_google_pay} />)} />
          <CompareRow label="Authentication" values={visibleOffers.map((o) => <Badge variant="secondary">{o.authentication || 'OTP'}</Badge>)} />

          <div className="min-w-[760px] border-y border-border/70 bg-muted/35 px-6 py-4 text-sm font-black uppercase tracking-wider text-muted-foreground">
            Limits & usage
          </div>
          <CompareRow label="Daily limit" values={visibleOffers.map((o) => money(o.daily_limit || 500, o.currency))} />
          <CompareRow label="Monthly limit" values={visibleOffers.map((o) => money(o.monthly_limit || 5000, o.currency))} />
          <CompareRow label="Verdict" values={['Ads & online', 'Subscriptions', 'Premium usage'].map((label) => <Badge variant="secondary">{label}</Badge>)} />
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-black">My cards</h2>
              <Badge variant="secondary">{cards?.length || 0}</Badge>
            </div>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-64 rounded-3xl" />
                <Skeleton className="h-64 rounded-3xl" />
              </div>
            ) : (cards || []).length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {(cards || []).map((card, index) => (
                  <motion.div key={card.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                    <div className="space-y-3 rounded-3xl border border-border/70 bg-background/70 p-4">
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
                        <div className="font-display text-lg font-black tabular">{money(card.balance, card.currency)}</div>
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
                          {(cardTx || []).slice(0, 4).map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between gap-3 text-sm">
                              <span className="truncate text-muted-foreground">{tx.description}</span>
                              <span className="font-semibold tabular">{money(tx.amount, tx.currency)}</span>
                            </div>
                          ))}
                          {(cardTx || []).length === 0 && <p className="py-2 text-center text-xs text-muted-foreground">No transaction</p>}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center">
                <WalletCards className="mx-auto mb-3 h-10 w-10 text-primary" />
                <Button disabled={!visibleOffers[0]} onClick={() => visibleOffers[0] && openCreate(visibleOffers[0])} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {t('cards.create')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5">
            <h2 className="font-display text-xl font-black">Works great with</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ['Meta Ads', FaMeta],
                ['Google', FaGoogle],
                ['TikTok', FaTiktok],
                ['Apple Pay', Apple],
              ].map(([label, Icon]) => (
                <div key={String(label)} className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background p-3 text-sm font-bold">
                  <Icon className="h-5 w-5 text-primary" />
                  {String(label)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden p-0">
          <DialogHeader className="flex-row items-center justify-between bg-primary px-7 py-5 text-primary-foreground">
            <DialogTitle className="flex items-center gap-3 font-display text-2xl">
              <CreditCard className="h-6 w-6" /> Create Card
            </DialogTitle>
            <button onClick={() => setOrderOpen(false)} className="rounded-full p-1 text-primary-foreground/70 hover:text-primary-foreground">
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>
          <div className="max-h-[calc(92vh-80px)] overflow-y-auto p-7">
            {selectedOffer && (
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-20 w-28 items-center justify-center rounded-2xl bg-muted">
                  <CardBrandMark brand={selectedOffer.brand} />
                </div>
                <h3 className="font-display text-2xl font-black">{selectedOffer.name}</h3>
                <p className="mt-1 font-semibold text-muted-foreground">{selectedOffer.currency}</p>
              </div>
            )}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Name on Card *</Label>
                <Input
                  value={nameOnCard}
                  onChange={(event) => setNameOnCard(event.target.value.toUpperCase())}
                  maxLength={23}
                  className="h-14 rounded-2xl text-base font-semibold"
                />
                <p className="text-sm text-muted-foreground">Latin letters only, 4-23 characters</p>
              </div>
              <div className="space-y-2">
                <Label>Initial Balance *</Label>
                <div className="flex overflow-hidden rounded-2xl border border-input">
                  <span className="flex w-14 items-center justify-center border-r border-input text-xl font-bold">$</span>
                  <Input
                    type="number"
                    min={selectedOffer?.min_funding || 0}
                    value={funding}
                    onChange={(event) => setFunding(event.target.value)}
                    className="h-14 border-0 text-base font-semibold focus-visible:ring-0"
                  />
                </div>
              </div>
              <WalletSelector label="Funding wallet" value={walletId} onChange={(id) => setWalletId(id)} />
              <div className="rounded-2xl bg-muted/50 p-5">
                <div className="flex justify-between py-1 text-muted-foreground">
                  <span>Card Issuance Fee</span>
                  <span className="font-bold text-foreground">{money(issuanceFee, selectedOffer?.currency)}</span>
                </div>
                <div className="flex justify-between py-1 text-muted-foreground">
                  <span>Initial Balance</span>
                  <span className="font-bold text-foreground">{money(initialBalance, selectedOffer?.currency)}</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-border pt-4 font-display text-2xl font-black">
                  <span>Total</span>
                  <span className="text-primary">{money(orderTotal, selectedOffer?.currency)}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-border pt-5">
                <Button variant="outline" size="lg" onClick={() => setOrderOpen(false)} className="min-w-32 rounded-2xl">
                  Cancel
                </Button>
                <Button onClick={submitOrder} disabled={ordering} size="lg" className="min-w-48 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
                  {ordering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Confirm & Create
                </Button>
              </div>
            </div>
          </div>
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

export default VirtualCard;
