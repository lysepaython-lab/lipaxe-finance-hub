import { LogOut, Search, User as UserIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationsInbox } from './security/NotificationsInbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { SidebarTrigger } from './ui/sidebar';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Topbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'LX';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/80 bg-background/72 px-4 backdrop-blur-xl lg:px-6">
      <SidebarTrigger className="text-foreground" />

      <div className="hidden md:flex relative max-w-md flex-1 ml-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('common.search')}
          className="rounded-xl border-border/60 bg-card/75 pl-9 shadow-sm focus-visible:ring-1"
        />
      </div>

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
