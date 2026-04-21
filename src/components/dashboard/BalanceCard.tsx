import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useWalletsQuery } from '@/store/api/walletApi';
import { formatMoney } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Wallet as WalletIcon, Eye, EyeOff, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export const BalanceCard = () => {
  const { data: wallets, isLoading } = useWalletsQuery();
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(false);
  const primary = wallets?.[0];

  const mask = (v: string) => hidden ? v.replace(/\d/g, '•') : v;

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-hero text-primary-foreground shadow-elegant">
      {/* Animated orbs */}
      <motion.div
        className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-primary-glow/40 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-brand-300/25 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <CardHeader className="relative pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-primary-foreground/80">
          <div className="h-8 w-8 rounded-lg bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
            <WalletIcon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">{t('dashboard.totalBalance')}</span>
        </div>
        <button
          onClick={() => setHidden(h => !h)}
          aria-label={hidden ? 'Afficher solde' : 'Masquer solde'}
          className="h-8 w-8 rounded-lg bg-primary-foreground/15 backdrop-blur flex items-center justify-center transition-smooth hover:bg-primary-foreground/25"
        >
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </CardHeader>

      <CardContent className="relative space-y-6 pt-2">
        {isLoading || !primary ? (
          <Skeleton className="h-14 w-56 bg-primary-foreground/20" />
        ) : (
          <motion.div
            key={hidden ? 'h' : 's'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl lg:text-5xl font-bold tabular tracking-tight"
          >
            {mask(formatMoney(primary.balance, primary.currency))}
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-primary-foreground/10 p-3.5 backdrop-blur-md border border-primary-foreground/15">
            <div className="text-[11px] uppercase tracking-wider text-primary-foreground/60 font-medium">{t('dashboard.available')}</div>
            <div className="font-semibold tabular mt-1">{primary && mask(formatMoney(primary.available, primary.currency))}</div>
          </div>
          <div className="rounded-2xl bg-primary-foreground/10 p-3.5 backdrop-blur-md border border-primary-foreground/15">
            <div className="text-[11px] uppercase tracking-wider text-primary-foreground/60 font-medium">{t('dashboard.pending')}</div>
            <div className="font-semibold tabular mt-1">{primary && mask(formatMoney(primary.pending, primary.currency))}</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-primary-foreground/85">
            <div className="flex items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-success-foreground">
              <ArrowUpRight className="h-3 w-3" /> <span className="font-semibold text-xs">+4.2%</span>
            </div>
            <span className="text-primary-foreground/70 text-xs">{t('dashboard.thisMonth').toLowerCase()}</span>
          </div>
          <div className="flex items-center gap-1 text-primary-foreground/70 text-xs">
            <TrendingUp className="h-3 w-3" /> Tendance haussière
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
