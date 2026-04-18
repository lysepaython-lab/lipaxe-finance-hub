import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { store } from "./store";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import "./i18n";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import Dashboard from "./pages/app/Dashboard";
import Transactions from "./pages/app/Transactions";
import Deposit from "./pages/app/Deposit";
import Withdraw from "./pages/app/Withdraw";
import Transfer from "./pages/app/Transfer";
import TransferQr from "./pages/app/transfer/TransferQr";
import TransferNfc from "./pages/app/transfer/TransferNfc";
import VirtualCard from "./pages/app/cards/VirtualCard";
import GiftCards from "./pages/app/cards/GiftCards";
import NfcCards from "./pages/app/cards/NfcCards";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="deposit" element={<Deposit />} />
                <Route path="withdraw" element={<Withdraw />} />
                <Route path="transfer" element={<Transfer />} />
                <Route path="transfer/international" element={<Transfer />} />
                <Route path="transfer/qr" element={<TransferQr />} />
                <Route path="transfer/nfc" element={<TransferNfc />} />
                <Route path="cards/virtual" element={<VirtualCard />} />
                <Route path="cards/gift" element={<GiftCards />} />
                <Route path="cards/nfc" element={<NfcCards />} />
                <Route path="payments/payall" element={<PayAll />} />
                <Route path="payments/festipay" element={<FestiPay />} />
                <Route path="strone/exchange" element={<Exchange />} />
                <Route path="strone/business" element={<BusinessAll />} />
                <Route path="strone/cryptos" element={<Cryptos />} />
                <Route path="profile" element={<Profile />} />
                <Route path="affiliation" element={<Affiliation />} />
                <Route path="kyc" element={<Kyc />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="activity" element={<Activity />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route path="/dashboard" element={<Navigate to="/app" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </Provider>
);

export default App;
