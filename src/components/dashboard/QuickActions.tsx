import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine, ArrowUpFromLine, Send, Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const QuickActions = () => {
  const { t } = useTranslation();
  const actions = [
    { to: '/app/deposit', label: t('nav.deposit'), icon: ArrowDownToLine, gradient: 'from-brand-400 to-brand-600' },
    { to: '/app/withdraw', label: t('nav.withdraw'), icon: ArrowUpFromLine, gradient: 'from-brand-500 to-brand-700' },
    { to: '/app/transfer', label: t('nav.transfer'), icon: Send, gradient: 'from-brand-600 to-brand-800' },
    { to: '/app/transfer?intl=1', label: 'Global', icon: Globe2, gradient: 'from-brand-700 to-brand-900' },
  ];
  return (
    <Card className="shadow-elegant border-border/60">
      <CardHeader><CardTitle className="font-display">{t('dashboard.quickActions')}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((a) => (
            <Link key={a.to} to={a.to} className="group">
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${a.gradient} p-4 text-white shadow-md transition-smooth hover:shadow-brand hover:-translate-y-0.5`}>
                <a.icon className="h-6 w-6 mb-6 opacity-90" />
                <div className="font-semibold">{a.label}</div>
                <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
