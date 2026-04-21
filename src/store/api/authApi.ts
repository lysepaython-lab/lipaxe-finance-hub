import { api } from './baseApi';
import type { User } from '../slices/authSlice';

interface AuthResp { user: User; access: string; refresh: string; }

export const authApi = api.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation<AuthResp, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login/', method: 'POST', body }),
    }),
    register: b.mutation<AuthResp & { otpRequired?: boolean }, { email: string; password: string; firstName: string; lastName: string; reference?: string }>({
      query: (body) => ({ url: '/auth/register/', method: 'POST', body }),
    }),
    forgotPassword: b.mutation<{ detail: string }, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password/', method: 'POST', body }),
    }),
    resetPassword: b.mutation<{ detail: string }, { token: string; password: string }>({
      query: (body) => ({ url: '/auth/reset-password/', method: 'POST', body }),
    }),
    verifyEmail: b.mutation<{ detail: string; verified: boolean }, { email: string; otp: string }>({
      query: (body) => ({ url: '/auth/verify-email/', method: 'POST', body }),
    }),
    resendOtp: b.mutation<{ detail: string; otp?: string }, { email: string }>({
      query: (body) => ({ url: '/auth/resend-otp/', method: 'POST', body }),
    }),
    me: b.query<User, void>({ query: () => '/auth/me/', providesTags: ['User'] }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useResendOtpMutation,
  useMeQuery,
} = authApi;
