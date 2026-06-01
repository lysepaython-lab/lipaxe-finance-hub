import { motion } from 'framer-motion';
import { Copy, DollarSign, Gift, Share2, Tag, TrendingUp, Users2, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';
import { useAffiliateCodeQuery, useCommissionsQuery } from '@/store/api/affiliationApi';

const metricTone = {
  green: 'text-emerald-600 dark:text-emerald-300',
  amber: 'text-amber-600 dark:text-amber-300',
  blue: 'text-sky-600 dark:text-sky-300',
  white: 'text-foreground dark:text-white',
};

const Affiliation = () => {
  const { t } = useTranslation();
  const { data: affiliate } = useAffiliateCodeQuery();
  const { data: commissions } = useCommissionsQuery();

  const code = affiliate?.code || 'LIPAXE';
  const link = affiliate?.link || `${window.location.origin}/register?reference=${code}`;
  const entries = commissions || [];
  const available = entries.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0);
  const pending = entries.filter((item) => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0);
  const total = entries.reduce((sum, item) => sum + item.amount, 0);
  const paidCount = entries.filter((item) => item.status === 'paid').length;

  const copy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success(t('affiliation.copied'));
  };

  const stats = [
    { label: 'Available', value: formatMoney(available, 'USD'), tone: 'green' as const },
    { label: 'Pending', value: formatMoney(pending, 'USD'), tone: 'amber' as const },
    { label: 'Withdrawn', value: formatMoney(0, 'USD'), tone: 'blue' as const },
    { label: 'Total Earned', value: formatMoney(total, 'USD'), tone: 'white' as const },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 rounded-[2rem] bg-background p-3 text-foreground shadow-sm ring-1 ring-border sm:p-6 dark:bg-[#07110f] dark:text-slate-100 dark:shadow-2xl dark:ring-white/10">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-300/20">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-emerald-400/12 dark:text-emerald-300">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:text-emerald-300">Referrals</p>
            <h1 className="font-display text-2xl font-bold">Affiliate Dashboard</h1>
          </div>
        </div>
        <div className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200">
          10% Commission
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-4 sm:p-5 dark:border-white/10 dark:bg-white/[0.035]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl bg-muted/60 p-3 text-center sm:p-4 dark:bg-black/20">
                <div className="text-xs text-muted-foreground dark:text-slate-400">{item.label}</div>
                <div className={`mt-2 font-display text-lg font-bold ${metricTone[item.tone]}`}>{item.value}</div>
              </div>
            ))}
          </div>
          <Button disabled className="mt-5 h-12 w-full rounded-2xl bg-primary/70 text-primary-foreground dark:bg-emerald-500/50 dark:text-white">
            Request Payout
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground dark:text-slate-500">Minimum payout: $50</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="rounded-3xl border border-border bg-card p-4 sm:p-5 dark:border-white/10 dark:bg-white/[0.035]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground dark:text-slate-400">Your Referral Code</label>
              <div className="flex gap-2">
                <Input readOnly value={code} className="h-12 rounded-2xl dark:border-white/10 dark:bg-black/30 dark:text-white" />
                <Button disabled className="h-12 rounded-2xl bg-primary/70 px-6 text-primary-foreground dark:bg-emerald-500/60 dark:text-white">Update</Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground dark:text-slate-400">Your Referral Link</label>
              <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-muted/50 px-4 py-3 dark:border-white/10 dark:bg-black/30">
                <code className="min-w-0 flex-1 truncate text-sm text-foreground dark:text-slate-200">{link}</code>
                <button onClick={() => copy(link)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white">
                  <Copy className="h-4 w-4" />
                </button>
                <button onClick={() => toast.success(t('affiliation.shared'))} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-3xl border border-border bg-card p-4 sm:p-5 dark:border-white/10 dark:bg-white/[0.035]">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <Wallet className="h-4 w-4 text-primary dark:text-emerald-300" />
            Payout Wallet
          </div>
          <div className="space-y-3">
            <Input placeholder="Wallet ID" className="h-12 rounded-2xl dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-slate-500" />
            <Input placeholder="your@email.com" className="h-12 rounded-2xl dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-slate-500" />
            <Button disabled className="h-12 w-full rounded-2xl bg-primary/70 text-primary-foreground dark:bg-emerald-500/60 dark:text-white">Save</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-3xl border border-border bg-card p-4 sm:p-5 dark:border-white/10 dark:bg-white/[0.035]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Tag className="h-4 w-4 text-primary dark:text-emerald-300" />
              Discount Codes
            </div>
            <Button disabled size="sm" className="rounded-xl bg-primary/20 text-primary dark:bg-emerald-500/30 dark:text-emerald-100">+ Create Code</Button>
          </div>
          <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground dark:border-white/10 dark:text-slate-500">
            No discount codes yet.
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users2, label: 'Signups', value: affiliate?.total_referrals || 0 },
          { icon: TrendingUp, label: 'Converted', value: paidCount },
          { icon: Users2, label: 'Direct Referrals', value: affiliate?.total_referrals || 0 },
          { icon: DollarSign, label: 'Total Sales', value: formatMoney(total, 'USD') },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-border bg-card p-4 sm:p-5 dark:border-white/10 dark:bg-white/[0.035]">
            <item.icon className="mb-3 h-4 w-4 text-muted-foreground dark:text-slate-500" />
            <div className="text-xs text-muted-foreground dark:text-slate-500">{item.label}</div>
            <div className="mt-1 font-display text-2xl font-bold">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card dark:border-white/10 dark:bg-white/[0.035]">
        <div className="border-b border-border px-5 py-4 font-semibold dark:border-white/10">Commission history</div>
        {entries.map((entry, i) => (
          <motion.div key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex flex-col gap-2 border-b border-border px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <div className="min-w-0">
              <div className="truncate font-medium">{entry.from_user || 'Referral'}</div>
              <div className="text-xs text-muted-foreground dark:text-slate-500">{new Date(entry.createdAt).toLocaleString()}</div>
            </div>
            <div className="text-left sm:text-right">
              <div className="font-display font-bold text-primary dark:text-emerald-300">+{formatMoney(entry.amount, entry.currency)}</div>
              <div className="text-[11px] uppercase text-muted-foreground dark:text-slate-500">{entry.status}</div>
            </div>
          </motion.div>
        ))}
        {entries.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground dark:text-slate-500">Aucune commission.</div>}
      </div>
    </div>
  );
};

export default Affiliation;
