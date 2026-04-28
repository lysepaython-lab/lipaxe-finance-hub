import type { Transaction } from '@/store/api/walletApi';

export interface MonthlyFlowPoint {
  name: string;
  inflow: number;
  outflow: number;
}

interface MonthBucket {
  key: string;
  name: string;
  inflow: number;
  outflow: number;
}

export interface NetChangeStats {
  percent: number;
  direction: 'up' | 'down' | 'flat';
}

const isIncludedStatus = (status: Transaction['status']) => status !== 'failed';

const getEffectiveAmount = (tx: Transaction) => {
  const base = Math.max(0, Number(tx.amount) || 0);
  const fee = Math.max(0, Number(tx.fee) || 0);
  if (tx.direction === 'out') return base + fee;
  return Math.max(0, base - fee);
};

const toMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const buildBuckets = (locale = 'en-US') => {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'short' });
  const now = new Date();
  const buckets: MonthBucket[] = [];

  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: toMonthKey(d),
      name: formatter.format(d),
      inflow: 0,
      outflow: 0,
    });
  }

  return buckets;
};

export const buildMonthlyFlowFromTransactions = (
  transactions: Transaction[] | undefined,
  options?: { currency?: string; locale?: string },
): MonthlyFlowPoint[] => {
  const buckets = buildBuckets(options?.locale);
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const tx of transactions || []) {
    if (!isIncludedStatus(tx.status)) continue;
    if (options?.currency && tx.currency !== options.currency) continue;
    if (!tx.createdAt) continue;

    const date = new Date(tx.createdAt);
    if (Number.isNaN(date.getTime())) continue;

    const bucket = byKey.get(toMonthKey(date));
    if (!bucket) continue;

    const amount = getEffectiveAmount(tx);
    if (tx.direction === 'in') bucket.inflow += amount;
    else bucket.outflow += amount;
  }

  return buckets.map((bucket) => ({
    name: bucket.name,
    inflow: Number(bucket.inflow.toFixed(2)),
    outflow: Number(bucket.outflow.toFixed(2)),
  }));
};

export const buildNetChangeStats = (
  transactions: Transaction[] | undefined,
  options?: { currency?: string },
): NetChangeStats => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const previousDate = new Date(currentYear, currentMonth - 1, 1);
  const previousYear = previousDate.getFullYear();
  const previousMonth = previousDate.getMonth();

  let currentNet = 0;
  let previousNet = 0;

  for (const tx of transactions || []) {
    if (!isIncludedStatus(tx.status)) continue;
    if (options?.currency && tx.currency !== options.currency) continue;
    if (!tx.createdAt) continue;

    const date = new Date(tx.createdAt);
    if (Number.isNaN(date.getTime())) continue;

    const amount = getEffectiveAmount(tx);
    const signed = tx.direction === 'in' ? amount : -amount;

    const y = date.getFullYear();
    const m = date.getMonth();
    if (y === currentYear && m === currentMonth) currentNet += signed;
    if (y === previousYear && m === previousMonth) previousNet += signed;
  }

  const denominator = Math.max(Math.abs(previousNet), 1);
  const percent = Number((((currentNet - previousNet) / denominator) * 100).toFixed(1));
  const direction: NetChangeStats['direction'] = percent > 0 ? 'up' : percent < 0 ? 'down' : 'flat';

  return { percent, direction };
};
