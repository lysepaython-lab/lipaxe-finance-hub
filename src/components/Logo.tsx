import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const Logo = ({ className, compact = false }: { className?: string; compact?: boolean }) => (
  <Link to="/" className={cn('flex items-center gap-2 group', className)}>
    <div className="relative h-9 w-9 rounded-xl bg-gradient-brand shadow-brand flex items-center justify-center transition-smooth group-hover:scale-105">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
        <path d="M5 5v11a3 3 0 0 0 3 3h11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M11 12l4-4 4 4-4 4z" fill="currentColor" />
      </svg>
    </div>
    {!compact && (
      <span className="font-display text-xl font-bold tracking-tight text-foreground">
        Lipaxe
      </span>
    )}
  </Link>
);
