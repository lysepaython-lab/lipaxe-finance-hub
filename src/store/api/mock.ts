// In-memory mock backend that mimics the Lipaxe Django REST API shape.
// When VITE_API_URL is set, real endpoints are used instead.

import type { User } from '../slices/authSlice';

interface Wallet {
  id: string; currency: string; symbol: string;
  balance: number; available: number; pending: number;
}
interface Tx {
  id: string; type: 'deposit' | 'withdrawal' | 'transfer'; direction: 'in' | 'out';
  amount: number; currency: string; status: 'completed' | 'pending' | 'failed' | 'processing';
  description: string; counterparty: string; reference: string; createdAt: string; fee?: number;
  wallet_id?: string;
}
interface Activity { id: string; action: string; ip: string; device: string; createdAt: string; }
interface Notif {
  id: string; title: string; body: string;
  level: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'normal' | 'high';
  read: boolean; createdAt: string; link?: string;
}
interface UserCard {
  id: string; brand: 'Visa' | 'Mastercard'; number_masked: string;
  name_on_card: string; exp: string; balance: number; currency: string;
  status: 'active' | 'frozen' | 'inactive';
}

const RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, XOF: 605, NGN: 1580, GHS: 14.2,
  KES: 129, JPY: 156, CAD: 1.36, BIF: 2900, CDF: 2750,
};

let user: User = {
  id: 'u_1', email: 'demo@lipaxe.app', firstName: 'Alex', lastName: 'Morgan',
  username: 'alex.morgan', kycStatus: 'unverified',
};

// PIN required for sensitive actions. Demo PIN: 12345
let userPin: string = '12345';

let wallets: Wallet[] = [
  { id: 'w_usd', currency: 'USD', symbol: '$', balance: 12480.55, available: 12180.55, pending: 300 },
  { id: 'w_eur', currency: 'EUR', symbol: '€', balance: 4320.10, available: 4320.10, pending: 0 },
  { id: 'w_gbp', currency: 'GBP', symbol: '£', balance: 1875.00, available: 1875.00, pending: 0 },
  { id: 'w_bif', currency: 'BIF', symbol: 'FBu', balance: 2_400_000, available: 2_400_000, pending: 0 },
];

const now = Date.now();
const day = 86400000;
let transactions: Tx[] = [
  { id: 't1', type: 'deposit', direction: 'in', amount: 1250, currency: 'USD', status: 'completed', description: 'Card top-up', counterparty: 'Visa •• 4242', reference: 'DEP-9821', createdAt: new Date(now - day).toISOString(), wallet_id: 'w_usd' },
  { id: 't2', type: 'transfer', direction: 'out', amount: 480, currency: 'EUR', status: 'completed', description: 'To Marie Dubois', counterparty: '@marie.d', reference: 'TRF-7710', createdAt: new Date(now - day * 2).toISOString(), fee: 0, wallet_id: 'w_eur' },
  { id: 't3', type: 'withdrawal', direction: 'out', amount: 200, currency: 'USD', status: 'pending', description: 'Bank withdrawal', counterparty: 'Chase •• 8821', reference: 'WD-5512', createdAt: new Date(now - day * 3).toISOString(), fee: 1.5, wallet_id: 'w_usd' },
  { id: 't4', type: 'transfer', direction: 'in', amount: 950, currency: 'USD', status: 'completed', description: 'From John K.', counterparty: '@john.k', reference: 'TRF-7621', createdAt: new Date(now - day * 4).toISOString(), wallet_id: 'w_usd' },
  { id: 't5', type: 'transfer', direction: 'out', amount: 1500, currency: 'USD', status: 'completed', description: 'International to NGN', counterparty: 'Adaeze O.', reference: 'INTL-3301', createdAt: new Date(now - day * 5).toISOString(), fee: 8.5, wallet_id: 'w_usd' },
  { id: 't6', type: 'deposit', direction: 'in', amount: 600, currency: 'GBP', status: 'completed', description: 'Bank transfer', counterparty: 'HSBC', reference: 'DEP-9810', createdAt: new Date(now - day * 7).toISOString(), wallet_id: 'w_gbp' },
  { id: 't7', type: 'transfer', direction: 'out', amount: 75, currency: 'USD', status: 'failed', description: 'To @sam', counterparty: '@sam', reference: 'TRF-7560', createdAt: new Date(now - day * 9).toISOString(), wallet_id: 'w_usd' },
];

let activity: Activity[] = [
  { id: 'a1', action: 'Signed in', ip: '192.168.1.4', device: 'Chrome on macOS', createdAt: new Date(now - day).toISOString() },
  { id: 'a2', action: 'Password updated', ip: '192.168.1.4', device: 'Chrome on macOS', createdAt: new Date(now - day * 6).toISOString() },
  { id: 'a3', action: 'New device authorized', ip: '10.0.0.12', device: 'Safari on iPhone', createdAt: new Date(now - day * 10).toISOString() },
];

let cards: UserCard[] = [
  { id: 'vc1', brand: 'Visa', number_masked: '•••• •••• •••• 4242', name_on_card: 'ALEX MORGAN', exp: '12/27', balance: 482.5, currency: 'USD', status: 'active' },
  { id: 'vc2', brand: 'Mastercard', number_masked: '•••• •••• •••• 9908', name_on_card: 'ALEX MORGAN', exp: '08/26', balance: 1240, currency: 'USD', status: 'active' },
];

let notifications: Notif[] = [
  { id: 'n1', title: 'Payment received', body: 'You received $950 from John K.', level: 'success', priority: 'normal', read: false, createdAt: new Date(now - day).toISOString(), link: '/app/transactions' },
  { id: 'n2', title: 'KYC required', body: 'Verify your identity to unlock higher limits.', level: 'warning', priority: 'high', read: false, createdAt: new Date(now - day * 2).toISOString(), link: '/app/kyc' },
  { id: 'n3', title: 'New device', body: 'Sign-in from Safari on iPhone.', level: 'info', priority: 'low', read: true, createdAt: new Date(now - day * 5).toISOString(), link: '/app/activity' },
];

// ---------- Tontines (BusinessAll) ----------
interface Tontine {
  id: string; name: string; contribution: number; currency: string;
  frequency: 'weekly' | 'monthly'; duration_months: number;
  selection: 'random' | 'ordered';
  members: { user: string; received: boolean; position: number }[];
  next_beneficiary?: string; next_payout_at?: string;
  status: 'active' | 'completed';
}
let tontines: Tontine[] = [
  {
    id: 'tn1', name: 'Famille Lipaxe', contribution: 50, currency: 'USD', frequency: 'monthly', duration_months: 6, selection: 'ordered',
    members: [
      { user: '@alex', received: true, position: 1 },
      { user: '@marie.d', received: false, position: 2 },
      { user: '@john.k', received: false, position: 3 },
    ],
    next_beneficiary: '@marie.d', next_payout_at: new Date(now + day * 12).toISOString(), status: 'active',
  },
];

// ---------- FestiPay events ----------
interface FestiEvent {
  id: string; name: string; date: string; price: number; currency: string;
  attendees: number; cover: string; organizer: string;
}
let festiEvents: FestiEvent[] = [
  { id: 'e1', name: 'Lipaxe Summit 2025', date: '2025-03-14', price: 49, currency: 'USD', attendees: 312, cover: 'from-violet-500 to-fuchsia-600', organizer: 'Lipaxe' },
  { id: 'e2', name: 'Afro Fintech Night', date: '2025-04-02', price: 25, currency: 'USD', attendees: 145, cover: 'from-amber-500 to-rose-600', organizer: 'AfroPay' },
  { id: 'e3', name: 'Web3 & Money', date: '2025-05-10', price: 79, currency: 'USD', attendees: 580, cover: 'from-sky-500 to-emerald-600', organizer: 'CryptoCorp' },
];

// ---------- PayAll Bills ----------
const BILL_PROVIDERS = [
  { id: 'bp_regideso', name: 'Regideso (Eau)', category: 'water', country: 'BI' },
  { id: 'bp_snel', name: 'SNEL (Électricité)', category: 'electricity', country: 'CD' },
  { id: 'bp_orange_net', name: 'Orange Internet', category: 'internet', country: 'CD' },
  { id: 'bp_canal', name: 'Canal+', category: 'tv', country: 'CD' },
  { id: 'bp_vodacom', name: 'Vodacom Internet', category: 'internet', country: 'CD' },
];

// ---------- Crypto ----------
const CRYPTO_ASSETS = [
  { symbol: 'USDT', name: 'Tether', price_usd: 1, change_24h: 0.01 },
  { symbol: 'USDC', name: 'USD Coin', price_usd: 1, change_24h: 0 },
  { symbol: 'BTC', name: 'Bitcoin', price_usd: 67420, change_24h: 2.4 },
  { symbol: 'ETH', name: 'Ethereum', price_usd: 3210, change_24h: -0.8 },
];
const CRYPTO_NETWORKS: Record<string, { id: string; name: string; symbol: string }[]> = {
  USDT: [{ id: 'TRC20', name: 'TRON (TRC20)', symbol: 'TRX' }, { id: 'ERC20', name: 'Ethereum (ERC20)', symbol: 'ETH' }, { id: 'BEP20', name: 'BNB Smart Chain (BEP20)', symbol: 'BNB' }],
  USDC: [{ id: 'ERC20', name: 'Ethereum (ERC20)', symbol: 'ETH' }, { id: 'TRC20', name: 'TRON (TRC20)', symbol: 'TRX' }],
  BTC: [{ id: 'BTC', name: 'Bitcoin', symbol: 'BTC' }],
  ETH: [{ id: 'ERC20', name: 'Ethereum (ERC20)', symbol: 'ETH' }],
};

// ---------- QR token store ----------
interface QrToken { token: string; sender: string; amount: number; currency: string; wallet_id: string; expires_at: string; consumed: boolean; }
const qrTokens: Map<string, QrToken> = new Map();

const pushNotif = (n: Omit<Notif, 'id' | 'createdAt'>) => {
  notifications.unshift({ ...n, id: 'n' + Date.now(), createdAt: new Date().toISOString() });
};

  { name: 'France', alpha_2: 'FR', phone_code: '+33' },
  { name: 'United Kingdom', alpha_2: 'GB', phone_code: '+44' },
  { name: 'United States', alpha_2: 'US', phone_code: '+1' },
  { name: 'Nigeria', alpha_2: 'NG', phone_code: '+234' },
  { name: 'Ghana', alpha_2: 'GH', phone_code: '+233' },
  { name: 'Senegal', alpha_2: 'SN', phone_code: '+221' },
  { name: 'Kenya', alpha_2: 'KE', phone_code: '+254' },
  { name: 'Burundi', alpha_2: 'BI', phone_code: '+257' },
  { name: 'DR Congo', alpha_2: 'CD', phone_code: '+243' },
  { name: 'Japan', alpha_2: 'JP', phone_code: '+81' },
  { name: 'Canada', alpha_2: 'CA', phone_code: '+1' },
  { name: 'Germany', alpha_2: 'DE', phone_code: '+49' },
];

const PAYMENT_METHODS_DEPOSIT = [
  { id: 'pm_orange_cdf', name: 'Orange Money', payment_type: { name: 'Mobile Payment' }, type: 'mobile', countries: [{ country: { name: 'DR Congo', alpha_2: 'CD' } }, { country: { name: 'Burundi', alpha_2: 'BI' } }], fees: { fixed: 0, percent: 1.5 } },
  { id: 'pm_mtn', name: 'MTN Mobile Money', payment_type: { name: 'Mobile Payment' }, type: 'mobile', countries: [{ country: { name: 'Ghana', alpha_2: 'GH' } }, { country: { name: 'Nigeria', alpha_2: 'NG' } }, { country: { name: 'Burundi', alpha_2: 'BI' } }], fees: { fixed: 0, percent: 1.5 } },
  { id: 'pm_wave', name: 'Wave', payment_type: { name: 'Mobile Payment' }, type: 'mobile', countries: [{ country: { name: 'Senegal', alpha_2: 'SN' } }, { country: { name: 'Kenya', alpha_2: 'KE' } }], fees: { fixed: 0, percent: 1 } },
  { id: 'pm_visa', name: 'Visa / Mastercard', payment_type: { name: 'Bank Transfer' }, type: 'card', countries: COUNTRIES.map((c) => ({ country: { name: c.name, alpha_2: c.alpha_2 } })), fees: { fixed: 0.3, percent: 2.9 } },
  { id: 'pm_amex', name: 'American Express', payment_type: { name: 'Bank Transfer' }, type: 'card', countries: COUNTRIES.map((c) => ({ country: { name: c.name, alpha_2: c.alpha_2 } })), fees: { fixed: 0.3, percent: 3.5 } },
  { id: 'pm_paypal', name: 'PayPal', payment_type: { name: 'Electronic' }, type: 'electronic', countries: [{ country: { name: 'France', alpha_2: 'FR' } }, { country: { name: 'United States', alpha_2: 'US' } }, { country: { name: 'Germany', alpha_2: 'DE' } }], fees: { fixed: 0, percent: 3.4 } },
  { id: 'pm_payeer', name: 'Payeer', payment_type: { name: 'Electronic' }, type: 'electronic', countries: COUNTRIES.map((c) => ({ country: { name: c.name, alpha_2: c.alpha_2 } })), fees: { fixed: 0, percent: 1.95 } },
  { id: 'pm_stripe', name: 'Stripe', payment_type: { name: 'Electronic' }, type: 'electronic', countries: COUNTRIES.map((c) => ({ country: { name: c.name, alpha_2: c.alpha_2 } })), fees: { fixed: 0.3, percent: 2.9 } },
  { id: 'pm_usdt_trc20', name: 'USDT (TRC20)', payment_type: { name: 'Cryptos' }, type: 'crypto', countries: COUNTRIES.map((c) => ({ country: { name: c.name, alpha_2: c.alpha_2 } })), fees: { fixed: 1, percent: 0 } },
  { id: 'pm_usdt_erc20', name: 'USDT (ERC20)', payment_type: { name: 'Cryptos' }, type: 'crypto', countries: COUNTRIES.map((c) => ({ country: { name: c.name, alpha_2: c.alpha_2 } })), fees: { fixed: 5, percent: 0 } },
];

const PAYMENT_METHODS_WITHDRAW = [
  { id: 'pm_orange_cdf', name: 'Orange Money', payment_type: { name: 'Mobile Payment' }, type: 'mobile', countries: [{ country: { name: 'DR Congo', alpha_2: 'CD' } }, { country: { name: 'Burundi', alpha_2: 'BI' } }], fees: { fixed: 0.5, percent: 0.5 } },
  { id: 'pm_mtn', name: 'MTN Mobile Money', payment_type: { name: 'Mobile Payment' }, type: 'mobile', countries: [{ country: { name: 'Ghana', alpha_2: 'GH' } }, { country: { name: 'Burundi', alpha_2: 'BI' } }], fees: { fixed: 0.5, percent: 0.5 } },
  { id: 'pm_visa_wd', name: 'Visa / Mastercard', payment_type: { name: 'Bank Transfer' }, type: 'card', countries: COUNTRIES.map((c) => ({ country: { name: c.name, alpha_2: c.alpha_2 } })), fees: { fixed: 1, percent: 0.5 } },
  { id: 'pm_amex_wd', name: 'American Express', payment_type: { name: 'Bank Transfer' }, type: 'card', countries: COUNTRIES.map((c) => ({ country: { name: c.name, alpha_2: c.alpha_2 } })), fees: { fixed: 1, percent: 0.7 } },
  { id: 'pm_paypal_wd', name: 'PayPal', payment_type: { name: 'Electronic' }, type: 'electronic', countries: COUNTRIES.map((c) => ({ country: { name: c.name, alpha_2: c.alpha_2 } })), fees: { fixed: 0, percent: 2.5 } },
  { id: 'pm_payeer_wd', name: 'Payeer', payment_type: { name: 'Electronic' }, type: 'electronic', countries: COUNTRIES.map((c) => ({ country: { name: c.name, alpha_2: c.alpha_2 } })), fees: { fixed: 0, percent: 1.5 } },
  { id: 'pm_stripe_wd', name: 'Stripe', payment_type: { name: 'Electronic' }, type: 'electronic', countries: COUNTRIES.map((c) => ({ country: { name: c.name, alpha_2: c.alpha_2 } })), fees: { fixed: 0.3, percent: 2.9 } },
  { id: 'pm_usdt_wd_trc20', name: 'USDT (TRC20)', payment_type: { name: 'Cryptos' }, type: 'crypto', countries: COUNTRIES.map((c) => ({ country: { name: c.name, alpha_2: c.alpha_2 } })), fees: { fixed: 1, percent: 0 } },
  { id: 'pm_usdt_wd_erc20', name: 'USDT (ERC20)', payment_type: { name: 'Cryptos' }, type: 'crypto', countries: COUNTRIES.map((c) => ({ country: { name: c.name, alpha_2: c.alpha_2 } })), fees: { fixed: 5, percent: 0 } },
];

const ok = <T,>(data: T): T => structuredClone(data);

function feeFor(amount: number, kind: 'internal' | 'international' | 'card' | 'mobile') {
  if (kind === 'internal') return 0;
  if (kind === 'international') return Math.max(1, amount * 0.0085);
  if (kind === 'card') return Math.max(0.3, amount * 0.029);
  return Math.max(0.5, amount * 0.005);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function mockHandler(url: string, method: string, body: any): Promise<unknown> {
  // ---------- AUTH (legacy + Django-style) ---------------------------------
  if ((url === '/auth/login/' || url === '/api/jwt/create/') && method === 'POST') {
    if (!body?.email || !body?.password) throw new Error('Missing credentials');
    return ok({ user, access: 'mock-access-token', refresh: 'mock-refresh-token' });
  }
  if (url === '/api/jwt/refresh/' && method === 'POST') {
    return ok({ access: 'mock-access-token-refreshed' });
  }
  if ((url === '/auth/register/' || url === '/api/user/') && method === 'POST') {
    user = { ...user, email: body.email, firstName: body.first_name || body.firstName || user.firstName, lastName: body.last_name || body.lastName || user.lastName };
    return ok({ user, access: 'mock-access-token', refresh: 'mock-refresh-token' });
  }
  if (url === '/auth/forgot-password/' && method === 'POST') return ok({ detail: 'Reset link sent' });
  if (url === '/auth/reset-password/' && method === 'POST') return ok({ detail: 'Password updated' });
  if (url === '/api/users/reset_password/' && method === 'POST') return ok({ detail: 'Reset link sent' });
  if (url === '/api/users/reset_password_confirm/' && method === 'POST') return ok({ detail: 'Password updated' });
  if (url === '/auth/verify-email/' && method === 'POST') {
    if (body?.otp === '123456') return ok({ detail: 'Email verified', verified: true });
    throw new Error('Invalid or expired code');
  }
  if (url === '/auth/resend-otp/' && method === 'POST') return ok({ detail: 'Code resent', otp: '123456' });
  if (url === '/auth/me/' && method === 'GET') return ok(user);
  if (url === '/api/user/me/' && method === 'GET') return ok(user);
  if (url === '/api/user/me/' && method === 'PUT') {
    // FormData → naive merge if body has keys
    return ok(user);
  }

  // ---------- PIN ----------------------------------------------------------
  if (url === '/api/verify-pin/' && method === 'POST') {
    if (body?.pin === userPin) return ok({ valid: true });
    throw new Error('PIN incorrect');
  }
  if (url === '/api/update-pin/' && method === 'POST') {
    if (!/^\d{5}$/.test(body?.pin || '')) throw new Error('Le PIN doit contenir 5 chiffres');
    userPin = body.pin;
    return ok({ detail: 'PIN updated' });
  }

  // ---------- COUNTRIES ----------------------------------------------------
  if (url === '/api/kyc/incountries/' && method === 'GET') {
    return ok({ data: COUNTRIES.map((c) => ({ country: c })) });
  }

  // ---------- KYC ----------------------------------------------------------
  if (url === '/api/kyc/useraddress/' && method === 'GET') {
    return ok({ status: user.kycStatus });
  }
  if (
    (url === '/api/kyc/useraddress/' ||
      url === '/api/kyc/useraddress/infospersons/' ||
      url === '/api/kyc/useraddress/documents/' ||
      url === '/api/kyc/useraddress/finances/') &&
    method === 'POST'
  ) {
    user = { ...user, kycStatus: 'pending' };
    return ok({ detail: 'Saved' });
  }
  if (url === '/api/kyc/phoneverify/' && method === 'POST') {
    if (body?.otp === '123456') return ok({ detail: 'Phone verified' });
    throw new Error('OTP invalide');
  }
  if (url === '/api/kyc/vivacite/' && method === 'POST') {
    // Mock: accept any FormData with at least some frames; randomly succeed.
    const success = Math.random() > 0.15;
    if (success) {
      return ok({ is_live: true, blink_valid: true, blinks_detected: true, head_movement: true, smile_detected: true, error: null });
    }
    return ok({ is_live: false, blink_valid: false, blinks_detected: false, head_movement: true, smile_detected: false, error: null });
  }

  // Legacy combined KYC submit
  if (url === '/kyc/submit/' && method === 'POST') {
    user = { ...user, kycStatus: 'pending' };
    return ok({ status: 'pending', user });
  }

  // ---------- WALLETS ------------------------------------------------------
  if ((url === '/wallets/' || url === '/api/v2/wallets/') && method === 'GET') return ok(wallets);

  // ---------- TRANSACTIONS -------------------------------------------------
  if ((url === '/transactions/' || url === '/api/transactions/') && method === 'GET') return ok(transactions);

  // ---------- PAYMENT METHODS ---------------------------------------------
  if (url === '/api/transactions/payment-methods/deposit/' && method === 'GET') return ok(PAYMENT_METHODS_DEPOSIT);
  if (url === '/api/transactions/payment-methods/withdrawal/' && method === 'GET') return ok(PAYMENT_METHODS_WITHDRAW);
  if (url === '/api/transactions/payment-methods/international/' && method === 'GET') return ok(PAYMENT_METHODS_DEPOSIT.filter(p => p.type !== 'crypto'));

  // ---------- FX -----------------------------------------------------------
  if (url.startsWith('/fx/quote') && method === 'POST') {
    const { from, to, amount } = body;
    const rate = (RATES[to] || 1) / (RATES[from] || 1);
    const fee = Math.max(0.5, amount * 0.0085);
    return ok({ from, to, amount, rate: Number(rate.toFixed(4)), fee: Number(fee.toFixed(2)), receive: Number(((amount - fee) * rate).toFixed(2)) });
  }

  // ---------- DEPOSIT ------------------------------------------------------
  if ((url === '/deposits/' || url === '/api/transactions/deposit/' || url === '/api/transactions/card/' || url === '/api/transactions/electronic/' || url === '/api/transactions/crypto/' || url === '/api/providers/deposit/afripay/' || url === '/api/providers/deposit/afripay/confirm/') && method === 'POST') {
    const w = wallets.find((x) => x.id === body.wallet_id) || wallets.find((x) => x.currency === body.currency);
    if (!w) throw new Error('Wallet introuvable');
    const fee = feeFor(body.amount, body.payment_method?.includes('card') ? 'card' : 'mobile');
    const tx: Tx = {
      id: 'd' + Date.now(), type: 'deposit', direction: 'in', amount: body.amount, currency: w.currency,
      status: 'pending', description: `Deposit via ${body.payment_method || body.method || 'mobile'}`,
      counterparty: body.payment_method || body.method || 'mobile',
      reference: 'DEP-' + Math.floor(Math.random() * 9000 + 1000),
      createdAt: new Date().toISOString(), fee, wallet_id: w.id,
    };
    transactions.unshift(tx);
    w.pending += body.amount;
    // Simulate async confirmation after a short delay (handled by polling on FE)
    setTimeout(() => {
      const t = transactions.find((x) => x.id === tx.id);
      if (t) { t.status = 'completed'; w.pending -= body.amount; w.balance += body.amount; w.available += body.amount; }
    }, 4000);
    return ok(tx);
  }

  // ---------- WITHDRAW -----------------------------------------------------
  if ((url === '/withdrawals/' || url === '/api/transactions/withdrawal/') && method === 'POST') {
    const w = wallets.find((x) => x.id === body.wallet_id) || wallets.find((x) => x.currency === body.currency);
    if (!w) throw new Error('Wallet introuvable');
    const fee = feeFor(body.amount, 'mobile');
    if (w.available < body.amount + fee) throw new Error('Solde insuffisant');
    const tx: Tx = {
      id: 'w' + Date.now(), type: 'withdrawal', direction: 'out', amount: body.amount, currency: w.currency,
      status: 'processing', description: 'Withdrawal to ' + (body.destination || body.payment_method),
      counterparty: body.destination || body.payment_method,
      reference: 'WD-' + Math.floor(Math.random() * 9000 + 1000),
      createdAt: new Date().toISOString(), fee, wallet_id: w.id,
    };
    transactions.unshift(tx);
    w.available -= body.amount + fee;
    w.balance -= body.amount + fee;
    setTimeout(() => { const t = transactions.find((x) => x.id === tx.id); if (t) t.status = 'completed'; }, 4000);
    return ok(tx);
  }

  // ---------- TRANSFER -----------------------------------------------------
  if ((url === '/transfers/' || url === '/api/transactions/transfert/') && method === 'POST') {
    const w = wallets.find((x) => x.id === body.wallet_id) || wallets.find((x) => x.currency === body.fromCurrency);
    if (!w) throw new Error('Wallet introuvable');
    const fee = body.kind === 'international' ? feeFor(body.amount, 'international') : 0;
    if (w.available < body.amount + fee) throw new Error('Solde insuffisant');
    const tx: Tx = {
      id: 'tr' + Date.now(), type: 'transfer', direction: 'out', amount: body.amount, currency: w.currency,
      status: 'completed', description: body.kind === 'international' ? `International to ${body.toCurrency}` : `To ${body.recipient || body.to_account}`,
      counterparty: body.recipient || body.to_account,
      reference: (body.kind === 'international' ? 'INTL-' : 'TRF-') + Math.floor(Math.random() * 9000 + 1000),
      createdAt: new Date().toISOString(), fee, wallet_id: w.id,
    };
    transactions.unshift(tx);
    w.available -= body.amount + fee;
    w.balance -= body.amount + fee;
    return ok(tx);
  }
  if (url === '/api/transactions/transfertlinkqrcode/' && method === 'POST') {
    return ok({ token: 'qr_' + Math.random().toString(36).slice(2, 10), amount: body.amount, currency: body.currency });
  }
  if (url === '/api/transactions/validate/' && method === 'POST') {
    if (!body?.token) throw new Error('Token requis');
    return ok({ detail: 'Validated', amount: 50, currency: 'USD' });
  }
  if (url === '/api/transactions/lookup/' && method === 'POST') {
    const acc = String(body?.account_no || '').trim();
    if (!acc) throw new Error('Compte requis');
    // Simulate "not found" for very short or numeric-only weird strings sometimes
    if (acc.length < 3) throw new Error('Destinataire introuvable');
    const seed = acc.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4) || 'user';
    const name =
      acc.startsWith('@')
        ? acc.slice(1).split('.').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
        : `${seed.charAt(0).toUpperCase()}${seed.slice(1)} Lipaxe`;
    return ok({ account_no: acc, name, verified: true });
  }

  // ---------- CARDS --------------------------------------------------------
  if (url === '/api/virtual-cards/' && method === 'GET') {
    return ok([
      { id: 'offer_visa_lite', brand: 'Visa', name: 'Visa Lite', price: 5, currency: 'USD', monthly_fee: 0, description: 'For everyday small purchases.' },
      { id: 'offer_visa_plus', brand: 'Visa', name: 'Visa Plus', price: 10, currency: 'USD', monthly_fee: 1, description: 'Higher limits and 3D-Secure.' },
      { id: 'offer_mc_world', brand: 'Mastercard', name: 'Mastercard World', price: 15, currency: 'USD', monthly_fee: 2, description: 'Premium cashback worldwide.' },
    ]);
  }
  if (url === '/api/cards/' && method === 'GET') return ok(cards);
  if (url.startsWith('/api/card/') && url.endsWith('/transactions/') && method === 'GET') {
    return ok([
      { id: 'ct1', amount: 12.5, currency: 'USD', description: 'Spotify', status: 'completed', createdAt: new Date(now - day).toISOString() },
      { id: 'ct2', amount: 49, currency: 'USD', description: 'Amazon', status: 'completed', createdAt: new Date(now - day * 2).toISOString() },
      { id: 'ct3', amount: 7.2, currency: 'USD', description: 'Uber', status: 'pending', createdAt: new Date(now - day * 3).toISOString() },
    ]);
  }
  if (url === '/api/order-cards/' && method === 'POST') {
    const id = 'vc' + Date.now();
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    const card: UserCard = {
      id, brand: 'Visa', number_masked: `•••• •••• •••• ${last4}`,
      name_on_card: body.name_on_card || `${user.firstName} ${user.lastName}`.toUpperCase(),
      exp: '12/29', balance: body.funding_amount || 0, currency: 'USD', status: 'active',
    };
    cards.unshift(card);
    return ok(card);
  }
  if (url === '/api/recharge-cards/' && method === 'POST') {
    const c = cards.find((x) => x.id === body.card_id);
    if (!c) throw new Error('Card not found');
    c.balance += body.amount;
    return ok({ detail: 'Card recharged' });
  }
  if (url === '/api/card/withdrawal-card/' && method === 'POST') {
    const c = cards.find((x) => x.id === body.card_id);
    if (!c) throw new Error('Card not found');
    if (c.balance < body.amount) throw new Error('Solde insuffisant sur la carte');
    c.balance -= body.amount;
    return ok({ detail: 'Withdrawn from card' });
  }
  if (url === '/api/card/freeze-card/' && method === 'POST') {
    const c = cards.find((x) => x.id === body.card_id);
    if (!c) throw new Error('Card not found');
    c.status = body.action === 'freeze' ? 'frozen' : 'active';
    return ok(c);
  }

  // ---------- NOTIFICATIONS -----------------------------------------------
  if (url === '/api/notifications/' && method === 'GET') return ok(notifications);
  if (url === '/api/notifications/makeasread/' && method === 'POST') {
    const n = notifications.find((x) => x.id === body.id);
    if (n) n.read = true;
    return ok({ detail: 'OK' });
  }

  // ---------- AFFILIATION --------------------------------------------------
  if (url === '/api/affiliate-code/' && method === 'GET') {
    return ok({ code: 'LIPAXE-' + (user.username || 'demo').toUpperCase(), link: `${typeof window !== 'undefined' ? window.location.origin : ''}/register?reference=LIPAXE-${(user.username || 'demo').toUpperCase()}`, total_referrals: 7 });
  }
  if (url === '/api/commissions/' && method === 'GET') {
    return ok([
      { id: 'cm1', amount: 10, currency: 'USD', from_user: 'Marie D.', status: 'paid', createdAt: new Date(now - day * 2).toISOString() },
      { id: 'cm2', amount: 10, currency: 'USD', from_user: 'John K.', status: 'paid', createdAt: new Date(now - day * 5).toISOString() },
      { id: 'cm3', amount: 10, currency: 'USD', from_user: 'Sam P.', status: 'pending', createdAt: new Date(now - day * 1).toISOString() },
    ]);
  }

  // ---------- ACTIVITY -----------------------------------------------------
  if (url === '/activity/' && method === 'GET') return ok(activity);

  throw new Error(`Mock route not implemented: ${method} ${url}`);
}
