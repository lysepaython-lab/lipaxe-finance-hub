import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import iconUrl from '/lipaxe-icon.png';

interface LogoProps {
  className?: string;
  compact?: boolean;
  to?: string;
  size?: number;
}

export const Logo = ({ className, compact = false, to = '/', size = 36 }: LogoProps) => (
  <Link to={to} className={cn('flex items-center gap-2.5 group', className)}>
    <img
      src={iconUrl}
      alt="Lipaxe"
      width={size}
      height={size}
      className="rounded-xl shadow-brand transition-smooth group-hover:scale-105 dark:ring-1 dark:ring-white/10"
      style={{ width: size, height: size }}
    />
    {!compact && (
      <span className="font-display text-xl font-bold tracking-tight text-foreground">
        Lipaxe
      </span>
    )}
  </Link>
);
