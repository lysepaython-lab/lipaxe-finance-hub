import { api } from './baseApi';

export interface Wallet { id: string; currency: string; symbol: string; balance: number; available: number; pending: number; }
export interface Transaction {
  id: string; type: 'deposit' | 'withdrawal' | 'transfer'; direction: 'in' | 'out';
  amount: number; currency: string; status: 'completed' | 'pending' | 'failed' | 'processing';
  description: string; counterparty: string; reference: string; createdAt: string; fee?: number;
  wallet_id?: string;
}
export interface FxQuote { from: string; to: string; amount: number; rate: number; fee: number; receive: number; }
export interface RecipientLookup { account_no: string; name: string; avatar?: string; verified: boolean; }

export const walletApi = api.injectEndpoints({
  endpoints: (b) => ({
    wallets: b.query<Wallet[], void>({ query: () => '/api/v2/wallets/', providesTags: ['Wallet'] }),
    transactions: b.query<Transaction[], void>({ query: () => '/api/transactions/', providesTags: ['Transactions'] }),
    transaction: b.query<Transaction, string>({
      query: (id) => `/api/transactions/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'Transactions', id }],
    }),
    fxQuote: b.mutation<FxQuote, { from: string; to: string; amount: number }>({
      query: (body) => ({ url: '/fx/quote/', method: 'POST', body }),
    }),
    deposit: b.mutation<Transaction, { amount: number; payment_method: string; wallet_id: string; phone?: string }>({
      query: (body) => ({ url: '/api/transactions/deposit/', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    cardDeposit: b.mutation<Transaction, { amount: number; payment_method: string; wallet_id: string; card_token?: string }>({
      query: (body) => ({ url: '/api/transactions/card/', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    electronicDeposit: b.mutation<Transaction, { amount: number; payment_method: string; wallet_id: string }>({
      query: (body) => ({ url: '/api/transactions/electronic/', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    cryptoDeposit: b.mutation<Transaction, { amount: number; payment_method: string; wallet_id: string; network?: string }>({
      query: (body) => ({ url: '/api/transactions/crypto/', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    withdraw: b.mutation<Transaction, { amount: number; wallet_id: string; payment_method: string; destination: string; phone?: string }>({
      query: (body) => ({ url: '/api/transactions/withdrawal/', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    transfer: b.mutation<Transaction, {
      kind: 'internal' | 'international';
      amount: number;
      wallet_id: string;
      from_account: string;
      to_account: string;
      payment_method: string;
      toCurrency?: string;
      note?: string;
    }>({
      query: (body) => ({ url: '/api/transactions/transfert/', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    transferQrLink: b.mutation<{ token: string; amount: number; currency: string; url?: string }, { amount: number; wallet_id: string; currency: string; expires_in?: number }>({
      query: (body) => ({ url: '/api/transactions/transfertlinkqrcode/', method: 'POST', body }),
    }),
    validateQr: b.mutation<{ detail: string; amount: number; currency: string }, { token: string; pin?: string; otp?: string }>({
      query: (body) => ({ url: '/api/transactions/validate/', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    lookupRecipient: b.mutation<RecipientLookup, { account_no: string }>({
      query: (body) => ({ url: '/api/transactions/lookup/', method: 'POST', body }),
    }),
    activity: b.query<{ id: string; action: string; ip: string; device: string; createdAt: string }[], void>({
      query: () => '/activity/', providesTags: ['Activity'],
    }),
  }),
});

export const {
  useWalletsQuery, useTransactionsQuery, useTransactionQuery,
  useFxQuoteMutation,
  useDepositMutation, useCardDepositMutation, useElectronicDepositMutation, useCryptoDepositMutation,
  useWithdrawMutation, useTransferMutation,
  useTransferQrLinkMutation, useValidateQrMutation,
  useLookupRecipientMutation,
  useActivityQuery,
} = walletApi;
