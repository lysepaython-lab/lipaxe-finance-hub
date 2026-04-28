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
}
export interface UserCard {
  id: string;
  brand: 'Visa' | 'Mastercard';
  number_masked: string;
  name_on_card: string;
  exp: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'inactive';
}
export interface CardTx {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'completed' | 'pending' | 'declined';
  createdAt: string;
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
    orderCard: b.mutation<
      UserCard,
      { id: string; amount: number; name_on_card: string; funding_amount: number; wallet_id: string }
    >({
      query: (body) => ({ url: '/cards/order-cards/', method: 'POST', body }),
      transformResponse: (response: unknown) => normalizeUserCard(response),
      invalidatesTags: ['Cards', 'Wallet'],
    }),
    rechargeCard: b.mutation<
      { detail: string },
      { card_id: string; amount: number; payment_method: string; wallet_id: string }
    >({
      query: (body) => ({ url: '/cards/recharge-cards/', method: 'POST', body }),
      transformResponse: () => ({ detail: 'Carte rechargee' }),
      invalidatesTags: ['Cards', 'Wallet'],
    }),
    withdrawCard: b.mutation<
      { detail: string },
      { card_id: string; amount: number; wallet_id: string }
    >({
      query: (body) => ({
        url: '/cards/withdrawal-card/',
        method: 'POST',
        body: { ...body, payment_method: 'wallet' },
      }),
      transformResponse: () => ({ detail: 'Retrait carte effectue' }),
      invalidatesTags: ['Cards', 'Wallet'],
    }),
    freezeCard: b.mutation<{ detail: string }, { card_id: string; action: 'freeze' | 'unfreeze' }>({
      query: (body) => ({ url: '/cards/freeze-card/', method: 'POST', body }),
      transformResponse: () => ({ detail: 'Statut carte mis a jour' }),
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
