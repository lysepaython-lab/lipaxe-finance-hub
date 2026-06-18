import { Copy, Globe, LayoutDashboard, LogOut, Moon, Repeat, Send, Settings, ShieldCheck, Sun, User as UserIcon, Users2, CreditCard as CardIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { NotificationsInbox } from './security/NotificationsInbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { setLanguage } from '@/store/slices/uiSlice';
import { toast } from 'sonner';

const mainNav = [
  { to: '/app', key: 'dashboard', icon: LayoutDashboard, match: ['/app'] },
  { to: '/app/cards/virtual', key: 'cards', icon: CardIcon, match: ['/app/cards'] },
  { to: '/app/transfer', key: 'transfer', icon: Send, match: ['/app/transfer'] },
  { to: '/app/payments/payall', key: 'payAll', icon: Users2, match: ['/app/payments', '/app/savings', '/app/strone/business'] },
  { to: '/app/strone/exchange', key: 'lipaxeExchange', icon: Repeat, match: ['/app/strone/exchange', '/app/strone/cryptos', '/app/strone/vaults'] },
  { to: '/app/affiliation', key: 'affiliation', icon: Users2, match: ['/app/affiliation'] },
];

export const Topbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const currentLanguage = useAppSelector((s) => s.ui.language);
  const { theme, toggle } = useTheme();

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'LX';
  const copyAccountNo = async () => {
    const accountNo = user?.username || '';
    if (!accountNo) return;
    await navigator.clipboard.writeText(accountNo);
    toast.success(t('profile.accountCopied', { defaultValue: 'Account number copied' }));
  };

  const toggleLanguage = () => {
    const nextLanguage = currentLanguage === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(nextLanguage);
    dispatch(setLanguage(nextLanguage));
  };

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 bg-primary px-4 text-primary-foreground shadow-sm lg:px-8">
      <Logo size={42} textClassName="text-primary-foreground text-2xl" />

      <nav className="ml-4 hidden min-w-0 flex-1 items-center justify-center gap-1.5 lg:flex">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = item.match.some((match) => (
            match === '/app' ? location.pathname === '/app' : location.pathname.startsWith(match)
          ));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-primary-foreground/78 hover:bg-white/10 hover:text-primary-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{t(`nav.${item.key}`)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <NotificationsInbox />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground shadow-brand transition-smooth hover:scale-105">
              {user?.avatar ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}${user.avatar}`}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 overflow-hidden rounded-3xl border-border/70 p-0 shadow-2xl">
            <DropdownMenuLabel className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                  {user?.avatar ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${user.avatar}`}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-display text-base font-bold">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="truncate text-xs font-normal text-muted-foreground">
                    ID : {user?.username || user?.email}
                  </div>
                  {user?.kycStatus === 'verified' && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                      <ShieldCheck className="h-3 w-3" /> Compte vérifié
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.username && (
              <DropdownMenuItem className="px-4 py-3" onClick={copyAccountNo}>
                <Copy className="mr-2 h-4 w-4 text-primary" /> Copier l'ID : {user.username}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="px-4 py-3" onClick={() => navigate('/app/profile')}>
              <UserIcon className="mr-2 h-4 w-4 text-primary" /> {t('nav.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem className="px-4 py-3" onClick={() => navigate('/app/settings')}>
              <Settings className="mr-2 h-4 w-4 text-primary" /> {t('nav.settings')}
            </DropdownMenuItem>
            <DropdownMenuItem className="px-4 py-3" onClick={toggleLanguage}>
              <Globe className="mr-2 h-4 w-4 text-primary" />
              {t('common.language')} : {currentLanguage === 'fr' ? t('common.french') : t('common.english')}
            </DropdownMenuItem>
            <DropdownMenuItem className="px-4 py-3" onClick={toggle}>
              {theme === 'light' ? <Moon className="mr-2 h-4 w-4 text-primary" /> : <Sun className="mr-2 h-4 w-4 text-primary" />}
              {t('common.theme')} : {theme === 'light' ? t('common.light') : t('common.dark')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="px-4 py-3 text-destructive focus:text-destructive"
              onClick={() => {
                dispatch(logout());
                navigate('/login');
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> {t('nav.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
