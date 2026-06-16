import { api } from './baseApi';
import { normalizePaymentMethod, normalizeWallet, unwrapData } from './adapters';

export interface IncountryEntry {
  country: { id?: string; name: string; alpha_2: string; isoCode?: string; phone_code?: string; dialling_code?: string };
}
export type PaymentTypeName = 'Mobile Payment' | 'Electronic' | 'Cryptos' | 'Bank Transfer';
export interface PaymentMethod {
  id: string;
  name: string;
  provider?: string;
  correspondent?: string;
  is_international?: boolean;
  type: 'mobile' | 'card' | 'bank' | 'electronic' | 'crypto';
  payment_type?: { name: PaymentTypeName };
  icon?: string;
  countries: { country: { id?: string; name: string; alpha_2: string; isoCode?: string } }[];
  fees?: {
    fixed: number;
    percent: number;
    lipaxePercent?: number;
    providerPercent?: number;
    transferPercent?: number;
    withdrawalPercent?: number;
    providerWithdrawalPercent?: number;
  };
}
export interface WalletV2 {
  id: string;
  currency: string;
  symbol: string;
  logo?: string;
  logoUrl?: string;
  balance: number;
  available: number;
  pending: number;
}

export const platformApi = api.injectEndpoints({
  endpoints: (b) => ({
    countries: b.query<IncountryEntry[], void>({
      query: () => '/kyc/incountries/',
      transformResponse: (r: unknown) =>
        unwrapData<unknown[]>(r, []).map((item) => {
          const entry = (item ?? {}) as Record<string, unknown>;
          const nested = (entry.country ?? {}) as Record<string, unknown>;
          const id = entry.id ?? nested.id ?? '';
          const name = nested.name ?? entry.name ?? '';
          const alpha2 = nested.alpha_2 ?? entry.alpha_2 ?? '';
          const isoCode = nested.isoCode ?? entry.isoCode ?? '';
          const phoneCode =
            nested.phone_code ??
            nested.dialling_code ??
            entry.phone_code ??
            entry.dialling_code ??
            '';
          return {
            country: {
              id: String(id),
              name: String(name),
              alpha_2: String(alpha2),
              isoCode: String(isoCode || ''),
              phone_code: String(phoneCode || ''),
              dialling_code: String(phoneCode || ''),
            },
          };
        }).filter((entry) => Boolean(entry.country.alpha_2 && entry.country.name)),
      providesTags: ['Countries'],
    }),
    walletsV2: b.query<WalletV2[], void>({
      query: () => '/wallets/',
      transformResponse: (response: unknown) =>
        unwrapData<unknown[]>(response, []).map((item) => normalizeWallet(item)),
      providesTags: ['Wallet'],
    }),
    paymentMethodsDeposit: b.query<PaymentMethod[], void>({
      query: () => '/transactions/payment-methods/deposit/',
      transformResponse: (response: unknown) =>
        unwrapData<unknown[]>(response, []).map((item) => normalizePaymentMethod(item)),
      providesTags: [{ type: 'PaymentMethods', id: 'deposit' }],
    }),
    paymentMethodsWithdrawal: b.query<PaymentMethod[], void>({
      query: () => '/transactions/payment-methods/withdrawal/',
      transformResponse: (response: unknown) =>
        unwrapData<unknown[]>(response, []).map((item) => normalizePaymentMethod(item)),
      providesTags: [{ type: 'PaymentMethods', id: 'withdrawal' }],
    }),
    paymentMethodsInternational: b.query<PaymentMethod[], void>({
      query: () => '/transactions/payment-methods/international/',
      transformResponse: (response: unknown) =>
        unwrapData<unknown[]>(response, []).map((item) => normalizePaymentMethod(item)),
      providesTags: [{ type: 'PaymentMethods', id: 'intl' }],
    }),
    verifyPin: b.mutation<{ valid: boolean }, { pin: string }>({
      query: (body) => ({ url: '/auth/verify-pin/', method: 'POST', body }),
      transformResponse: () => ({ valid: true }),
    }),
    updatePin: b.mutation<{ detail: string }, { pin: string; current_pin?: string }>({
      query: (body) => ({ url: '/auth/update-pin/', method: 'POST', body }),
      transformResponse: () => ({ detail: 'PIN mis a jour' }),
    }),
  }),
});

export const {
  useCountriesQuery,
  useWalletsV2Query,
  usePaymentMethodsDepositQuery,
  usePaymentMethodsWithdrawalQuery,
  usePaymentMethodsInternationalQuery,
  useVerifyPinMutation,
  useUpdatePinMutation,
} = platformApi;
