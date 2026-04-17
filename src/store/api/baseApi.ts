import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import { mockHandler } from './mock';

const API_URL = import.meta.env.VITE_API_URL || '';
const USE_MOCK = !API_URL;

const realBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

const mockBaseQuery = async (args: any) => {
  const { url, method = 'GET', body } = typeof args === 'string' ? { url: args } as any : args;
  await new Promise(r => setTimeout(r, 350 + Math.random() * 300));
  try {
    const data = await mockHandler(url, method, body);
    return { data };
  } catch (e: any) {
    return { error: { status: 400, data: { detail: e.message } } as FetchBaseQueryError };
  }
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: USE_MOCK ? (mockBaseQuery as any) : realBaseQuery,
  tagTypes: ['Wallet', 'Transactions', 'User', 'Activity'],
  endpoints: () => ({}),
});
