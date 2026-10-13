import { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTransactionsQuery, useWalletsQuery } from '@/store/api/walletApi';
import { formatMoney } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, Eye, EyeOff, Wallet as WalletIcon, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { buildNetChangeStats } from '@/lib/dashboardStats';
import { cn } from '@/lib/utils';
import { CurrencyMark } from '@/lib/moneyVisuals';

// Composant Select Custom avec drapeaux (responsive)
const CurrencySelect = ({ wallets, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedWallet = wallets.find((w) => w.currency === selected);

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Bouton déclencheur - responsive */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2 text-xs font-semibold outline-none ring-primary/20 transition-smooth hover:bg-muted focus:ring-2 sm:h-9 sm:gap-2 sm:rounded-xl sm:px-3 sm:text-sm"
      >
        {selectedWallet && <CurrencyMark currency={selectedWallet.currency} logo={selectedWallet.logoUrl || selectedWallet.logo} className="h-5 w-5 text-[9px]" />}
        <span className="hidden xs:inline">{selected}</span>
        <span className="xs:hidden">{selected}</span>
        <ChevronDown
          size={14}
          className={cn(
            'ml-0 sm:ml-1 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* Liste déroulante - responsive */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-1 w-full min-w-[140px] sm:min-w-[180px] overflow-hidden rounded-lg sm:rounded-xl border border-border bg-background py-1 shadow-lg"
          >
            {wallets.map((wallet) => (
              <button
                key={wallet.id || wallet.currency}
                type="button"
                onClick={() => {
                  onChange(wallet.currency);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-smooth hover:bg-muted',
                  selected === wallet.currency && 'bg-primary/8 font-semibold text-primary',
                )}
              >
                <CurrencyMark currency={wallet.currency} logo={wallet.logoUrl || wallet.logo} className="h-5 w-5 text-[9px]" />
                <span className="flex-1 text-left">{wallet.currency}</span>
                {selected === wallet.currency && (
                  <Check size={12} className="text-primary sm:h-4 sm:w-4" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const BalanceCard = () => {
  const { data: wallets, isLoading } = useWalletsQuery();
  const { data: transactions } = useTransactionsQuery();
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('');

  const sortedWallets = useMemo(
    () => [...(wallets || [])].sort((a, b) => b.available - a.available),
    [wallets],
  );
  const selected = sortedWallets.find((w) => w.currency === selectedCurrency) || sortedWallets[0];
  const netChange = buildNetChangeStats(transactions, { currency: selected?.currency });
  const equivalent = selected?.localValue?.currency !== selected?.currency
    ? selected?.localValue
    : selected?.usdValue?.currency !== selected?.currency
      ? selected?.usdValue
      : undefined;

  const mask = (value) => (hidden ? value.replace(/\d/g, '*') : value);

  return (
    <Card className="relative w-full min-w-0 overflow-hidden border-border/60 bg-gradient-card shadow-elegant">
      <div className="absolute -right-24 -top-24 h-40 sm:h-56 w-40 sm:w-56 rounded-full bg-primary/12 blur-3xl" />
      <div className="absolute -bottom-28 -left-28 h-40 sm:h-60 w-40 sm:w-60 rounded-full bg-emerald-400/10 blur-3xl" />

      <CardHeader className="relative flex min-w-0 flex-row items-center justify-between gap-2 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-primary/12 text-primary">
            <WalletIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <span className="min-w-0 truncate text-xs sm:text-sm font-semibold">{t('dashboard.totalBalance')}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {selected && (
            <CurrencySelect
              wallets={sortedWallets}
              selected={selected.currency}
              onChange={setSelectedCurrency}
            />
          )}
          <button
            onClick={() => setHidden((value) => !value)}
            aria-label={hidden ? 'Afficher solde' : 'Masquer solde'}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-border bg-background transition-smooth hover:bg-muted"
          >
            {hidden ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>
        </div>
      </CardHeader>

      <CardContent className="relative min-w-0 space-y-4 overflow-hidden sm:space-y-5 pt-2 px-4 sm:px-6 pb-4 sm:pb-6">
        {isLoading || !selected ? (
          <Skeleton className="h-12 sm:h-16 w-40 sm:w-60" />
        ) : (
          <motion.div
            key={`${hidden}-${selected.currency}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex min-w-0 flex-wrap items-end justify-between gap-x-3 gap-y-1"
          >
            <div className="min-w-0 truncate font-display text-3xl font-bold tracking-tight tabular sm:text-4xl lg:text-5xl">
              {mask(formatMoney(selected.balance, selected.currency))}
            </div>
            {equivalent && (
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground tabular sm:text-sm">
                <span>~</span>
                <CurrencyMark currency={equivalent.currency} logo={equivalent.logoUrl || equivalent.logo} className="h-4 w-4 text-[8px]" />
                <span>{mask(formatMoney(equivalent.amount, equivalent.currency))}</span>
              </div>
            )}
          </motion.div>
        )}

        <div className="grid min-w-0 grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
          <div className="min-w-0 rounded-xl sm:rounded-2xl border border-border/70 bg-background/70 p-2.5 sm:p-3.5">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('dashboard.available')}
            </div>
            <div className="mt-0.5 truncate sm:mt-1 font-semibold tabular text-sm sm:text-base">
              {selected ? mask(formatMoney(selected.available, selected.currency)) : '-'}
            </div>
          </div>
          <div className="min-w-0 rounded-xl sm:rounded-2xl border border-border/70 bg-background/70 p-2.5 sm:p-3.5">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('dashboard.pending')}
            </div>
            <div className="mt-0.5 truncate sm:mt-1 font-semibold tabular text-sm sm:text-base">
              {selected ? mask(formatMoney(selected.pending, selected.currency)) : '-'}
            </div>
          </div>
        </div>

        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <div
              className={cn(
                'flex items-center gap-1 rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold',
                netChange.direction === 'down'
                  ? 'bg-destructive/12 text-destructive'
                  : 'bg-success/12 text-success',
              )}
            >
              <ArrowUpRight className={cn('h-2.5 w-2.5 sm:h-3 sm:w-3', netChange.direction === 'down' && 'rotate-180')} />
              {netChange.percent > 0 ? '+' : ''}
              {netChange.percent.toFixed(1)}%
            </div>
            <span className="text-[10px] sm:text-xs">{t('dashboard.thisMonth').toLowerCase()}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground">{selected?.currency || ''}</span>
        </div>
      </CardContent>
    </Card>
  );
};
