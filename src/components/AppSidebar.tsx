import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CreditCard, Send, Wallet, Network, User,
  ArrowDownToLine, ArrowUpFromLine, Gift, Nfc, QrCode, Globe2,
  Users2, PartyPopper, Repeat, Briefcase, Bitcoin, Receipt,
  Settings, ShieldCheck, History, UserCircle2, ChevronDown,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

type Item = { to: string; key: string; icon: React.ComponentType<{ className?: string }>; end?: boolean };
type Group = { key: string; icon: React.ComponentType<{ className?: string }>; items: Item[] } | { single: Item };

const groups: Group[] = [
  { single: { to: '/app', key: 'dashboard', icon: LayoutDashboard, end: true } },
  {
    key: 'cards',
    icon: CreditCard,
    items: [
      { to: '/app/cards/virtual', key: 'virtualCard', icon: CreditCard },
      { to: '/app/cards/gift', key: 'giftCards', icon: Gift },
      { to: '/app/cards/nfc', key: 'nfcCards', icon: Nfc },
    ],
  },
  {
    key: 'transfers',
    icon: Send,
    items: [
      { to: '/app/transfer', key: 'internalTransfer', icon: Repeat },
      { to: '/app/transfer/international', key: 'internationalTransfer', icon: Globe2 },
      { to: '/app/transfer/qr', key: 'transferQr', icon: QrCode },
      { to: '/app/transfer/nfc', key: 'transferNfc', icon: Nfc },
    ],
  },
  {
    key: 'payments',
    icon: Wallet,
    items: [
      { to: '/app/payments/payall', key: 'payAll', icon: Users2 },
      { to: '/app/payments/festipay', key: 'festiPay', icon: PartyPopper },
    ],
  },
  {
    key: 'strone',
    icon: Network,
    items: [
      { to: '/app/strone/exchange', key: 'lipaxeExchange', icon: Repeat },
      { to: '/app/strone/business', key: 'businessAll', icon: Briefcase },
      { to: '/app/strone/cryptos', key: 'lipaxeCryptos', icon: Bitcoin },
    ],
  },
  {
    key: 'account',
    icon: User,
    items: [
      { to: '/app/transactions', key: 'transactions', icon: Receipt },
      { to: '/app/deposit', key: 'deposit', icon: ArrowDownToLine },
      { to: '/app/withdraw', key: 'withdraw', icon: ArrowUpFromLine },
      { to: '/app/profile', key: 'profile', icon: UserCircle2 },
      { to: '/app/kyc', key: 'kyc', icon: ShieldCheck },
      { to: '/app/affiliation', key: 'affiliation', icon: Users2 },
      { to: '/app/activity', key: 'activity', icon: History },
      { to: '/app/settings', key: 'settings', icon: Settings },
      { to: '/app/security', key: 'security', icon: ShieldCheck },
    ],
  },
];

export const AppSidebar = () => {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const path = location.pathname;

  // Open the group that matches current path by default
  const initialOpen: Record<string, boolean> = {};
  groups.forEach((g) => {
    if ('items' in g) initialOpen[g.key] = g.items.some((i) => path.startsWith(i.to));
  });
  const [open, setOpen] = useState(initialOpen);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-16 px-4 flex items-center border-b border-sidebar-border">
        <Logo compact={collapsed} />
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {groups.map((g, idx) => {
                if ('single' in g) {
                  const { to, key, icon: Icon, end } = g.single;
                  const active = end ? path === to : path.startsWith(to);
                  return (
                    <SidebarMenuItem key={key}>
                      <SidebarMenuButton asChild isActive={active} tooltip={t(`nav.${key}`)}>
                        <NavLink to={to} end={end} className="font-medium">
                          <Icon className="h-[18px] w-[18px]" />
                          <span>{t(`nav.${key}`)}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
                const { key, icon: Icon, items } = g;
                const isOpen = open[key];
                const groupActive = items.some((i) => path === i.to || path.startsWith(i.to + '/'));
                return (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton
                      onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
                      isActive={groupActive}
                      tooltip={t(`nav.${key}`)}
                      className="font-medium"
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      <span className="flex-1 text-left">{t(`nav.${key}`)}</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-muted-foreground transition-transform duration-200',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </SidebarMenuButton>
                    <AnimatePresence initial={false}>
                      {isOpen && !collapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <SidebarMenuSub>
                            {items.map((sub) => {
                              const subActive = path === sub.to || path.startsWith(sub.to + '/');
                              return (
                                <SidebarMenuSubItem key={sub.to}>
                                  <SidebarMenuSubButton asChild isActive={subActive}>
                                    <NavLink to={sub.to}>
                                      <sub.icon className="h-4 w-4" />
                                      <span>{t(`nav.${sub.key}`)}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="p-3">
          <div className="rounded-xl bg-gradient-hero p-4 text-primary-foreground">
            <p className="font-display text-sm font-semibold">{t('dashboard.verifyPrompt')}</p>
            <NavLink
              to="/app/kyc"
              className="mt-2 inline-flex text-xs underline underline-offset-2 hover:opacity-80"
            >
              {t('dashboard.verifyNow')} →
            </NavLink>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};

export default AppSidebar;
