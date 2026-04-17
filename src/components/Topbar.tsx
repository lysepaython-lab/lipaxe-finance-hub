import { Bell, Menu, Search, LogOut, User as UserIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { logout } from '@/store/slices/authSlice';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Topbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAppSelector(s => s.auth.user);
  const unread = useAppSelector(s => s.notifications.items.filter(n => !n.read).length);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'LX';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
      <Button variant="ghost" size="icon" onClick={() => dispatch(toggleSidebar())}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden md:flex relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('common.search')} className="pl-9 bg-muted/50 border-0 focus-visible:ring-1" />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <Link to="/app/notifications">
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground shadow-brand transition-smooth hover:scale-105">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-muted-foreground font-normal">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/app/settings')}>
              <UserIcon className="mr-2 h-4 w-4" /> {t('nav.settings')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { dispatch(logout()); navigate('/login'); }}>
              <LogOut className="mr-2 h-4 w-4" /> {t('nav.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
