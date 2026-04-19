import { api } from './baseApi';

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
      query: () => '/api/virtual-cards/',
    }),
    myCards: b.query<UserCard[], void>({
      query: () => '/api/cards/',
      providesTags: ['Cards'],
    }),
    cardTransactions: b.query<CardTx[], string>({
      query: (cardId) => `/api/card/${cardId}/transactions/`,
      providesTags: (_r, _e, id) => [{ type: 'CardTx', id }],
    }),
    orderCard: b.mutation<
      UserCard,
      { id: string; amount: number; name_on_card: string; funding_amount: number; wallet_id: string }
    >({
      query: (body) => ({ url: '/api/order-cards/', method: 'POST', body }),
      invalidatesTags: ['Cards', 'Wallet'],
    }),
    rechargeCard: b.mutation<
      { detail: string },
      { card_id: string; amount: number; payment_method: string; wallet_id: string }
    >({
      query: (body) => ({ url: '/api/recharge-cards/', method: 'POST', body }),
      invalidatesTags: ['Cards', 'Wallet'],
    }),
    withdrawCard: b.mutation<
      { detail: string },
      { card_id: string; amount: number; wallet_id: string }
    >({
      query: (body) => ({ url: '/api/card/withdrawal-card/', method: 'POST', body }),
      invalidatesTags: ['Cards', 'Wallet'],
    }),
    freezeCard: b.mutation<UserCard, { card_id: string; action: 'freeze' | 'unfreeze' }>({
      query: (body) => ({ url: '/api/card/freeze-card/', method: 'POST', body }),
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
