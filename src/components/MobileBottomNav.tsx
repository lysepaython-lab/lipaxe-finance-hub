import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, QrCode, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * Mobile-first bottom navigation, mirrors a native app feel.
 * Hidden ≥md — desktop relies on the sidebar + dashboard QuickActions.
 */
export const MobileBottomNav = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const items = [
    { to: '/app', label: t('nav.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/app/deposit', label: t('nav.deposit'), icon: ArrowDownToLine },
    { to: '/app/transfer/qr', label: 'QR', icon: QrCode, big: true },
    { to: '/app/withdraw', label: t('nav.withdraw'), icon: ArrowUpFromLine },
    { to: '/app/cards/virtual', label: 'Cards', icon: CreditCard },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-border bg-background/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Bottom navigation"
    >
      <ul className="grid grid-cols-5 px-1 pt-1.5">
        {items.map((it) => {
          const active = it.end ? pathname === it.to : pathname.startsWith(it.to);
          const Icon = it.icon;
          if (it.big) {
            return (
              <li key={it.to} className="flex justify-center -mt-6">
                <NavLink to={it.to} aria-label={it.label} className="group">
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    className="h-14 w-14 rounded-2xl bg-gradient-brand shadow-brand flex items-center justify-center text-primary-foreground ring-4 ring-background"
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>
                </NavLink>
              </li>
            );
          }
          return (
            <li key={it.to}>
              <NavLink
                to={it.to}
                end={it.end}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate max-w-full">{it.label}</span>
                {active && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    className="absolute -top-0.5 h-1 w-8 rounded-full bg-primary"
                  />
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
