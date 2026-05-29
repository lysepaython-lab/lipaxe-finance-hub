import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, Coins, CreditCard, QrCode, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    { to: '/app/cards/virtual', label: t('nav.cards'), icon: CreditCard, tone: 'from-brand-400 to-brand-700' },
    { to: '/app/strone/cryptos', label: 'Crypto', icon: Coins, tone: 'from-brand-300 to-brand-600' },
  ];

  return (
    <Card className="hidden overflow-hidden border-border/60 shadow-elegant md:block">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg">{t('dashboard.quickActions')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-6">
          {actions.map((action, index) => (
            <motion.button
              key={action.to}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035, duration: 0.25 }}
              onClick={() => {
                const needsPin = ['/app/deposit', '/app/withdraw', '/app/transfer', '/app/transfer/qr'].includes(action.to);
                if (needsPin) pin.guard(() => navigate(action.to));
                else navigate(action.to);
              }}
              className="group block w-full text-left"
            >
              <div className={`relative flex items-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-br ${action.tone} px-3 py-3 text-white shadow-sm transition-smooth hover:-translate-y-0.5 hover:shadow-brand`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/14 ring-1 ring-white/15">
                  <action.icon className="h-4 w-4" />
                </span>
                <span className="truncate text-sm font-semibold">{action.label}</span>
                <span className="absolute -bottom-6 -right-5 h-16 w-16 rounded-full bg-white/15 blur-xl transition-smooth group-hover:bg-white/25" />
              </div>
            </motion.button>
          ))}
        </div>
      </CardContent>
      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </Card>
  );
};
