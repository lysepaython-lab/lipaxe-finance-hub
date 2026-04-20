import { api } from './baseApi';

// ============ Tontine / BusinessAll ============
export interface Tontine {
  id: string;
  name: string;
  contribution: number;
  currency: string;
  frequency: 'weekly' | 'monthly';
  duration_months: number;
  selection: 'random' | 'ordered';
  members: { user: string; received: boolean; position: number }[];
  next_beneficiary?: string;
  next_payout_at?: string;
  status: 'active' | 'completed';
}
export interface CreateTontineBody {
  name: string;
  contribution: number;
  currency: string;
  frequency: 'weekly' | 'monthly';
  duration_months: number;
  selection: 'random' | 'ordered';
  members: string[];
}

// ============ FestiPay (events) ============
export interface FestiEvent {
  id: string;
  name: string;
  date: string;
  price: number;
  currency: string;
  attendees: number;
  cover: string;
  organizer: string;
}
export interface FestiTicket {
  id: string;
  event_id: string;
  qr_token: string;
  amount: number;
  currency: string;
  createdAt: string;
}

// ============ PayAll (Bills) ============
export interface BillProvider {
  id: string;
  name: string;
  category: 'electricity' | 'water' | 'internet' | 'tv';
  country: string;
}

// ============ Crypto ============
export interface CryptoAsset {
  symbol: string;
  name: string;
  price_usd: number;
  change_24h: number;
}
export interface CryptoNetwork {
  id: string;
  name: string;
  symbol: string;
}
export interface CryptoDepositAddress {
  address: string;
  network: string;
  symbol: string;
  qr_payload: string;
}

export const businessApi = api.injectEndpoints({
  endpoints: (b) => ({
    // Tontines
    tontines: b.query<Tontine[], void>({
      query: () => '/api/tontines/',
      providesTags: ['Tontine'],
    }),
    createTontine: b.mutation<Tontine, CreateTontineBody>({
      query: (body) => ({ url: '/api/tontines/', method: 'POST', body }),
      invalidatesTags: ['Tontine'],
    }),
    contributeTontine: b.mutation<{ detail: string }, { tontine_id: string; wallet_id: string; amount: number }>({
      query: (body) => ({ url: '/api/tontines/contribute/', method: 'POST', body }),
      invalidatesTags: ['Tontine', 'Wallet'],
    }),
    // FestiPay
    festiEvents: b.query<FestiEvent[], void>({
      query: () => '/api/festipay/events/',
      providesTags: ['Festi'],
    }),
    bookTicket: b.mutation<FestiTicket, { event_id: string; wallet_id: string }>({
      query: (body) => ({ url: '/api/festipay/book/', method: 'POST', body }),
      invalidatesTags: ['Festi', 'Wallet'],
    }),
    // PayAll
    billProviders: b.query<BillProvider[], string | void>({
      query: (category) => `/api/payall/providers/${category ? `?category=${category}` : ''}`,
      providesTags: ['Bills'],
    }),
    payBill: b.mutation<{ detail: string; reference: string }, { provider_id: string; reference: string; amount: number; wallet_id: string }>({
      query: (body) => ({ url: '/api/payall/pay/', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    // Crypto
    cryptoAssets: b.query<CryptoAsset[], void>({
      query: () => '/api/cryptos/',
      providesTags: ['Crypto'],
    }),
    cryptoNetworks: b.query<CryptoNetwork[], string>({
      query: (symbol) => `/api/cryptos/${symbol}/networks/`,
    }),
    cryptoDepositAddress: b.mutation<CryptoDepositAddress, { symbol: string; network: string; amount: number; wallet_id: string }>({
      query: (body) => ({ url: '/api/cryptos/deposit-address/', method: 'POST', body }),
    }),
    cryptoWithdraw: b.mutation<{ detail: string; reference: string }, { symbol: string; network: string; address: string; amount: number; wallet_id: string }>({
      query: (body) => ({ url: '/api/cryptos/withdraw/', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
  }),
});

export const {
  useTontinesQuery,
  useCreateTontineMutation,
  useContributeTontineMutation,
  useFestiEventsQuery,
  useBookTicketMutation,
  useBillProvidersQuery,
  usePayBillMutation,
  useCryptoAssetsQuery,
  useCryptoNetworksQuery,
  useCryptoDepositAddressMutation,
  useCryptoWithdrawMutation,
} = businessApi;
