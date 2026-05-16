import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, Send, Receipt, ShieldCheck, Bell, Activity, Settings, X } from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSidebar } from '@/store/slices/uiSlice';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { useGetKycDataQuery } from '@/store/api/kycApi';
import { getKycState } from '@/lib/kycStatus';

const items = [
  { to: '/app', key: 'dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/transactions', key: 'transactions', icon: Receipt },
  { to: '/app/deposit', key: 'deposit', icon: ArrowDownToLine },
  { to: '/app/withdraw', key: 'withdraw', icon: ArrowUpFromLine },
  { to: '/app/transfer', key: 'transfer', icon: Send },
  { to: '/app/kyc', key: 'kyc', icon: ShieldCheck },
  { to: '/app/notifications', key: 'notifications', icon: Bell },
  { to: '/app/activity', key: 'activity', icon: Activity },
  { to: '/app/settings', key: 'settings', icon: Settings },
];

export const Sidebar = () => {
  const open = useAppSelector(s => s.ui.sidebarOpen);
  const user = useAppSelector(s => s.auth.user);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const location = useLocation();
  const { data: kycData } = useGetKycDataQuery();
  const kycState = getKycState(kycData, user);
  const visibleItems = items.filter((item) => item.key !== 'kyc' || !kycState.locked);

  // Close mobile drawer on nav
  const onNav = () => { if (window.innerWidth < 1024) dispatch(setSidebar(false)); };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden" onClick={() => dispatch(setSidebar(false))} />}
      <aside
        className={cn(
          'fixed lg:sticky top-0 z-50 h-screen w-72 shrink-0 border-r border-sidebar-border bg-sidebar transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
          <Logo />
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => dispatch(setSidebar(false))}><X className="h-5 w-5" /></Button>
        </div>

        <nav className="p-4 space-y-1">
          {visibleItems.map(({ to, key, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNav}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth',
                isActive
                  ? 'bg-gradient-brand text-primary-foreground shadow-brand'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{t(`nav.${key}`)}</span>
            </NavLink>
          ))}
        </nav>

        {(kycState.needsVerification || kycState.underReview) && (
          <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-gradient-hero p-4 text-primary-foreground">
            <p className="font-display text-sm font-semibold">
              {kycState.underReview ? t('dashboard.kycPendingTitle') : t('dashboard.verifyPrompt')}
            </p>
            {kycState.needsVerification ? (
              <NavLink to="/app/kyc" className="mt-2 inline-flex text-xs underline underline-offset-2 hover:opacity-80">
                {t('dashboard.verifyNow')} →
              </NavLink>
            ) : (
              <p className="mt-2 text-xs opacity-80">{t('dashboard.kycPending')}</p>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
