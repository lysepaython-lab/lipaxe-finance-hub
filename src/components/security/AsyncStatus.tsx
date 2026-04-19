import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

const STYLES: Record<Status, { icon: React.ReactNode; label: string; className: string }> = {
  idle: { icon: null, label: '', className: '' },
  pending: { icon: <Clock className="h-3.5 w-3.5" />, label: 'En attente', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  processing: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, label: 'En cours', className: 'bg-primary/10 text-primary border-primary/30' },
  completed: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Réussie', className: 'bg-success/10 text-success border-success/30' },
  failed: { icon: <XCircle className="h-3.5 w-3.5" />, label: 'Échec', className: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export const AsyncStatusPill = ({ status, label }: { status: Status; label?: string }) => {
  if (status === 'idle') return null;
  const s = STYLES[status];
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
          s.className,
        )}
      >
        {s.icon}
        {label || s.label}
      </motion.span>
    </AnimatePresence>
  );
};
