import { api } from './baseApi';

export interface TrustedDevice {
  id: string;
  device_id: string;
  label: string;
  ip: string;
  last_seen: string;
  current: boolean;
  trusted: boolean;
}

export interface TotpSetup {
  secret: string;
  otpauth_url: string;
  backup_codes: string[];
}

export const securityApi = api.injectEndpoints({
  endpoints: (b) => ({
    // ---- Devices / Sessions ----
    devices: b.query<TrustedDevice[], void>({
      query: () => '/api/security/devices/',
      providesTags: ['Devices'],
    }),
    registerDevice: b.mutation<{ detail: string }, { device_id: string; label: string }>({
      query: (body) => ({ url: '/api/security/devices/register/', method: 'POST', body }),
      invalidatesTags: ['Devices'],
    }),
    revokeDevice: b.mutation<{ detail: string }, { id: string }>({
      query: ({ id }) => ({ url: `/api/security/devices/${id}/revoke/`, method: 'POST' }),
      invalidatesTags: ['Devices'],
    }),
    trustDevice: b.mutation<{ detail: string }, { id: string; trusted: boolean }>({
      query: ({ id, trusted }) => ({
        url: `/api/security/devices/${id}/trust/`, method: 'POST', body: { trusted },
      }),
      invalidatesTags: ['Devices'],
    }),

    // ---- 2FA TOTP ----
    totpStatus: b.query<{ enabled: boolean }, void>({
      query: () => '/api/security/2fa/status/',
      providesTags: ['TwoFA'],
    }),
    totpInit: b.mutation<TotpSetup, void>({
      query: () => ({ url: '/api/security/2fa/init/', method: 'POST' }),
    }),
    totpEnable: b.mutation<{ detail: string }, { secret: string; token: string }>({
      query: (body) => ({ url: '/api/security/2fa/enable/', method: 'POST', body }),
      invalidatesTags: ['TwoFA'],
    }),
    totpDisable: b.mutation<{ detail: string }, { token: string }>({
      query: (body) => ({ url: '/api/security/2fa/disable/', method: 'POST', body }),
      invalidatesTags: ['TwoFA'],
    }),
    regenerateBackupCodes: b.mutation<{ backup_codes: string[] }, { token: string }>({
      query: (body) => ({ url: '/api/security/2fa/backup-codes/', method: 'POST', body }),
    }),

    // ---- Push subscriptions ----
    vapidKey: b.query<{ public_key: string }, void>({
      query: () => '/api/push/vapid-key/',
    }),
    pushSubscribe: b.mutation<{ detail: string }, { subscription: PushSubscriptionJSON; device_id: string; label: string }>({
      query: (body) => ({ url: '/api/push/subscribe/', method: 'POST', body }),
    }),
    pushUnsubscribe: b.mutation<{ detail: string }, { endpoint: string }>({
      query: (body) => ({ url: '/api/push/unsubscribe/', method: 'POST', body }),
    }),

    // ---- Resilient signup OTP ----
    updatePendingEmail: b.mutation<{ detail: string; email: string }, { email: string; new_email: string }>({
      query: (body) => ({ url: '/auth/update-pending-email/', method: 'POST', body }),
    }),
    pendingStatus: b.query<{ exists: boolean; email?: string; created_at?: string }, string>({
      query: (email) => `/auth/pending-status/?email=${encodeURIComponent(email)}`,
    }),
  }),
});

export const {
  useDevicesQuery, useRegisterDeviceMutation, useRevokeDeviceMutation, useTrustDeviceMutation,
  useTotpStatusQuery, useTotpInitMutation, useTotpEnableMutation, useTotpDisableMutation,
  useRegenerateBackupCodesMutation,
  useVapidKeyQuery, usePushSubscribeMutation, usePushUnsubscribeMutation,
  useUpdatePendingEmailMutation, usePendingStatusQuery,
} = securityApi;
