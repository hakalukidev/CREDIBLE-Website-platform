/**
 * Billing-related constants shared between API and web.
 */

export const SUBSCRIPTION_PLANS = ['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'] as const;

export const BILLING_CYCLES = ['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY'] as const;

export const PLAN_DISPLAY: Record<(typeof SUBSCRIPTION_PLANS)[number], string> = {
  FREE: 'Free',
  BASIC: 'Basic',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

export const SUPPORT_LEVEL_LABEL = {
  EMAIL: 'Email support',
  PRIORITY_EMAIL: 'Priority email support',
  PHONE_AND_EMAIL: 'Phone & email support',
} as const;

export const FEATURE_FLAGS = [
  'canList',
  'canCollectReviews',
  'canRespondReviews',
  'canGetVerified',
  'canUseWidgets',
  'canGenerateQR',
  'canSendInvitations',
  'reviewWidget',
  'trustScoreWidget',
  'customDomain',
  'badgeDisplay',
  'analytics',
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[number];

/**
 * Default Bangladesh VAT for invoices (5%).
 * Override via INVOICE_VAT_RATE environment variable on the API.
 */
export const DEFAULT_INVOICE_VAT_RATE = 0.05;