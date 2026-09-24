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

/** Human-readable labels for each feature flag — used as marketing
 *  bullet copy when admins haven't supplied a custom `highlights`
 *  list on a plan. */
export const PLAN_HIGHLIGHT_LABELS: Record<FeatureFlagKey, string> = {
  canList: 'Public profile page',
  canCollectReviews: 'Verified reviews',
  canRespondReviews: 'Two-way reviews',
  canGetVerified: 'Application review',
  canUseWidgets: 'Website widgets',
  canGenerateQR: 'QR code generator',
  canSendInvitations: 'Review invitations',
  reviewWidget: 'Reviews widget',
  trustScoreWidget: 'Trust score widget',
  customDomain: 'Custom domain',
  badgeDisplay: 'Verified badge',
  analytics: 'Analytics dashboard',
};

export const PLAN_AUDIENCES = ['ALL', 'BUSINESS', 'PROFESSIONAL'] as const;
export type PlanAudience = (typeof PLAN_AUDIENCES)[number];

export const PLAN_AUDIENCE_LABEL: Record<PlanAudience, string> = {
  ALL: 'All audiences',
  BUSINESS: 'For business only',
  PROFESSIONAL: 'For professionals only',
};

/**
 * Default VAT for invoices (5%).
 * Override via INVOICE_VAT_RATE environment variable on the API.
 */
export const DEFAULT_INVOICE_VAT_RATE = 0.05;