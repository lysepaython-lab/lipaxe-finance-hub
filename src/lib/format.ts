export const formatMoney = (amount: number, currency = 'USD', locale?: string) => {
  try {
    return new Intl.NumberFormat(locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US'), {
      style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const formatDate = (iso: string, locale?: string) =>
  new Intl.DateTimeFormat(locale || 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

export const formatDateShort = (iso: string, locale?: string) =>
  new Intl.DateTimeFormat(locale || 'en-US', { month: 'short', day: 'numeric' }).format(new Date(iso));

export const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};
