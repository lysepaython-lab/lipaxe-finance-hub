import { api } from './baseApi';
import {
  normalizeCardOffer,
  normalizeCardTransaction,
  normalizeUserCard,
  unwrapData,
} from './adapters';

export interface CardOffer {
  id: string;
  brand: 'Visa' | 'Mastercard';
  provider?: string;
  name: string;
  price: number;
  currency: string;
  monthly_fee?: number;
  description: string;
  card_type?: string;
  creation_fixed_fee?: number;
  creation_percentage_fee?: number;
  creation_minimum_fee?: number;
  live_creation_fixed_fee?: number;
  live_creation_percentage_fee?: number;
  live_creation_minimum_fee?: number;
  funding_fixed_fee?: number;
  funding_minimum_fee?: number;
  funding_fee_percent?: number;
  live_funding_fixed_fee?: number;
  live_funding_percentage_fee?: number;
  live_funding_minimum_fee?: number;
  lipaxe_fee_percent?: number;
  settlement_fee?: number;
  authorization_fee?: number;
  cross_border_fee_percent?: number;
  withdrawal_fee_percent?: number;
  daily_limit?: number;
  monthly_limit?: number;
  min_funding?: number;
  supports_3ds?: boolean;
  supports_apple_pay?: boolean;
  supports_google_pay?: boolean;
  authentication?: string;
  image?: string;
  features?: string[];
  decline_free_attempts_per_day?: number;
  decline_fee_per_attempt?: number;
  decline_max_attempts_per_day?: number;
  freeze_on_decline?: boolean;
}
export interface UserCard {
  id: string;
  brand: 'Visa' | 'Mastercard';
  card_number?: string;
  number_masked: string;
  name_on_card: string;
  exp: string;
  cvv?: string;
  billing?: string;
  first_six?: string;
  last_four?: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'inactive' | 'pending';
  image?: string;
  provider?: string;
  provider_mode?: string;
  provider_decline_count?: number;
  provider_decline_limit?: number;
  provider_decline_last_at?: string | null;
  is_freezon_by_system?: boolean;
  daily_limit?: number;
  daily_spend_today?: number;
  daily_limit_remaining?: number;
  daily_limit_reached_on?: string | null;
  is_daily_limit_frozen?: boolean;
}
export interface RevealedCardDetails {
  card_number: string;
  cvv: string;
  expiry: string;
  cardholder_name: string;
}
export interface CardTx {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'completed' | 'pending' | 'declined' | 'failed';
  createdAt: string;
}

export interface CardOperationResult {
  success?: boolean;
  status?: 'success' | 'pending' | 'failed';
  detail?: string;
  message?: string;
  reference?: string;
}
export interface CardWithdrawalRequest {
  id: number;
  status: 'pending' | 'needs_review' | 'completed' | 'failed';
  amount: string;
  provider_fee?: string;
  expected_credit?: string;
  credited_amount: string | null;
  wallet_id: string;
  requested_at: string;
  completed_at?: string | null;
}
export interface CardWithdrawalPreview {
  mode: 'sandbox' | 'live' | 'test' | string;
  card_balance: string;
  withdrawal_fee_bps: number;
  minimum_withdrawal: string;
  maximum_withdrawal: string;
}
export interface ScarabPayKycStatus {
  status: 'success' | 'unavailable';
  kyc_status: 'not_started' | 'unsubmitted' | 'pending' | 'review' | 'approved' | 'rejected' | string;
  kyc_failure_reason?: string;
  mode: 'sandbox' | 'live' | string;
}

export const cardApi = api.injectEndpoints({
  endpoints: (b) => ({
    cardOffers: b.query<CardOffer[], void>({
      query: () => '/cards/virtual-cards/',
      transformResponse: (response: unknown) =>
        unwrapData<unknown[]>(response, []).map((item) => normalizeCardOffer(item)),
    }),
    myCards: b.query<UserCard[], void>({
      query: () => '/cards/',
      transformResponse: (response: unknown) =>
        unwrapData<unknown[]>(response, []).map((item) => normalizeUserCard(item)),
      providesTags: ['Cards'],
    }),
    scarabPayKycStatus: b.query<ScarabPayKycStatus, void>({
      query: () => '/cards/scarabpay/kyc/',
      providesTags: ['KYC'],
    }),
    cardTransactions: b.query<CardTx[], string>({
      query: (cardId) => `/cards/${cardId}/transactions/`,
      transformResponse: (response: unknown) =>
        unwrapData<unknown[]>(response, []).map((item) => normalizeCardTransaction(item)),
      providesTags: (_r, _e, id) => [{ type: 'CardTx', id }],
    }),
    revealScarabPayCard: b.mutation<RevealedCardDetails, { card_id: string; pin: string }>({
      query: ({ card_id, pin }) => ({
        url: `/cards/${encodeURIComponent(card_id)}/details/`,
        method: 'POST',
        body: { pin },
      }),
    }),
    orderCard: b.mutation<UserCard | CardOperationResult, { id: string; amount: number; name_on_card: string; funding_amount: number; wallet_id: string; occupation?: string; employment_status?: string; account_purpose?: string; annual_salary?: string; expected_monthly_volume?: string; terms_of_service_accepted?: boolean }>({
      query: (body) => ({ url: '/cards/order-cards/', method: 'POST', body }),
      transformResponse: (response: unknown) => {
        const raw = (response ?? {}) as { status?: string; message?: string; reference?: string };
        return raw.status === 'pending' ? (raw as CardOperationResult) : normalizeUserCard(response);
      },
      invalidatesTags: ['Cards', 'Wallet', 'KYC'],
    }),
    rechargeCard: b.mutation<CardOperationResult, { card_id: string; amount: number; payment_method: string; wallet_id: string }>({
      query: (body) => ({ url: '/cards/recharge-cards/', method: 'POST', body }),
      transformResponse: (response: unknown) => response as CardOperationResult,
      invalidatesTags: ['Cards', 'Wallet'],
    }),
    withdrawCard: b.mutation<CardOperationResult, { card_id: string; amount: number; wallet_id: string }>({
      query: (body) => ({
        url: '/cards/withdrawal-card/',
        method: 'POST',
        body: { ...body, payment_method: 'wallet' },
      }),
      transformResponse: (response: unknown) => response as CardOperationResult,
      invalidatesTags: ['Cards', 'Wallet'],
    }),
    freezeCard: b.mutation<CardOperationResult, { card_id: string; action: 'freeze' | 'unfreeze' }>({
      query: (body) => ({ url: '/cards/freeze-card/', method: 'POST', body }),
      transformResponse: (response: unknown) => response as CardOperationResult,
      invalidatesTags: ['Cards'],
    }),
    terminateScarabPayCard: b.mutation<CardOperationResult, { card_id: string; pin: string; reason: 'lost' | 'stolen' | 'fraud' | 'no_longer_needed' | 'other' }>({
      query: ({ card_id, ...body }) => ({ url: `/cards/${encodeURIComponent(card_id)}/terminate/`, method: 'POST', body }),
      transformResponse: (response: unknown) => response as CardOperationResult,
      invalidatesTags: ['Cards', 'Wallet'],
    }),
    scarabPayCardWithdrawalRequest: b.query<{ request: CardWithdrawalRequest | null; preview: CardWithdrawalPreview }, string>({
      query: (cardId) => `/cards/${encodeURIComponent(cardId)}/withdraw/`,
      providesTags: (_r, _e, id) => [{ type: 'Cards', id: `withdrawal-${id}` }],
    }),
    requestScarabPayCardWithdrawal: b.mutation<CardOperationResult & { request?: CardWithdrawalRequest }, { card_id: string; wallet_id: string; amount: number; pin: string }>({
      query: ({ card_id, ...body }) => ({ url: `/cards/${encodeURIComponent(card_id)}/withdraw/`, method: 'POST', body }),
      transformResponse: (response: unknown) => response as CardOperationResult & { request?: CardWithdrawalRequest },
      invalidatesTags: (_r, _e, arg) => ['Cards', 'Wallet', { type: 'Cards', id: `withdrawal-${arg.card_id}` }],
    }),
    simulateScarabPayCard: b.mutation<CardOperationResult & { data?: Record<string, unknown> }, { card_id: string; type: 'purchase' | 'decline' | 'refund'; amount: number; pin: string; merchant_name?: string; decline_reason?: string }>({
      query: ({ card_id, ...body }) => ({ url: `/cards/${encodeURIComponent(card_id)}/simulate/`, method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => ['Cards', { type: 'CardTx', id: arg.card_id }],
    }),
  }),
});

export const {
  useCardOffersQuery,
  useMyCardsQuery,
  useScarabPayKycStatusQuery,
  useCardTransactionsQuery,
  useRevealScarabPayCardMutation,
  useOrderCardMutation,
  useRechargeCardMutation,
  useWithdrawCardMutation,
  useFreezeCardMutation,
  useTerminateScarabPayCardMutation,
  useScarabPayCardWithdrawalRequestQuery,
  useRequestScarabPayCardWithdrawalMutation,
  useSimulateScarabPayCardMutation,
} = cardApi;
