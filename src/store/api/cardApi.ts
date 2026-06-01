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
  name: string;
  price: number;
  currency: string;
  monthly_fee: number;
  description: string;
  card_type?: string;
  creation_fixed_fee?: number;
  funding_fixed_fee?: number;
  funding_fee_percent?: number;
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
}
export interface UserCard {
  id: string;
  brand: 'Visa' | 'Mastercard';
  number_masked: string;
  name_on_card: string;
  exp: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'inactive' | 'pending';
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
    cardTransactions: b.query<CardTx[], string>({
      query: (cardId) => `/cards/${cardId}/transactions/`,
      transformResponse: (response: unknown) =>
        unwrapData<unknown[]>(response, []).map((item) => normalizeCardTransaction(item)),
      providesTags: (_r, _e, id) => [{ type: 'CardTx', id }],
    }),
    orderCard: b.mutation<UserCard | CardOperationResult, { id: string; amount: number; name_on_card: string; funding_amount: number; wallet_id: string }>({
      query: (body) => ({ url: '/cards/order-cards/', method: 'POST', body }),
      transformResponse: (response: unknown) => {
        const raw = (response ?? {}) as { status?: string; message?: string; reference?: string };
        return raw.status === 'pending' ? (raw as CardOperationResult) : normalizeUserCard(response);
      },
      invalidatesTags: ['Cards', 'Wallet'],
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
  }),
});

export const {
  useCardOffersQuery,
  useMyCardsQuery,
  useCardTransactionsQuery,
  useOrderCardMutation,
  useRechargeCardMutation,
  useWithdrawCardMutation,
  useFreezeCardMutation,
} = cardApi;
