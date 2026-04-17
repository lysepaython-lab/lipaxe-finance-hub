import { api } from './baseApi';

export interface Wallet { currency: string; symbol: string; balance: number; available: number; pending: number; }
export interface Transaction {
  id: string; type: 'deposit' | 'withdrawal' | 'transfer'; direction: 'in' | 'out';
  amount: number; currency: string; status: 'completed' | 'pending' | 'failed' | 'processing';
  description: string; counterparty: string; reference: string; createdAt: string; fee?: number;
}
export interface FxQuote { from: string; to: string; amount: number; rate: number; fee: number; receive: number; }

export const walletApi = api.injectEndpoints({
  endpoints: (b) => ({
    wallets: b.query<Wallet[], void>({ query: () => '/wallets/', providesTags: ['Wallet'] }),
    transactions: b.query<Transaction[], void>({ query: () => '/transactions/', providesTags: ['Transactions'] }),
    transaction: b.query<Transaction, string>({ query: (id) => `/transactions/${id}/` }),
    fxQuote: b.mutation<FxQuote, { from: string; to: string; amount: number }>({
      query: (body) => ({ url: '/fx/quote/', method: 'POST', body }),
    }),
    deposit: b.mutation<Transaction, { amount: number; currency: string; method: 'card' | 'bank' | 'mobile' }>({
      query: (body) => ({ url: '/deposits/', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    withdraw: b.mutation<Transaction, { amount: number; currency: string; destination: string }>({
      query: (body) => ({ url: '/withdrawals/', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    transfer: b.mutation<Transaction, { kind: 'internal' | 'international'; recipient: string; amount: number; fromCurrency: string; toCurrency: string; note?: string }>({
      query: (body) => ({ url: '/transfers/', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    submitKyc: b.mutation<{ status: string }, any>({
      query: (body) => ({ url: '/kyc/submit/', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    activity: b.query<{ id: string; action: string; ip: string; device: string; createdAt: string }[], void>({
      query: () => '/activity/', providesTags: ['Activity'],
    }),
  }),
});

export const {
  useWalletsQuery, useTransactionsQuery, useTransactionQuery,
  useFxQuoteMutation, useDepositMutation, useWithdrawMutation, useTransferMutation,
  useSubmitKycMutation, useActivityQuery,
} = walletApi;
