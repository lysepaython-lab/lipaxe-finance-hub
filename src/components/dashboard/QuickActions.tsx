import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownToLine, ArrowUpFromLine, Send, QrCode, CreditCard, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { PinModal, usePinGate } from '@/components/security/PinModal';

export const QuickActions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pin = usePinGate();
  const actions = [
    { to: '/app/deposit', label: t('nav.deposit'), icon: ArrowDownToLine, tone: 'from-brand-400/90 to-brand-600' },
    { to: '/app/withdraw', label: t('nav.withdraw'), icon: ArrowUpFromLine, tone: 'from-brand-500 to-brand-700' },
    { to: '/app/transfer', label: t('nav.transfer'), icon: Send, tone: 'from-brand-600 to-brand-800' },
    { to: '/app/transfer/qr', label: 'QR Pay', icon: QrCode, tone: 'from-brand-500 to-brand-900' },
    { to: '/app/cards/virtual', label: 'Carte', icon: CreditCard, tone: 'from-brand-400 to-brand-700' },
    { to: '/app/strone/cryptos', label: 'Crypto', icon: Coins, tone: 'from-brand-300 to-brand-600' },
  ];
  return (
    <Card className="hidden md:block shadow-elegant border-border/60 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="font-display flex items-center justify-between">
          <span>{t('dashboard.quickActions')}</span>
          <span className="text-xs font-normal text-muted-foreground">Accès rapide</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5">
          {actions.map((a, i) => (
            <motion.div
              key={a.to}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <button
                type="button"
                onClick={() => {
                  const needsPin = ['/app/deposit', '/app/withdraw', '/app/transfer', '/app/transfer/qr'].includes(a.to);
                  if (needsPin) pin.guard(() => navigate(a.to));
                  else navigate(a.to);
                }}
                className="group block w-full text-left"
              >
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${a.tone} p-3.5 text-white shadow-md transition-smooth hover:shadow-brand hover:-translate-y-1 hover:scale-[1.02] aspect-square flex flex-col justify-between`}>
                  <a.icon className="h-5 w-5 opacity-95" />
                  <div className="font-semibold text-xs leading-tight">{a.label}</div>
                  <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-white/15 blur-xl group-hover:bg-white/25 transition-smooth" />
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </CardContent>
      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </Card>
  );
};
