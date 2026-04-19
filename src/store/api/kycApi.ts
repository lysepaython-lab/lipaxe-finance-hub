import { api } from './baseApi';

export interface KycCountry { name: string; alpha_2: string }
export interface KycPersonal { dob: string; nationality: string; phone: string; gender?: 'M' | 'F' }
export interface KycAddress { street: string; city: string; postalCode: string; country: string }

export interface LivenessResult {
  is_live: boolean;
  blink_valid: boolean;
  blinks_detected: boolean;
  head_movement: boolean;
  smile_detected: boolean;
  error: string | null;
}

export const kycApi = api.injectEndpoints({
  endpoints: (b) => ({
    getKycData: b.query<{ status: string; personal?: KycPersonal; address?: KycAddress }, void>({
      query: () => '/api/kyc/useraddress/',
      providesTags: ['KYC'],
    }),
    submitPersonal: b.mutation<{ detail: string }, FormData>({
      query: (body) => ({ url: '/api/kyc/useraddress/infospersons/', method: 'POST', body }),
      invalidatesTags: ['KYC'],
    }),
    submitAddress: b.mutation<{ detail: string }, FormData>({
      query: (body) => ({ url: '/api/kyc/useraddress/', method: 'POST', body }),
      invalidatesTags: ['KYC'],
    }),
    submitDocuments: b.mutation<{ detail: string }, FormData>({
      query: (body) => ({ url: '/api/kyc/useraddress/documents/', method: 'POST', body }),
      invalidatesTags: ['KYC'],
    }),
    submitFinance: b.mutation<{ detail: string }, FormData>({
      query: (body) => ({ url: '/api/kyc/useraddress/finances/', method: 'POST', body }),
      invalidatesTags: ['KYC'],
    }),
    verifyPhone: b.mutation<{ detail: string }, { phone: string; otp: string }>({
      query: (body) => ({ url: '/api/kyc/phoneverify/', method: 'POST', body }),
    }),
    /**
     * Liveness check: send a sequence of frames captured from the camera.
     * The browser sets the multipart Content-Type automatically.
     */
    liveness: b.mutation<LivenessResult, FormData>({
      query: (body) => ({ url: '/api/kyc/vivacite/', method: 'POST', body }),
    }),
  }),
});

export const {
  useGetKycDataQuery,
  useSubmitPersonalMutation,
  useSubmitAddressMutation,
  useSubmitDocumentsMutation,
  useSubmitFinanceMutation,
  useVerifyPhoneMutation,
  useLivenessMutation,
} = kycApi;
