import { api } from './baseApi';

export interface KycCountry { name: string; alpha_2: string }
export interface KycPersonal {
  dob: string;
  nationality: string;
  phone: string;
  gender?: string;
  employmentStatus?: string;
  purposeOfAccount?: string;
  sourceOfFunds?: string;
}
export interface KycAddress { street: string; city: string; province?: string; postalCode: string; country: string }

export interface KycServerRecord {
  id?: string | number;
  kyc_complete?: boolean;
  kyc_status?: string;
  kyc_verified?: boolean;
  [key: string]: unknown;
}

export interface KycSubmissionResponse {
  status?: string | number;
  message?: string;
  detail?: string;
  kyc_complete?: boolean;
  kyc_status?: string;
  kyc_verified?: boolean;
  data?: KycServerRecord;
}

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
    getKycData: b.query<KycSubmissionResponse, void>({
      query: () => '/kyc/useraddress/',
      providesTags: ['KYC'],
    }),
    submitPersonal: b.mutation<{ detail: string }, FormData>({
      query: (body) => ({ url: '/kyc/useraddress/infospersons/', method: 'POST', body }),
      invalidatesTags: ['KYC'],
    }),
    submitAddress: b.mutation<KycSubmissionResponse, FormData>({
      query: (body) => ({ url: '/kyc/useraddress/', method: 'POST', body }),
      invalidatesTags: ['KYC'],
    }),
    submitDocuments: b.mutation<{ detail: string }, FormData>({
      query: (body) => ({ url: '/kyc/useraddress/documents/', method: 'POST', body }),
      invalidatesTags: ['KYC'],
    }),
    submitFinance: b.mutation<{ detail: string }, FormData>({
      query: (body) => ({ url: '/kyc/useraddress/finances/', method: 'POST', body }),
      invalidatesTags: ['KYC'],
    }),
    verifyPhone: b.mutation<{ detail: string }, { phone: string; otp: string }>({
      query: (body) => ({ url: '/kyc/phoneverify/', method: 'POST', body }),
    }),
    requestPhoneOtp: b.mutation<{ detail?: string; message?: string }, { phone: string }>({
      query: ({ phone }) => ({
        url: '/kyc/regenerate_phone/',
        method: 'POST',
        body: { phone, otp: '1' },
      }),
      transformResponse: (response: unknown) => {
        if (typeof response === 'string') return { detail: response };
        const raw = (response ?? {}) as Record<string, unknown>;
        return {
          detail: typeof raw.detail === 'string' ? raw.detail : undefined,
          message: typeof raw.message === 'string' ? raw.message : undefined,
        };
      },
    }),
    /**
     * Liveness check: send a sequence of frames captured from the camera.
     * The browser sets the multipart Content-Type automatically.
     */
    liveness: b.mutation<LivenessResult, FormData>({
      query: (body) => ({ url: '/kyc/vivacite/', method: 'POST', body }),
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
  useRequestPhoneOtpMutation,
  useLivenessMutation,
} = kycApi;
