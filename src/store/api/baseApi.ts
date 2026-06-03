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
import { clearMaintenance, setBackendVersion, setMaintenance } from '../slices/systemSlice';

const RAW_API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const API_URL = RAW_API_URL
  ? RAW_API_URL.endsWith('/api/v1')
    ? RAW_API_URL
    : `${RAW_API_URL}/api/v1`
  : '';
const USE_MOCK = !RAW_API_URL;

const realBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const mockBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
) => {
  const { url, method = 'GET', body } =
    typeof args === 'string' ? ({ url: args } as FetchArgs) : args;
  await new Promise((r) => setTimeout(r, 250 + Math.random() * 250));
  try {
    const data = await mockHandler(url, method, body);
    return { data };
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : 'Mock error';
    return { error: { status: 400, data: { detail } } as FetchBaseQueryError };
  }
};

const refreshMutex = new Mutex();

const readHeader = (result: unknown, name: string) => {
  const meta = (result as { meta?: { response?: Response } })?.meta;
  return meta?.response?.headers.get(name) || undefined;
};

const handlePlatformStatus = (result: unknown, apiCtx: Parameters<BaseQueryFn>[1]) => {
  const version = readHeader(result, 'X-Lipaxe-App-Version');
  if (version) apiCtx.dispatch(setBackendVersion(version));

  const error = (result as { error?: FetchBaseQueryError })?.error;
  if (error?.status === 503) {
    const data = (error.data || {}) as {
      detail?: string;
      message?: string;
      retry_after?: number;
      version?: string;
      status?: string;
    };
    apiCtx.dispatch(
      setMaintenance({
        message: data.message || data.detail || 'Lipaxe est momentanement en maintenance.',
        retryAfter: data.retry_after,
        version: data.version || version,
      }),
    );
    return;
  }

  if (!error && readHeader(result, 'X-Lipaxe-Maintenance') !== '1') {
    apiCtx.dispatch(clearMaintenance());
  }
};

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, apiCtx, extraOptions) => {
  await refreshMutex.waitForUnlock();
  const inner = USE_MOCK ? mockBaseQuery : realBaseQuery;
  let result = await inner(args, apiCtx, extraOptions);
  handlePlatformStatus(result, apiCtx);
  

  if (result.error?.status === 401 && !USE_MOCK) {
    if (!refreshMutex.isLocked()) {
      const release = await refreshMutex.acquire();
      try {
        const refresh = await realBaseQuery(
          { url: '/auth/token/refresh/', method: 'POST' },
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
          handlePlatformStatus(result, apiCtx);
        } else {
          apiCtx.dispatch(logout());
        }
      } finally {
        release();
      }
    } else {
      await refreshMutex.waitForUnlock();
      result = await inner(args, apiCtx, extraOptions);
      handlePlatformStatus(result, apiCtx);
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
    'Savings',
    'YieldVault',
    'Qr',
    'Devices',
    'TwoFA',
    'DashboardLayout',
  ],
  endpoints: () => ({}),
});
