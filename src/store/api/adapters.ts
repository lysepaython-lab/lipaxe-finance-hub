import type { User } from '../slices/authSlice';

type UnknownRecord = Record<string, unknown>;

export const unwrapData = <T>(payload: unknown, fallback: T): T => {
  if (Array.isArray(payload)) return payload as T;
  if (payload && typeof payload === 'object') {
    const record = payload as UnknownRecord;
    if (record.data !== undefined) return record.data as T;
    if (record.results !== undefined) return record.results as T;
  }
  return (payload as T) ?? fallback;
};

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : value == null ? fallback : String(value);

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

export const normalizeUser = (payload: unknown): User => {
  const raw = (payload ?? {}) as UnknownRecord;
  const kycStatusValue = asString(raw.kyc_status ?? raw.kycStatus).toLowerCase();
  const kycStatus = (
    kycStatusValue === 'verified' || kycStatusValue === 'approved'
      ? 'verified'
      : kycStatusValue === 'pending'
        ? 'pending'
        : 'unverified'
  ) as User['kycStatus'];
  return {
    id: asString(raw.id),
    email: asString(raw.email),
    firstName: asString(raw.first_name ?? raw.firstName),
    lastName: asString(raw.last_name ?? raw.lastName),
    username: asString(raw.account_no ?? raw.username),
    kycStatus,
    kycComplete: Boolean(raw.kyc_complete ?? raw.kycComplete ?? kycStatus !== 'unverified'),
    avatar: asString(raw.profile_image_url ?? raw.avatar, ''),
    isStaff: Boolean(raw.is_staff ?? raw.isStaff),
    isSuperuser: Boolean(raw.is_superuser ?? raw.isSuperuser),
  };
};

export const normalizeWallet = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const currency = (raw.currency ?? {}) as UnknownRecord;
  const code = asString(currency.code ?? raw.currency, 'USD');
  const balance = asNumber(raw.balance);

  return {
    id: asString(raw.id),
    currency: code,
    symbol: asString(currency.symbol, code),
    balance,
    available: balance,
    pending: 0,
  };
};

export const normalizeTransaction = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const txType = asString(raw.transaction_type ?? raw.type, 'transfer');
  const status = asString(raw.status, 'pending').toLowerCase();
  const direction = (txType === 'deposit' || txType === 'receive' ? 'in' : 'out') as 'in' | 'out';
  const type = (
    txType === 'withdrawal'
      ? 'withdrawal'
      : txType === 'deposit' || txType === 'receive'
        ? 'deposit'
        : 'transfer'
  ) as 'deposit' | 'withdrawal' | 'transfer';
  const normalizedStatus = (
    status === 'success' || status === 'completed'
      ? 'completed'
      : status === 'failed'
        ? 'failed'
        : 'pending'
  ) as 'completed' | 'failed' | 'pending';

  return {
    id: asString(raw.id),
    type,
    direction,
    amount: asNumber(raw.amount),
    currency: asString(raw.currency ?? raw.payment_method_currency, 'USD'),
    status: normalizedStatus,
    description: asString(raw.remark ?? raw.description ?? raw.transaction_type, 'Transaction'),
    counterparty: asString(raw.to_account ?? raw.from_account, ''),
    reference: asString(raw.reference),
    createdAt: asString(raw.timestamp ?? raw.created_at ?? raw.createdAt),
    fee: asNumber(raw.fees),
    wallet_id: asString(raw.from_wallet ?? raw.wallet_id),
  };
};

export const normalizePaymentMethod = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const paymentType = (raw.payment_type ?? {}) as UnknownRecord;
  const paymentTypeName = asString(paymentType.name);
  const canonicalPaymentTypeName = (
    paymentTypeName === 'Cryptos' || paymentTypeName === 'Cryptomonnaies'
      ? 'Cryptos'
      : paymentTypeName === 'Electronic' || paymentTypeName === 'Electronique'
        ? 'Electronic'
        : paymentTypeName === 'Bank Transfer' || paymentTypeName === 'Virement Bancaire'
          ? 'Bank Transfer'
          : 'Mobile Payment'
  ) as 'Mobile Payment' | 'Electronic' | 'Cryptos' | 'Bank Transfer';
  const type = (
    canonicalPaymentTypeName === 'Cryptos'
      ? 'crypto'
      : canonicalPaymentTypeName === 'Electronic'
        ? 'electronic'
        : canonicalPaymentTypeName === 'Bank Transfer'
          ? 'bank'
          : 'mobile'
  ) as 'mobile' | 'bank' | 'electronic' | 'crypto';

  return {
    id: asString(raw.id),
    name: asString(raw.name),
    provider: asString(raw.provider),
    correspondent: asString(raw.correspondent),
    type,
    payment_type: { name: canonicalPaymentTypeName },
    icon: asString(raw.logo),
    countries: Array.isArray(raw.countries)
      ? raw.countries.map((country) => {
          const item = (country ?? {}) as UnknownRecord;
          return {
            country: {
              name: asString(item.name ?? (item.country as UnknownRecord | undefined)?.name),
              alpha_2: asString(item.alpha_2 ?? (item.country as UnknownRecord | undefined)?.alpha_2),
            },
          };
        })
      : [],
    fees: {
      fixed: asNumber(raw.provider_fee ?? raw.provider_fee_with),
      percent: asNumber(
        raw.deposit_fee_percentage ?? raw.withdrawal_fee_percentage ?? raw.transfer_fee_percentage,
      ),
    },
  };
};

export const normalizeNotification = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const priority = asString(raw.priority, 'normal');
  const level = (priority === 'high' ? 'warning' : 'info') as 'info' | 'warning';
  const normalizedPriority = (priority === 'high' ? 'high' : 'normal') as 'high' | 'normal';

  return {
    id: asString(raw.id),
    title: asString(raw.title, 'Notification'),
    body: asString(raw.message ?? raw.body),
    level,
    priority: normalizedPriority,
    read: Boolean(raw.is_read ?? raw.read),
    createdAt: asString(raw.created_at ?? raw.createdAt),
    link: asString(raw.link, ''),
  };
};

export const normalizeCardOffer = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const brand = (asString(raw.category, 'visa').toLowerCase().includes('master')
    ? 'Mastercard'
    : 'Visa') as 'Visa' | 'Mastercard';

  return {
    id: asString(raw.id),
    brand,
    name: asString(raw.name ?? `${brand} Virtual`),
    price: asNumber(raw.amount),
    currency: 'USD',
    monthly_fee: 0,
    description: `Frais de creation ${asNumber(raw.creation_fixed_fee)} USD`,
  };
};

export const normalizeUserCard = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const brand = (asString(raw.card_type, 'visa').toLowerCase().includes('master')
    ? 'Mastercard'
    : 'Visa') as 'Visa' | 'Mastercard';
  const status = (asString(raw.status, 'inactive') === 'frozen' ? 'frozen' : 'active') as 'active' | 'frozen';

  return {
    id: asString(raw.card_id ?? raw.id),
    brand,
    number_masked: asString(raw.masked_number ?? raw.last_four, '****'),
    name_on_card: asString(raw.name ?? raw.card_holder_name, 'LIPAXE USER'),
    exp: asString(raw.expiry ?? raw.exp, '--/--'),
    balance: asNumber(raw.balance),
    currency: asString(raw.currency, 'USD'),
    status,
  };
};

export const normalizeCardTransaction = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const status = (asString(raw.status, 'pending') === 'success' ? 'completed' : 'pending') as 'completed' | 'pending';
  return {
    id: asString(raw.id),
    amount: asNumber(raw.amount),
    currency: asString(raw.currency, 'USD'),
    description: asString(raw.description ?? raw.remark, 'Card transaction'),
    status,
    createdAt: asString(raw.created_at ?? raw.timestamp),
  };
};

export const normalizeAffiliateCode = (payload: unknown) => {
  const raw = unwrapData<UnknownRecord>(payload, {} as UnknownRecord);
  const code = asString(raw.refferral_code ?? raw.code);
  return {
    code,
    link: code ? `${window.location.origin}/register?reference=${encodeURIComponent(code)}` : '',
    total_referrals: asNumber(raw.total_referrals),
  };
};

export const normalizeCommissions = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const commissions = Array.isArray(raw.commissions) ? raw.commissions : [];

  return commissions.map((item) => {
    const entry = (item ?? {}) as UnknownRecord;
    return {
      id: asString(entry.id),
      amount: asNumber(entry.amount),
      currency: asString(entry.currency, 'USD'),
      from_user: asString(entry.from_user ?? entry.profile),
      status: (asString(entry.status, 'pending').toLowerCase() === 'paid' ? 'paid' : 'pending') as 'paid' | 'pending',
      createdAt: asString(entry.created_at ?? entry.createdAt),
    };
  });
};

export const normalizeFestiEvent = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const ticketTypes = Array.isArray(raw.ticket_types) ? raw.ticket_types : [];
  const firstTicketEntry = (ticketTypes[0] ?? {}) as UnknownRecord;
  const firstTicketType = (firstTicketEntry.ticket_type ?? {}) as UnknownRecord;
  return {
    id: asString(raw.id),
    name: asString(raw.title ?? raw.name),
    date: asString(raw.start_time ?? raw.date),
    price: asNumber(raw.price ?? raw.ticket_price ?? firstTicketEntry.price),
    currency: 'USD',
    attendees: asNumber(raw.available_tickets ?? raw.attendees),
    cover: asString(raw.image ?? raw.cover),
    organizer: asString(raw.organizer_name ?? raw.organizer),
    ticket_type_id: asString(firstTicketType.id),
  };
};
