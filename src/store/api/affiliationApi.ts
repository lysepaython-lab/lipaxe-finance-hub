import { api } from './baseApi';
import { normalizeAffiliateCode, normalizeCommissions } from './adapters';

export interface AffiliateCode {
  code: string;
  link: string;
  total_referrals: number;
}
export interface Commission {
  id: string;
  amount: number;
  currency: string;
  from_user: string;
  status: 'pending' | 'paid';
  createdAt: string;
}
export interface AffiliatePayoutResult {
  detail: string;
  amount: string;
  currency: string;
  wallet_amount: string;
  wallet_currency: string;
}
export interface AffiliateDiscountCode {
  id: string;
  code: string;
  percent: number;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  createdAt: string;
}

const normalizeDiscountCodes = (response: unknown): AffiliateDiscountCode[] => {
  const source = (response as { data?: unknown })?.data ?? response;
  if (!Array.isArray(source)) return [];
  return source.map((value): AffiliateDiscountCode => {
    const item = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return {
      id: String(item.id ?? ''),
      code: typeof item.code === 'string' ? item.code : '',
      percent: Number(item.percent ?? 0),
      usage_limit: Number(item.usage_limit ?? 0),
      used_count: Number(item.used_count ?? 0),
      is_active: Boolean(item.is_active),
      createdAt: typeof item.created_at === 'string' ? item.created_at : typeof item.createdAt === 'string' ? item.createdAt : '',
    };
  });
};

export const affiliationApi = api.injectEndpoints({
  endpoints: (b) => ({
    affiliateCode: b.query<AffiliateCode, void>({
      query: () => '/affiliation/affiliate-code/',
      transformResponse: (response: unknown) => normalizeAffiliateCode(response),
      providesTags: ['Affiliation'],
    }),
    commissions: b.query<Commission[], void>({
      query: () => '/affiliation/commissions/',
      transformResponse: (response: unknown) => normalizeCommissions(response),
      providesTags: ['Affiliation'],
    }),
    affiliatePayout: b.mutation<AffiliatePayoutResult, { wallet_id: string; email: string }>({
      query: (body) => ({
        url: '/affiliation/payout/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Affiliation', 'Wallet'],
    }),
    affiliateDiscountCodes: b.query<AffiliateDiscountCode[], void>({
      query: () => '/affiliation/discount-codes/',
      transformResponse: normalizeDiscountCodes,
      providesTags: ['Affiliation'],
    }),
    createAffiliateDiscountCode: b.mutation<AffiliateDiscountCode, { code?: string; percent: number; usage_limit?: number }>({
      query: (body) => ({
        url: '/affiliation/discount-codes/',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => {
        const source = (response as { data?: unknown })?.data ?? response;
        return normalizeDiscountCodes([source])[0];
      },
      invalidatesTags: ['Affiliation'],
    }),
  }),
});

export const {
  useAffiliateCodeQuery,
  useAffiliateDiscountCodesQuery,
  useAffiliatePayoutMutation,
  useCommissionsQuery,
  useCreateAffiliateDiscountCodeMutation,
} = affiliationApi;
