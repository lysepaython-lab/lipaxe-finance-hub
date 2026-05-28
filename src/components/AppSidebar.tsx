import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bitcoin,
  Briefcase,
  CreditCard,
  Gift,
  Globe2,
  History,
  Landmark,
  LayoutDashboard,
  Menu,
  Network,
  Nfc,
  PartyPopper,
  PiggyBank,
  QrCode,
  Receipt,
  Repeat,
  Send,
  Settings,
  ShieldCheck,
  UserCircle2,
  Users2,
  Wallet,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import { useGetKycDataQuery } from '@/store/api/kycApi';
import { getKycState } from '@/lib/kycStatus';

type Item = { to: string; key: string; icon: React.ComponentType<{ className?: string }>; end?: boolean };
type Group = { key: string; items: Item[] };

const groups: Group[] = [
  {
    key: 'main',
    items: [
      { to: '/app', key: 'dashboard', icon: LayoutDashboard, end: true },
      { to: '/app/transactions', key: 'transactions', icon: Receipt },
      { to: '/app/deposit', key: 'deposit', icon: ArrowDownToLine },
      { to: '/app/withdraw', key: 'withdraw', icon: ArrowUpFromLine },
    ],
  },
  {
    key: 'cards',
    items: [
      { to: '/app/cards/virtual', key: 'virtualCard', icon: CreditCard },
      { to: '/app/cards/my', key: 'myCards', icon: Wallet },
      { to: '/app/cards/gift', key: 'giftCards', icon: Gift },
      { to: '/app/cards/nfc', key: 'nfcCards', icon: Nfc },
    ],
  },
  {
    key: 'transfers',
    items: [
      { to: '/app/transfer', key: 'internalTransfer', icon: Send },
      { to: '/app/transfer/international', key: 'internationalTransfer', icon: Globe2 },
      { to: '/app/transfer/qr', key: 'transferQr', icon: QrCode },
      { to: '/app/transfer/nfc', key: 'transferNfc', icon: Nfc },
    ],
  },
  {
    key: 'payments',
    items: [
      { to: '/app/payments/payall', key: 'payAll', icon: Users2 },
      { to: '/app/payments/festipay', key: 'festiPay', icon: PartyPopper },
    ],
  },
  {
    key: 'strone',
    items: [
      { to: '/app/strone/exchange', key: 'lipaxeExchange', icon: Repeat },
      { to: '/app/strone/business', key: 'businessAll', icon: Briefcase },
      { to: '/app/strone/cryptos', key: 'lipaxeCryptos', icon: Bitcoin },
      { to: '/app/strone/vaults', key: 'yieldVaults', icon: Landmark },
    ],
  },
  {
    key: 'account',
    items: [
      { to: '/app/savings', key: 'savings', icon: PiggyBank },
      { to: '/app/profile', key: 'profile', icon: UserCircle2 },
      { to: '/app/kyc', key: 'kyc', icon: ShieldCheck },
      { to: '/app/affiliation', key: 'affiliation', icon: Users2 },
      { to: '/app/activity', key: 'activity', icon: History },
      { to: '/app/security', key: 'security', icon: ShieldCheck },
      { to: '/app/settings', key: 'settings', icon: Settings },
    ],
  },
];

const desktopItems: Item[] = groups.flatMap((group) => group.items).filter((item, index, items) => (
  items.findIndex((candidate) => candidate.to === item.to) === index
));

const NavItem = ({ item, compact = false }: { item: Item; compact?: boolean }) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={cn(
        compact
          ? 'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold'
          : 'relative flex min-w-[104px] flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold',
        active
          ? 'bg-primary/16 text-primary shadow-sm ring-1 ring-primary/15'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className={compact ? 'h-5 w-5' : 'h-5 w-5'} />
      <span className="whitespace-nowrap">{t(`nav.${item.key}`)}</span>
      {active && !compact && <span className="absolute bottom-0 h-0.5 w-9 rounded-full bg-primary" />}
    </NavLink>
  );
};

export const AppSidebar = () => {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const { data: kycData } = useGetKycDataQuery();
  const kycState = getKycState(kycData, user);

  return (
    <div className="sticky top-[76px] z-20 border-b border-border/70 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto hidden max-w-[1500px] gap-2 overflow-x-auto px-4 py-2 md:flex">
        {desktopItems
          .filter((item) => item.key !== 'kyc' || !kycState.locked)
          .map((item) => <NavItem key={item.to} item={item} />)}
      </div>

      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-3 py-3 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="rounded-2xl">
              <Menu className="mr-2 h-4 w-4" />
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] overflow-y-auto p-4">
            <SheetHeader className="mb-5 text-left">
              <Logo size={38} />
              <SheetTitle className="sr-only">Lipaxe menu</SheetTitle>
            </SheetHeader>
            <div className="space-y-6">
              {groups.map((group) => {
                const visibleItems = group.items.filter((item) => item.key !== 'kyc' || !kycState.locked);
                if (!visibleItems.length) return null;
                return (
                  <section key={group.key} className="space-y-2">
                    <p className="px-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                      {t(`nav.${group.key}`, group.key)}
                    </p>
                    <div className="grid gap-1">
                      {visibleItems.map((item) => <NavItem key={item.to} item={item} compact />)}
                    </div>
                  </section>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
        <div className="text-sm font-semibold text-muted-foreground">Lipaxe</div>
      </div>
    </div>
  );
};

export default AppSidebar;
