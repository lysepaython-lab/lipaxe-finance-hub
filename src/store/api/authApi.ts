import { api } from './baseApi';
import { normalizeUser } from './adapters';
import type { User } from '../slices/authSlice';

interface AuthResp { user: User; access: string; refresh: string; }
interface RegisterResp { user: User; otpRequired?: boolean; }

export const authApi = api.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation<AuthResp, { email: string; password: string }>({
      async queryFn(body, _api, _extraOptions, baseQuery) {
        const loginResult = await baseQuery({
          url: '/auth/login/',
          method: 'POST',
          body: { ...body, platform: 'web' },
        });
        if ('error' in loginResult) return { error: loginResult.error };

        const tokens = (loginResult.data ?? {}) as { access?: string; refresh?: string };
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
      transformResponse: (response: unknown) => ({
        user: normalizeUser(response),
        otpRequired: true,
      }),
    }),
    forgotPassword: b.mutation<{ detail: string }, { email: string }>({
      query: (body) => ({
        url: '/auth/forgot-password/',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: b.mutation<{ detail: string }, { token: string; password: string }>({
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
    resendOtp: b.mutation<{ detail: string; otp?: string }, { userId: string; email?: string }>({
      query: ({ userId, email }) => ({
        url: `/auth/register/${userId}/regenerate_otp/`,
        method: 'POST',
        body: email ? { email } : {},
      }),
      transformResponse: () => ({ detail: 'Code renvoye' }),
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
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useResendOtpMutation,
  useMeQuery,
  useUpdateProfileImageMutation,
} = authApi;
