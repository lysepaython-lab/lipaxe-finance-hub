import { useMemo, useState } from 'react';
import { Apple, Check, CreditCard, Gift, Loader2, Minus, Plus, Shield, Wallet, X } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { CardArtwork } from '@/components/cards/CardArtwork';
import { useAppSelector } from '@/store/hooks';
import { type CardOffer, useCardOffersQuery, useOrderCardMutation, useScarabPayKycStatusQuery } from '@/store/api/cardApi';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Gestion des erreurs API avec fallback
const apiMessage = (error: unknown, fallback: string) => {
  const data = (error as { data?: { detail?: string; message?: string; error?: string } })?.data;
  return data?.message || data?.detail || data?.error || fallback;
};

// État visuel pour les fonctionnalités (activé/désactivé)
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

// Labels des offres selon le type ou l'index
const offerLabel = (offer: CardOffer, index: number) => {
  if (offer.name.toLowerCase().includes('starter')) return 'Visa Starter';
  if (offer.name.toLowerCase().includes('contactless')) return 'Visa Contactless';
  if (offer.name.toLowerCase().includes('business')) return 'Visa Business';
  const type = offer.card_type?.toLowerCase() || '';
  if (type.includes('credit')) return 'Credit card';
  if (type.includes('debit')) return 'Debit card';
  return index === 2 ? 'Credit card' : index === 1 ? 'Debit card' : 'Prepaid card';
};

// Descriptions des offres
const offerDescription = (offer: CardOffer, index: number) =>
  offer.description ||
  ['A Visa card for online payments and subscriptions.', 'A Visa card for online and contactless payments.', 'A Visa card for business-related online spending.'][index] ||
  'Virtual card for secure online payments';

// Formatage des montants
const money = (amount?: number, currency = 'USD') => formatMoney(Number(amount || 0), currency);

const EmptyValue = () => <Minus className="mx-auto h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />;

const moneyOrDash = (amount: number | undefined, currency = 'USD') =>
  amount === undefined ? <EmptyValue /> : money(amount, currency);

const percentOrDash = (amount: number | undefined) =>
  amount === undefined ? <EmptyValue /> : `${amount}%`;

const cardFundingFee = (offer: CardOffer) => {
  const fixed = Math.max(offer.funding_fixed_fee || 0, offer.live_funding_fixed_fee || 0);
  const percentage = Math.max(offer.funding_fee_percent || 0, offer.live_funding_percentage_fee || 0);
  const minimum = Math.max(offer.funding_minimum_fee || 0, offer.live_funding_minimum_fee || 0);
  if (!fixed && !percentage && !offer.lipaxe_fee_percent) return <EmptyValue />;
  return `${money(fixed, offer.currency)} + ${percentage}% (min. ${money(minimum, offer.currency)}) + Lipaxe ${offer.lipaxe_fee_percent || 0}%`;
};

const providerFee = (fixed: number, percentage: number, minimum: number, amount: number) =>
  Math.max(minimum, fixed + amount * percentage / 100);

// Composant de carte d'offre (responsive)
const OfferCard = ({ offer, index, onCreate }: { offer: CardOffer; index: number; onCreate: (offer: CardOffer) => void }) => (
  <div className="flex min-h-[410px] flex-col items-center border-border/70 px-4 sm:px-6 md:px-8 py-6 sm:py-9 text-center border-b last:border-b-0 md:border-b-0 lg:border-l first:lg:border-l-0">
    <Badge
      className={cn(
        'mb-4 rounded-full px-3 sm:px-4 py-1 text-[10px] sm:text-[11px] font-semibold',
        index === 0 && 'bg-primary text-primary-foreground',
        index === 1 && 'bg-slate-800 text-white',
        index >= 2 && 'bg-amber-800 text-white',
      )}
    >
      {offerLabel(offer, index)}
    </Badge>
    <div className="mb-5 w-full max-w-[260px]">
      <CardArtwork
        image={offer.image}
        brand={offer.brand}
        name={offer.name}
        masked="LIPAXE VIRTUAL"
        className="shadow-sm"
      />
    </div>
    <p className="min-h-8 max-w-xs text-xs sm:text-sm text-muted-foreground text-center px-2">
      {offerDescription(offer, index)}
    </p>
    <div className="my-5 sm:my-7">
      <div className="flex items-start justify-center font-display text-3xl sm:text-5xl font-bold tracking-tight">
        <span className="mt-1 sm:mt-2 text-xl sm:text-2xl text-primary">$</span>
      {Number(offer.price || 0).toFixed(2)}
      </div>
      <Badge className="mt-2 bg-primary px-3 sm:px-4 py-1 text-primary-foreground text-[10px] sm:text-xs">
        {offer.currency}
      </Badge>
    </div>
    {!!offer.features?.length && (
      <ul className="mb-5 w-full space-y-2 text-left text-xs text-muted-foreground">
        {offer.features.slice(0, 4).map((feature) => (
          <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /><span>{feature.replace('*', '')}</span></li>
        ))}
      </ul>
    )}
    {Number(offer.daily_limit || 0) > 0 && (
      <div className="mb-4 w-full rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-left text-xs">
        <div className="font-semibold text-foreground">Daily spending cap</div>
        <div className="mt-0.5 text-muted-foreground">{money(offer.daily_limit!, offer.currency)} per day, enforced by Lipaxe</div>
      </div>
    )}
    <div className="mb-6 flex flex-wrap justify-center gap-1.5 sm:gap-2">
      {offer.supports_3ds && (
        <Badge variant="secondary" className="gap-1 rounded-lg px-2 sm:px-3 py-1 text-[10px] sm:text-xs">
          <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> 3D Secure
        </Badge>
      )}
      {offer.supports_apple_pay && (
        <Badge variant="secondary" className="gap-1 rounded-lg px-2 sm:px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400">
          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> <Apple className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Apple Pay
        </Badge>
      )}
      {offer.supports_google_pay && (
        <Badge variant="secondary" className="gap-1 rounded-lg px-2 sm:px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400">
          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> <FaGoogle className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Google Pay
        </Badge>
      )}
    </div>
    <Button onClick={() => onCreate(offer)} className="mt-auto h-11 sm:h-12 w-full rounded-xl sm:rounded-2xl bg-primary text-primary-foreground shadow-brand hover:bg-primary/90">
      Create <Plus className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
    </Button>
  </div>
);

// Ligne de comparaison responsive avec défilement horizontal
const CompareRow = ({ label, values }: { label: string; values: React.ReactNode[] }) => (
  <div className="grid min-w-[600px] md:min-w-[700px] lg:min-w-[760px] grid-cols-[140px_repeat(3,minmax(120px,1fr))] sm:grid-cols-[180px_repeat(3,minmax(140px,1fr))] lg:grid-cols-[240px_repeat(3,minmax(160px,1fr))] border-t border-border/70">
    <div className="bg-muted/35 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-xs sm:text-sm font-bold text-muted-foreground break-words">
      {label}
    </div>
    {values.slice(0, 3).map((value, index) => (
      <div key={index} className="border-l border-border/70 px-2 sm:px-3 lg:px-6 py-3 sm:py-4 lg:py-5 text-center text-xs sm:text-sm font-bold">
        {value}
      </div>
    ))}
  </div>
);

const VirtualCard = () => {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const { data: offers, isLoading } = useCardOffersQuery();
  const { data: scarabKyc } = useScarabPayKycStatusQuery();
  const [orderCard, { isLoading: ordering }] = useOrderCardMutation();
  const pin = usePinGate();
  
  // États du formulaire de création de carte
  const [orderOpen, setOrderOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<CardOffer | null>(null);
  const [walletId, setWalletId] = useState<string>();
  const [funding, setFunding] = useState('5');
  const [nameOnCard, setNameOnCard] = useState((user ? `${user.firstName} ${user.lastName}` : '').toUpperCase());
  const [occupation, setOccupation] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('employed');
  const [accountPurpose, setAccountPurpose] = useState('personal_spending');
  const [annualSalary, setAnnualSalary] = useState('');
  const [expectedMonthlyVolume, setExpectedMonthlyVolume] = useState('');
  const [scarabTermsAccepted, setScarabTermsAccepted] = useState(false);

  // 3 premières offres uniquement
  const visibleOffers = useMemo(() => (offers || []).slice(0, 3), [offers]);
  
  // Calculs des frais pour le récapitulatif
  const issuanceFee = Number(selectedOffer?.price || 0);
  const initialBalance = Number(funding || 0);
  const issueFixed = Math.max(selectedOffer?.creation_fixed_fee || 0, selectedOffer?.live_creation_fixed_fee || 0);
  const issuePercentage = Math.max(selectedOffer?.creation_percentage_fee || 0, selectedOffer?.live_creation_percentage_fee || 0);
  const issueMinimum = Math.max(selectedOffer?.creation_minimum_fee || 0, selectedOffer?.live_creation_minimum_fee || 0);
  const providerIssueFee = providerFee(issueFixed, issuePercentage, issueMinimum, initialBalance);
  const fundingFixed = Math.max(selectedOffer?.funding_fixed_fee || 0, selectedOffer?.live_funding_fixed_fee || 0);
  const fundingPercentage = Math.max(selectedOffer?.funding_fee_percent || 0, selectedOffer?.live_funding_percentage_fee || 0);
  const fundingMinimum = Math.max(selectedOffer?.funding_minimum_fee || 0, selectedOffer?.live_funding_minimum_fee || 0);
  const providerFundingFee = providerFee(fundingFixed, fundingPercentage, fundingMinimum, initialBalance);
  const lipaxeFundingFee = initialBalance * (Number(selectedOffer?.lipaxe_fee_percent || 0) / 100);
  const totalFundingFee = providerFundingFee + lipaxeFundingFee;
  const orderTotal = issuanceFee + initialBalance + providerIssueFee + totalFundingFee;
  const scarabKycStatus = String(scarabKyc?.kyc_status || 'not_started').toLowerCase();
  const scarabKycInReview = ['pending', 'review'].includes(scarabKycStatus);
  const scarabKycApproved = scarabKycStatus === 'approved';
  const scarabNeedsDeclarations = !scarabKycApproved && !scarabKycInReview;

  // Ouvre le modal de création avec l'offre sélectionnée
  const openCreate = (offer: CardOffer) => {
    setSelectedOffer(offer);
    setFunding(String(offer.min_funding || 5));
    setScarabTermsAccepted(false);
    setOrderOpen(true);
  };

  // Soumet la commande de carte avec vérification PIN
  const submitOrder = () => {
    if (!selectedOffer || !walletId) {
      toast.error('Sélectionnez une offre et un wallet');
      return;
    }
    if (selectedOffer.provider === 'scarabpay' && scarabKycInReview) {
      toast.warning('Your ScarabPay cardholder profile is still under review. We will let you know when it is approved.');
      return;
    }
    if (selectedOffer.provider === 'scarabpay' && scarabNeedsDeclarations && (
      !occupation.trim() || !annualSalary.trim() || !expectedMonthlyVolume.trim() || !scarabTermsAccepted
    )) {
      toast.error('Complétez votre profil financier et confirmez les conditions avant de continuer.');
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
          ...(selectedOffer.provider === 'scarabpay' ? {
            occupation: occupation.trim(),
            employment_status: employmentStatus,
            account_purpose: accountPurpose,
            annual_salary: annualSalary,
            expected_monthly_volume: expectedMonthlyVolume,
            terms_of_service_accepted: scarabNeedsDeclarations ? scarabTermsAccepted : true,
          } : {}),
        }).unwrap();
        const raw = result as { status?: string; message?: string; detail?: string; reference?: string };
        if (raw.status === 'pending') {
          toast.warning(raw.message || `Opération en vérification fournisseur. Référence: ${raw.reference || '-'}`);
        } else {
          toast.success(raw.message || raw.detail || t('cards.virtualCreated'));
        }
        setOrderOpen(false);
      } catch (error) {
        toast.error(apiMessage(error, t('common.error')));
      }
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 px-3 sm:px-4 md:px-0">
      {/* En-tête de la page */}
      <PageHeader
        title={t('nav.virtualCard')}
        subtitle=""
        // icon={<CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />}
        // actions={
        //   visibleOffers[0] && (
        //     <Button onClick={() => openCreate(visibleOffers[0])} className="bg-primary text-primary-foreground shadow-brand hover:bg-primary/90 text-sm sm:text-base">
        //       <Plus className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t('cards.create')}
        //     </Button>
        //   )
        // }
      />

      {visibleOffers[0] && (
        <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-primary/8 p-3 shadow-sm sm:hidden">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Create a virtual card</p>
            <p className="truncate text-xs text-muted-foreground">{visibleOffers[0].name}</p>
          </div>
          <Button onClick={() => openCreate(visibleOffers[0])} size="sm" className="shrink-0 rounded-xl bg-primary text-primary-foreground">
            <Plus className="mr-1 h-3.5 w-3.5" /> Create
          </Button>
        </div>
      )}

      {/* Liens de navigation secondaires */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {[
          { to: '/app/cards/my', label: t('nav.myCards'), icon: Wallet },
          { to: '/app/cards/gift', label: t('nav.giftCards'), icon: Gift },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center justify-center sm:justify-start gap-2 rounded-xl sm:rounded-2xl border border-border/70 bg-card px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Section de comparaison des offres */}
      <section className="overflow-hidden rounded-xl sm:rounded-2xl md:rounded-[2rem] border border-border/70 bg-card shadow-elegant">
        <div className="flex flex-col lg:flex-row">
          <div className="border-b lg:border-b-0 lg:border-r border-border/70 bg-muted/35 p-4 sm:p-6 md:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold">Compare cards</h2>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">Fees, limits, security.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="m-4 sm:m-6 h-[380px] rounded-2xl" />)
              : visibleOffers.map((offer, index) => <OfferCard key={offer.id} offer={offer} index={index} onCreate={openCreate} />)}
          </div>
        </div>
      </section>

      {/* Tableau comparatif des prix et frais - Scroll horizontal sur mobile */}
      {visibleOffers.length > 0 && (
        <section className="overflow-x-auto rounded-xl sm:rounded-2xl md:rounded-[1.75rem] border border-border/70 bg-card shadow-sm">
          <div className="min-w-[600px] md:min-w-[700px] lg:min-w-[760px] border-b border-border/70 bg-muted/35 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-muted-foreground">
            Pricing & fees
          </div>
          <CompareRow label="Lipaxe card price" values={visibleOffers.map((o) => moneyOrDash(o.price, o.currency))} />
          <CompareRow label="Provider issuance fee" values={visibleOffers.map((o) => (
            o.creation_fixed_fee === undefined && o.live_creation_fixed_fee === undefined ? <EmptyValue /> : `${money(Math.max(o.creation_fixed_fee || 0, o.live_creation_fixed_fee || 0), o.currency)} + ${Math.max(o.creation_percentage_fee || 0, o.live_creation_percentage_fee || 0)}% (min. ${money(Math.max(o.creation_minimum_fee || 0, o.live_creation_minimum_fee || 0), o.currency)})`
          ))} />
          <CompareRow label="Card funding fee" values={visibleOffers.map((o) => cardFundingFee(o))} />
          <CompareRow label="Settlement fee" values={visibleOffers.map((o) => (
            o.settlement_fee === undefined
              ? <EmptyValue />
              : Number(o.settlement_fee) === 0
                ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs">Free</Badge>
                : money(o.settlement_fee, o.currency)
          ))} />
          <CompareRow label="Authorization fee" values={visibleOffers.map((o) => (
            o.authorization_fee === undefined
              ? <EmptyValue />
              : Number(o.authorization_fee) === 0
                ? <Badge className="bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs">Free</Badge>
                : money(o.authorization_fee, o.currency)
          ))} />
          <CompareRow label="Cross-border fee" values={visibleOffers.map((o) => percentOrDash(o.cross_border_fee_percent))} />
          <CompareRow label="Maintenance fee" values={visibleOffers.map((o) => (
            o.monthly_fee === undefined ? <EmptyValue /> : `${money(o.monthly_fee, o.currency)}/mo`
          ))} />
          <CompareRow label="Withdrawal fee" values={visibleOffers.map((o) => percentOrDash(o.withdrawal_fee_percent))} />
          <CompareRow label="First declined authorization" values={visibleOffers.map((o) => `${o.decline_free_attempts_per_day ?? 1} free; card frozen`)} />
          <CompareRow label="2nd and 3rd confirmed issuer declines" values={visibleOffers.map((o) => money(o.decline_fee_per_attempt ?? 0.8, o.currency))} />
          <CompareRow label="Daily decline limit" values={visibleOffers.map((o) => `${o.decline_max_attempts_per_day ?? 3} declines`)} />
          <CompareRow label="Daily spending cap (Lipaxe)" values={visibleOffers.map((o) => moneyOrDash(o.daily_limit, o.currency))} />

          {/* Section sécurité et paiements */}
          <div className="min-w-[600px] md:min-w-[700px] lg:min-w-[760px] border-y border-border/70 bg-muted/35 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-muted-foreground">
            Security & payments
          </div>
          <CompareRow label="3D Secure (3DS)" values={visibleOffers.map((o) => <CheckState enabled={o.supports_3ds} />)} />
          <CompareRow label="Authentication" values={visibleOffers.map((o) => (
            o.authentication ? <Badge variant="secondary" className="text-[10px] sm:text-xs">{o.authentication}</Badge> : <EmptyValue />
          ))} />

          {/* Section limites et utilisation */}
          <div className="min-w-[600px] md:min-w-[700px] lg:min-w-[760px] border-y border-border/70 bg-muted/35 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-muted-foreground">
            Limits & usage
          </div>
          <CompareRow label="Monthly limit" values={visibleOffers.map((o) => moneyOrDash(o.monthly_limit, o.currency))} />
          <div className="min-w-[600px] md:min-w-[700px] lg:min-w-[760px] border-t border-border/70 px-4 py-3 text-xs text-muted-foreground sm:px-6">
            Lipaxe tracks issuer-reported authorizations and freezes the card when the daily cap is reached. It is reactivated after the daily reset. ScarabPay does not provide a pre-authorization limit hook, so a payment already being authorized may still complete before the freeze takes effect.
          </div>
          <CompareRow label="Verdict" values={visibleOffers.map((o) => (
            <Badge variant="secondary" className="max-w-[150px] truncate text-[10px] sm:text-xs">{o.card_type || o.description || offerLabel(o, 0)}</Badge>
          ))} />
        </section>
      )}

      {/* Modal de création de carte */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-h-[92vh] max-w-[95vw] sm:max-w-2xl overflow-hidden p-0 rounded-2xl sm:rounded-3xl">
          <DialogHeader className="flex-row items-center justify-between bg-primary px-4 sm:px-7 py-4 sm:py-5 text-primary-foreground">
            <DialogTitle className="flex items-center gap-2 sm:gap-3 font-display text-xl sm:text-2xl">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" /> Create Card
            </DialogTitle>
            <button onClick={() => setOrderOpen(false)} className="rounded-full p-1 text-primary-foreground/70 hover:text-primary-foreground">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </DialogHeader>
          <div className="max-h-[calc(92vh-80px)] overflow-y-auto p-4 sm:p-7">
            {selectedOffer && (
              <div className="mb-5 sm:mb-7 text-center">
                <div className="mx-auto mb-3 w-full max-w-[280px] sm:mb-4">
                  <CardArtwork
                    image={selectedOffer.image}
                    brand={selectedOffer.brand}
                    name={selectedOffer.name}
                    masked="LIPAXE VIRTUAL"
                  />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold">{selectedOffer.name}</h3>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-muted-foreground">{selectedOffer.currency}</p>
              </div>
            )}
            <div className="space-y-4 sm:space-y-5">
              {/* Champ nom sur la carte */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Name on Card *</Label>
                <Input 
                  value={nameOnCard} 
                  onChange={(event) => setNameOnCard(event.target.value.toUpperCase())} 
                  maxLength={23} 
                  className="h-12 sm:h-14 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold" 
                />
                <p className="text-xs sm:text-sm text-muted-foreground">Latin letters only, 4-23 characters</p>
              </div>

              {selectedOffer?.provider === 'scarabpay' && scarabKycInReview && (
                <div role="status" className="rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  Your cardholder profile is being reviewed by ScarabPay. Card creation will be available when the review is complete.
                </div>
              )}

              {selectedOffer?.provider === 'scarabpay' && scarabNeedsDeclarations && (
                <section className="space-y-4 rounded-2xl border border-primary/15 bg-primary/[0.035] p-4 sm:p-5" aria-labelledby="scarab-profile-title">
                  <div>
                    <h4 id="scarab-profile-title" className="font-semibold">Cardholder declarations</h4>
                    <p className="mt-1 text-xs text-muted-foreground">ScarabPay requires these details to review your cardholder profile. Use accurate estimates.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="scarab-occupation">Occupation</Label>
                      <Input id="scarab-occupation" value={occupation} onChange={(event) => setOccupation(event.target.value)} maxLength={100} placeholder="For example, teacher" className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scarab-employment">Employment status</Label>
                      <select id="scarab-employment" value={employmentStatus} onChange={(event) => setEmploymentStatus(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                        <option value="employed">Employed</option>
                        <option value="self_employed">Self-employed</option>
                        <option value="student">Student</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="retired">Retired</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scarab-purpose">Purpose of card</Label>
                      <select id="scarab-purpose" value={accountPurpose} onChange={(event) => setAccountPurpose(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                        <option value="personal_spending">Personal spending</option>
                        <option value="online_purchases">Online purchases</option>
                        <option value="business_expenses">Business expenses</option>
                        <option value="travel">Travel</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scarab-salary">Annual income (whole amount)</Label>
                      <Input id="scarab-salary" inputMode="numeric" value={annualSalary} onChange={(event) => setAnnualSalary(event.target.value.replace(/\D/g, ''))} maxLength={12} placeholder="4800000" className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="scarab-volume">Estimated monthly card spending</Label>
                      <Input id="scarab-volume" inputMode="numeric" value={expectedMonthlyVolume} onChange={(event) => setExpectedMonthlyVolume(event.target.value.replace(/\D/g, ''))} maxLength={12} placeholder="150000" className="h-11 rounded-xl" />
                      <p className="text-xs text-muted-foreground">Enter the amount in your local currency, without decimals.</p>
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-5">
                    <Checkbox checked={scarabTermsAccepted} onCheckedChange={(checked) => setScarabTermsAccepted(checked === true)} className="mt-0.5" />
                    <span>I confirm these declarations are accurate and accept ScarabPay’s cardholder terms.</span>
                  </label>
                </section>
              )}
              
              {/* Champ solde initial */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Initial Balance *</Label>
                <div className="flex overflow-hidden rounded-xl sm:rounded-2xl border border-input">
                  <span className="flex w-12 sm:w-14 items-center justify-center border-r border-input text-lg sm:text-xl font-bold">$</span>
                  <Input 
                    type="number" 
                    min={selectedOffer?.min_funding || 0} 
                    value={funding} 
                    onChange={(event) => setFunding(event.target.value)} 
                    className="h-12 sm:h-14 border-0 text-sm sm:text-base font-semibold focus-visible:ring-0" 
                  />
                </div>
              </div>
              
              {/* Sélecteur de wallet */}
              <WalletSelector label="Funding wallet" value={walletId} onChange={(id) => setWalletId(id)} />
              
              {/* Récapitulatif des frais */}
              <div className="rounded-xl sm:rounded-2xl bg-muted/50 p-4 sm:p-5">
                <div className="flex justify-between py-1 text-xs sm:text-sm text-muted-foreground">
                  <span>Lipaxe card price</span>
                  <span className="font-bold text-foreground">{money(issuanceFee, selectedOffer?.currency)}</span>
                </div>
                <div className="flex justify-between py-1 text-xs sm:text-sm text-muted-foreground">
                  <span>Provider issuance fee</span>
                  <span className="font-bold text-foreground">{money(providerIssueFee, selectedOffer?.currency)}</span>
                </div>
                <div className="flex justify-between py-1 text-xs sm:text-sm text-muted-foreground">
                  <span>Initial Balance</span>
                  <span className="font-bold text-foreground">{money(initialBalance, selectedOffer?.currency)}</span>
                </div>
                <div className="flex justify-between py-1 text-xs sm:text-sm text-muted-foreground">
                  <span>Lipaxe Fee</span>
                  <span className="font-bold text-foreground">{money(lipaxeFundingFee, selectedOffer?.currency)}</span>
                </div>
                <div className="flex justify-between py-1 text-xs sm:text-sm text-muted-foreground">
                  <span>Provider Fee</span>
                  <span className="font-bold text-foreground">{money(providerFundingFee, selectedOffer?.currency)}</span>
                </div>
                {selectedOffer?.provider === 'scarabpay' && (
                  <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
                    First confirmed card-payment decline each day: free and the card is frozen for your protection. The 2nd and 3rd confirmed issuer declines cost {money(selectedOffer.decline_fee_per_attempt ?? 0.8, selectedOffer.currency)} each. This applies regardless of the decline reason; temporary network errors and failed top-ups are not counted as card-payment declines.
                  </p>
                )}
                <div className="flex justify-between py-1 text-xs sm:text-sm text-muted-foreground">
                  <span>Total Fees</span>
                  <span className="font-bold text-foreground">{money(providerIssueFee + totalFundingFee, selectedOffer?.currency)}</span>
                </div>
                <div className="mt-3 sm:mt-4 flex justify-between border-t border-border pt-3 sm:pt-4 font-display text-xl sm:text-2xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">{money(orderTotal, selectedOffer?.currency)}</span>
                </div>
              </div>
              
              {/* Boutons d'action */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-border pt-4 sm:pt-5">
                <Button variant="outline" size="lg" onClick={() => setOrderOpen(false)} className="min-w-full sm:min-w-32 rounded-xl sm:rounded-2xl">
                  Cancel
                </Button>
                <Button onClick={submitOrder} disabled={ordering || (selectedOffer?.provider === 'scarabpay' && scarabKycInReview)} size="lg" className="min-w-full sm:min-w-48 rounded-xl sm:rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
                  {ordering ? <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <Check className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  Confirm & Create
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal PIN pour sécuriser la transaction */}
      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default VirtualCard;
