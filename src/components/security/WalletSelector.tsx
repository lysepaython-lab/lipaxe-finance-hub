import { motion } from 'framer-motion';
import { Wallet as WalletIcon, Check } from 'lucide-react';
import { useWalletsV2Query, type WalletV2 } from '@/store/api/platformApi';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

interface WalletSelectorProps {
  value?: string;
  onChange: (walletId: string, wallet: WalletV2) => void;
  filterCurrency?: string;
  excludeCurrencies?: string[];
  label?: string;
}

const walletLogoClass = (currency: string) => {
  const code = currency.toUpperCase();
  if (code === 'BTC') return 'bg-orange-500 text-white';
  if (code === 'USDT') return 'bg-emerald-500 text-white';
  if (code === 'USDC') return 'bg-blue-500 text-white';
  if (code === 'BIF') return 'bg-red-500 text-white';
  if (code === 'CDF') return 'bg-sky-600 text-white';
  if (code === 'RWF') return 'bg-amber-500 text-white';
  return 'bg-gradient-brand text-primary-foreground';
};

export const WalletSelector = ({ value, onChange, filterCurrency, excludeCurrencies = [], label }: WalletSelectorProps) => {
  const { data: wallets, isLoading } = useWalletsV2Query();
  const excluded = excludeCurrencies.map((currency) => currency.toUpperCase());
  const list = (wallets || []).filter((w) => {
    const currency = w.currency.toUpperCase();
    return (!filterCurrency || currency === filterCurrency.toUpperCase()) && !excluded.includes(currency);
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {label && <p className="text-sm font-medium">{label}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="grid sm:grid-cols-2 gap-2">
        {list.map((w) => {
          const active = w.id === value;
          return (
            <motion.button
              key={w.id}
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(w.id, w)}
              className={cn(
                'relative text-left rounded-xl border-2 p-3 transition-colors',
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:border-primary/40 bg-background',
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  'h-9 w-9 rounded-full flex items-center justify-center font-display text-[11px] font-black shadow-sm ring-1 ring-black/5',
                  walletLogoClass(w.currency),
                )}>
                  {w.currency.slice(0, 3)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <WalletIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    {w.currency}
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {formatMoney(w.available, w.currency)}
                  </div>
                </div>
                {active && (
                  <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
        {list.length === 0 && (
          <p className="col-span-2 text-sm text-muted-foreground py-4 text-center">
            Aucun portefeuille disponible.
          </p>
        )}
      </div>
    </div>
  );
};
