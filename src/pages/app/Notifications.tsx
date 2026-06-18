import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, Bell, CheckCircle2, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { relativeTime } from '@/lib/format';
import { PaymentMethodMark } from '@/lib/moneyVisuals';
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">{t('notifications.title')}</h1>
        {unreadIds.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAll({ ids: unreadIds })}>
            {t('notifications.markRead')}
          </Button>
        )}
      </div>

      <Card className="overflow-hidden border-border/60 shadow-elegant">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : list.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Bell className="mx-auto mb-2 h-8 w-8" />
              {t('notifications.empty')}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((n) => {
                const Icon = ICONS[n.level] || Info;
                const tone =
                  n.level === 'success' ? 'bg-success/10 text-success' :
                  n.level === 'warning' ? 'bg-warning/10 text-warning' :
                  n.level === 'error' ? 'bg-destructive/10 text-destructive' :
                  'bg-primary/10 text-primary';
                const Wrapper = n.link ? Link : 'div';
                const markName = [n.paymentMethodName, n.provider, n.kind, n.title, n.body].filter(Boolean).join(' ');
                const logo = n.paymentMethodLogo || n.logo;

                return (
                  <li key={n.id} className={cn('transition-smooth hover:bg-muted/30', !n.read && 'bg-primary/5')}>
                    <Wrapper
                      to={n.link as string}
                      onClick={() => !n.read && markRead({ id: n.id })}
                      className="flex min-w-0 gap-3 p-4 sm:gap-4"
                    >
                      <div className="relative shrink-0">
                        <PaymentMethodMark logo={logo} name={markName} className="h-11 w-11" />
                        <span className={cn('absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card', tone)}>
                          <Icon className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-semibold">{n.title}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(n.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{n.body}</p>
                        {(n.paymentMethodName || n.provider) && (
                          <p className="mt-1 truncate text-xs font-semibold text-primary">
                            {n.paymentMethodName || n.provider}
                          </p>
                        )}
                        {n.priority === 'high' && (
                          <span className="mt-1 inline-block text-[10px] font-bold uppercase text-destructive">Priorite haute</span>
                        )}
                      </div>
                      {!n.read && <span className="h-2 w-2 shrink-0 self-center rounded-full bg-primary" />}
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
