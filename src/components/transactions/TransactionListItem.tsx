import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Transaction } from '@/store/api/walletApi';
import { PaymentMethodMark } from '@/lib/moneyVisuals';
import { formatMoney, relativeTime } from '@/lib/format';
import { StatusPill } from '@/components/StatusPill';
import { cn } from '@/lib/utils';
import { getTransactionSubtitle, getTransactionTitle } from '@/lib/transactionPresentation';
import { useTranslation } from 'react-i18next';

const shorten = (value?: string, max = 18) => {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(6, max - 4))}...`;
};

export const TransactionListItem = ({
  tx,
  compact = false,
  className,
}: {
  tx: Transaction;
  compact?: boolean;
  className?: string;
}) => {
  const { t } = useTranslation();
  const sign = tx.direction === 'in' ? '+' : '-';
  const markName = [tx.paymentMethodName, tx.provider, tx.description, tx.counterparty].filter(Boolean).join(' ');
  const title = getTransactionTitle(tx, t);
  const subtitle = getTransactionSubtitle(tx, t);

  return (
    <Link
      to={`/app/transactions/${tx.id}`}
      className={cn(
        'group flex min-w-0 items-center gap-3 px-4 py-3 transition-smooth hover:bg-muted/40 sm:gap-4 sm:px-5',
        className,
      )}
    >
      <PaymentMethodMark
        logo={tx.paymentMethodLogo}
        name={markName}
        currency={tx.currency}
        direction={tx.direction}
        className={compact ? 'h-10 w-10' : undefined}
      />

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="truncate text-sm font-semibold text-foreground sm:text-[15px]">
          {title}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {shorten(subtitle, compact ? 38 : 72) || tx.paymentMethodName || tx.provider || tx.currency}
          {tx.createdAt ? ` - ${relativeTime(tx.createdAt)}` : ''}
        </div>
      </div>

      <div className="min-w-[82px] shrink-0 text-right sm:min-w-[124px]">
        <div className={cn('truncate text-sm font-bold tabular sm:text-base', tx.direction === 'in' && 'text-success')}>
          {sign} {formatMoney(tx.amount, tx.currency)}
        </div>
        <div className="mt-1 flex justify-end">
          <StatusPill status={tx.status} />
        </div>
      </div>

      <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-smooth group-hover:translate-x-0.5 group-hover:opacity-100 sm:block" />
    </Link>
  );
};
