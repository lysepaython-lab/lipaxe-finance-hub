import { api } from './baseApi';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  level: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'normal' | 'high';
  read: boolean;
  createdAt: string;
  link?: string;
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
    markAllRead: b.mutation<{ detail: string }, void>({
      query: () => ({ url: '/api/notifications/makeasread/', method: 'POST', body: { id: 'all' } }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const { useNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } = notificationsApi;
