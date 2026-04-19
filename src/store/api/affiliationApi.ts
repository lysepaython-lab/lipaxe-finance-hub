import { api } from './baseApi';

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
      query: () => '/api/affiliate-code/',
      providesTags: ['Affiliation'],
    }),
    commissions: b.query<Commission[], void>({
      query: () => '/api/commissions/',
      providesTags: ['Affiliation'],
    }),
  }),
});

export const { useAffiliateCodeQuery, useCommissionsQuery } = affiliationApi;
