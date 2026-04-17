import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppLayout = () => (
  <div className="flex min-h-screen bg-background">
    <Sidebar />
    <div className="flex flex-1 flex-col min-w-0">
      <Topbar />
      <main className="flex-1 p-4 lg:p-8 max-w-[1400px] w-full mx-auto animate-fade-in">
        <Outlet />
      </main>
    </div>
  </div>
);
