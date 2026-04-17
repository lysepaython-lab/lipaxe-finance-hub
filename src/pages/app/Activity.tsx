import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { useActivityQuery } from '@/store/api/walletApi';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/format';
import { Activity as ActivityIcon, Monitor } from 'lucide-react';

const Activity = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useActivityQuery();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('activity.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('activity.subtitle')}</p>
      </div>
      <Card className="shadow-elegant border-border/60">
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-12"/>)}</div> : (
            <ul className="divide-y divide-border">
              {(data || []).map(a => (
                <li key={a.id} className="flex items-center gap-4 p-4">
                  <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-primary flex items-center justify-center"><ActivityIcon className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <div className="font-medium">{a.action}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5"><Monitor className="h-3 w-3" />{a.device} · {a.ip}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Activity;
