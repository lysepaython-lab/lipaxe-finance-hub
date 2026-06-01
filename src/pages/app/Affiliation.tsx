import { motion } from 'framer-motion';
import { Copy, DollarSign, Gift, Share2, Tag, TrendingUp, Users2, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';
import { useAffiliateCodeQuery, useCommissionsQuery } from '@/store/api/affiliationApi';

const metricTone = {
  green: 'text-emerald-300',
  amber: 'text-amber-300',
  blue: 'text-sky-300',
  white: 'text-white',
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
    <div className="mx-auto max-w-6xl space-y-5 rounded-[2rem] bg-[#07110f] p-4 text-slate-100 shadow-2xl sm:p-6">
      <div className="flex items-center justify-between border-b border-emerald-300/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400/12 text-emerald-300">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Referrals</p>
            <h1 className="font-display text-2xl font-bold text-white">Affiliate Dashboard</h1>
          </div>
        </div>
        <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
          10% Commission
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl bg-black/20 p-4 text-center">
                <div className="text-xs text-slate-400">{item.label}</div>
                <div className={`mt-2 font-display text-lg font-bold ${metricTone[item.tone]}`}>{item.value}</div>
              </div>
            ))}
          </div>
          <Button disabled className="mt-5 h-12 w-full rounded-2xl bg-emerald-500/50 text-white">
            Request Payout
          </Button>
          <p className="mt-2 text-center text-xs text-slate-500">Minimum payout: $50</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Your Referral Code</label>
              <div className="flex gap-2">
                <Input readOnly value={code} className="h-12 rounded-2xl border-white/10 bg-black/30 text-white" />
                <Button disabled className="h-12 rounded-2xl bg-emerald-500/60 px-6 text-white">Update</Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Your Referral Link</label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <code className="min-w-0 flex-1 truncate text-sm text-slate-200">{link}</code>
                <button onClick={() => copy(link)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
                  <Copy className="h-4 w-4" />
                </button>
                <button onClick={() => toast.success(t('affiliation.shared'))} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          <div className="mb-4 flex items-center gap-2 font-semibold text-white">
            <Wallet className="h-4 w-4 text-emerald-300" />
            Payout Wallet
          </div>
          <div className="space-y-3">
            <Input placeholder="Wallet ID" className="h-12 rounded-2xl border-white/10 bg-black/30 text-white placeholder:text-slate-500" />
            <Input placeholder="your@email.com" className="h-12 rounded-2xl border-white/10 bg-black/30 text-white placeholder:text-slate-500" />
            <Button disabled className="h-12 w-full rounded-2xl bg-emerald-500/60 text-white">Save</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Tag className="h-4 w-4 text-emerald-300" />
              Discount Codes
            </div>
            <Button disabled size="sm" className="rounded-xl bg-emerald-500/30 text-emerald-100">+ Create Code</Button>
          </div>
          <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-500">
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
          <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <item.icon className="mb-3 h-4 w-4 text-slate-500" />
            <div className="text-xs text-slate-500">{item.label}</div>
            <div className="mt-1 font-display text-2xl font-bold text-white">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.035]">
        <div className="border-b border-white/10 px-5 py-4 font-semibold text-white">Commission history</div>
        {entries.map((entry, i) => (
          <motion.div key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center justify-between border-b border-white/10 px-5 py-4 last:border-0">
            <div>
              <div className="font-medium text-white">{entry.from_user || 'Referral'}</div>
              <div className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold text-emerald-300">+{formatMoney(entry.amount, entry.currency)}</div>
              <div className="text-[11px] uppercase text-slate-500">{entry.status}</div>
            </div>
          </motion.div>
        ))}
        {entries.length === 0 && <div className="px-5 py-8 text-center text-sm text-slate-500">Aucune commission.</div>}
      </div>
    </div>
  );
};

export default Affiliation;
