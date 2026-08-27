/**
 * Temporarily unavailable product areas. Keep navigation and direct routes in
 * sync through this single source of truth until each product is launch-ready.
 */
export const FEATURES = {
  payAll: false,
  lipaxeExchange: false,
  lipaxeCryptos: false,
  yieldVaults: false,
  savings: false,
  festiPay: false,
} as const;

export type FeatureName = keyof typeof FEATURES;

export const isFeatureEnabled = (feature?: FeatureName) => !feature || FEATURES[feature];
