import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import { SessionTimeoutGuard } from './security/SessionTimeoutGuard';
import { useNotificationsStream } from '@/hooks/useNotificationsStream';
import { useDeviceRegistration } from '@/hooks/useDeviceRegistration';

export const AppLayout = () => {
  const location = useLocation();
  useNotificationsStream();
  useDeviceRegistration();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_32%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.62))]">
        <Topbar />
        <AppSidebar />
        <main className="mx-auto w-full min-w-0 max-w-[1500px] flex-1 overflow-x-hidden p-3 pb-8 sm:p-4 lg:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="min-w-0 overflow-hidden rounded-[28px] border border-border/50 bg-card/65 p-3 shadow-sm backdrop-blur-[2px] sm:p-4 lg:p-5"
          >
            <Outlet />
          </motion.div>
        </main>
        <SessionTimeoutGuard />
      </div>
    </SidebarProvider>
  );
};

