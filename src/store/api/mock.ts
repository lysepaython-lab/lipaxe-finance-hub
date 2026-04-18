// In-memory mock backend that mimics a Django REST API shape.
// When VITE_API_URL is set, real endpoints are used instead.

import type { User } from '../slices/authSlice';

interface Wallet { currency: string; symbol: string; balance: number; available: number; pending: number; }
interface Tx {
  id: string; type: 'deposit' | 'withdrawal' | 'transfer'; direction: 'in' | 'out';
  amount: number; currency: string; status: 'completed' | 'pending' | 'failed' | 'processing';
  description: string; counterparty: string; reference: string; createdAt: string; fee?: number;
}
interface Activity { id: string; action: string; ip: string; device: string; createdAt: string; }

const RATES: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79, XOF: 605, NGN: 1580, GHS: 14.2, KES: 129, JPY: 156, CAD: 1.36 };

let user: User = {
  id: 'u_1', email: 'demo@lipaxe.app', firstName: 'Alex', lastName: 'Morgan',
  username: 'alex.morgan', kycStatus: 'unverified',
};

let wallets: Wallet[] = [
  { currency: 'USD', symbol: '$', balance: 12480.55, available: 12180.55, pending: 300 },
  { currency: 'EUR', symbol: '€', balance: 4320.10, available: 4320.10, pending: 0 },
  { currency: 'GBP', symbol: '£', balance: 1875.00, available: 1875.00, pending: 0 },
];

const now = Date.now();
const day = 86400000;
let transactions: Tx[] = [
  { id: 't1', type: 'deposit', direction: 'in', amount: 1250, currency: 'USD', status: 'completed', description: 'Card top-up', counterparty: 'Visa •• 4242', reference: 'DEP-9821', createdAt: new Date(now - day).toISOString() },
  { id: 't2', type: 'transfer', direction: 'out', amount: 480, currency: 'EUR', status: 'completed', description: 'To Marie Dubois', counterparty: '@marie.d', reference: 'TRF-7710', createdAt: new Date(now - day * 2).toISOString(), fee: 0 },
  { id: 't3', type: 'withdrawal', direction: 'out', amount: 200, currency: 'USD', status: 'pending', description: 'Bank withdrawal', counterparty: 'Chase •• 8821', reference: 'WD-5512', createdAt: new Date(now - day * 3).toISOString(), fee: 1.5 },
  { id: 't4', type: 'transfer', direction: 'in', amount: 950, currency: 'USD', status: 'completed', description: 'From John K.', counterparty: '@john.k', reference: 'TRF-7621', createdAt: new Date(now - day * 4).toISOString() },
  { id: 't5', type: 'transfer', direction: 'out', amount: 1500, currency: 'USD', status: 'completed', description: 'International to NGN', counterparty: 'Adaeze O.', reference: 'INTL-3301', createdAt: new Date(now - day * 5).toISOString(), fee: 8.5 },
  { id: 't6', type: 'deposit', direction: 'in', amount: 600, currency: 'GBP', status: 'completed', description: 'Bank transfer', counterparty: 'HSBC', reference: 'DEP-9810', createdAt: new Date(now - day * 7).toISOString() },
  { id: 't7', type: 'transfer', direction: 'out', amount: 75, currency: 'USD', status: 'failed', description: 'To @sam', counterparty: '@sam', reference: 'TRF-7560', createdAt: new Date(now - day * 9).toISOString() },
];

let activity: Activity[] = [
  { id: 'a1', action: 'Signed in', ip: '192.168.1.4', device: 'Chrome on macOS', createdAt: new Date(now - day).toISOString() },
  { id: 'a2', action: 'Password updated', ip: '192.168.1.4', device: 'Chrome on macOS', createdAt: new Date(now - day * 6).toISOString() },
  { id: 'a3', action: 'New device authorized', ip: '10.0.0.12', device: 'Safari on iPhone', createdAt: new Date(now - day * 10).toISOString() },
];

const ok = (data: any) => structuredClone(data);

export async function mockHandler(url: string, method: string, body: any) {
  // Auth
  if (url === '/auth/login/' && method === 'POST') {
    if (!body?.email || !body?.password) throw new Error('Missing credentials');
    return ok({ user, access: 'mock-access-token', refresh: 'mock-refresh-token' });
  }
  if (url === '/auth/register/' && method === 'POST') {
    user = { ...user, email: body.email, firstName: body.firstName || user.firstName, lastName: body.lastName || user.lastName };
    return ok({ user, access: 'mock-access-token', refresh: 'mock-refresh-token' });
  }
  if (url === '/auth/forgot-password/' && method === 'POST') return ok({ detail: 'Reset link sent' });
  if (url === '/auth/reset-password/' && method === 'POST') return ok({ detail: 'Password updated' });
  if (url === '/auth/verify-email/' && method === 'POST') {
    // Demo: 123456 is the valid code
    if (body?.otp === '123456') return ok({ detail: 'Email verified', verified: true });
    throw new Error('Invalid or expired code');
  }
  if (url === '/auth/resend-otp/' && method === 'POST') return ok({ detail: 'Code resent', otp: '123456' });
  if (url === '/auth/me/' && method === 'GET') return ok(user);

  // Wallets
  if (url === '/wallets/' && method === 'GET') return ok(wallets);

  // Transactions
  if (url === '/transactions/' && method === 'GET') return ok(transactions);
  if (url.startsWith('/transactions/') && method === 'GET') {
    const id = url.split('/')[2];
    const tx = transactions.find(t => t.id === id);
    if (!tx) throw new Error('Not found');
    return ok(tx);
  }

  // FX
  if (url.startsWith('/fx/quote') && method === 'POST') {
    const { from, to, amount } = body;
    const rate = (RATES[to] || 1) / (RATES[from] || 1);
    const fee = Math.max(0.5, amount * 0.0085);
    return ok({ from, to, amount, rate: Number(rate.toFixed(4)), fee: Number(fee.toFixed(2)), receive: Number(((amount - fee) * rate).toFixed(2)) });
  }

  // Deposit
  if (url === '/deposits/' && method === 'POST') {
    const tx: Tx = {
      id: 'd' + Date.now(), type: 'deposit', direction: 'in', amount: body.amount, currency: body.currency,
      status: 'pending', description: body.method === 'card' ? 'Card top-up' : body.method === 'bank' ? 'Bank transfer' : 'Mobile money',
      counterparty: body.method, reference: 'DEP-' + Math.floor(Math.random() * 9000 + 1000), createdAt: new Date().toISOString(), fee: 0,
    };
    transactions.unshift(tx);
    const w = wallets.find(w => w.currency === body.currency);
    if (w) { w.pending += body.amount; w.balance += body.amount; }
    return ok(tx);
  }

  // Withdraw
  if (url === '/withdrawals/' && method === 'POST') {
    const fee = Math.max(0.5, body.amount * 0.005);
    const tx: Tx = {
      id: 'w' + Date.now(), type: 'withdrawal', direction: 'out', amount: body.amount, currency: body.currency,
      status: 'processing', description: 'Withdrawal to ' + body.destination, counterparty: body.destination,
      reference: 'WD-' + Math.floor(Math.random() * 9000 + 1000), createdAt: new Date().toISOString(), fee,
    };
    transactions.unshift(tx);
    const w = wallets.find(w => w.currency === body.currency);
    if (w) { w.available -= body.amount + fee; w.balance -= body.amount + fee; }
    return ok(tx);
  }

  // Transfer
  if (url === '/transfers/' && method === 'POST') {
    const fee = body.kind === 'international' ? Math.max(1, body.amount * 0.0085) : 0;
    const tx: Tx = {
      id: 'tr' + Date.now(), type: 'transfer', direction: 'out', amount: body.amount, currency: body.fromCurrency,
      status: 'completed', description: body.kind === 'international' ? `International to ${body.toCurrency}` : `To ${body.recipient}`,
      counterparty: body.recipient, reference: (body.kind === 'international' ? 'INTL-' : 'TRF-') + Math.floor(Math.random() * 9000 + 1000),
      createdAt: new Date().toISOString(), fee,
    };
    transactions.unshift(tx);
    const w = wallets.find(w => w.currency === body.fromCurrency);
    if (w) { w.available -= body.amount + fee; w.balance -= body.amount + fee; }
    return ok(tx);
  }

  // KYC
  if (url === '/kyc/submit/' && method === 'POST') {
    user = { ...user, kycStatus: 'pending' };
    return ok({ status: 'pending', user });
  }

  // Activity
  if (url === '/activity/' && method === 'GET') return ok(activity);

  throw new Error(`Mock route not implemented: ${method} ${url}`);
}
