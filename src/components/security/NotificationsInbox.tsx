import { Bell, CheckCircle2, Info, AlertTriangle, Check, AlertOctagon, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } from '@/store/api/notificationsApi';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertOctagon,
} as const;

const PRIORITY_RING: Record<string, string> = {
  high: 'ring-2 ring-destructive/40',
  normal: '',
  low: 'opacity-90',
};

export const NotificationsInbox = () => {
  // Poll every 15s
  const { data, isLoading } = useNotificationsQuery(undefined, { pollingInterval: 15_000 });
  const [markRead] = useMarkReadMutation();
  const [markAll] = useMarkAllReadMutation();
  const items = data || [];
  const unread = items.filter((n) => !n.read).length;
  const unreadIds = items.filter((n) => !n.read).map((n) => n.id);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center ring-2 ring-background">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold">Notifications</span>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAll({ ids: unreadIds })}>
              <Check className="mr-1 h-3 w-3" /> Tout lire
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[420px]">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Aucune notification
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const Icon = ICONS[n.level] || Info;
                const tone =
                  n.level === 'success' ? 'text-success bg-success/10' :
                  n.level === 'warning' ? 'text-warning bg-warning/10' :
                  n.level === 'error' ? 'text-destructive bg-destructive/10' :
                  'text-primary bg-primary/10';
                const Wrapper = n.link ? Link : 'div';
                return (
                  <li key={n.id} className={cn('relative', !n.read && 'bg-primary/5')}>
                    <Wrapper
                      to={n.link as string}
                      onClick={() => !n.read && markRead({ id: n.id })}
                      className="flex gap-3 p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className={cn('h-9 w-9 rounded-full flex items-center justify-center shrink-0', tone, PRIORITY_RING[n.priority])}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm truncate">{n.title}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{relativeTime(n.createdAt)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                        {n.priority === 'high' && (
                          <span className="inline-block mt-1 text-[10px] uppercase font-bold text-destructive">Priorité haute</span>
                        )}
                      </div>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary self-center shrink-0" />}
                    </Wrapper>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" size="sm" className="w-full text-xs">
            <Link to="/app/notifications">Voir tout</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
