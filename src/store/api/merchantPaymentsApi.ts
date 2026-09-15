import { api } from './baseApi';

export type MerchantPaymentIntent = {
  id: string;
  reference: string;
  merchant: { name: string; country_code: string };
  description: string;
  amount: string;
  currency: string;
  expires_at: string;
  return_url?: string;
};

type MerchantPaymentResponse = {
  transaction: { id: string; reference: string; amount: string; currency: string; status: string };
  return_url?: string;
};

export const merchantPaymentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    merchantPaymentIntent: builder.query<MerchantPaymentIntent, string>({
      query: (paymentIntentId) => `/merchants/payment-intents/${paymentIntentId}/checkout/`,
      transformResponse: (response: { payment_intent: MerchantPaymentIntent }) => response.payment_intent,
    }),
    payMerchantIntent: builder.mutation<MerchantPaymentResponse, {
      payment_intent_id: string;
      customer_wallet_id: string;
      pin: string;
      idempotency_key: string;
    }>({
      query: ({ idempotency_key, ...body }) => ({
        url: '/merchants/pay/',
        method: 'POST',
        body,
        headers: { 'Idempotency-Key': idempotency_key },
      }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
  }),
});

export const { useMerchantPaymentIntentQuery, usePayMerchantIntentMutation } = merchantPaymentsApi;
