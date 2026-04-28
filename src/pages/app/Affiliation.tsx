import { motion } from 'framer-motion';
import { Users2, Copy, Share2, Trophy, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';
import { useAffiliateCodeQuery, useCommissionsQuery } from '@/store/api/affiliationApi';

const Affiliation = () => {
  const { t } = useTranslation();
  const { data: affiliate } = useAffiliateCodeQuery();
  const { data: commissions } = useCommissionsQuery();

  const code = affiliate?.code || 'LIPAXE';
  const link = affiliate?.link || `${window.location.origin}/register?reference=${code}`;
  const total = (commissions || []).reduce((sum, item) => sum + item.amount, 0);

  return (
    <div>
      <PageHeader title={t('nav.affiliation')} subtitle={t('affiliation.subtitle')} icon={<Users2 className="h-6 w-6" />} />
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
          <Card className="bg-gradient-hero text-primary-foreground overflow-hidden relative">
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary-foreground/10 blur-3xl" />
            <CardContent className="p-6 relative space-y-4">
              <div className="text-sm opacity-80">{t('affiliation.yourCode')}</div>
              <div className="font-display text-4xl font-bold tracking-wider">{code}</div>
              <div className="rounded-xl bg-primary-foreground/10 backdrop-blur p-3 flex items-center gap-2">
                <code className="flex-1 text-xs truncate">{link}</code>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => { navigator.clipboard.writeText(link); toast.success(t('affiliation.copied')); }}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => toast.success(t('affiliation.shared'))}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm opacity-85">{t('affiliation.howItWorks')}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-2"><Trophy className="h-4 w-4" />{t('affiliation.referrals')}</span><span className="font-display text-2xl font-bold">{affiliate?.total_referrals || 0}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4" />{t('affiliation.earned')}</span><span className="font-display text-2xl font-bold tabular">{formatMoney(total, 'USD')}</span></div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-border font-display font-semibold">{t('affiliation.history')}</div>
          {(commissions || []).map((entry, i) => (
            <motion.div key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="px-6 py-4 flex items-center justify-between border-b border-border last:border-0">
              <div>
                <div className="font-medium">{entry.from_user || 'Referral'}</div>
                <div className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-success tabular">+{formatMoney(entry.amount, entry.currency)}</div>
                <div className="text-[11px] uppercase text-muted-foreground">{entry.status}</div>
              </div>
            </motion.div>
          ))}
          {(commissions || []).length === 0 && (
            <div className="px-6 py-8 text-sm text-muted-foreground text-center">Aucune commission enregistrée pour le moment.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Affiliation;
