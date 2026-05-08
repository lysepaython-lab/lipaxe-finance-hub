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
  currency: string;
  goal_amount: number;
  current_amount: number;
  contribution_amount: number;
  frequency: SavingsFrequency;
  duration_months: number;
  auto_debit: boolean;
  status: 'active' | 'paused' | 'matured';
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

export const savingsApi = api.injectEndpoints({
  endpoints: (b) => ({
    savingsPlans: b.query<SavingsPlan[], void>({
      query: () => '/savings/plans/',
      transformResponse: (response: unknown) => unwrapData<SavingsPlan[]>(response, []),
      providesTags: [{ type: 'Savings', id: 'plans' }],
    }),
    savingsAccounts: b.query<SavingsAccount[], void>({
      query: () => '/savings/',
      transformResponse: (response: unknown) => unwrapData<SavingsAccount[]>(response, []),
      providesTags: (result) => [
        { type: 'Savings', id: 'LIST' },
        ...(result || []).map((item) => ({ type: 'Savings' as const, id: item.id })),
      ],
    }),
    savingsAccount: b.query<SavingsAccount, string>({
      query: (id) => `/savings/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'Savings', id }],
    }),
    createSavings: b.mutation<SavingsAccount, CreateSavingsBody>({
      query: (body) => ({
        url: '/savings/',
        method: 'POST',
        body,
      }),
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
} = savingsApi;
