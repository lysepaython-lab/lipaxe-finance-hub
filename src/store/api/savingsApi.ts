import { api } from './baseApi';
import { unwrapData } from './adapters';

export type SavingsPlanKind = 'flexible' | 'goal' | 'locked';
export type SavingsFrequency = 'daily' | 'weekly' | 'monthly';

export interface SavingsRule {
  title: string;
  value: string;
}

export interface SavingsPlan {
  id: string;
  code: string;
  name: string;
  kind: SavingsPlanKind;
  headline: string;
  description: string;
  min_contribution: number;
  suggested_contribution: number;
  allowed_durations_months: number[];
  frequencies: SavingsFrequency[];
  currencies: string[];
  auto_debit_allowed: boolean;
  early_exit_penalty_percent: number;
  target_required: boolean;
  liquidity: 'on_demand' | 'maturity';
  rules: SavingsRule[];
  policies: string[];
}

export interface SavingsAccount {
  id: string;
  name: string;
  plan_id: string;
  plan_name: string;
  kind: SavingsPlanKind;
  liquidity: 'on_demand' | 'maturity';
  early_exit_penalty_percent: number;
  currency: string;
  goal_amount: number;
  current_amount: number;
  contribution_amount: number;
  frequency: SavingsFrequency;
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

export interface CreateSavingsBody {
  name: string;
  plan_id: string;
  currency: string;
  goal_amount: number;
  contribution_amount: number;
  duration_months: number;
  frequency: SavingsFrequency;
  auto_debit: boolean;
  source_wallet_id: string;
}

const money = (value: unknown) => Number(value || 0);

const normalizePlan = (plan: SavingsPlan): SavingsPlan => ({
  ...plan,
  min_contribution: money(plan.min_contribution),
  suggested_contribution: money(plan.suggested_contribution),
  early_exit_penalty_percent: money(plan.early_exit_penalty_percent),
});

const normalizeAccount = (account: SavingsAccount): SavingsAccount => ({
  ...account,
  goal_amount: money(account.goal_amount),
  current_amount: money(account.current_amount),
  contribution_amount: money(account.contribution_amount),
  early_exit_penalty_percent: money(account.early_exit_penalty_percent),
  progress_percent: money(account.progress_percent),
});

export const savingsApi = api.injectEndpoints({
  endpoints: (b) => ({
    savingsPlans: b.query<SavingsPlan[], void>({
      query: () => '/savings/plans/',
      transformResponse: (response: unknown) => unwrapData<SavingsPlan[]>(response, []).map(normalizePlan),
      providesTags: [{ type: 'Savings', id: 'plans' }],
    }),
    savingsAccounts: b.query<SavingsAccount[], void>({
      query: () => '/savings/',
      transformResponse: (response: unknown) => unwrapData<SavingsAccount[]>(response, []).map(normalizeAccount),
      providesTags: (result) => [
        { type: 'Savings', id: 'LIST' },
        ...(result || []).map((item) => ({ type: 'Savings' as const, id: item.id })),
      ],
    }),
    savingsAccount: b.query<SavingsAccount, string>({
      query: (id) => `/savings/${id}/`,
      transformResponse: (response: SavingsAccount) => normalizeAccount(response),
      providesTags: (_r, _e, id) => [{ type: 'Savings', id }],
    }),
    createSavings: b.mutation<SavingsAccount, CreateSavingsBody>({
      query: (body) => ({
        url: '/savings/',
        method: 'POST',
        body,
      }),
      transformResponse: (response: SavingsAccount) => normalizeAccount(response),
      invalidatesTags: ['Savings', 'Wallet', 'Transactions'],
    }),
    contributeSavings: b.mutation<
      { detail: string; account: SavingsAccount },
      { savings_id: string; wallet_id: string; amount: number }
    >({
      query: (body) => ({
        url: '/savings/contribute/',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { detail: string; account: SavingsAccount }) => ({
        ...response,
        account: normalizeAccount(response.account),
      }),
      invalidatesTags: (_r, _e, body) => [
        'Savings',
        'Wallet',
        'Transactions',
        { type: 'Savings', id: body.savings_id },
      ],
    }),
    withdrawSavings: b.mutation<
      { detail: string; penalty_amount: string; net_amount: string; account: SavingsAccount },
      { savings_id: string; wallet_id: string; amount: number }
    >({
      query: (body) => ({
        url: '/savings/withdraw/',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { detail: string; penalty_amount: string; net_amount: string; account: SavingsAccount }) => ({
        ...response,
        account: normalizeAccount(response.account),
      }),
      invalidatesTags: (_r, _e, body) => [
        'Savings',
        'Wallet',
        'Transactions',
        { type: 'Savings', id: body.savings_id },
      ],
    }),
  }),
});

export const {
  useSavingsPlansQuery,
  useSavingsAccountsQuery,
  useSavingsAccountQuery,
  useCreateSavingsMutation,
  useContributeSavingsMutation,
  useWithdrawSavingsMutation,
} = savingsApi;
