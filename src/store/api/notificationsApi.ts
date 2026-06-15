import { api } from './baseApi';
import { normalizeNotification, unwrapData } from './adapters';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  level: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'normal' | 'high';
  read: boolean;
  createdAt: string;
  link?: string;
  logo?: string;
  kind?: string;
}

export const notificationsApi = api.injectEndpoints({
  endpoints: (b) => ({
    notifications: b.query<AppNotification[], void>({
      query: () => '/auth/notifications/',
      transformResponse: (response: unknown) =>
        unwrapData<unknown[]>(response, []).map((item) => normalizeNotification(item)),
      providesTags: ['Notifications'],
    }),
    markRead: b.mutation<{ detail: string }, { id: string }>({
      async queryFn({ id }, _api, _extraOptions, baseQuery) {
        const attempts = [{ id }, { notification_id: id }, { _id: id }];
        let lastError: unknown = null;
        for (const body of attempts) {
          const result = await baseQuery({
            url: '/auth/notifications/makeasread/',
            method: 'POST',
            body,
          });
          if (!('error' in result)) return { data: { detail: 'Notification lue' } };
          lastError = result.error;
        }
        return { error: lastError as any };
      },
      invalidatesTags: ['Notifications'],
    }),
    markAllRead: b.mutation<{ detail: string }, { ids: string[] }>({
      async queryFn({ ids }, _api, _extraOptions, baseQuery) {
        if (!ids.length) return { data: { detail: 'Aucune notification a marquer' } };
        for (const id of ids) {
          const attempts = [{ id }, { notification_id: id }, { _id: id }];
          for (const body of attempts) {
            const result = await baseQuery({
              url: '/auth/notifications/makeasread/',
              method: 'POST',
              body,
            });
            if (!('error' in result)) break;
          }
        }
        return { data: { detail: 'Notifications lues' } };
      },
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const { useNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } = notificationsApi;
