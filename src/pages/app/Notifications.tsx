import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCircle2, Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { relativeTime } from '@/lib/format';
import { useNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } from '@/store/api/notificationsApi';
import { cn } from '@/lib/utils';

const ICONS = { success: CheckCircle2, info: Info, warning: AlertTriangle, error: AlertOctagon } as const;

const Notifications = () => {
  const { t } = useTranslation();
  const { data: items, isLoading } = useNotificationsQuery(undefined, { pollingInterval: 20_000 });
  const [markRead] = useMarkReadMutation();
  const [markAll] = useMarkAllReadMutation();
  const list = items || [];
  const unreadIds = list.filter((n) => !n.read).map((n) => n.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">{t('notifications.title')}</h1>
        {unreadIds.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAll({ ids: unreadIds })}>{t('notifications.markRead')}</Button>
        )}
      </div>
      <Card className="shadow-elegant border-border/60">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : list.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground"><Bell className="h-8 w-8 mx-auto mb-2" />{t('notifications.empty')}</div>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((n) => {
                const Icon = ICONS[n.level] || Info;
                const tone =
                  n.level === 'success' ? 'text-success bg-success/10' :
                  n.level === 'warning' ? 'text-warning bg-warning/10' :
                  n.level === 'error' ? 'text-destructive bg-destructive/10' :
                  'text-primary bg-primary/10';
                const Wrapper = n.link ? Link : 'div';
                return (
                  <li key={n.id} className={cn('transition-smooth hover:bg-muted/30', !n.read && 'bg-primary/5')}>
                    <Wrapper to={n.link as string} onClick={() => !n.read && markRead({ id: n.id })} className="flex gap-4 p-4">
                      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', tone, n.priority === 'high' && 'ring-2 ring-destructive/40')}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{n.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{relativeTime(n.createdAt)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                        {n.priority === 'high' && <span className="inline-block mt-1 text-[10px] uppercase font-bold text-destructive">Priorité haute</span>}
                      </div>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary self-center shrink-0" />}
                    </Wrapper>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
