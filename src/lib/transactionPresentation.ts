import type { TFunction } from 'i18next';
import type { Transaction } from '@/store/api/walletApi';

const normalizeText = (value?: string) => String(value || '').trim();
const isRawIdentifier = (value: string) =>
  /^LI\d{6,}$/i.test(value) ||
  /^\+?\d{8,15}$/.test(value) ||
  /^[0-9a-f]{8}-[0-9a-f-]{12,}$/i.test(value);

const humanCounterparty = (value: string | undefined, t: TFunction) => {
  const text = normalizeText(value);
  if (!text) return '';
  if (/^LI\d{6,}$/i.test(text)) return t('tx.lipaxeUser');
  if (/^\+?\d{8,15}$/.test(text)) return t('tx.mobileNumber');
  if (/^[0-9a-f]{8}-[0-9a-f-]{12,}$/i.test(text)) return '';
  return text;
};

const isCardTransaction = (tx: Transaction) => {
  const haystack = `${tx.rawType || ''} ${tx.description || ''} ${tx.paymentMethodName || ''} ${tx.provider || ''}`.toLowerCase();
  return haystack.includes('card') || haystack.includes('carte');
};

const isCryptoTransaction = (tx: Transaction) => {
  const haystack = `${tx.rawType || ''} ${tx.description || ''} ${tx.paymentMethodName || ''} ${tx.provider || ''}`.toLowerCase();
  return haystack.includes('crypto') || haystack.includes('btc') || haystack.includes('usdt') || haystack.includes('usdc');
};

export const getTransactionTitle = (tx: Transaction, t: TFunction) => {
  const counterparty = humanCounterparty(tx.counterparty, t);
  const methodName = normalizeText(tx.paymentMethodName || tx.provider);
  const rawType = normalizeText(tx.rawType || tx.type).toLowerCase();

  if (isCardTransaction(tx) && rawType.includes('withdraw')) {
    return t('tx.cardWithdraw');
  }
  if (isCardTransaction(tx) && (rawType.includes('deposit') || rawType.includes('topup') || normalizeText(tx.description).toLowerCase().includes('recharge'))) {
    return t('tx.cardTopup');
  }
  if (isCardTransaction(tx) && (normalizeText(tx.description).toLowerCase().includes('buy') || normalizeText(tx.description).toLowerCase().includes('achat'))) {
    return t('tx.cardPurchase');
  }
  if (rawType.includes('swap')) {
    return t('tx.swap');
  }
  if (rawType.includes('exchange')) {
    return t('tx.exchange');
  }
  if (isCryptoTransaction(tx) && rawType.includes('buy')) {
    return t('tx.cryptoBuy');
  }
  if (isCryptoTransaction(tx) && rawType.includes('sell')) {
    return t('tx.cryptoSell');
  }
  if (rawType.includes('withdraw')) {
    const target = methodName || counterparty;
    return target ? t('tx.withdrawTo', { target }) : t('tx.withdrawal');
  }
  if (rawType.includes('deposit')) {
    const target = methodName || counterparty;
    return target ? t('tx.depositVia', { target }) : t('tx.deposit');
  }
  if (rawType.includes('transfer')) {
    if (tx.direction === 'out') {
      return counterparty ? t('tx.transferTo', { target: counterparty }) : t('tx.transfer');
    }
    return counterparty ? t('tx.transferFrom', { target: counterparty }) : t('tx.transfer');
  }

  return normalizeText(tx.description) || t('tx.transaction');
};

export const getTransactionSubtitle = (tx: Transaction, t: TFunction) => {
  const bits = [
    normalizeText(tx.reference),
    normalizeText(tx.paymentMethodName || tx.provider),
    isRawIdentifier(normalizeText(tx.counterparty)) ? '' : normalizeText(tx.counterparty),
  ].filter(Boolean);

  if (bits.length > 0) return bits.join(' - ');
  return t('tx.transaction');
};
