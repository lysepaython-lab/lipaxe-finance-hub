import { CreditCard, LayoutDashboard, LogOut, Repeat, Send, Settings, User as UserIcon, Users2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationsInbox } from './security/NotificationsInbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

const mainNav = [
  { to: '/app', key: 'dashboard', icon: LayoutDashboard, match: ['/app'] },
  { to: '/app/cards/virtual', key: 'cards', icon: CreditCard, match: ['/app/cards'] },
  { to: '/app/transfer', key: 'transfer', icon: Send, match: ['/app/transfer'] },
  { to: '/app/payments/payall', key: 'payAll', icon: Users2, match: ['/app/payments', '/app/savings', '/app/strone/business'] },
  { to: '/app/strone/exchange', key: 'lipaxeExchange', icon: Repeat, match: ['/app/strone/exchange', '/app/strone/cryptos', '/app/strone/vaults'] },
  { to: '/app/settings', key: 'settings', icon: Settings, match: ['/app/settings'] },
];

export const Topbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'LX';

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
        <LanguageSwitcher />
        <ThemeToggle />
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-semibold">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-muted-foreground font-normal">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/app/profile')}>
              <UserIcon className="mr-2 h-4 w-4" /> {t('nav.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/settings')}>
              <UserIcon className="mr-2 h-4 w-4" /> {t('nav.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
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
