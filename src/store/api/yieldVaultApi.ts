import { api } from './baseApi';
import { unwrapData } from './adapters';

export type YieldMode = 'variable' | 'projected';

export interface YieldVaultRule {
  title: string;
  value: string;
}

export interface YieldVaultPlan {
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
  yield_mode: YieldMode;
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

export interface YieldVaultPosition {
  id: string;
  name: string;
  plan_id: string;
  plan_name: string;
  stablecoins: string[];
  corridors: string[];
  yield_mode: YieldMode;
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
  recent_movements: Array<{
    id: string;
    kind: string;
    amount: number;
    reference?: string;
    note?: string;
    created_at: string;
  }>;
  recent_distributions: Array<{
    id: string;
    amount: number;
    principal_basis: number;
    share_percent: number;
    status: string;
    note?: string;
    distributed_at?: string;
    snapshot_date?: string;
    created_at: string;
  }>;
}

export interface CreateYieldVaultBody {
  name: string;
  plan_id: string;
  currency: string;
  principal_amount: number;
  lock_days: number;
  auto_rollover: boolean;
  source_wallet_id: string;
}

export const yieldVaultApi = api.injectEndpoints({
  endpoints: (b) => ({
    yieldVaultPlans: b.query<YieldVaultPlan[], void>({
      query: () => '/yield-vaults/plans/',
      transformResponse: (response: unknown) => unwrapData<YieldVaultPlan[]>(response, []),
      providesTags: [{ type: 'YieldVault', id: 'plans' }],
    }),
    yieldVaultPositions: b.query<YieldVaultPosition[], void>({
      query: () => '/yield-vaults/',
      transformResponse: (response: unknown) => unwrapData<YieldVaultPosition[]>(response, []),
      providesTags: (result) => [
        { type: 'YieldVault', id: 'LIST' },
        ...(result || []).map((item) => ({ type: 'YieldVault' as const, id: item.id })),
      ],
    }),
    yieldVaultPosition: b.query<YieldVaultPosition, string>({
      query: (id) => `/yield-vaults/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'YieldVault', id }],
    }),
    createYieldVault: b.mutation<YieldVaultPosition, CreateYieldVaultBody>({
      query: (body) => ({
        url: '/yield-vaults/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['YieldVault', 'Wallet', 'Transactions'],
    }),
    contributeYieldVault: b.mutation<
      { detail: string; position: YieldVaultPosition },
      { position_id: string; wallet_id: string; amount: number }
    >({
      query: (body) => ({
        url: '/yield-vaults/contribute/',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, body) => [
        'YieldVault',
        'Wallet',
        'Transactions',
        { type: 'YieldVault', id: body.position_id },
      ],
    }),
    redeemYieldVault: b.mutation<
      { detail: string; position: YieldVaultPosition },
      { position_id: string; note?: string }
    >({
      query: (body) => ({
        url: '/yield-vaults/redeem/',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, body) => [
        'YieldVault',
        { type: 'YieldVault', id: body.position_id },
      ],
    }),
  }),
});

export const {
  useYieldVaultPlansQuery,
  useYieldVaultPositionsQuery,
  useYieldVaultPositionQuery,
  useCreateYieldVaultMutation,
  useContributeYieldVaultMutation,
  useRedeemYieldVaultMutation,
} = yieldVaultApi;
