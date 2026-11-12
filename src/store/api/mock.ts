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
  username: 'alex.morgan', kycStatus: 'unverified', isPin: true,
};

// PIN required for sensitive actions. Demo PIN: 12345
let userPin: string = '12345';

const wallets: Wallet[] = [
  { id: 'w_usd', currency: 'USD', symbol: '$', balance: 12480.55, available: 12180.55, pending: 300 },
  { id: 'w_eur', currency: 'EUR', symbol: '€', balance: 4320.10, available: 4320.10, pending: 0 },
  { id: 'w_gbp', currency: 'GBP', symbol: '£', balance: 1875.00, available: 1875.00, pending: 0 },
  { id: 'w_bif', currency: 'BIF', symbol: 'FBu', balance: 2_400_000, available: 2_400_000, pending: 0 },
];

const now = Date.now();
const day = 86400000;
const transactions: Tx[] = [
  { id: 't1', type: 'deposit', direction: 'in', amount: 1250, currency: 'USD', status: 'completed', description: 'Card top-up', counterparty: 'Visa •• 4242', reference: 'DEP-9821', createdAt: new Date(now - day).toISOString(), wallet_id: 'w_usd' },
  { id: 't2', type: 'transfer', direction: 'out', amount: 480, currency: 'EUR', status: 'completed', description: 'To Marie Dubois', counterparty: '@marie.d', reference: 'TRF-7710', createdAt: new Date(now - day * 2).toISOString(), fee: 0, wallet_id: 'w_eur' },
  { id: 't3', type: 'withdrawal', direction: 'out', amount: 200, currency: 'USD', status: 'pending', description: 'Bank withdrawal', counterparty: 'Chase •• 8821', reference: 'WD-5512', createdAt: new Date(now - day * 3).toISOString(), fee: 1.5, wallet_id: 'w_usd' },
  { id: 't4', type: 'transfer', direction: 'in', amount: 950, currency: 'USD', status: 'completed', description: 'From John K.', counterparty: '@john.k', reference: 'TRF-7621', createdAt: new Date(now - day * 4).toISOString(), wallet_id: 'w_usd' },
  { id: 't5', type: 'transfer', direction: 'out', amount: 1500, currency: 'USD', status: 'completed', description: 'International to NGN', counterparty: 'Adaeze O.', reference: 'INTL-3301', createdAt: new Date(now - day * 5).toISOString(), fee: 8.5, wallet_id: 'w_usd' },
  { id: 't6', type: 'deposit', direction: 'in', amount: 600, currency: 'GBP', status: 'completed', description: 'Bank transfer', counterparty: 'HSBC', reference: 'DEP-9810', createdAt: new Date(now - day * 7).toISOString(), wallet_id: 'w_gbp' },
  { id: 't7', type: 'transfer', direction: 'out', amount: 75, currency: 'USD', status: 'failed', description: 'To @sam', counterparty: '@sam', reference: 'TRF-7560', createdAt: new Date(now - day * 9).toISOString(), wallet_id: 'w_usd' },
];

const activity: Activity[] = [
  { id: 'a1', action: 'Signed in', ip: '192.168.1.4', device: 'Chrome on macOS', createdAt: new Date(now - day).toISOString() },
  { id: 'a2', action: 'Password updated', ip: '192.168.1.4', device: 'Chrome on macOS', createdAt: new Date(now - day * 6).toISOString() },
  { id: 'a3', action: 'New device authorized', ip: '10.0.0.12', device: 'Safari on iPhone', createdAt: new Date(now - day * 10).toISOString() },
];

const cards: UserCard[] = [
  { id: 'vc1', brand: 'Visa', number_masked: '•••• •••• •••• 4242', name_on_card: 'ALEX MORGAN', exp: '12/27', balance: 482.5, currency: 'USD', status: 'active' },
  { id: 'vc2', brand: 'Mastercard', number_masked: '•••• •••• •••• 9908', name_on_card: 'ALEX MORGAN', exp: '08/26', balance: 1240, currency: 'USD', status: 'active' },
];

const notifications: Notif[] = [
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
const tontines: Tontine[] = [
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

// ---------- Savings -------------------------------------------------------
interface SavingsRule {
  title: string;
  value: string;
}
interface SavingsPlan {
  id: string;
  code: string;
  name: string;
  kind: 'flexible' | 'goal' | 'locked';
  headline: string;
  description: string;
  min_contribution: number;
  suggested_contribution: number;
  allowed_durations_months: number[];
  frequencies: ('daily' | 'weekly' | 'monthly')[];
  currencies: string[];
  auto_debit_allowed: boolean;
  early_exit_penalty_percent: number;
  target_required: boolean;
  liquidity: 'on_demand' | 'maturity';
  rules: SavingsRule[];
  policies: string[];
}
interface SavingsAccount {
  id: string;
  name: string;
  plan_id: string;
  plan_name: string;
  kind: 'flexible' | 'goal' | 'locked';
  liquidity: 'on_demand' | 'maturity';
  early_exit_penalty_percent: number;
  currency: string;
  goal_amount: number;
  current_amount: number;
  contribution_amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  duration_months: number;
  auto_debit: boolean;
  status: 'active' | 'paused' | 'matured' | 'closed';
  source_wallet_id: string;
  next_contribution_at?: string;
  maturity_date?: string;
  progress_percent: number;
  rules: SavingsRule[];
  policies: string[];
}

const SAVINGS_PLANS: SavingsPlan[] = [
  {
    id: 'sv_flex',
    code: 'FLEX',
    name: 'Flexible Starter',
    kind: 'flexible',
    headline: 'Commencez petit et gardez une sortie souple.',
    description: 'Pour une epargne de routine avec petites contributions et acces rapide.',
    min_contribution: 5,
    suggested_contribution: 15,
    allowed_durations_months: [1, 3, 6],
    frequencies: ['daily', 'weekly', 'monthly'],
    currencies: ['USD', 'EUR', 'BIF', 'CDF'],
    auto_debit_allowed: true,
    early_exit_penalty_percent: 0,
    target_required: false,
    liquidity: 'on_demand',
    rules: [
      { title: 'Ticket minimum', value: 'A partir de 5' },
      { title: 'Sortie', value: 'Disponible a la demande' },
      { title: 'Debit auto', value: 'Autorise' },
    ],
    policies: [
      'Le plan peut etre alimente par petites contributions recurrentes.',
      'La liquidite reste souple, sous reserve des controles de securite et de conformite.',
      'Les frais et regles de sortie doivent etre affiches avant confirmation.',
    ],
  },
  {
    id: 'sv_goal',
    code: 'GOAL',
    name: 'Goal Builder',
    kind: 'goal',
    headline: 'Atteignez un objectif cible avec un rythme previsible.',
    description: 'Pour financer une depense future avec discipline et visibilite.',
    min_contribution: 10,
    suggested_contribution: 25,
    allowed_durations_months: [3, 6, 9, 12],
    frequencies: ['weekly', 'monthly'],
    currencies: ['USD', 'EUR', 'BIF', 'CDF'],
    auto_debit_allowed: true,
    early_exit_penalty_percent: 1.5,
    target_required: true,
    liquidity: 'maturity',
    rules: [
      { title: 'Objectif requis', value: 'Oui' },
      { title: 'Sortie anticipee', value: 'Penalite legere' },
      { title: 'Frequence', value: 'Hebdo ou mensuel' },
    ],
    policies: [
      'Le client fixe une cible et une duree avant ouverture.',
      'Une sortie anticipee peut reduire la performance attendue du plan.',
      'Le plan reste associe a un wallet source unique pour la trace des flux.',
    ],
  },
  {
    id: 'sv_locked',
    code: 'LOCK',
    name: 'Locked Reserve',
    kind: 'locked',
    headline: 'Bloquez un montant plus ferme pour une discipline plus forte.',
    description: 'Pour une reserve protegee avec horizon defini et moins de liquidite.',
    min_contribution: 25,
    suggested_contribution: 50,
    allowed_durations_months: [6, 12],
    frequencies: ['weekly', 'monthly'],
    currencies: ['USD', 'BIF'],
    auto_debit_allowed: true,
    early_exit_penalty_percent: 4,
    target_required: false,
    liquidity: 'maturity',
    rules: [
      { title: 'Liquidite', value: 'A echeance' },
      { title: 'Sortie anticipee', value: 'Penalite forte' },
      { title: 'Discipline', value: 'Verrou renforcé' },
    ],
    policies: [
      'Ce plan suppose un engagement de duree plus strict.',
      'Les demandes de sortie avant echeance doivent suivre une politique d exception.',
      'Le client doit accepter un cadre plus ferme avant activation.',
    ],
  },
];

const savingsAccounts: SavingsAccount[] = [
  {
    id: 'sav_1',
    name: 'Loyer septembre',
    plan_id: 'sv_goal',
    plan_name: 'Goal Builder',
    kind: 'goal',
    liquidity: 'maturity',
    early_exit_penalty_percent: 1.5,
    currency: 'USD',
    goal_amount: 900,
    current_amount: 315,
    contribution_amount: 35,
    frequency: 'weekly',
    duration_months: 6,
    auto_debit: true,
    status: 'active',
    source_wallet_id: 'w_usd',
    next_contribution_at: new Date(now + day * 4).toISOString(),
    maturity_date: new Date(now + day * 120).toISOString(),
    progress_percent: 35,
    rules: SAVINGS_PLANS[1].rules,
    policies: SAVINGS_PLANS[1].policies,
  },
  {
    id: 'sav_2',
    name: 'Reserve famille',
    plan_id: 'sv_flex',
    plan_name: 'Flexible Starter',
    kind: 'flexible',
    liquidity: 'on_demand',
    early_exit_penalty_percent: 0,
    currency: 'BIF',
    goal_amount: 800000,
    current_amount: 225000,
    contribution_amount: 25000,
    frequency: 'monthly',
    duration_months: 6,
    auto_debit: true,
    status: 'active',
    source_wallet_id: 'w_bif',
    next_contribution_at: new Date(now + day * 18).toISOString(),
    maturity_date: new Date(now + day * 170).toISOString(),
    progress_percent: 28,
    rules: SAVINGS_PLANS[0].rules,
    policies: SAVINGS_PLANS[0].policies,
  },
];

// ---------- Yield Vaults --------------------------------------------------
interface YieldVaultRule {
  title: string;
  value: string;
}
interface YieldVaultPlan {
  id: string;
  code: string;
  name: string;
  headline: string;
  description: string;
  currencies: string[];
  stablecoins: string[];
  corridors: string[];
  min_contribution: number;
  suggested_contribution: number;
  allowed_lock_days: number[];
  notice_period_days: number;
  yield_mode: 'variable' | 'projected';
  target_apy_min: number;
  target_apy_max: number;
  reserve_ratio_percent: number;
  client_yield_share_percent: number;
  auto_rollover_allowed: boolean;
  liquidity: 'open' | 'notice';
  rules: YieldVaultRule[];
  policies: string[];
  disclosures: string[];
}
interface YieldVaultPosition {
  id: string;
  name: string;
  plan_id: string;
  plan_name: string;
  stablecoins: string[];
  corridors: string[];
  yield_mode: 'variable' | 'projected';
  liquidity: 'open' | 'notice';
  target_apy_min: number;
  target_apy_max: number;
  reserve_ratio_percent: number;
  client_yield_share_percent: number;
  currency: string;
  principal_amount: number;
  current_value: number;
  accrued_yield: number;
  yield_percent: number;
  lock_days: number;
  notice_period_days: number;
  auto_rollover: boolean;
  status: 'active' | 'redeeming' | 'closed';
  source_wallet_id: string;
  unlock_at?: string;
  next_redemption_at?: string;
  rules: YieldVaultRule[];
  policies: string[];
  disclosures: string[];
  recent_movements: Array<{ id: string; kind: string; amount: number; reference?: string; note?: string; created_at: string }>;
  recent_distributions: Array<{ id: string; amount: number; principal_basis: number; share_percent: number; status: string; note?: string; distributed_at?: string; snapshot_date?: string; created_at: string }>;
}

const YIELD_VAULT_PLANS: YieldVaultPlan[] = [
  {
    id: 'yv_usdt_bi',
    code: 'USDT-BI-30',
    name: 'USDT Corridor Vault',
    headline: 'Liquidite stablecoin pour corridors BIF et CDF.',
    description: 'Alimente les demandes OTC d achat et de vente de USDT et USDC avec reserve de securite.',
    currencies: ['USD', 'BIF', 'CDF'],
    stablecoins: ['USDT', 'USDC'],
    corridors: ['BIF', 'CDF'],
    min_contribution: 25,
    suggested_contribution: 100,
    allowed_lock_days: [30, 90, 180],
    notice_period_days: 7,
    yield_mode: 'variable',
    target_apy_min: 6,
    target_apy_max: 12,
    reserve_ratio_percent: 35,
    client_yield_share_percent: 45,
    auto_rollover_allowed: true,
    liquidity: 'notice',
    rules: [
      { title: 'Capital minimum', value: 'A partir de 25' },
      { title: 'Blocage', value: '30 a 180 jours' },
      { title: 'Sortie', value: 'Preavis de 7 jours' },
    ],
    policies: [
      'Les fonds servent uniquement a la liquidite achat et vente de stablecoins.',
      'Une reserve minimale doit rester disponible avant toute allocation de flux.',
      'Les demandes de sortie passent par une fenetre de preavis avant decaissement.',
    ],
    disclosures: [
      'Le rendement n est pas garanti et depend de l activite reelle du desk.',
      'Ce produit est distinct du savings classique et suppose un opt-in explicite.',
      'Les fonds clients doivent rester traces separement de la tresorerie generale.',
    ],
  },
  {
    id: 'yv_usdc_desk',
    code: 'USDC-DESK-90',
    name: 'USDC Desk Reserve',
    headline: 'Reserve plus longue pour la profondeur du desk stablecoin.',
    description: 'Position de liquidite pour servir les flux OTC et de settlement en USDC.',
    currencies: ['USD', 'EUR'],
    stablecoins: ['USDC'],
    corridors: ['USD', 'EUR', 'BIF'],
    min_contribution: 100,
    suggested_contribution: 250,
    allowed_lock_days: [90, 180, 365],
    notice_period_days: 14,
    yield_mode: 'projected',
    target_apy_min: 8,
    target_apy_max: 14,
    reserve_ratio_percent: 40,
    client_yield_share_percent: 50,
    auto_rollover_allowed: true,
    liquidity: 'notice',
    rules: [
      { title: 'Ticket minimum', value: 'A partir de 100' },
      { title: 'Preavis', value: '14 jours' },
      { title: 'Rollover', value: 'Optionnel' },
    ],
    policies: [
      'La reserve soutient les operations de liquidite USDC et settlement externe.',
      'Les plans longs privilegient la stabilite de liquidite plutot que la sortie immediate.',
      'Le rendement distribue provient uniquement des marges et frais realises.',
    ],
    disclosures: [
      'Aucun rendement fixe n est garanti avant la realisation effective des revenus.',
      'Le produit vise des clients acceptant un blocage et une fenetre de rachat.',
      'La conformite et les limites de corridor peuvent reduire la capacite d allocation.',
    ],
  },
];

const yieldVaultPositions: YieldVaultPosition[] = [
  {
    id: 'yv_pos_1',
    name: 'BIF Liquidity 30J',
    plan_id: 'yv_usdt_bi',
    plan_name: 'USDT Corridor Vault',
    stablecoins: ['USDT', 'USDC'],
    corridors: ['BIF', 'CDF'],
    yield_mode: 'variable',
    liquidity: 'notice',
    target_apy_min: 6,
    target_apy_max: 12,
    reserve_ratio_percent: 35,
    client_yield_share_percent: 45,
    currency: 'USD',
    principal_amount: 350,
    current_value: 362,
    accrued_yield: 12,
    yield_percent: 3.43,
    lock_days: 90,
    notice_period_days: 7,
    auto_rollover: true,
    status: 'active',
    source_wallet_id: 'w_usd',
    unlock_at: new Date(now + day * 74).toISOString(),
    next_redemption_at: '',
    rules: YIELD_VAULT_PLANS[0].rules,
    policies: YIELD_VAULT_PLANS[0].policies,
    disclosures: YIELD_VAULT_PLANS[0].disclosures,
    recent_movements: [
      { id: 'yvm_1', kind: 'initial', amount: 350, reference: 'YV-OPEN-1', note: 'Initial yield vault contribution', created_at: new Date(now - day * 15).toISOString() },
      { id: 'yvm_2', kind: 'payout', amount: 12, reference: 'YV-PAYOUT-1', note: 'Yield distribution posted', created_at: new Date(now - day * 2).toISOString() },
    ],
    recent_distributions: [
      { id: 'yvd_1', amount: 12, principal_basis: 350, share_percent: 100, status: 'posted', note: 'Stablecoin liquidity revenue share', distributed_at: new Date(now - day * 2).toISOString(), snapshot_date: new Date(now - day * 2).toISOString().slice(0, 10), created_at: new Date(now - day * 2).toISOString() },
    ],
  },
];

// ---------- FestiPay events ----------
interface FestiEvent {
  id: string; name: string; date: string; price: number; currency: string;
  attendees: number; cover: string; organizer: string;
}
const festiEvents: FestiEvent[] = [
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

const COUNTRIES = [
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
    if (url === '/auth/login/') {
      return ok({
        two_factor_required: true,
        challenge_id: 'mock-web-login-challenge',
        masked_email: body.email.replace(/^(.).+(@.+)$/, '$1•••$2'),
        expires_in: 600,
        resend_after: 30,
      });
    }
    return ok({ user, access: 'mock-access-token', refresh: 'mock-refresh-token' });
  }
  if (url === '/auth/login/verify-otp/' && method === 'POST') {
    if (body?.otp !== '123456' || body?.challenge_id !== 'mock-web-login-challenge') throw new Error('Code incorrect ou expiré.');
    return ok({ access: 'mock-access-token', refresh: 'mock-refresh-token' });
  }
  if (url === '/auth/login/resend-otp/' && method === 'POST') return ok({ detail: 'A new sign-in code has been sent.', resend_after: 30 });
  if (url === '/api/jwt/refresh/' && method === 'POST') {
    return ok({ access: 'mock-access-token-refreshed' });
  }
  if ((url === '/auth/register/' || url === '/api/user/') && method === 'POST') {
    user = { ...user, email: body.email, firstName: body.first_name || body.firstName || user.firstName, lastName: body.last_name || body.lastName || user.lastName };
    // Capture affiliate referral code if provided
    if (body?.reference || body?.ref) {
      pushNotif({
        title: 'Parrainage enregistré',
        body: `Code utilisé : ${body.reference || body.ref}`,
        level: 'info', priority: 'low', read: false,
      });
    }
    return ok({ user, access: 'mock-access-token', refresh: 'mock-refresh-token' });
  }
  if (url === '/auth/forgot-password/' && method === 'POST') return ok({ detail: 'Reset OTP sent' });
  if (url === '/auth/reset-password/' && method === 'POST') return ok({ detail: 'Password updated' });
  if (url === '/api/users/reset_password/' && method === 'POST') return ok({ detail: 'Reset link sent' });
  if (url === '/api/users/reset_password_confirm/' && method === 'POST') return ok({ detail: 'Password updated' });
  if (url === '/auth/verify-email/' && method === 'POST') {
    if (body?.otp === '123456') return ok({ detail: 'Email verified', verified: true });
    throw new Error('Invalid or expired code');
  }
  if (url === '/auth/resend-otp/' && method === 'POST') return ok({ detail: 'Code resent', otp: '123456' });
  if (url === '/auth/update-pending-email/' && method === 'POST') {
    if (!body?.new_email) throw new Error('Nouvelle adresse requise');
    return ok({ detail: 'Pending email updated', email: body.new_email });
  }
  if (url.startsWith('/auth/pending-status/') && method === 'GET') {
    return ok({ exists: true, email: user.email, created_at: new Date().toISOString() });
  }

  // ---------- SECURITY: DEVICES / 2FA / PUSH ------------------------------
  if (url === '/api/security/devices/' && method === 'GET') {
    const id = (typeof localStorage !== 'undefined' && localStorage.getItem('lipaxe-device-id')) || 'dev_current';
    return ok([
      { id: 'd_current', device_id: id, label: 'Chrome on macOS', ip: '192.168.1.4', last_seen: new Date().toISOString(), current: true, trusted: true },
      { id: 'd_iphone', device_id: 'dev_iphone', label: 'Safari on iOS', ip: '10.0.0.21', last_seen: new Date(Date.now() - day * 2).toISOString(), current: false, trusted: true },
      { id: 'd_old', device_id: 'dev_old', label: 'Firefox on Windows', ip: '88.120.4.10', last_seen: new Date(Date.now() - day * 18).toISOString(), current: false, trusted: false },
    ]);
  }
  if (url === '/api/security/devices/register/' && method === 'POST') return ok({ detail: 'Registered' });
  if (url.match(/^\/api\/security\/devices\/.+\/revoke\/$/) && method === 'POST') return ok({ detail: 'Revoked' });
  if (url.match(/^\/api\/security\/devices\/.+\/trust\/$/) && method === 'POST') return ok({ detail: 'Updated' });

  if (url === '/api/security/2fa/status/' && method === 'GET') return ok({ enabled: false });
  if (url === '/api/security/2fa/init/' && method === 'POST') return ok({ secret: '', otpauth_url: '', backup_codes: [] });
  if (url === '/api/security/2fa/enable/' && method === 'POST') return ok({ detail: '2FA enabled' });
  if (url === '/api/security/2fa/disable/' && method === 'POST') return ok({ detail: '2FA disabled' });
  if (url === '/api/security/2fa/backup-codes/' && method === 'POST') return ok({ backup_codes: [] });

  if (url === '/api/push/vapid-key/' && method === 'GET') {
    return ok({ public_key: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U' });
  }
  if (url === '/api/push/subscribe/' && method === 'POST') return ok({ detail: 'Subscribed' });
  if (url === '/api/push/unsubscribe/' && method === 'POST') return ok({ detail: 'Unsubscribed' });

  if (url === '/auth/me/' && method === 'GET') return ok(user);
  if (url === '/api/user/me/' && method === 'GET') return ok(user);
  if (url === '/api/user/me/' && method === 'PUT') {
    // FormData → naive merge if body has keys
    return ok(user);
  }

  // ---------- PIN ----------------------------------------------------------
  if ((url === '/api/verify-pin/' || url === '/auth/verify-pin/') && method === 'POST') {
    if (body?.pin === userPin) return ok({ valid: true });
    throw new Error('PIN incorrect');
  }
  if ((url === '/api/update-pin/' || url === '/auth/update-pin/') && method === 'POST') {
    if (!/^\d{5}$/.test(body?.pin || '')) throw new Error('Le PIN doit contenir 5 chiffres');
    userPin = body.pin;
    user = { ...user, isPin: true };
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

  // ---------- SAVINGS -----------------------------------------------------
  if (url === '/savings/plans/' && method === 'GET') return ok(SAVINGS_PLANS);
  if (url === '/savings/' && method === 'GET') return ok(savingsAccounts);
  if (url.match(/^\/savings\/[^/]+\/$/) && method === 'GET') {
    const id = url.split('/').filter(Boolean)[1];
    const account = savingsAccounts.find((item) => item.id === id);
    if (!account) throw new Error('Savings introuvable');
    return ok(account);
  }
  if (url === '/savings/' && method === 'POST') {
    const plan = SAVINGS_PLANS.find((item) => item.id === body.plan_id);
    const wallet = wallets.find((item) => item.id === body.source_wallet_id);
    if (!plan || !wallet) throw new Error('Plan ou portefeuille introuvable');
    if (wallet.currency !== body.currency) throw new Error('Le wallet source doit correspondre a la devise du plan');
    if (wallet.available < Number(body.contribution_amount || 0)) throw new Error('Solde insuffisant pour ouvrir ce plan');

    const contribution = Number(body.contribution_amount || 0);
    wallet.available -= contribution;
    wallet.balance -= contribution;

    const account: SavingsAccount = {
      id: 'sav_' + Date.now(),
      name: body.name || plan.name,
      plan_id: plan.id,
      plan_name: plan.name,
      kind: plan.kind,
      liquidity: plan.liquidity,
      early_exit_penalty_percent: plan.early_exit_penalty_percent,
      currency: body.currency,
      goal_amount: Number(body.goal_amount || contribution),
      current_amount: contribution,
      contribution_amount: contribution,
      frequency: body.frequency,
      duration_months: Number(body.duration_months || plan.allowed_durations_months[0] || 3),
      auto_debit: Boolean(body.auto_debit),
      status: 'active',
      source_wallet_id: wallet.id,
      next_contribution_at: new Date(Date.now() + (body.frequency === 'daily' ? day : body.frequency === 'weekly' ? day * 7 : day * 30)).toISOString(),
      maturity_date: new Date(Date.now() + Number(body.duration_months || 3) * 30 * day).toISOString(),
      progress_percent: Math.min(100, Math.round((contribution / Math.max(Number(body.goal_amount || contribution), 1)) * 100)),
      rules: plan.rules,
      policies: plan.policies,
    };
    savingsAccounts.unshift(account);
    transactions.unshift({
      id: 'savtx' + Date.now(),
      type: 'transfer',
      direction: 'out',
      amount: contribution,
      currency: account.currency,
      status: 'completed',
      description: `Savings opening ${account.name}`,
      counterparty: account.plan_name,
      reference: 'SAV-' + Math.floor(Math.random() * 9000 + 1000),
      createdAt: new Date().toISOString(),
      wallet_id: wallet.id,
    });
    pushNotif({ title: 'Savings ouvert', body: `${account.name} est actif.`, level: 'success', priority: 'normal', read: false, link: '/app/savings' });
    return ok(account);
  }
  if (url === '/savings/contribute/' && method === 'POST') {
    const account = savingsAccounts.find((item) => item.id === body.savings_id);
    const wallet = wallets.find((item) => item.id === body.wallet_id);
    const amount = Number(body.amount || 0);
    if (!account || !wallet) throw new Error('Savings ou portefeuille introuvable');
    if (wallet.currency !== account.currency) throw new Error('Le portefeuille doit etre dans la meme devise');
    if (wallet.available < amount) throw new Error('Solde insuffisant');

    wallet.available -= amount;
    wallet.balance -= amount;
    account.current_amount += amount;
    account.progress_percent = Math.min(100, Math.round((account.current_amount / Math.max(account.goal_amount, 1)) * 100));
    account.next_contribution_at = new Date(Date.now() + (account.frequency === 'daily' ? day : account.frequency === 'weekly' ? day * 7 : day * 30)).toISOString();
    if (account.progress_percent >= 100) account.status = 'matured';

    transactions.unshift({
      id: 'savc' + Date.now(),
      type: 'transfer',
      direction: 'out',
      amount,
      currency: account.currency,
      status: 'completed',
      description: `Savings contribution ${account.name}`,
      counterparty: account.plan_name,
      reference: 'SAV-' + Math.floor(Math.random() * 9000 + 1000),
      createdAt: new Date().toISOString(),
      wallet_id: wallet.id,
    });
    pushNotif({ title: 'Contribution savings', body: `${amount} ${account.currency} ajoutes a ${account.name}.`, level: 'success', priority: 'normal', read: false, link: `/app/savings/${account.id}` });
    return ok({ detail: 'Contribution enregistree', account });
  }
  if (url === '/savings/withdraw/' && method === 'POST') {
    const account = savingsAccounts.find((item) => item.id === body.savings_id);
    const wallet = wallets.find((item) => item.id === body.wallet_id);
    const amount = Number(body.amount || 0);
    if (!account || !wallet) throw new Error('Savings ou portefeuille introuvable');
    if (wallet.currency !== account.currency) throw new Error('Le portefeuille doit etre dans la meme devise');
    if (amount <= 0 || amount > account.current_amount) throw new Error('Montant invalide');

    const maturityTime = account.maturity_date ? new Date(account.maturity_date).getTime() : 0;
    const earlyExit = account.liquidity === 'maturity' && (!maturityTime || maturityTime > Date.now());
    const penalty = earlyExit ? Number(((amount * account.early_exit_penalty_percent) / 100).toFixed(2)) : 0;
    const netAmount = Number((amount - penalty).toFixed(2));

    wallet.available += netAmount;
    wallet.balance += netAmount;
    account.current_amount = Number((account.current_amount - amount).toFixed(2));
    account.progress_percent = Math.min(100, Math.round((account.current_amount / Math.max(account.goal_amount, 1)) * 100));
    account.status = account.current_amount <= 0 ? 'closed' : account.progress_percent >= 100 ? 'matured' : 'active';

    transactions.unshift({
      id: 'savw' + Date.now(),
      type: 'receive',
      direction: 'in',
      amount: netAmount,
      currency: account.currency,
      status: 'completed',
      description: `Savings withdrawal ${account.name}`,
      counterparty: account.plan_name,
      reference: 'SAV-' + Math.floor(Math.random() * 9000 + 1000),
      createdAt: new Date().toISOString(),
      wallet_id: wallet.id,
    });
    pushNotif({ title: 'Retrait savings', body: `${netAmount} ${account.currency} verses sur votre wallet.`, level: 'success', priority: 'normal', read: false, link: `/app/savings/${account.id}` });
    return ok({ detail: 'Retrait savings enregistre', penalty_amount: penalty.toFixed(2), net_amount: netAmount.toFixed(2), account });
  }

  // ---------- YIELD VAULTS ------------------------------------------------
  if (url === '/yield-vaults/plans/' && method === 'GET') return ok(YIELD_VAULT_PLANS);
  if (url === '/yield-vaults/' && method === 'GET') return ok(yieldVaultPositions);
  if (url.match(/^\/yield-vaults\/[^/]+\/$/) && method === 'GET') {
    const id = url.split('/').filter(Boolean)[1];
    const position = yieldVaultPositions.find((item) => item.id === id);
    if (!position) throw new Error('Vault introuvable');
    return ok(position);
  }
  if (url === '/yield-vaults/' && method === 'POST') {
    const plan = YIELD_VAULT_PLANS.find((item) => item.id === body.plan_id);
    const wallet = wallets.find((item) => item.id === body.source_wallet_id);
    if (!plan || !wallet) throw new Error('Plan ou portefeuille introuvable');
    if (wallet.currency !== body.currency) throw new Error('Le wallet source doit correspondre a la devise du vault');
    if (wallet.available < Number(body.principal_amount || 0)) throw new Error('Solde insuffisant pour ouvrir ce vault');

    const principal = Number(body.principal_amount || 0);
    wallet.available -= principal;
    wallet.balance -= principal;

    const position: YieldVaultPosition = {
      id: 'yv_' + Date.now(),
      name: body.name || plan.name,
      plan_id: plan.id,
      plan_name: plan.name,
      stablecoins: plan.stablecoins,
      corridors: plan.corridors,
      yield_mode: plan.yield_mode,
      liquidity: plan.liquidity,
      target_apy_min: plan.target_apy_min,
      target_apy_max: plan.target_apy_max,
      reserve_ratio_percent: plan.reserve_ratio_percent,
      client_yield_share_percent: plan.client_yield_share_percent,
      currency: body.currency,
      principal_amount: principal,
      current_value: principal,
      accrued_yield: 0,
      yield_percent: 0,
      lock_days: Number(body.lock_days || plan.allowed_lock_days[0] || 30),
      notice_period_days: plan.notice_period_days,
      auto_rollover: Boolean(body.auto_rollover),
      status: 'active',
      source_wallet_id: wallet.id,
      unlock_at: new Date(Date.now() + Number(body.lock_days || 30) * day).toISOString(),
      next_redemption_at: '',
      rules: plan.rules,
      policies: plan.policies,
      disclosures: plan.disclosures,
      recent_movements: [
        { id: 'yvm_' + Date.now(), kind: 'initial', amount: principal, reference: 'YV-OPEN', note: 'Initial yield vault contribution', created_at: new Date().toISOString() },
      ],
      recent_distributions: [],
    };
    yieldVaultPositions.unshift(position);
    transactions.unshift({
      id: 'yvtx' + Date.now(),
      type: 'transfer',
      direction: 'out',
      amount: principal,
      currency: position.currency,
      status: 'completed',
      description: `Yield vault opening ${position.name}`,
      counterparty: position.plan_name,
      reference: 'YV-' + Math.floor(Math.random() * 9000 + 1000),
      createdAt: new Date().toISOString(),
      wallet_id: wallet.id,
    });
    pushNotif({ title: 'Yield vault actif', body: `${position.name} est ouvert.`, level: 'success', priority: 'normal', read: false, link: '/app/strone/vaults' });
    return ok(position);
  }
  if (url === '/yield-vaults/contribute/' && method === 'POST') {
    const position = yieldVaultPositions.find((item) => item.id === body.position_id);
    const wallet = wallets.find((item) => item.id === body.wallet_id);
    const amount = Number(body.amount || 0);
    if (!position || !wallet) throw new Error('Vault ou portefeuille introuvable');
    if (wallet.currency !== position.currency) throw new Error('Le portefeuille doit etre dans la meme devise');
    if (wallet.available < amount) throw new Error('Solde insuffisant');

    wallet.available -= amount;
    wallet.balance -= amount;
    position.principal_amount += amount;
    position.current_value += amount;
    position.yield_percent = Number((((position.current_value - position.principal_amount) / Math.max(position.principal_amount, 1)) * 100).toFixed(2));
    position.recent_movements.unshift({
      id: 'yvm_' + Date.now(),
      kind: 'topup',
      amount,
      reference: 'YV-TOPUP',
      note: 'Manual vault top up',
      created_at: new Date().toISOString(),
    });

    transactions.unshift({
      id: 'yvc' + Date.now(),
      type: 'transfer',
      direction: 'out',
      amount,
      currency: position.currency,
      status: 'completed',
      description: `Yield vault top up ${position.name}`,
      counterparty: position.plan_name,
      reference: 'YV-' + Math.floor(Math.random() * 9000 + 1000),
      createdAt: new Date().toISOString(),
      wallet_id: wallet.id,
    });
    pushNotif({ title: 'Contribution vault', body: `${amount} ${position.currency} ajoutes a ${position.name}.`, level: 'success', priority: 'normal', read: false, link: `/app/strone/vaults/${position.id}` });
    return ok({ detail: 'Contribution enregistree', position });
  }
  if (url === '/yield-vaults/redeem/' && method === 'POST') {
    const position = yieldVaultPositions.find((item) => item.id === body.position_id);
    if (!position) throw new Error('Vault introuvable');
    if (position.status !== 'active') throw new Error('Cette position ne peut pas etre rachetee pour le moment');
    position.status = 'redeeming';
    position.next_redemption_at = new Date(Date.now() + position.notice_period_days * day).toISOString();
    position.recent_movements.unshift({
      id: 'yvm_' + Date.now(),
      kind: 'redemption_request',
      amount: position.current_value,
      reference: 'YV-REDEEM',
      note: body.note || 'Yield redemption requested',
      created_at: new Date().toISOString(),
    });
    pushNotif({ title: 'Rachat programme', body: `${position.name} passe en sortie programmee.`, level: 'warning', priority: 'high', read: false, link: `/app/strone/vaults/${position.id}` });
    return ok({ detail: 'Demande de sortie enregistree', position });
  }

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
    // Crypto deposit returns an address — funded externally, no immediate tx.
    if (url === '/api/transactions/crypto/') {
      const network = body.network || 'TRC20';
      const address = network === 'TRC20' ? 'TR' + Math.random().toString(36).slice(2, 32).toUpperCase()
        : network === 'ERC20' ? '0x' + Math.random().toString(16).slice(2, 42)
        : '1' + Math.random().toString(36).slice(2, 30);
      return ok({ address, network, symbol: 'USDT' });
    }
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
    const w = wallets.find((x) => x.id === body.wallet_id);
    if (!w) throw new Error('Wallet introuvable');
    const token = 'qr_' + Math.random().toString(36).slice(2, 10);
    const expires_at = new Date(Date.now() + (body.expires_in || 600) * 1000).toISOString();
    qrTokens.set(token, {
      token, sender: `${user.firstName} ${user.lastName}`,
      amount: body.amount, currency: body.currency || w.currency,
      wallet_id: w.id, expires_at, consumed: false,
    });
    const url_ = (typeof window !== 'undefined' ? window.location.origin : '') + '/app/transfer/qr?token=' + token;
    return ok({ token, amount: body.amount, currency: body.currency || w.currency, url: url_, expires_at });
  }
  if (url.startsWith('/api/transactions/qr/') && method === 'GET') {
    const token = url.split('/').filter(Boolean).pop();
    const t = token ? qrTokens.get(token) : undefined;
    if (!t) throw new Error('QR introuvable ou expiré');
    if (t.consumed) throw new Error('Ce QR a déjà été utilisé');
    if (new Date(t.expires_at).getTime() < Date.now()) throw new Error('Ce QR est expiré');
    return ok({ token: t.token, amount: t.amount, currency: t.currency, sender: t.sender, expires_at: t.expires_at });
  }
  if (url === '/api/transactions/validate/' && method === 'POST') {
    if (!body?.token) throw new Error('Token requis');
    const t = qrTokens.get(body.token);
    if (!t) throw new Error('QR introuvable');
    if (t.consumed) throw new Error('Déjà consommé');
    if (new Date(t.expires_at).getTime() < Date.now()) throw new Error('QR expiré');
    if (body.pin && body.pin !== userPin) throw new Error('PIN incorrect');
    // Optional OTP for amounts > 100
    if (t.amount > 100 && body.otp !== '123456') throw new Error('Code OTP requis (123456 en démo)');
    t.consumed = true;
    const senderWallet = wallets.find((w) => w.id === t.wallet_id);
    const receiverWallet = body.wallet_id ? wallets.find((w) => w.id === body.wallet_id) : wallets.find((w) => w.currency === t.currency);
    if (senderWallet) { senderWallet.balance -= t.amount; senderWallet.available -= t.amount; }
    if (receiverWallet) { receiverWallet.balance += t.amount; receiverWallet.available += t.amount; }
    transactions.unshift({
      id: 'qr' + Date.now(), type: 'transfer', direction: 'in', amount: t.amount, currency: t.currency,
      status: 'completed', description: `QR from ${t.sender}`, counterparty: t.sender,
      reference: 'QR-' + Math.floor(Math.random() * 9000 + 1000), createdAt: new Date().toISOString(),
      wallet_id: receiverWallet?.id,
    });
    pushNotif({ title: 'Paiement QR reçu', body: `Vous avez reçu ${t.amount} ${t.currency}`, level: 'success', priority: 'normal', read: false, link: '/app/transactions' });
    return ok({ detail: 'Validated', amount: t.amount, currency: t.currency });
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
    if (body?.id === 'all') {
      notifications.forEach((n) => (n.read = true));
    } else {
      const n = notifications.find((x) => x.id === body.id);
      if (n) n.read = true;
    }
    return ok({ detail: 'OK' });
  }

  // ---------- TONTINES ----------------------------------------------------
  if (url === '/api/tontines/' && method === 'GET') return ok(tontines);
  if (url === '/api/tontines/' && method === 'POST') {
    const id = 'tn' + Date.now();
    const members = (body.members as string[]).map((m, i) => ({ user: m, received: false, position: i + 1 }));
    const tn: Tontine = {
      id, name: body.name, contribution: body.contribution, currency: body.currency,
      frequency: body.frequency, duration_months: body.duration_months, selection: body.selection,
      members, next_beneficiary: members[0]?.user,
      next_payout_at: new Date(Date.now() + (body.frequency === 'weekly' ? 7 : 30) * day).toISOString(),
      status: 'active',
    };
    tontines.unshift(tn);
    pushNotif({ title: 'Tontine créée', body: `${tn.name} démarre.`, level: 'info', priority: 'normal', read: false, link: '/app/strone/business' });
    return ok(tn);
  }
  if (url === '/api/tontines/contribute/' && method === 'POST') {
    const tn = tontines.find((x) => x.id === body.tontine_id);
    const w = wallets.find((x) => x.id === body.wallet_id);
    if (!tn || !w) throw new Error('Tontine ou wallet introuvable');
    if (w.available < body.amount) throw new Error('Solde insuffisant');
    w.available -= body.amount; w.balance -= body.amount;
    pushNotif({ title: 'Contribution tontine', body: `${body.amount} ${tn.currency} → ${tn.name}`, level: 'success', priority: 'normal', read: false });
    return ok({ detail: 'Contribution enregistrée' });
  }

  // ---------- FESTIPAY ----------------------------------------------------
  if (url === '/api/festipay/events/' && method === 'GET') return ok(festiEvents);
  if (url === '/api/festipay/book/' && method === 'POST') {
    const ev = festiEvents.find((e) => e.id === body.event_id);
    const w = wallets.find((x) => x.id === body.wallet_id);
    if (!ev || !w) throw new Error('Event ou wallet introuvable');
    if (w.available < ev.price) throw new Error('Solde insuffisant');
    w.available -= ev.price; w.balance -= ev.price;
    ev.attendees += 1;
    const ticket = {
      id: 'tk' + Date.now(), event_id: ev.id,
      qr_token: 'tk_' + Math.random().toString(36).slice(2, 10),
      amount: ev.price, currency: ev.currency, createdAt: new Date().toISOString(),
    };
    pushNotif({ title: 'Ticket réservé', body: `${ev.name} — Bonne soirée!`, level: 'success', priority: 'normal', read: false });
    return ok(ticket);
  }

  // ---------- PAYALL ------------------------------------------------------
  if (url.startsWith('/api/payall/providers/') && method === 'GET') {
    const cat = url.includes('?category=') ? url.split('?category=')[1] : null;
    return ok(cat ? BILL_PROVIDERS.filter((p) => p.category === cat) : BILL_PROVIDERS);
  }
  if (url === '/api/payall/pay/' && method === 'POST') {
    const w = wallets.find((x) => x.id === body.wallet_id);
    if (!w) throw new Error('Wallet introuvable');
    if (w.available < body.amount) throw new Error('Solde insuffisant');
    w.available -= body.amount; w.balance -= body.amount;
    const ref = 'BILL-' + Math.floor(Math.random() * 9000 + 1000);
    transactions.unshift({
      id: 'b' + Date.now(), type: 'withdrawal', direction: 'out', amount: body.amount, currency: w.currency,
      status: 'completed', description: `Bill ${body.provider_id}`, counterparty: body.reference,
      reference: ref, createdAt: new Date().toISOString(), wallet_id: w.id,
    });
    pushNotif({ title: 'Facture payée', body: `${body.amount} ${w.currency} — ${body.provider_id}`, level: 'success', priority: 'normal', read: false });
    return ok({ detail: 'Bill paid', reference: ref });
  }

  // ---------- CRYPTO ------------------------------------------------------
  if (url === '/api/cryptos/' && method === 'GET') return ok(CRYPTO_ASSETS);
  if (url.startsWith('/api/cryptos/') && url.endsWith('/networks/') && method === 'GET') {
    const sym = url.split('/').filter(Boolean)[2];
    return ok(CRYPTO_NETWORKS[sym] || []);
  }
  if ((url === '/api/cryptos/deposit-address/' || url === '/crypto-market/deposit-address/') && method === 'POST') {
    const network = String(body.network || '').toLowerCase();
    const address = network === 'trc20' ? 'T' + Math.random().toString(36).slice(2, 34).toUpperCase()
      : ['erc20', 'bep20'].includes(network) ? '0x' + Math.random().toString(16).slice(2, 42)
      : '1' + Math.random().toString(36).slice(2, 30);
    return ok({ address, network: body.network, symbol: body.symbol, qr_payload: `${body.symbol}:${address}?network=${body.network}` });
  }
  if (url === '/api/cryptos/withdraw/' && method === 'POST') {
    const w = wallets.find((x) => x.id === body.wallet_id);
    if (!w) throw new Error('Wallet introuvable');
    if (w.available < body.amount) throw new Error('Solde insuffisant');
    if (!body.address || body.address.length < 10) throw new Error('Adresse invalide');
    w.available -= body.amount; w.balance -= body.amount;
    const ref = 'CRY-' + Math.floor(Math.random() * 9000 + 1000);
    transactions.unshift({
      id: 'c' + Date.now(), type: 'withdrawal', direction: 'out', amount: body.amount, currency: body.symbol,
      status: 'pending', description: `${body.symbol} (${body.network}) → ${body.address.slice(0, 8)}…`,
      counterparty: body.address, reference: ref, createdAt: new Date().toISOString(), wallet_id: w.id,
    });
    pushNotif({ title: 'Retrait crypto envoyé', body: `${body.amount} ${body.symbol} → ${body.address.slice(0, 10)}…`, level: 'success', priority: 'high', read: false });
    return ok({ detail: 'Crypto withdrawal sent', reference: ref });
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
