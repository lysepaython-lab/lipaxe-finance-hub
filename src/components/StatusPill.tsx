import { cn } from '@/lib/utils';

const styles: Record<string, string> = {
  completed: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  processing: 'bg-brand-100 text-brand-700 border-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:border-brand-800',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
};

export const StatusPill = ({ status }: { status: string }) => (
  <span className={cn(
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
    styles[status] || 'bg-muted text-muted-foreground border-border'
  )}>
    <span className={cn('h-1.5 w-1.5 rounded-full', {
      'bg-success': status === 'completed',
      'bg-warning': status === 'pending',
      'bg-brand-500': status === 'processing',
      'bg-destructive': status === 'failed',
    })} />
    {status}
  </span>
);
