import { ArrowDownLeft, ArrowUpRight, CreditCard, Landmark, Smartphone, WalletCards } from 'lucide-react';
import { cn } from '@/lib/utils';

const cryptoMeta: Record<string, { label: string; className: string }> = {
  BTC: { label: 'B', className: 'bg-orange-500 text-white' },
  USDT: { label: 'T', className: 'bg-emerald-500 text-white' },
  USDC: { label: '$', className: 'bg-blue-500 text-white' },
};

const fiatMeta: Record<string, { label: string; className: string }> = {
  USD: { label: 'US', className: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200' },
  EUR: { label: 'EU', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200' },
  BIF: { label: 'BI', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200' },
  CDF: { label: 'CD', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200' },
  RWF: { label: 'RW', className: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-200' },
  XOF: { label: 'XO', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200' },
  XAF: { label: 'XA', className: 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-200' },
  KES: { label: 'KE', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200' },
  UGX: { label: 'UG', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200' },
  TZS: { label: 'TZ', className: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200' },
};

export const resolveMediaUrl = (value?: string) => {
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  const apiRoot = String(import.meta.env.VITE_API_URL || '').replace(/\/api\/v\d+\/?$/i, '').replace(/\/+$/, '');
  if (value.startsWith('/')) return apiRoot ? `${apiRoot}${value}` : value;
  return apiRoot ? `${apiRoot}/${value.replace(/^\/+/, '')}` : value;
};

export const currencyVisual = (currency?: string) => {
  const code = (currency || 'USD').toUpperCase();
  return cryptoMeta[code] || fiatMeta[code] || { label: code.slice(0, 2), className: 'bg-muted text-foreground' };
};

export const providerVisual = (value?: string) => {
  const text = (value || '').toLowerCase();
  if (text.includes('airtel')) return { label: 'airtel', className: 'bg-red-600 text-white' };
  if (text.includes('orange')) return { label: 'orange', className: 'bg-orange-500 text-white' };
  if (text.includes('mpesa') || text.includes('vodacom')) return { label: 'M', className: 'bg-red-500 text-white' };
  if (text.includes('lumicash')) return { label: 'LC', className: 'bg-emerald-600 text-white' };
  if (text.includes('visa')) return { label: 'VISA', className: 'bg-blue-700 text-white' };
  if (text.includes('master')) return { label: 'MC', className: 'bg-orange-500 text-white' };
  if (text.includes('card') || text.includes('carte')) return { label: 'CARD', className: 'bg-primary text-primary-foreground' };
  if (text.includes('bank') || text.includes('banque')) return { label: 'BANK', className: 'bg-slate-700 text-white' };
  return null;
};

export const CurrencyMark = ({
  currency,
  logo,
  className,
}: {
  currency?: string;
  logo?: string;
  className?: string;
}) => {
  const logoSrc = resolveMediaUrl(logo);
  if (logoSrc) {
    return (
      <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border', className)}>
        <img src={logoSrc} alt={currency || 'currency'} className="h-full w-full object-cover" />
      </span>
    );
  }

  const meta = currencyVisual(currency);
  return (
    <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black', meta.className, className)}>
      {meta.label}
    </span>
  );
};

export const PaymentMethodMark = ({
  logo,
  name,
  currency,
  direction,
  className,
}: {
  logo?: string;
  name?: string;
  currency?: string;
  direction?: 'in' | 'out';
  className?: string;
}) => {
  const provider = providerVisual(name);
  const logoSrc = resolveMediaUrl(logo);

  if (logoSrc) {
    return (
      <span className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border', className)}>
        <img src={logoSrc} alt={name || currency || 'payment method'} className="h-full w-full object-cover" />
      </span>
    );
  }

  if (provider) {
    return (
      <span className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-black uppercase', provider.className, className)}>
        {provider.label}
      </span>
    );
  }

  if (currency) {
    return <CurrencyMark currency={currency} className={cn('h-11 w-11', className)} />;
  }

  return (
    <span
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
        direction === 'in' ? 'bg-success/12 text-success' : 'bg-primary/12 text-primary',
        className,
      )}
    >
      {direction === 'in' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
    </span>
  );
};

export const TransactionKindIcon = ({ type }: { type?: string }) => {
  const value = (type || '').toLowerCase();
  if (value.includes('card')) return <CreditCard className="h-4 w-4" />;
  if (value.includes('deposit') || value.includes('withdraw')) return <Smartphone className="h-4 w-4" />;
  if (value.includes('bank')) return <Landmark className="h-4 w-4" />;
  return <WalletCards className="h-4 w-4" />;
};
