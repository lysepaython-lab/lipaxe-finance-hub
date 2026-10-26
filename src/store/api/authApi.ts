import { api } from './baseApi';
import { normalizeUser } from './adapters';
import type { User } from '../slices/authSlice';

export interface LoginChallenge {
  two_factor_required: true;
  challenge_id: string;
  masked_email: string;
  expires_in: number;
  resend_after: number;
}
interface AuthResp { user: User; access: string; refresh: string; }
export type LoginResult = AuthResp | LoginChallenge;
interface RegisterResp { userId: string; email: string; otpRequired: true; }

export const authApi = api.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation<LoginResult, { email: string; password: string }>({
      async queryFn(body, _api, _extraOptions, baseQuery) {
        const loginResult = await baseQuery({
          url: '/auth/login/',
          method: 'POST',
          body: { ...body, platform: 'web' },
        });
        if ('error' in loginResult) return { error: loginResult.error };

        const loginData = (loginResult.data ?? {}) as LoginChallenge | { access?: string; refresh?: string };
        if ('two_factor_required' in loginData && loginData.two_factor_required) {
          return { data: loginData };
        }
        const tokens = loginData as { access?: string; refresh?: string };
        const meResult = await baseQuery({
          url: '/auth/me/',
          method: 'GET',
          headers: tokens.access ? { Authorization: `Bearer ${tokens.access}` } : undefined,
        });
        if ('error' in meResult) return { error: meResult.error };

        return {
          data: {
            user: normalizeUser(meResult.data),
            access: tokens.access || '',
            refresh: tokens.refresh || '',
          },
        };
      },
    }),
    verifyWebLoginOtp: b.mutation<AuthResp, { challenge_id: string; otp: string }>({
      async queryFn(body, _api, _extraOptions, baseQuery) {
        const verifyResult = await baseQuery({
          url: '/auth/login/verify-otp/',
          method: 'POST',
          body,
        });
        if ('error' in verifyResult) return { error: verifyResult.error };

        const tokens = (verifyResult.data ?? {}) as { access?: string; refresh?: string };
        const meResult = await baseQuery({
          url: '/auth/me/',
          method: 'GET',
          headers: tokens.access ? { Authorization: `Bearer ${tokens.access}` } : undefined,
        });
        if ('error' in meResult) return { error: meResult.error };
        return {
          data: {
            user: normalizeUser(meResult.data),
            access: tokens.access || '',
            refresh: tokens.refresh || '',
          },
        };
      },
    }),
    resendWebLoginOtp: b.mutation<{ detail: string; resend_after?: number }, { challenge_id: string }>({
      query: (body) => ({
        url: '/auth/login/resend-otp/',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { detail?: string; resend_after?: number }) => ({
        detail: response.detail || 'Un nouveau code a été envoyé.',
        resend_after: response.resend_after,
      }),
    }),
    register: b.mutation<
      RegisterResp,
      { email: string; password: string; firstName: string; lastName: string; reference?: string }
    >({
      query: (body) => ({
        url: '/auth/register/',
        method: 'POST',
        body: {
          email: body.email,
          password: body.password,
          re_password: body.password,
          first_name: body.firstName,
          last_name: body.lastName,
          accountType: "user",
          reference: body.reference || undefined,
        },
      }),
      transformResponse: (response: { id: string; email: string }) => ({
        userId: String(response.id),
        email: response.email,
        otpRequired: true as const,
      }),
    }),
    forgotPassword: b.mutation<{ detail: string }, { email: string }>({
      query: (body) => ({
        url: '/auth/forgot-password/',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: b.mutation<{ detail: string }, { email: string; otp: string; password: string; re_password?: string }>({
      query: (body) => ({
        url: '/auth/reset-password/',
        method: 'POST',
        body,
      }),
    }),
    verifyEmail: b.mutation<{ detail: string; verified: boolean }, { userId: string; otp: string }>({
      query: ({ userId, otp }) => ({
        url: `/auth/register/${userId}/verify_otp/`,
        method: 'POST',
        body: { otp },
      }),
      transformResponse: () => ({ detail: 'Email verifie', verified: true }),
    }),
    resendOtp: b.mutation<{ detail: string; otp?: string }, { userId: string; email: string }>({
      query: ({ userId, email }) => ({
        url: `/auth/register/${userId}/regenerate_otp/`,
        method: 'POST',
        body: { email },
      }),
      transformResponse: (response: { message?: string }) => ({
        detail: response.message || 'L’envoi du code est en cours.',
      }),
    }),
    me: b.query<User, void>({
      query: () => '/auth/me/',
      transformResponse: (response: unknown) => normalizeUser(response),
      providesTags: ['User'],
    }),
    updateProfileImage: b.mutation<User, File>({
      async queryFn(file, _api, _extraOptions, baseQuery) {
        const formData = new FormData();
        formData.append('profile_image', file);
        const result = await baseQuery({
          url: '/auth/me/',
          method: 'PATCH',
          body: formData,
        });
        if ('error' in result) return { error: result.error };
        return { data: normalizeUser(result.data) };
      },
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useVerifyWebLoginOtpMutation,
  useResendWebLoginOtpMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useResendOtpMutation,
  useMeQuery,
  useUpdateProfileImageMutation,
} = authApi;
