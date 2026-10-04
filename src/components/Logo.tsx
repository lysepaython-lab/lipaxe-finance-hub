import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import iconUrl from '/brand/lipaxe-mark.png';


interface LogoProps {
  className?: string;
  compact?: boolean;
  to?: string;
  size?: number;
  textClassName?: string;
}

export const Logo = ({ className, compact = false, to = '/', size = 36, textClassName }: LogoProps) => (
  <Link to={to} className={cn('flex items-center gap-2.5 group', className)}>
    <span
      className="relative shrink-0 overflow-hidden rounded-xl bg-[#F3F6F5] p-1 shadow-brand transition-smooth group-hover:scale-105 dark:ring-1 dark:ring-white/10"
      style={{ width: size, height: size }}
    >
      <img
        src={iconUrl}
        alt="Lipaxe"
        width={size}
        height={size}
        className="h-full w-full object-contain"
      />
    </span>
    {!compact && (
      <span className={cn('font-display text-xl font-bold tracking-tight text-foreground', textClassName)}>
        Lipaxe
      </span>
    )}
  </Link>
);
