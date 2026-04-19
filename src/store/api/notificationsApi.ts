import { api } from './baseApi';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  level: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export const notificationsApi = api.injectEndpoints({
  endpoints: (b) => ({
    notifications: b.query<AppNotification[], void>({
      query: () => '/api/notifications/',
      providesTags: ['Notifications'],
    }),
    markRead: b.mutation<{ detail: string }, { id: string }>({
      query: (body) => ({ url: '/api/notifications/makeasread/', method: 'POST', body }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const { useNotificationsQuery, useMarkReadMutation } = notificationsApi;
