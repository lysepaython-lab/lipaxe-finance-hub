import { describe, expect, it } from 'vitest';
import { normalizeCardOffer } from './adapters';

describe('normalizeCardOffer', () => {
  it('recognizes ScarabPay 3DS support and monthly spending limits', () => {
    const offer = normalizeCardOffer({
      id: 'visa-starter',
      provider: 'ScarabPay',
      monthly_spending_limit: '500',
    });

    expect(offer.supports_3ds).toBe(true);
    expect(offer.monthly_limit).toBe(500);
  });

  it('respects an explicit provider declaration that 3DS is unsupported', () => {
    const offer = normalizeCardOffer({
      id: 'legacy-card',
      provider: 'ScarabPay',
      supports_3ds: false,
    });

    expect(offer.supports_3ds).toBe(false);
  });
});
