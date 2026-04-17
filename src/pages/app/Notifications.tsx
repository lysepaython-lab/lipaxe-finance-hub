import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { markAllRead } from '@/store/slices/notificationsSlice';
import { Bell, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { relativeTime } from '@/lib/format';

const iconFor = (k: string) => k === 'success' ? CheckCircle2 : k === 'warning' ? AlertTriangle : Info;
const colorFor = (k: string) => k === 'success' ? 'text-success bg-success/10' : k === 'warning' ? 'text-warning bg-warning/10' : 'text-primary bg-brand-100 dark:bg-brand-900/40';

const Notifications = () => {
  const { t } = useTranslation();
  const items = useAppSelector(s => s.notifications.items);
  const dispatch = useAppDispatch();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">{t('notifications.title')}</h1>
        <Button variant="outline" size="sm" onClick={() => dispatch(markAllRead())}>{t('notifications.markRead')}</Button>
      </div>
      <Card className="shadow-elegant border-border/60">
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground"><Bell className="h-8 w-8 mx-auto mb-2" />{t('notifications.empty')}</div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map(n => {
                const Icon = iconFor(n.kind);
                return (
                  <li key={n.id} className={`flex gap-4 p-4 transition-smooth hover:bg-muted/30 ${!n.read ? 'bg-brand-50/40 dark:bg-brand-900/10' : ''}`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorFor(n.kind)}`}><Icon className="h-5 w-5" /></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{n.title}</span>
                        <span className="text-xs text-muted-foreground">{relativeTime(n.createdAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                    </div>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary self-center" />}
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
