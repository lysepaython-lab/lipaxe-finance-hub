import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, DollarSign, Gift, Share2, Tag, TrendingUp, Users2, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WalletSelector } from '@/components/security/WalletSelector';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';
import {
  useAffiliateCodeQuery,
  useAffiliateDiscountCodesQuery,
  useAffiliatePayoutMutation,
  useCommissionsQuery,
  useCreateAffiliateDiscountCodeMutation,
} from '@/store/api/affiliationApi';

const metricTone = {
  green: 'text-emerald-600 dark:text-emerald-300',
  amber: 'text-amber-600 dark:text-amber-300',
  blue: 'text-sky-600 dark:text-sky-300',
  white: 'text-foreground dark:text-white',
};

const apiMessage = (error: unknown, fallback: string) => {
  const data = (error as { data?: { detail?: string; message?: string; error?: string } })?.data;
  return data?.message || data?.detail || data?.error || fallback;
};

const Affiliation = () => {
  const { t } = useTranslation();
  const { data: affiliate } = useAffiliateCodeQuery();
  const { data: commissions } = useCommissionsQuery();
  const { data: discountCodes } = useAffiliateDiscountCodesQuery();
  const [requestPayout, { isLoading: payoutLoading }] = useAffiliatePayoutMutation();
  const [createDiscountCode, { isLoading: discountLoading }] = useCreateAffiliateDiscountCodeMutation();
  const [payoutWallet, setPayoutWallet] = useState<string>();
  const [payoutEmail, setPayoutEmail] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('5');
  const [discountLimit, setDiscountLimit] = useState('0');

  const code = affiliate?.code || 'LIPAXE';
  const link = affiliate?.link || `${window.location.origin}/register?reference=${code}`;
  const entries = commissions || [];
  const available = entries.filter((item) => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0);
  const withdrawn = entries.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0);
  const pending = available;
  const total = entries.reduce((sum, item) => sum + item.amount, 0);
  const paidCount = entries.filter((item) => item.status === 'paid').length;

  const copy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success(t('affiliation.copied'));
  };

  const submitPayout = async () => {
    if (!payoutWallet) {
      toast.error('Selectionnez un wallet');
      return;
    }
    if (!payoutEmail.trim()) {
      toast.error('Email requis');
      return;
    }
    try {
      const result = await requestPayout({ wallet_id: payoutWallet, email: payoutEmail.trim() }).unwrap();
      toast.success(result.detail || `Payout envoye: ${result.wallet_amount} ${result.wallet_currency}`);
      setPayoutEmail('');
    } catch (error) {
      toast.error(apiMessage(error, 'Impossible de demander le payout.'));
    }
  };

  const submitDiscountCode = async () => {
    const percent = Number(discountPercent);
    if (!percent || percent <= 0 || percent > 10) {
      toast.error('Le discount doit etre entre 0 et 10%.');
      return;
    }
    try {
      await createDiscountCode({
        code: discountCode.trim() || undefined,
        percent,
        usage_limit: Number(discountLimit || 0),
      }).unwrap();
      toast.success('Code promo cree');
      setDiscountCode('');
      setDiscountPercent('5');
      setDiscountLimit('0');
    } catch (error) {
      toast.error(apiMessage(error, 'Impossible de creer le code promo.'));
    }
  };

  const stats = [
    { label: 'Available', value: formatMoney(available, 'USD'), tone: 'green' as const },
    { label: 'Pending', value: formatMoney(pending, 'USD'), tone: 'amber' as const },
    { label: 'Withdrawn', value: formatMoney(withdrawn, 'USD'), tone: 'blue' as const },
    { label: 'Total Earned', value: formatMoney(total, 'USD'), tone: 'white' as const },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-hidden space-y-4 sm:space-y-5 rounded-2xl sm:rounded-[2rem] bg-background p-2.5 sm:p-4 md:p-6 text-foreground shadow-sm ring-1 ring-border dark:bg-[#07110f] dark:text-slate-100 dark:shadow-2xl dark:ring-white/10">
      
      {/* En-tête responsive */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-300/20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-emerald-400/12 dark:text-emerald-300">
            <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-primary dark:text-emerald-300">
              Referrals
            </p>
            {/* <h1 className="font-display text-xl sm:text-2xl font-bold">Affiliate Dashboard</h1> */}
          </div>
        </div>
        <div className="w-fit rounded-full border border-primary/20 bg-primary/10 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-primary dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200">
          10% Commission
        </div>
      </div>

      {/* Grille principale responsive */}
      <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-2">
        
        {/* Carte des statistiques */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="min-w-0 rounded-2xl sm:rounded-3xl border border-border bg-card p-3 sm:p-5 dark:border-white/10 dark:bg-white/[0.035]"
        >
          {/* Grille des stats responsive: 2 colonnes sur mobile, 4 sur desktop */}
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
            {stats.map((item) => (
              <div key={item.label} className="min-w-0 rounded-xl sm:rounded-2xl bg-muted/60 p-2.5 sm:p-3 text-center dark:bg-black/20">
                <div className="text-[10px] sm:text-xs text-muted-foreground dark:text-slate-400">{item.label}</div>
                <div className={`mt-1 sm:mt-2 font-display text-base sm:text-lg font-bold truncate ${metricTone[item.tone]}`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          <Button
            onClick={() => document.getElementById('affiliate-payout-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            disabled={available <= 0}
            className="mt-4 sm:mt-5 h-10 sm:h-12 w-full rounded-xl sm:rounded-2xl bg-primary text-primary-foreground text-sm sm:text-base dark:bg-emerald-500 dark:text-white"
          >
            Request Payout
          </Button>
          <p className="mt-2 text-center text-[10px] sm:text-xs text-muted-foreground dark:text-slate-500">
            Minimum payout: $50
          </p>
        </motion.div>

        {/* Carte du code de parrainage */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.04 }} 
          className="min-w-0 rounded-2xl sm:rounded-3xl border border-border bg-card p-3 sm:p-5 dark:border-white/10 dark:bg-white/[0.035]"
        >
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[10px] sm:text-xs text-muted-foreground dark:text-slate-400">Your Referral Code</label>
              <div className="flex min-w-0 gap-2">
                <Input 
                  readOnly 
                  value={code} 
                  className="min-w-0 h-10 sm:h-12 rounded-xl sm:rounded-2xl text-sm dark:border-white/10 dark:bg-black/30 dark:text-white" 
                />
                <Button disabled className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/70 px-4 sm:px-6 text-sm text-primary-foreground dark:bg-emerald-500/60 dark:text-white">
                  Update
                </Button>
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[10px] sm:text-xs text-muted-foreground dark:text-slate-400">Your Referral Link</label>
              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-border bg-muted/50 px-2 sm:px-4 py-2 sm:py-3 dark:border-white/10 dark:bg-black/30">
                <code className="min-w-0 flex-1 truncate text-xs sm:text-sm text-foreground dark:text-slate-200">
                  {link}
                </code>
                <button 
                  onClick={() => copy(link)} 
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <button 
                  onClick={() => toast.success(t('affiliation.shared'))} 
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Carte du wallet de paiement */}
        <motion.div 
          id="affiliate-payout-card"
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.08 }} 
          className="min-w-0 rounded-2xl sm:rounded-3xl border border-border bg-card p-3 sm:p-5 dark:border-white/10 dark:bg-white/[0.035]"
        >
          <div className="mb-3 sm:mb-4 flex items-center gap-2 font-semibold">
            <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary dark:text-emerald-300" />
            <span className="text-sm sm:text-base">Payout Wallet</span>
          </div>
          <div className="space-y-2.5 sm:space-y-3">
            <WalletSelector label="Payout wallet" value={payoutWallet} onChange={(walletId) => setPayoutWallet(walletId)} />
            <Input 
              placeholder="your@email.com" 
              value={payoutEmail}
              onChange={(event) => setPayoutEmail(event.target.value)}
              className="h-10 sm:h-12 rounded-xl sm:rounded-2xl text-sm dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-slate-500" 
            />
            <Button
              onClick={submitPayout}
              disabled={payoutLoading || available <= 0 || !payoutWallet || !payoutEmail.trim()}
              className="h-10 sm:h-12 w-full rounded-xl sm:rounded-2xl bg-primary text-sm text-primary-foreground dark:bg-emerald-500 dark:text-white"
            >
              {payoutLoading ? 'Processing...' : 'Request payout'}
            </Button>
          </div>
        </motion.div>

        {/* Carte des codes promo */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.12 }} 
          className="min-w-0 rounded-2xl sm:rounded-3xl border border-border bg-card p-3 sm:p-5 dark:border-white/10 dark:bg-white/[0.035]"
        >
          <div className="mb-3 sm:mb-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary dark:text-emerald-300" />
              <span className="text-sm sm:text-base">Discount Codes</span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_90px_90px_auto]">
            <Input
              placeholder="Code optionnel"
              value={discountCode}
              onChange={(event) => setDiscountCode(event.target.value.toUpperCase())}
              className="h-10 rounded-xl text-sm dark:border-white/10 dark:bg-black/30 dark:text-white"
            />
            <Input
              type="number"
              min={1}
              max={10}
              placeholder="%"
              value={discountPercent}
              onChange={(event) => setDiscountPercent(event.target.value)}
              className="h-10 rounded-xl text-sm dark:border-white/10 dark:bg-black/30 dark:text-white"
            />
            <Input
              type="number"
              min={0}
              placeholder="Limit"
              value={discountLimit}
              onChange={(event) => setDiscountLimit(event.target.value)}
              className="h-10 rounded-xl text-sm dark:border-white/10 dark:bg-black/30 dark:text-white"
            />
            <Button onClick={submitDiscountCode} disabled={discountLoading} size="sm" className="h-10 rounded-xl bg-primary text-primary-foreground dark:bg-emerald-500 dark:text-white">
              {discountLoading ? '...' : '+ Create'}
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {(discountCodes || []).map((item) => (
              <div key={item.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs dark:border-white/10 dark:bg-black/25">
                <div className="min-w-0">
                  <div className="truncate font-bold">{item.code}</div>
                  <div className="text-muted-foreground">{item.used_count}/{item.usage_limit || '∞'} uses</div>
                </div>
                <div className="shrink-0 rounded-full bg-primary/10 px-2 py-1 font-bold text-primary dark:bg-emerald-400/10 dark:text-emerald-200">
                  {item.percent}%
                </div>
              </div>
            ))}
            {(discountCodes || []).length === 0 && (
              <div className="flex h-20 items-center justify-center rounded-xl sm:rounded-2xl border border-dashed border-border text-xs sm:text-sm text-muted-foreground dark:border-white/10 dark:text-slate-500">
                No discount codes yet.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Cartes de métriques - responsive grid */}
      <div className="grid min-w-0 grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {[
          { icon: Users2, label: 'Signups', value: affiliate?.total_referrals || 0 },
          { icon: TrendingUp, label: 'Converted', value: paidCount },
          { icon: Users2, label: 'Direct Referrals', value: affiliate?.total_referrals || 0 },
          { icon: DollarSign, label: 'Total Sales', value: formatMoney(total, 'USD') },
        ].map((item) => (
          <div key={item.label} className="min-w-0 rounded-xl sm:rounded-2xl md:rounded-3xl border border-border bg-card p-3 sm:p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <item.icon className="mb-2 sm:mb-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground dark:text-slate-500" />
            <div className="text-[10px] sm:text-xs text-muted-foreground dark:text-slate-500">{item.label}</div>
            <div className="mt-0.5 sm:mt-1 font-display text-lg sm:text-2xl font-bold truncate">
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tableau de l'historique des commissions - responsive */}
      <div className="min-w-0 overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-border bg-card dark:border-white/10 dark:bg-white/[0.035]">
        <div className="border-b border-border px-4 sm:px-5 py-3 sm:py-4 font-semibold text-sm sm:text-base dark:border-white/10">
          Commission history
        </div>
        {entries.map((entry, i) => (
          <motion.div 
            key={entry.id} 
            initial={{ opacity: 0, x: -8 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: i * 0.04 }} 
            className="flex flex-col sm:flex-row gap-2 border-b border-border px-4 sm:px-5 py-3 sm:py-4 last:border-0 dark:border-white/10"
          >
            {/* Colonne gauche: info utilisateur (responsive) */}
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-sm sm:text-base">
                {entry.from_user || 'Referral'}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground dark:text-slate-500 mt-0.5">
                {new Date(entry.createdAt).toLocaleString()}
              </div>
            </div>
            
            {/* Colonne droite: montant et status (responsive) */}
            <div className="flex flex-row sm:flex-col items-center justify-between sm:items-end gap-2 sm:gap-0">
              <div className="font-display font-bold text-sm sm:text-base text-primary dark:text-emerald-300">
                +{formatMoney(entry.amount, entry.currency)}
              </div>
              <div className="text-[9px] sm:text-[11px] uppercase text-muted-foreground dark:text-slate-500">
                {entry.status}
              </div>
            </div>
          </motion.div>
        ))}
        {entries.length === 0 && (
          <div className="px-4 sm:px-5 py-8 text-center text-xs sm:text-sm text-muted-foreground dark:text-slate-500">
            Aucune commission.
          </div>
        )}
      </div>
    </div>
  );
};

export default Affiliation;
