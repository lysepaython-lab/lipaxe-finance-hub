import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import { SessionTimeoutGuard } from './security/SessionTimeoutGuard';
import { MobileBottomNav } from './MobileBottomNav';
import { useNotificationsStream } from '@/hooks/useNotificationsStream';
import { useDeviceRegistration } from '@/hooks/useDeviceRegistration';

export const AppLayout = () => {
  const location = useLocation();
  useNotificationsStream();
  useDeviceRegistration();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-4 lg:p-8 max-w-[1500px] w-full mx-auto pb-24 md:pb-8">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
        <MobileBottomNav />
        <SessionTimeoutGuard />
      </div>
    </SidebarProvider>
  );
};

