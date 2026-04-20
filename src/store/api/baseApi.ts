import {
  createApi,
  fetchBaseQuery,
  FetchBaseQueryError,
  BaseQueryFn,
  FetchArgs,
} from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import type { RootState } from '../index';
import { mockHandler } from './mock';
import { setCredentials, logout } from '../slices/authSlice';

// VITE_API_URL=http://127.0.0.1:8000  → live Django backend (prod-ready)
// (left empty)                        → in-memory mock for local development
export const API_URL = import.meta.env.VITE_API_URL || '';
const USE_MOCK = !API_URL;

// ---- Real backend base query ------------------------------------------------
const realBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: 'include', // send/receive httpOnly refresh cookies (CSRF protection)
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    // Let the browser set Content-Type for FormData; otherwise enforce JSON.
    return headers;
  },
});

// ---- Mock base query --------------------------------------------------------
const mockBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
) => {
  const { url, method = 'GET', body } =
    typeof args === 'string' ? ({ url: args } as FetchArgs) : args;
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 250 + Math.random() * 250));
  try {
    const data = await mockHandler(url, method, body);
    return { data };
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : 'Mock error';
    return { error: { status: 400, data: { detail } } as FetchBaseQueryError };
  }
};

// ---- Refresh-token mutex (single-flight) ------------------------------------
const refreshMutex = new Mutex();

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, apiCtx, extraOptions) => {
  await refreshMutex.waitForUnlock();
  const inner = USE_MOCK ? mockBaseQuery : realBaseQuery;
  let result = await inner(args, apiCtx, extraOptions);

  // Try silent refresh on 401
  if (result.error?.status === 401 && !USE_MOCK) {
    if (!refreshMutex.isLocked()) {
      const release = await refreshMutex.acquire();
      try {
        const refresh = await realBaseQuery(
          { url: '/api/jwt/refresh/', method: 'POST' },
          apiCtx,
          extraOptions,
        );
        const data = (refresh.data as { access?: string } | undefined) || undefined;
        if (data?.access) {
          const state = apiCtx.getState() as RootState;
          apiCtx.dispatch(
            setCredentials({
              user: state.auth.user,
              accessToken: data.access,
              refreshToken: state.auth.refreshToken,
            }),
          );
          result = await inner(args, apiCtx, extraOptions);
        } else {
          apiCtx.dispatch(logout());
        }
      } finally {
        release();
      }
    } else {
      // Another refresh is in flight — wait then retry once.
      await refreshMutex.waitForUnlock();
      result = await inner(args, apiCtx, extraOptions);
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Wallet',
    'Transactions',
    'User',
    'Activity',
    'Countries',
    'Cards',
    'CardTx',
    'KYC',
    'Notifications',
    'Affiliation',
    'PaymentMethods',
    'Tontine',
    'Festi',
    'Bills',
    'Crypto',
    'Qr',
  ],
  endpoints: () => ({}),
});
