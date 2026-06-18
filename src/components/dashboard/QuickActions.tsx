import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, Coins, 
  CreditCard,
   QrCode, Send,Wallet,
   Vault,RefreshCw,Sprout } from 'lucide-react';
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

    { to: '/app/payments/festipay', label:t('nav.festiPay'), icon: QrCode, tone: 'from-brand-500 to-brand-900' },
    { to: '/app/strone/business', label: t('nav.businessAll'), icon: CreditCard, tone: 'from-brand-400 to-brand-700' },
    { to: '/app/savings', label: t('nav.savings'), icon: Wallet, tone: 'from-brand-300 to-brand-600' },
    { to: '/app/strone/vaults', label: t('nav.yieldVaults'), icon: Vault, tone: 'from-brand-500 to-brand-900' },
    { to: '/app/strone/exchange', label: t('nav.swap'), icon: RefreshCw, tone: 'from-brand-400 to-brand-700' },
    { to: '/app/affiliation', label: t('nav.earn'), icon: Sprout, tone: 'from-brand-300 to-brand-600' },


  ];

  return (
    <Card className="w-full min-w-0 overflow-hidden border-border/60 shadow-elegant">
      <CardHeader className="px-3 pb-2 pt-4 sm:px-6">
        <CardTitle className="font-display text-lg">{t('dashboard.quickActions')}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 overflow-hidden px-3 pb-4 sm:px-6">
        <div className="grid min-w-0 grid-cols-1 gap-2 min-[390px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
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
              className="group block w-full min-w-0 text-left"
            >
              <div className={`relative flex min-w-0 items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-br ${action.tone} px-2.5 py-2.5 text-white shadow-sm transition-smooth hover:-translate-y-0.5 hover:shadow-brand sm:px-3 sm:py-3`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/14 ring-1 ring-white/15">
                  <action.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 truncate text-xs font-semibold sm:text-sm">{action.label}</span>
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
