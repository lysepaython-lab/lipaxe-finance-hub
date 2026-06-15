import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { store } from "./store";
import { useAppSelector } from "./store/hooks";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { HostRedirect } from "./components/HostRedirect";
import { MaintenanceOverlay } from "./components/MaintenanceOverlay";
import { buildAppUrl } from "./config/site";
import { getPendingVerification } from "./lib/pendingVerification";
import "./i18n";

import LaunchScreen from "./pages/LaunchScreen";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import Dashboard from "./pages/app/Dashboard";
import Transactions from "./pages/app/Transactions";
import TransactionDetail from "./pages/app/TransactionDetail";
import Deposit from "./pages/app/Deposit";
import Withdraw from "./pages/app/Withdraw";
import Transfer from "./pages/app/Transfer";
import TransferQr from "./pages/app/transfer/TransferQr";
import VirtualCard from "./pages/app/cards/VirtualCard";
import MyCards from "./pages/app/cards/MyCards";
import GiftCards from "./pages/app/cards/GiftCards";
import PayAll from "./pages/app/payments/PayAll";
import FestiPay from "./pages/app/payments/FestiPay";
import Exchange from "./pages/app/strone/Exchange";
import BusinessAll from "./pages/app/strone/BusinessAll";
import Cryptos from "./pages/app/strone/Cryptos";
import Profile from "./pages/app/Profile";
import Affiliation from "./pages/app/Affiliation";
import Kyc from "./pages/app/Kyc";
import Notifications from "./pages/app/Notifications";
import Activity from "./pages/app/Activity";
import Settings from "./pages/app/Settings";
import Security from "./pages/app/Security";
import SavingsHub from "./pages/app/savings/SavingsHub";
import SavingsDetail from "./pages/app/savings/SavingsDetail";
import YieldVaultHub from "./pages/app/vaults/YieldVaultHub";
import YieldVaultDetail from "./pages/app/vaults/YieldVaultDetail";
import PublicQrLanding from "./pages/PublicQrLanding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PathRedirect = ({ buildTarget }: { buildTarget: (path: string) => string }) => {
  const location = useLocation();
  return <HostRedirect to={buildTarget(`${location.pathname}${location.search}${location.hash}`)} />;
};

const PublicAuthRoute = ({ children }: { children: JSX.Element }) => {
  const token = useAppSelector((s) => s.auth.accessToken);
  const pending = getPendingVerification();
  if (token) return <Navigate to="/app" replace />;
  if (pending?.userId) return <Navigate to="/verify-email" replace />;
  return children;
};

const VerifyEmailRoute = ({ children }: { children: JSX.Element }) => {
  const token = useAppSelector((s) => s.auth.accessToken);
  const pending = getPendingVerification();
  if (token) return <Navigate to="/app" replace />;
  if (!pending?.userId || !pending.email) return <Navigate to="/register" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LaunchScreen />} />
    <Route path="/login" element={<PublicAuthRoute><Login /></PublicAuthRoute>} />
    <Route path="/register" element={<PublicAuthRoute><Register /></PublicAuthRoute>} />
    <Route path="/verify-email" element={<VerifyEmailRoute><VerifyEmail /></VerifyEmailRoute>} />
    <Route path="/forgot-password" element={<PublicAuthRoute><ForgotPassword /></PublicAuthRoute>} />
    <Route path="/reset-password" element={<PublicAuthRoute><ResetPassword /></PublicAuthRoute>} />
    <Route path="/pay/:token" element={<PublicQrLanding />} />

    <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="transactions" element={<Transactions />} />
      <Route path="transactions/:id" element={<TransactionDetail />} />
      <Route path="savings" element={<SavingsHub />} />
      <Route path="savings/:id" element={<SavingsDetail />} />
      <Route path="deposit" element={<Deposit />} />
      <Route path="withdraw" element={<Withdraw />} />
      <Route path="transfer" element={<Transfer />} />
      <Route path="transfer/international" element={<Transfer />} />
      <Route path="transfer/qr" element={<TransferQr />} />
      <Route path="transfer/nfc" element={<Navigate to="/app/transfer" replace />} />
      <Route path="cards/virtual" element={<VirtualCard />} />
      <Route path="cards/my" element={<MyCards />} />
      <Route path="cards/gift" element={<GiftCards />} />
      <Route path="cards/nfc" element={<Navigate to="/app/cards/virtual" replace />} />
      <Route path="payments/payall" element={<PayAll />} />
      <Route path="payments/festipay" element={<FestiPay />} />
      <Route path="strone/exchange" element={<Exchange />} />
      <Route path="strone/business" element={<BusinessAll />} />
      <Route path="strone/cryptos" element={<Cryptos />} />
      <Route path="strone/vaults" element={<YieldVaultHub />} />
      <Route path="strone/vaults/:id" element={<YieldVaultDetail />} />
      <Route path="profile" element={<Profile />} />
      <Route path="affiliation" element={<Affiliation />} />
      <Route path="kyc" element={<Kyc />} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="activity" element={<Activity />} />
      <Route path="settings" element={<Settings />} />
      <Route path="security" element={<Security />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <Provider store={store}>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" />
          <BrowserRouter>
            <AppRoutes />
            <MaintenanceOverlay />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </Provider>
);

export default App;
