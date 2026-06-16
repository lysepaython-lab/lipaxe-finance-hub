import { motion } from 'framer-motion';
import { Wallet as WalletIcon, Check } from 'lucide-react';
import { useWalletsV2Query, type WalletV2 } from '@/store/api/platformApi';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CurrencyMark } from '@/lib/moneyVisuals';

interface WalletSelectorProps {
  value?: string;
  onChange: (walletId: string, wallet: WalletV2) => void;
  filterCurrency?: string;
  excludeCurrencies?: string[];
  label?: string;
}

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
                <CurrencyMark currency={w.currency} logo={w.logoUrl || w.logo} className="h-9 w-9 text-[11px] shadow-sm ring-1 ring-black/5" />
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
