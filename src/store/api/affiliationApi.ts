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
  }),
});

export const { useAffiliateCodeQuery, useCommissionsQuery } = affiliationApi;
