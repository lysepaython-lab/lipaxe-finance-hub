import { api } from './baseApi';
import { normalizeTransaction, normalizeWallet, unwrapData } from './adapters';

export interface Wallet { id: string; currency: string; symbol: string; logo?: string; logoUrl?: string; balance: number; available: number; pending: number; }
export interface Transaction {
  id: string; type: 'deposit' | 'withdrawal' | 'transfer'; rawType?: string; direction: 'in' | 'out';
  amount: number; currency: string; status: 'completed' | 'pending' | 'failed' | 'processing';
  description: string; counterparty: string; reference: string; createdAt: string; fee?: number;
  lipaxeFee?: number; providerFee?: number;
  wallet_id?: string; paymentMethodName?: string; paymentMethodLogo?: string; provider?: string;
}
export interface FxQuote { from: string; to: string; amount: number; rate: number; fee: number; receive: number; }
export interface WalletSwapQuote {
  from_currency: string;
  to_currency: string;
  from_amount: string;
  fee_percent: string;
  fee_amount: string;
  net_source_amount: string;
  to_amount: string;
  effective_rate: string;
}
export interface WalletSwapResult {
  detail: string;
  transaction_id: string;
  credit_transaction_id: string;
  quote: WalletSwapQuote;
  from_wallet: Wallet;
  to_wallet: Wallet;
}
export interface RecipientLookup { account_no: string; name: string; avatar?: string; verified: boolean; }
export interface DepositInitiation {
  id?: string;
  status?: string;
  message?: string;
  detail?: string;
  otp_confirm?: boolean;
  transaction_id?: string;
}
export interface NfcP2PAcceptPayload {
  signed_token: {
    payload: {
      payer_wallet_id?: string;
      wallet_id?: string;
      receiver_wallet_id?: string;
      card_uid: string;
      amount: string | number;
      currency: string;
      nonce: string;
      expires_at: string;
      device_id?: string;
    };
    signature: string;
  };
  pin: string;
  receiver_wallet_id?: string;
}
export interface NfcP2PAcceptResult {
  status: 'APPROVED';
  message: string;
  amount: string;
  fees: string;
  currency: string;
  sender_transaction_id: string;
  receiver_transaction_id: string;
  nfc_transaction_id: string;
  balance_remaining: string;
}

const QR_CACHE_KEY = 'lipaxe-qr-links';

const saveQrCache = (entry: { token: string; amount: number; currency: string; sender: string }) => {
  try {
    const current = JSON.parse(localStorage.getItem(QR_CACHE_KEY) || '[]') as typeof entry[];
    localStorage.setItem(
      QR_CACHE_KEY,
      JSON.stringify([entry, ...current.filter((item) => item.token !== entry.token)].slice(0, 20)),
    );
  } catch {}
};

const getQrCache = (token: string) => {
  try {
    const current = JSON.parse(localStorage.getItem(QR_CACHE_KEY) || '[]') as Array<{
      token: string;
      amount: number;
      currency: string;
      sender: string;
    }>;
    return current.find((item) => item.token === token) || null;
  } catch {
    return null;
  }
};

export const walletApi = api.injectEndpoints({
  endpoints: (b) => ({
    wallets: b.query<Wallet[], void>({
      query: () => '/wallets/',
      transformResponse: (response: unknown) =>
        unwrapData<unknown[]>(response, []).map((item) => normalizeWallet(item)),
      providesTags: ['Wallet'],
    }),
    transactions: b.query<Transaction[], void>({
      query: () => '/transactions/',
      transformResponse: (response: unknown) =>
        unwrapData<unknown[]>(response, []).map((item) => normalizeTransaction(item)),
      providesTags: ['Transactions'],
    }),
    transaction: b.query<Transaction, string>({
      query: (id) => `/transactions/${id}/`,
      transformResponse: (response: unknown) => {
        const data = unwrapData<unknown[] | unknown>(response, {});
        const item = Array.isArray(data) ? data[0] : data;
        return normalizeTransaction(item);
      },
      providesTags: (_r, _e, id) => [{ type: 'Transactions', id }],
    }),
    fxQuote: b.mutation<FxQuote, { from: string; to: string; amount: number }>({
      queryFn: async ({ from, to, amount }) => {
        const rate = from === to ? 1 : 1;
        const fee = Number((amount * 0.015).toFixed(2));
        return {
          data: {
            from,
            to,
            amount,
            rate,
            fee,
            receive: Number((amount * rate - fee).toFixed(2)),
          },
        };
      },
    }),
    walletSwapQuote: b.mutation<WalletSwapQuote, { from_wallet_id: string; to_currency: string; amount: number }>({
      query: (body) => ({
        url: '/wallets/swap/quote/',
        method: 'POST',
        body,
      }),
    }),
    walletSwapExecute: b.mutation<WalletSwapResult, { from_wallet_id: string; to_currency: string; amount: number }>({
      query: (body) => ({
        url: '/wallets/swap/execute/',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => {
        const raw = (response ?? {}) as Record<string, unknown>;
        const quote = (raw.quote ?? {}) as WalletSwapQuote;
        return {
          detail: String(raw.detail ?? ''),
          transaction_id: String(raw.transaction_id ?? ''),
          credit_transaction_id: String(raw.credit_transaction_id ?? ''),
          quote,
          from_wallet: normalizeWallet(raw.from_wallet),
          to_wallet: normalizeWallet(raw.to_wallet),
        };
      },
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    walletExchangeQuote: b.mutation<WalletSwapQuote, { from_wallet_id: string; to_currency: string; amount: number }>({
      query: (body) => ({
        url: '/wallets/exchange/quote/',
        method: 'POST',
        body,
      }),
    }),
    walletExchangeExecute: b.mutation<WalletSwapResult, { from_wallet_id: string; to_currency: string; amount: number }>({
      query: (body) => ({
        url: '/wallets/exchange/execute/',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => {
        const raw = (response ?? {}) as Record<string, unknown>;
        const quote = (raw.quote ?? {}) as WalletSwapQuote;
        return {
          detail: String(raw.detail ?? ''),
          transaction_id: String(raw.transaction_id ?? ''),
          credit_transaction_id: String(raw.credit_transaction_id ?? ''),
          quote,
          from_wallet: normalizeWallet(raw.from_wallet),
          to_wallet: normalizeWallet(raw.to_wallet),
        };
      },
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    deposit: b.mutation<DepositInitiation, { amount: number; payment_method: string; payment_method_id?: string; wallet_id: string; phone?: string }>({
      query: ({ phone, ...body }) => ({
        url: '/transactions/deposit/',
        method: 'POST',
        body: { ...body, phone },
      }),
      transformResponse: (response: unknown) => {
        const raw = (response ?? {}) as Record<string, unknown>;
        return {
          id: raw.id ? String(raw.id) : undefined,
          status: raw.status ? String(raw.status) : undefined,
          message: raw.message ? String(raw.message) : undefined,
          detail: raw.detail ? String(raw.detail) : undefined,
          otp_confirm: Boolean(raw.otp_confirm),
          transaction_id: raw.transaction_id ? String(raw.transaction_id) : undefined,
        };
      },
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    afripayDeposit: b.mutation<DepositInitiation, { amount: number; payment_method: string; wallet_id: string; phone: string }>(
      {
        query: (body) => ({
          url: '/providers/v2/deposit/afripay/',
          method: 'POST',
          body,
        }),
        transformResponse: (response: unknown) => {
          const raw = (response ?? {}) as Record<string, unknown>;
          return {
            id: raw.id ? String(raw.id) : undefined,
            status: raw.status ? String(raw.status) : undefined,
            message: raw.message ? String(raw.message) : undefined,
            detail: raw.detail ? String(raw.detail) : undefined,
            otp_confirm: Boolean(raw.otp_confirm),
            transaction_id: raw.transaction_id ? String(raw.transaction_id) : undefined,
          };
        },
        invalidatesTags: ['Wallet', 'Transactions'],
      },
    ),
    afripayDepositConfirm: b.mutation<DepositInitiation, { transaction_id: string; otp: string }>({
      query: (body) => ({
        url: '/providers/v2/deposit/afripay/confirm/',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => {
        const raw = (response ?? {}) as Record<string, unknown>;
        return {
          status: raw.status ? String(raw.status) : undefined,
          message: raw.message ? String(raw.message) : undefined,
          detail: raw.detail ? String(raw.detail) : undefined,
          otp_confirm: Boolean(raw.otp_confirm),
          transaction_id: raw.transaction_id ? String(raw.transaction_id) : undefined,
        };
      },
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    cardDeposit: b.mutation<Transaction, { amount: number; payment_method: string; payment_method_id?: string; wallet_id: string; card_token?: string; card_number?: string; validity?: string }>({
      query: (body) => ({ url: '/transactions/card/', method: 'POST', body }),
      transformResponse: (response: unknown) => normalizeTransaction(response),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    electronicDeposit: b.mutation<Transaction, { amount: number; payment_method: string; payment_method_id?: string; wallet_id: string }>({
      query: (body) => ({ url: '/transactions/electronic/', method: 'POST', body }),
      transformResponse: (response: unknown) => normalizeTransaction(response),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    cryptoDeposit: b.mutation<Transaction, { amount: number; payment_method: string; payment_method_id?: string; wallet_id: string; network?: string }>({
      query: (body) => ({ url: '/transactions/crypto/', method: 'POST', body }),
      transformResponse: (response: unknown) => normalizeTransaction(response),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    withdraw: b.mutation<Transaction, { amount: number; wallet_id: string; payment_method: string; payment_method_id?: string; destination: string; phone?: string; card_number?: string; validity?: string; address?: string; network?: string }>({
      query: (body) => ({ url: '/transactions/withdrawal/', method: 'POST', body }),
      transformResponse: (response: unknown) => normalizeTransaction(response),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    transfer: b.mutation<Transaction, {
      kind: 'internal' | 'international';
      amount: number;
      wallet_id: string;
      from_account: string;
      to_account: string;
      payment_method?: string;
      payment_method_id?: string;
      toCurrency?: string;
      note?: string;
    }>({
      query: ({ payment_method, ...body }) => ({
        url: '/transactions/transfert/',
        method: 'POST',
        body: payment_method ? { ...body, payment_method } : body,
      }),
      transformResponse: (response: unknown) => normalizeTransaction(response),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    transferQrLink: b.mutation<{ token: string; amount: number; currency: string; url?: string; expires_at?: string }, { amount: number; wallet_id: string; currency: string; expires_in?: number; note?: string }>({
      async queryFn(body, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          url: '/transactions/transfertlinkqrcode/',
          method: 'POST',
          body: {
            amount: body.amount,
            wallet_id: body.wallet_id,
            note: body.note,
          },
        });
        if ('error' in result) return { error: result.error };

        const data = (result.data ?? {}) as Record<string, unknown>;
        const mapped = {
          token: String(data.token ?? ''),
          amount: Number(data.amount ?? body.amount),
          currency: body.currency,
          url: `${window.location.origin}/pay/${String(data.token ?? '')}`,
          expires_at: '',
        };
        saveQrCache({ token: mapped.token, amount: mapped.amount, currency: mapped.currency, sender: 'Lipaxe user' });
        return { data: mapped };
      },
    }),
    qrInfo: b.query<{ token: string; amount: number; currency: string; sender: string; expires_at?: string }, string>({
      async queryFn(token, _api, _extraOptions, baseQuery) {
        const result = await baseQuery(`/transactions/qr/${encodeURIComponent(token)}/`);
        if ('error' in result) {
          const cached = getQrCache(token);
          if (cached) return { data: cached };
          return { error: result.error };
        }
        const raw = (result.data ?? {}) as Record<string, unknown>;
        const data = {
          token: String(raw.token ?? token),
          amount: Number(raw.amount ?? 0),
          currency: String(raw.currency ?? 'USD'),
          sender: String(raw.sender ?? ''),
          expires_at: String(raw.expires_at ?? ''),
        };
        saveQrCache(data);
        return { data };
      },
    }),
    validateQr: b.mutation<{ detail: string; amount: number; currency: string }, { token: string; pin?: string; otp?: string; wallet_id?: string }>({
      query: (body) => ({ url: '/transactions/validate/', method: 'POST', body }),
      transformResponse: (response: unknown) => {
        const raw = (response ?? {}) as Record<string, unknown>;
        return {
          detail: String(raw.message ?? 'QR valide'),
          amount: Number(raw.amount ?? 0),
          currency: 'USD',
        };
      },
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    acceptNfcP2P: b.mutation<NfcP2PAcceptResult, NfcP2PAcceptPayload>({
      query: (body) => ({ url: '/transactions/nfc/p2p/accept/', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    lookupRecipient: b.mutation<RecipientLookup, { account_no: string }>({
      query: (body) => ({
        url: '/transactions/lookup/',
        method: 'POST',
        body,
      }),
    }),
    activity: b.query<{ id: string; action: string; ip: string; device: string; createdAt: string }[], void>({
      query: () => '/auth/activity/',
      providesTags: ['Activity'],
    }),
  }),
});

export const {
  useWalletsQuery, useTransactionsQuery, useTransactionQuery,
  useFxQuoteMutation, useWalletSwapQuoteMutation, useWalletSwapExecuteMutation,
  useWalletExchangeQuoteMutation, useWalletExchangeExecuteMutation,
  useDepositMutation, useAfripayDepositMutation, useAfripayDepositConfirmMutation, useCardDepositMutation, useElectronicDepositMutation, useCryptoDepositMutation,
  useWithdrawMutation, useTransferMutation,
  useTransferQrLinkMutation, useValidateQrMutation, useQrInfoQuery, useAcceptNfcP2PMutation,
  useLookupRecipientMutation,
  useActivityQuery,
} = walletApi;
