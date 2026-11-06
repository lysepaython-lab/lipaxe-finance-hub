import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const BrandMark = ({ brand }: { brand: 'Visa' | 'Mastercard' }) => {
  if (brand === 'Visa') {
    return <span className="font-display text-2xl font-black italic tracking-tight text-white">VISA</span>;
  }
  return (
    <span className="relative block h-10 w-16">
      <span className="absolute left-2 top-1 h-8 w-8 rounded-full bg-[#eb001b]" />
      <span className="absolute left-7 top-1 h-8 w-8 rounded-full bg-[#f79e1b] mix-blend-screen" />
    </span>
  );
};

const resolveImageSrc = (image?: string) => {
  if (!image) return '';
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  if (image.startsWith('/')) {
    const apiRoot = String(import.meta.env.VITE_API_URL || '').replace(/\/api\/v\d+\/?$/i, '').replace(/\/+$/, '');
    return apiRoot ? `${apiRoot}${image}` : image;
  }
  return image;
};

const offerArtwork = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes('starter')) return '/brand/cards/lipaxe-visa-starter.png';
  if (normalized.includes('contactless')) return '/brand/cards/lipaxe-visa-premium-horizontal.png';
  if (normalized.includes('everyday') || normalized.includes('mastercard')) return '/brand/cards/lipaxe-mastercard-everyday.png';
  if (normalized.includes('business')) return '/brand/cards/lipaxe-visa-business.png';
  return '';
};

export const CardArtwork = ({
  image,
  brand = 'Visa',
  name = 'Lipaxe Virtual',
  holder,
  masked,
  exp,
  balance,
  currency,
  className,
  muted = false,
}: {
  image?: string;
  brand?: 'Visa' | 'Mastercard';
  name?: string;
  holder?: string;
  masked?: string;
  exp?: string;
  balance?: string | number;
  currency?: string;
  className?: string;
  muted?: boolean;
}) => {
  // A purchased card must keep the design supplied by its issuer. Offer art is only a local fallback.
  const imageSrc = resolveImageSrc(image) || offerArtwork(name);
  const showCardDetails = Boolean(holder && masked);

  if (imageSrc) {
    return (
      <div className={cn('relative aspect-[1.58/1] overflow-hidden rounded-[1.65rem] bg-muted shadow-brand', muted && 'grayscale', className)}>
        <img src={imageSrc} alt={name} className="h-full w-full object-cover" />
        {showCardDetails && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent p-5 text-white">
            {balance !== undefined && (
              <div className="absolute right-5 top-4 text-right">
                <div className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-white/65">Balance</div>
                <div className="font-display text-sm font-bold">{balance} {currency || ''}</div>
              </div>
            )}
            <div className="absolute inset-x-5 bottom-5">
              <div className="font-mono text-sm tracking-[0.16em] sm:text-base">{masked}</div>
              <div className="mt-2 flex items-end justify-between gap-4 text-[0.63rem] uppercase tracking-[0.12em]">
                <div className="min-w-0">
                  <div className="text-white/60">Card holder</div>
                  <div className="truncate font-semibold text-white">{holder}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-white/60">Exp</div>
                  <div className="font-semibold text-white">{exp || '--/--'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative aspect-[1.58/1] overflow-hidden rounded-[1.65rem] bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,.28),transparent_28%),linear-gradient(135deg,#01594B,#02362F_54%,#0A1412)] p-5 text-white shadow-brand',
        muted && 'grayscale',
        className,
      )}
    >
      <div className="absolute -right-10 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
      <div className="absolute -bottom-14 left-10 h-32 w-32 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-lg font-black">
          <CreditCard className="h-5 w-5" /> Lipaxe
        </div>
        <BrandMark brand={brand} />
      </div>
      <div className="relative mt-8 font-mono text-lg tracking-[0.2em]">
        {masked || '**** **** **** 0000'}
      </div>
      <div className="relative mt-7 flex items-end justify-between text-xs">
        <div className="min-w-0">
          <div className="opacity-70">CARD HOLDER</div>
          <div className="truncate font-bold">{holder || name}</div>
        </div>
        <div className="text-right">
          <div className="opacity-70">EXP</div>
          <div className="font-bold">{exp || '--/--'}</div>
        </div>
      </div>
    </div>
  );
};
