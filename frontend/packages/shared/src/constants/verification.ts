/**
 * Verification workflow states in order.
 * Used to drive progress UI on the business dashboard.
 */
export const VERIFICATION_STAGES = [
  { key: 'PENDING', label: 'Application Submitted', description: 'Your application has been received.' },
  { key: 'DOCUMENTS_UPLOADED', label: 'Documents Under Review', description: 'Our team is reviewing your documents.' },
  { key: 'AUTO_CHECKING', label: 'Automated Checks', description: 'Running automated verification checks.' },
  { key: 'HUMAN_REVIEW_REQUIRED', label: 'Manual Review', description: 'A human reviewer is examining your case.' },
  { key: 'APPROVED', label: 'Approved', description: 'Your business has been verified!' },
] as const;

// Phase 3 — limits + eligibility thresholds for the verification wizard.
export const VERIFICATION_MIN_DOCUMENTS = 3;
export const VERIFICATION_MAX_DOCUMENTS = 10;
export const VERIFICATION_MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB
export const VERIFICATION_MIN_REVIEW_COUNT = 5;
export const VERIFICATION_MIN_AVG_RATING = 4.0;
export const VERIFICATION_REVIEW_SLA_DAYS = 3;

// Allowed MIME types for verification document uploads.
export const VERIFICATION_ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export type VerificationStageKey = (typeof VERIFICATION_STAGES)[number]['key'];

export const VERIFICATION_LEVEL_LABELS: Record<string, string> = {
  NONE: 'Unverified',
  BASIC: 'Basic',
  CERTIFIED: 'Credible Certified',
  PREMIUM: 'Premium Verified',
};

export const REVIEW_QUEUE_NAMES = {
  EMAIL: 'email',
  AI_VERIFICATION: 'ai-verification',
  BADGE_GENERATION: 'badge-generation',
  PAYMENT_IPN: 'payment-ipn',
  REVIEW_MODERATION: 'review-moderation',
  NOTIFICATIONS: 'notifications',
} as const;

export const STORAGE_KEYS = {
  DOCUMENTS: 'documents',
  PUBLIC: 'public',
  AVATARS: 'avatars',
  BADGES: 'badges',
} as const;