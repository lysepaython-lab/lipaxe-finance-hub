import { api } from './baseApi';

export interface IncountryEntry {
  country: { name: string; alpha_2: string; phone_code?: string };
}
export type PaymentTypeName = 'Mobile Payment' | 'Electronic' | 'Cryptos' | 'Bank Transfer';
export interface PaymentMethod {
  id: string;
  name: string;
  type: 'mobile' | 'card' | 'bank' | 'electronic' | 'crypto';
  payment_type?: { name: PaymentTypeName };
  icon?: string;
  countries: { country: { name: string; alpha_2: string } }[];
  fees?: { fixed: number; percent: number };
}
export interface WalletV2 {
  id: string;
  currency: string;
  symbol: string;
  balance: number;
  available: number;
  pending: number;
}

export const platformApi = api.injectEndpoints({
  endpoints: (b) => ({
    countries: b.query<IncountryEntry[], void>({
      query: () => '/api/kyc/incountries/',
      providesTags: ['Countries'],
      transformResponse: (r: { data: IncountryEntry[] } | IncountryEntry[]) =>
        Array.isArray(r) ? r : r.data,
    }),
    walletsV2: b.query<WalletV2[], void>({
      query: () => '/api/v2/wallets/',
      providesTags: ['Wallet'],
    }),
    paymentMethodsDeposit: b.query<PaymentMethod[], void>({
      query: () => '/api/transactions/payment-methods/deposit/',
      providesTags: [{ type: 'PaymentMethods', id: 'deposit' }],
    }),
    paymentMethodsWithdrawal: b.query<PaymentMethod[], void>({
      query: () => '/api/transactions/payment-methods/withdrawal/',
      providesTags: [{ type: 'PaymentMethods', id: 'withdrawal' }],
    }),
    paymentMethodsInternational: b.query<PaymentMethod[], void>({
      query: () => '/api/transactions/payment-methods/international/',
      providesTags: [{ type: 'PaymentMethods', id: 'intl' }],
    }),
    verifyPin: b.mutation<{ valid: boolean }, { pin: string }>({
      query: (body) => ({ url: '/api/verify-pin/', method: 'POST', body }),
    }),
    updatePin: b.mutation<{ detail: string }, { pin: string; current_pin?: string }>({
      query: (body) => ({ url: '/api/update-pin/', method: 'POST', body }),
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
