import { api } from './baseApi';
import { normalizeFestiEvent, unwrapData } from './adapters';

export interface Tontine {
  id: string;
  name: string;
  contribution: number;
  currency: string;
  frequency: 'weekly' | 'monthly';
  duration_months: number;
  selection: 'random' | 'ordered' | 'credit_score';
  status: 'pending' | 'draft' | 'active' | 'locked' | 'completed' | 'cancelled' | 'defaulted';
  policy?: Record<string, unknown>;
  contract_hash?: string;
  members: {
    user: string;
    received: boolean;
    position: number;
    status?: string;
    credit_score_snapshot?: number;
    kyc_status_snapshot?: string;
  }[];
  next_beneficiary?: string;
  next_payout_at?: string;
  my_join_status?: string;
  owner_account?: string;
  is_owner?: boolean;
  escrow_wallet?: string;
  treasury_wallet?: string;
  escrow_wallet_id?: string;
  treasury_wallet_id?: string;
  max_members?: number | null;
  min_credit_score?: number;
  require_kyc_verified?: boolean;
  invite_only?: boolean;
  payout_commission_percent?: string;
  reserve_percent?: string;
}
export interface TontineInvitationDecision {
  tontine_id: string;
  action: 'accept' | 'reject';
}
export interface CreateTontineBody {
  name: string;
  contribution: number;
  currency: string;
  frequency: 'weekly' | 'monthly';
  duration_months: number;
  selection: 'random' | 'ordered' | 'credit_score';
  members: string[];
  max_members?: number;
  min_credit_score?: number;
  require_kyc_verified?: boolean;
  invite_only?: boolean;
  payout_commission_percent?: number;
  reserve_percent?: number;
  escrow_wallet_id?: string;
  treasury_wallet_id?: string;
  policy?: Record<string, unknown>;
}
export type UpdateTontineBody = Partial<Omit<CreateTontineBody, 'members'>> & {
  tontine_id: string;
};
export interface FestiEvent {
  id: string;
  name: string;
  date: string;
  price: number;
  currency: string;
  attendees: number;
  cover: string;
  organizer: string;
  ticket_type_id?: string;
}
export interface FestiTicket {
  id: string;
  event_id: string;
  qr_token: string;
  amount: number;
  currency: string;
  createdAt: string;
}
export interface BillProvider {
  id: string;
  name: string;
  provider_code?: string;
  category: 'electricity' | 'water' | 'internet' | 'tv' | 'mobile' | 'school' | 'ebillet' | 'other';
  country: string;
  active?: boolean;
  supports_otp?: boolean;
  supports_async?: boolean;
  requires_customer_name?: boolean;
  transport_type?: 'flight' | 'bus' | 'ferry' | 'train' | 'other';
  supports_hold?: boolean;
  supports_seat_map?: boolean;
  supports_ticketless?: boolean;
  booking_timeout_minutes?: number;
  required_passenger_fields?: unknown[];
  accept_any_ebillet?: boolean;
  accepted_formats?: unknown[];
  validation_rules?: Record<string, unknown>;
  ticket_schema?: Record<string, unknown>;
  commission_percent?: number;
  fixed_fee?: number;
  min_amount?: number;
  max_amount?: number;
  customer_identifier_label?: string;
  configuration?: Record<string, unknown>;
}
export interface CryptoAsset {
  symbol: string;
  name: string;
  logo?: string;
  logo_url?: string;
  price_usd: number;
  change_24h: number;
  market_rate?: string;
  buy_rate?: string;
  sell_rate?: string;
  buy_margin_percent?: number;
  sell_margin_percent?: number;
}
export interface CryptoNetwork {
  id: string;
  name: string;
  logo?: string;
  logo_url?: string;
  symbol?: string;
  family?: string;
  provider?: string;
  native_symbol?: string;
  confirmations_required?: number;
  withdrawal_enabled?: boolean;
  deposit_enabled?: boolean;
}
export interface CryptoNetworksQuery {
  symbol: string;
  purpose?: 'all' | 'deposit' | 'withdraw';
}
export interface CryptoDepositAddress {
  id?: string;
  address: string;
  network: string;
  symbol: string;
  qr_payload: string;
  tag?: string;
  status?: string;
}
export interface CryptoQuote {
  id: string;
  symbol: string;
  network?: string | null;
  side: 'buy' | 'sell';
  fiat_currency: string;
  crypto_currency: string;
  fiat_amount: string;
  crypto_amount: string;
  market_rate: string;
  executed_rate: string;
  spread_amount: string;
  lipaxe_fee_amount?: string;
  expires_at: string;
  status: string;
}
export interface CryptoTrade {
  id: string;
  reference: string;
  symbol: string;
  network?: string | null;
  side: 'buy' | 'sell';
  fiat_currency: string;
  crypto_currency: string;
  fiat_amount: string;
  crypto_amount: string;
  market_rate: string;
  executed_rate: string;
  spread_amount: string;
  status: string;
  created_at: string;
}
export interface CryptoOnchainTransaction {
  id: string;
  symbol: string;
  network: string;
  direction: 'deposit' | 'withdrawal';
  amount: string;
  status: string;
  tx_hash?: string;
  to_address?: string;
  confirmations?: number;
  required_confirmations?: number;
  created_at: string;
}

export interface EbilletOffer {
  reference: string;
  transport_type: string;
  provider: string;
  origin: string;
  destination: string;
  departure_at?: string;
  return_at?: string;
  currency: string;
  amount: number;
  fee_amount: number;
  total_amount: number;
  supports_seat_map: boolean;
  supports_hold: boolean;
  supports_ticketless: boolean;
  expires_in_minutes: number;
  passengers: unknown[];
  seat_map: Record<string, unknown>;
  ticket_schema: Record<string, unknown>;
  required_passenger_fields: unknown[];
  accept_any_ebillet: boolean;
  accepted_formats: unknown[];
  validation_rules: Record<string, unknown>;
}

export const businessApi = api.injectEndpoints({
  endpoints: (b) => ({
    tontines: b.query<Tontine[], void>({
      query: () => '/tontines/',
      providesTags: ['Tontine'],
    }),
    createTontine: b.mutation<Tontine, CreateTontineBody>({
      query: (body) => ({
        url: '/tontines/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tontine'],
    }),
    updateTontine: b.mutation<{ detail: string; tontine: Tontine }, UpdateTontineBody>({
      query: ({ tontine_id, ...body }) => ({
        url: `/tontines/${tontine_id}/`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Tontine'],
    }),
    contributeTontine: b.mutation<{ detail: string }, { tontine_id: string; wallet_id: string; amount: number }>({
      query: (body) => ({
        url: '/tontines/contribute/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tontine', 'Wallet'],
    }),
    tontineEligibility: b.query<{ eligible: boolean; score: number; kyc_status: string; policy: Record<string, unknown>; reasons: string[] }, string>({
      query: (id) => `/tontines/${id}/eligibility/`,
      providesTags: ['Tontine'],
    }),
    festiEvents: b.query<FestiEvent[], void>({
      query: () => '/festpay/events/upcoming/',
      transformResponse: (response: unknown) =>
        unwrapData<unknown[]>(response, []).map((item) => normalizeFestiEvent(item)),
      providesTags: ['Festi'],
    }),
    bookTicket: b.mutation<FestiTicket, { event_id: string; ticket_type_id: string; wallet_id: string }>({
      query: ({ event_id, ticket_type_id, wallet_id }) => ({
        url: '/festpay/buy-ticket/',
        method: 'POST',
        body: { event_id, ticket_type_id, quantity: 1, wallet_id },
      }),
      transformResponse: (response: unknown, _meta, arg) => {
        const raw = (response ?? {}) as Record<string, unknown>;
        const tickets = Array.isArray(raw.tickets) ? raw.tickets : [];
        const first = (tickets[0] ?? {}) as Record<string, unknown>;
        return {
          id: String(first.id ?? crypto.randomUUID()),
          event_id: String(arg.event_id),
          qr_token: String(first.validation_token ?? ''),
          amount: Number((raw.payment as Record<string, unknown> | undefined)?.amount ?? 0),
          currency: 'USD',
          createdAt: new Date().toISOString(),
        };
      },
      invalidatesTags: ['Festi', 'Wallet'],
    }),
    billProviders: b.query<BillProvider[], string | void>({
      query: (category) => category ? `/payall/providers/?category=${encodeURIComponent(category)}` : '/payall/providers/',
      providesTags: ['Bills'],
    }),
    ebilletSearch: b.mutation<{ offers: EbilletOffer[]; search: Record<string, unknown> }, { provider_id?: string; transport_type: string; origin: string; destination: string; departure_at: string; return_at?: string; passengers: unknown[]; currency?: string }>(
      {
        query: (body) => ({
          url: '/ebillet/search/',
          method: 'POST',
          body,
        }),
      },
    ),
    ebilletReserve: b.mutation<{ detail: string; booking_id: string; booking_reference: string; workflow_state: string; status: string; expires_at?: string }, { provider_id: string; offer_reference: string; wallet_id: string; transport_type: string; origin: string; destination: string; departure_at: string; return_at?: string; passengers: unknown[]; seat_map?: Record<string, unknown>; booking_reference?: string; ticket_number?: string; ticket_url?: string; amount: number; fee_amount?: number; customer_name?: string; customer_identifier?: string; ebillet_code?: string; ebillet_type?: string; ticket_type?: string; ebillet_issuer?: string; qr_payload?: string; journey_payload?: Record<string, unknown> }>(
      {
        query: (body) => ({
          url: '/ebillet/reserve/',
          method: 'POST',
          body,
        }),
      },
    ),
    ebilletConfirm: b.mutation<{ detail: string; booking_reference: string; ticket_number: string; ticket_url?: string; status: string; workflow_state: string }, { booking_id: string; wallet_id?: string; ticket_number?: string; ticket_url?: string }>(
      {
        query: (body) => ({
          url: '/ebillet/confirm/',
          method: 'POST',
          body,
        }),
        invalidatesTags: ['Wallet', 'Transactions'],
      },
    ),
    payBill: b.mutation<{ detail: string; reference: string; status: string; receipt_url?: string }, { provider_id: string; reference: string; amount: number; wallet_id: string; customer_identifier?: string; customer_name?: string; ebillet_code?: string; ebillet_type?: string; ticket_type?: string; ebillet_issuer?: string; qr_payload?: string; otp?: string; auto_pay?: boolean }>({
      query: (body) => ({
        url: '/payall/pay/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
    respondTontineInvitation: b.mutation<{ detail: string; tontine_status: string; join_status: string; member_status: string; accepted_contract: boolean }, TontineInvitationDecision>({
      query: (body) => ({
        url: '/tontines/invitations/decision/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tontine'],
    }),
    inviteTontineMembers: b.mutation<{ detail: string; added: string[]; tontine: Tontine }, { tontine_id: string; members: string[] }>({
      query: ({ tontine_id, members }) => ({
        url: `/tontines/${tontine_id}/members/`,
        method: 'POST',
        body: { members },
      }),
      invalidatesTags: ['Tontine'],
    }),
    remindTontineMembers: b.mutation<{ detail: string; notified: string[] }, { tontine_id: string }>({
      query: ({ tontine_id }) => ({
        url: `/tontines/${tontine_id}/reminders/`,
        method: 'POST',
      }),
      invalidatesTags: ['Tontine'],
    }),
    cryptoAssets: b.query<CryptoAsset[], void>({
      query: () => '/crypto-market/rates/',
      transformResponse: (response: unknown) =>
        unwrapData<unknown[]>(response, []).map((item) => {
          const raw = (item ?? {}) as Record<string, unknown>;
          return {
              symbol: String(raw.symbol ?? ''),
              name: String(raw.name ?? ''),
              logo: String(raw.logo_url ?? raw.logo ?? ''),
              logo_url: String(raw.logo_url ?? raw.logo ?? ''),
              price_usd: Number(raw.price_usd ?? raw.market_rate ?? 0),
            change_24h: Number(raw.change_24h ?? 0),
            market_rate: String(raw.market_rate ?? raw.price_usd ?? ''),
            buy_rate: String(raw.buy_rate ?? ''),
            sell_rate: String(raw.sell_rate ?? ''),
            buy_margin_percent: Number(raw.buy_margin_percent ?? 0),
            sell_margin_percent: Number(raw.sell_margin_percent ?? 0),
          };
        }),
      providesTags: ['Crypto'],
    }),
    cryptoNetworks: b.query<CryptoNetwork[], CryptoNetworksQuery>({
      query: ({ symbol, purpose = 'all' }) =>
        `/crypto-market/rates/${encodeURIComponent(symbol)}/networks/?purpose=${purpose}`,
    }),
    cryptoQuote: b.mutation<CryptoQuote, { symbol: string; side: 'buy' | 'sell'; fiat_wallet_id: string; crypto_wallet_id: string; network?: string; fiat_amount?: number; crypto_amount?: number }>({
      query: (body) => ({
        url: '/crypto-market/trades/quote/',
        method: 'POST',
        body,
      }),
    }),
    cryptoTradeExecute: b.mutation<CryptoTrade, { quote_id: string }>({
      query: (body) => ({
        url: '/crypto-market/trades/execute/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wallet', 'Transactions', 'Crypto'],
    }),
    cryptoDepositAddress: b.mutation<CryptoDepositAddress, { symbol: string; network: string; wallet_id: string; expected_amount?: number }>({
      query: (body) => ({
        url: '/crypto-market/deposit-address/',
        method: 'POST',
        body,
      }),
    }),
    cryptoWithdraw: b.mutation<CryptoOnchainTransaction, { symbol: string; network: string; address: string; amount: number; wallet_id: string }>({
      query: (body) => ({
        url: '/cryptos/withdraw/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),
  }),
});

export const {
  useTontinesQuery,
  useCreateTontineMutation,
  useUpdateTontineMutation,
  useContributeTontineMutation,
  useRespondTontineInvitationMutation,
  useInviteTontineMembersMutation,
  useRemindTontineMembersMutation,
  useLazyTontineEligibilityQuery,
  useTontineEligibilityQuery,
  useFestiEventsQuery,
  useBookTicketMutation,
  useBillProvidersQuery,
  useEbilletSearchMutation,
  useEbilletReserveMutation,
  useEbilletConfirmMutation,
  usePayBillMutation,
  useCryptoAssetsQuery,
  useCryptoNetworksQuery,
  useCryptoQuoteMutation,
  useCryptoTradeExecuteMutation,
  useCryptoDepositAddressMutation,
  useCryptoWithdrawMutation,
} = businessApi;
