import type { User } from '../slices/authSlice';
import { normalizeKycStatusValue } from '@/lib/kycStatus';

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

const asOptionalNumber = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
};

const asOptionalBoolean = (...values: unknown[]): boolean | undefined => {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', 'yes', '1', 'enabled'].includes(normalized)) return true;
      if (['false', 'no', '0', 'disabled'].includes(normalized)) return false;
    }
  }
  return undefined;
};

const firstText = (...values: unknown[]): string => {
  for (const value of values) {
    const text = asString(value).trim();
    if (text) return text;
  }
  return '';
};

export const normalizeUser = (payload: unknown): User => {
  const raw = (payload ?? {}) as UnknownRecord;
  const kycStatus = normalizeKycStatusValue(asString(raw.kyc_status ?? raw.kycStatus));
  return {
    id: asString(raw.id),
    email: asString(raw.email),
    firstName: asString(raw.first_name ?? raw.firstName),
    lastName: asString(raw.last_name ?? raw.lastName),
    username: asString(raw.account_no ?? raw.username),
    kycStatus,
    kycComplete: Boolean(raw.kyc_complete ?? raw.kycComplete),
    avatar: asString(raw.profile_image_url ?? raw.avatar, ''),
    isStaff: Boolean(raw.is_staff ?? raw.isStaff),
    isSuperuser: Boolean(raw.is_superuser ?? raw.isSuperuser),
    isPin: typeof raw.is_pin === 'boolean' ? raw.is_pin : typeof raw.isPin === 'boolean' ? raw.isPin : undefined,
  };
};

export const normalizeWallet = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const currency = (raw.currency ?? {}) as UnknownRecord;
  const code = asString(currency.code ?? raw.currency, 'USD');
  const balance = asNumber(raw.balance);
  const normalizeValue = (payload: unknown) => {
    const value = (payload ?? {}) as UnknownRecord;
    const valueCurrency = (value.currency ?? {}) as UnknownRecord;
    const valueCode = asString(valueCurrency.code ?? value.currency);
    if (!valueCode) return undefined;
    return {
      currency: valueCode,
      symbol: asString(valueCurrency.symbol, valueCode),
      logo: firstText(valueCurrency.logo_url, valueCurrency.logo),
      logoUrl: firstText(valueCurrency.logo_url, valueCurrency.logo),
      amount: asNumber(value.amount),
      formatted: asString(value.formatted),
    };
  };

  return {
    id: asString(raw.id),
    currency: code,
    symbol: asString(currency.symbol, code),
    logo: firstText(currency.logo_url, currency.logo, raw.logo_url, raw.logo),
    logoUrl: firstText(currency.logo_url, currency.logo, raw.logo_url, raw.logo),
    balance,
    available: balance,
    pending: 0,
    localValue: normalizeValue(raw.local_value ?? raw.localValue),
    usdValue: normalizeValue(raw.usd_value ?? raw.usdValue),
  };
};

export const normalizeTransaction = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const txType = asString(raw.transaction_type ?? raw.type, 'transfer').toLowerCase();
  const status = asString(raw.status, 'pending').toLowerCase();
  const paymentMethod = (raw.payment_method ?? raw.paymentMethod ?? {}) as UnknownRecord;
  const direction = (
    ['deposit', 'receive', 'reception', 'credit', 'in'].includes(txType)
      ? 'in'
      : 'out'
  ) as 'in' | 'out';
  const type = (
    txType === 'withdrawal' || txType === 'withdraw'
      ? 'withdrawal'
      : txType === 'deposit' || txType === 'receive' || txType === 'reception'
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

  const paymentMethodName = firstText(
    paymentMethod.name,
    raw.payment_method_name,
    raw.paymentMethodName,
    raw.correspondent,
    raw.provider,
  );
  const amount = asNumber(
    raw.amount ??
    raw.montant ??
    raw.total_amount ??
    raw.total_to_debit ??
    raw.net_amount,
  );
  const providerFees = asNumber(raw.provider_fees ?? raw.provider_fee);
  const lipaxeFees = asNumber(raw.fees ?? raw.fee);

  return {
    id: asString(raw.id),
    type,
    rawType: txType,
    direction,
    amount,
    currency: asString(
      raw.currency ??
      raw.payment_method_currency ??
      paymentMethod.currency,
      'USD',
    ),
    status: normalizedStatus,
    description: firstText(raw.remark, raw.description, raw.label, raw.transaction_type, raw.type) || 'Transaction',
    counterparty: firstText(
      raw.counterparty_name,
      raw.to_account_name,
      raw.from_account_name,
      raw.to_user_name,
      raw.from_user_name,
      raw.to_user,
      raw.from_user,
      raw.phone,
      raw.to_account,
      raw.from_account,
      paymentMethodName,
    ),
    reference: asString(raw.reference),
    createdAt: asString(raw.timestamp ?? raw.created_at ?? raw.createdAt),
    fee: lipaxeFees + providerFees,
    lipaxeFee: lipaxeFees,
    providerFee: providerFees,
    wallet_id: asString(raw.wallet_id ?? raw.from_wallet_id ?? raw.to_wallet_id ?? raw.from_wallet ?? raw.to_wallet ?? raw.walletId),
    from_wallet_id: asString(raw.from_wallet_id ?? raw.from_wallet),
    to_wallet_id: asString(raw.to_wallet_id ?? raw.to_wallet),
    paymentMethodName,
    paymentMethodLogo: firstText(
      raw.payment_method_logo,
      raw.paymentMethodLogo,
      raw.image,
      raw.logo,
      paymentMethod.logo_url,
      paymentMethod.logo,
      paymentMethod.icon,
      paymentMethod.image,
    ),
    provider: firstText(raw.provider, paymentMethod.provider, raw.correspondent, paymentMethod.correspondent),
  };
};

export const normalizePaymentMethod = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const paymentType = (raw.payment_type ?? {}) as UnknownRecord;
  const paymentTypeName = asString(paymentType.name);
  const lipaxeDepositPercent = asNumber(raw.deposit_fee_percentage);
  const providerDepositPercent = asNumber(raw.provider_fee);
  const transferPercent = asNumber(raw.transfer_fee_percentage);
  const withdrawalPercent = asNumber(raw.withdrawal_fee_percentage);
  const providerWithdrawalPercent = asNumber(raw.provider_fee_with);
  const totalPercent = lipaxeDepositPercent + providerDepositPercent
    || withdrawalPercent + providerWithdrawalPercent
    || transferPercent;
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
    is_international:
      raw.is_international === undefined && raw.isInternational === undefined
        ? undefined
        : Boolean(raw.is_international ?? raw.isInternational),
    type,
    payment_type: { name: canonicalPaymentTypeName },
    icon: asString(raw.logo),
    countries: Array.isArray(raw.countries)
      ? raw.countries.map((country) => {
          const item = (country ?? {}) as UnknownRecord;
          const nested = (item.country as UnknownRecord | undefined) ?? {};
          return {
            country: {
              id: firstText(item.id, nested.id),
              name: firstText(item.name, nested.name),
              alpha_2: firstText(
                item.alpha_2,
                item.alpha2,
                item.iso_code,
                nested.alpha_2,
                nested.alpha2,
                nested.iso_code,
              ),
              isoCode: firstText(item.isoCode, item.code, item.alpha_3, nested.isoCode, nested.code, nested.alpha_3),
            },
          };
        })
      : [],
    fees: {
      fixed: 0,
      percent: totalPercent,
      lipaxePercent: lipaxeDepositPercent,
      providerPercent: providerDepositPercent,
      transferPercent,
      withdrawalPercent,
      providerWithdrawalPercent,
    },
  };
};

export const normalizeNotification = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const paymentMethod = (raw.payment_method ?? raw.paymentMethod ?? {}) as UnknownRecord;
  const priority = asString(raw.priority, 'normal');
  const text = `${raw.title ?? ''} ${raw.message ?? raw.body ?? ''}`.toLowerCase();
  const level = (
    priority === 'high'
      ? 'warning'
      : text.includes('failed') || text.includes('echec') || text.includes('rejete')
        ? 'error'
        : text.includes('success') || text.includes('complet') || text.includes('verifie')
          ? 'success'
          : 'info'
  ) as 'info' | 'success' | 'warning' | 'error';
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
    logo: firstText(
      raw.logo,
      raw.icon,
      raw.payment_method_logo,
      raw.paymentMethodLogo,
      raw.image,
      paymentMethod.logo_url,
      paymentMethod.logo,
      paymentMethod.icon,
      paymentMethod.image,
    ),
    kind: firstText(raw.kind, raw.notification_key, raw.type),
    paymentMethodName: firstText(
      raw.payment_method_name,
      raw.paymentMethodName,
      paymentMethod.name,
      raw.correspondent,
      raw.provider,
    ),
    paymentMethodLogo: firstText(
      raw.payment_method_logo,
      raw.paymentMethodLogo,
      raw.logo,
      raw.icon,
      raw.image,
      paymentMethod.logo_url,
      paymentMethod.logo,
      paymentMethod.icon,
      paymentMethod.image,
    ),
    provider: firstText(raw.provider, paymentMethod.provider, raw.correspondent, paymentMethod.correspondent),
    amount: asNumber(raw.amount, 0),
    currency: firstText(raw.currency, paymentMethod.currency),
    transactionId: firstText(raw.transaction_id, raw.transactionId),
  };
};

export const normalizeCardOffer = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const sourceBrand = asString(raw.category ?? raw.brand ?? raw.card_type, 'visa');
  const brand = (sourceBrand.toLowerCase().includes('master')
    ? 'Mastercard'
    : 'Visa') as 'Visa' | 'Mastercard';
  const creationFee = asNumber(raw.creation_fixed_fee ?? raw.issuance_fee);
  const featurePayload = Array.isArray(raw.features) ? raw.features : [];

  return {
    id: asString(raw.id),
    provider: asString(raw.provider).toLowerCase(),
    brand,
    name: asString(raw.name ?? `${brand} Virtual`),
    price: asNumber(raw.amount ?? raw.price),
    currency: asString(raw.currency, 'USD'),
    monthly_fee: asOptionalNumber(raw.monthly_fee, raw.maintenance_fee),
    description: asString(raw.description, `${brand} virtual card`),
    card_type: asString(raw.card_type ?? raw.category, brand),
    creation_fixed_fee: creationFee,
    creation_percentage_fee: asOptionalNumber(raw.creation_percentage_fee),
    creation_minimum_fee: asOptionalNumber(raw.creation_minimum_fee),
    live_creation_fixed_fee: asOptionalNumber(raw.live_creation_fixed_fee),
    live_creation_percentage_fee: asOptionalNumber(raw.live_creation_percentage_fee),
    live_creation_minimum_fee: asOptionalNumber(raw.live_creation_minimum_fee),
    funding_fixed_fee: asOptionalNumber(raw.funding_fixed_fee),
    funding_minimum_fee: asOptionalNumber(raw.funding_minimum_fee),
    funding_fee_percent: asOptionalNumber(raw.funding_percentage_fee, raw.funding_fee_percent, raw.funding_fee, raw.load_fee_percent),
    live_funding_fixed_fee: asOptionalNumber(raw.live_funding_fixed_fee),
    live_funding_percentage_fee: asOptionalNumber(raw.live_funding_percentage_fee),
    live_funding_minimum_fee: asOptionalNumber(raw.live_funding_minimum_fee),
    lipaxe_fee_percent: asOptionalNumber(raw.lipax_fee_percentage, raw.lipaxe_fee_percent),
    settlement_fee: asOptionalNumber(raw.settlement_fee),
    authorization_fee: asOptionalNumber(raw.authorization_fee),
    cross_border_fee_percent: asOptionalNumber(raw.cross_border_fee_percent, raw.cross_border_fee),
    withdrawal_fee_percent: asOptionalNumber(raw.withdrawal_fee_percent, raw.withdrawal_fee),
    daily_limit: asOptionalNumber(raw.daily_limit),
    monthly_limit: asOptionalNumber(raw.monthly_limit),
    min_funding: asOptionalNumber(raw.min_funding, raw.minimum_funding),
    supports_3ds: asOptionalBoolean(raw.supports_3ds, raw.three_ds),
    supports_apple_pay: asOptionalBoolean(raw.supports_apple_pay, raw.apple_pay),
    supports_google_pay: asOptionalBoolean(raw.supports_google_pay, raw.google_pay),
    authentication: asString(raw.authentication),
    image: firstText(raw.image, raw.card_image, raw.design_image, raw.preview_image, raw.logo),
    features: featurePayload.map((feature) => typeof feature === 'string' ? feature : asString((feature as UnknownRecord)?.name)).filter(Boolean),
    decline_free_attempts_per_day: asOptionalNumber(raw.decline_free_attempts_per_day),
    decline_fee_per_attempt: asOptionalNumber(raw.decline_fee_per_attempt),
    decline_max_attempts_per_day: asOptionalNumber(raw.decline_max_attempts_per_day),
    freeze_on_decline: asOptionalBoolean(raw.freeze_on_decline),
  };
};

export const normalizeUserCard = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const brand = (asString(raw.card_type, 'visa').toLowerCase().includes('master')
    ? 'Mastercard'
    : 'Visa') as 'Visa' | 'Mastercard';
  const rawStatus = asString(raw.status, 'inactive').toLowerCase();
  const status = (
    rawStatus === 'frozen'
      ? 'frozen'
      : rawStatus === 'pending'
        ? 'pending'
        : rawStatus === 'active'
          ? 'active'
          : 'inactive'
  ) as 'active' | 'frozen' | 'pending' | 'inactive';

  return {
    id: asString(raw.card_id ?? raw.id),
    brand,
    card_number: asString(raw.card_number ?? raw.number),
    number_masked: asString(raw.masked_number ?? raw.last_four, '****'),
    name_on_card: asString(raw.name ?? raw.card_holder_name, 'LIPAXE USER'),
    exp: asString(raw.expiry ?? raw.exp, '--/--'),
    cvv: asString(raw.cvv ?? raw.ccv),
    billing: asString(raw.billing),
    first_six: asString(raw.first_six),
    last_four: asString(raw.last_four),
    balance: asNumber(raw.balance),
    currency: asString(raw.currency, 'USD'),
    status,
    image: firstText(
      raw.image,
      raw.image_url,
      raw.card_image,
      raw.card_design_image,
      raw.design_image,
      raw.preview_image,
      (raw.virtual_card as UnknownRecord | undefined)?.image,
      (raw.virtual_card as UnknownRecord | undefined)?.image_url,
      (raw.virtual_card as UnknownRecord | undefined)?.card_image,
      (raw.virtual_card as UnknownRecord | undefined)?.design_image,
    ),
    provider: asString(raw.provider).toLowerCase(),
    provider_mode: asString(raw.provider_mode).toLowerCase(),
    provider_decline_count: asNumber(raw.provider_decline_count),
    is_freezon_by_system: Boolean(raw.is_freezon_by_system),
    provider_decline_limit: asNumber(raw.provider_decline_limit),
    provider_decline_last_at: raw.provider_decline_last_at == null ? null : asString(raw.provider_decline_last_at),
    daily_limit: asOptionalNumber(raw.daily_limit ?? (raw.virtual_card as UnknownRecord | undefined)?.daily_limit),
    daily_spend_today: asOptionalNumber(raw.daily_spend_today),
    daily_limit_remaining: asOptionalNumber(raw.daily_limit_remaining),
    daily_limit_reached_on: raw.daily_limit_reached_on == null ? null : asString(raw.daily_limit_reached_on),
    is_daily_limit_frozen: Boolean(raw.is_daily_limit_frozen),
  };
};

export const normalizeCardTransaction = (payload: unknown) => {
  const raw = (payload ?? {}) as UnknownRecord;
  const rawStatus = asString(raw.status, 'pending').toLowerCase();
  const status = (
    ['success', 'completed', 'approved'].includes(rawStatus)
      ? 'completed'
      : ['failed', 'declined', 'reversed', 'rejected'].includes(rawStatus)
        ? 'failed'
        : 'pending'
  ) as 'completed' | 'pending' | 'failed';
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
