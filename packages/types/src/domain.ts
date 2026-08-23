/**
 * Domain enums — mirror Prisma enums so they can be used on the frontend
 * without importing the Prisma client.
 */

export type UserRole = 'GUEST' | 'CUSTOMER' | 'BUSINESS' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED';

export type BusinessStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'SUSPENDED' | 'CLOSED';

export type VerificationStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'DOCUMENTS_UPLOADED'
  | 'AUTO_CHECKING'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'APPROVED'
  | 'REJECTED';

export type VerificationLevel = 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';

export type DocumentType =
  | 'TRADE_LICENSE'
  | 'NATIONAL_ID'
  | 'TAX_CERTIFICATE'
  | 'BUSINESS_REGISTRATION'
  | 'ADDRESS_PROOF'
  | 'PROFESSIONAL_LICENSE'
  | 'OTHER';

export type DocumentStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'AI_EXTRACTED'
  | 'AI_FLAGGED'
  | 'APPROVED'
  | 'REJECTED';

export type ReviewStatus =
  | 'PUBLISHED'
  | 'FLAGGED'
  | 'HIDDEN'
  | 'DELETED'
  | 'PENDING_MODERATION';

export type SubscriptionPlan = 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';

export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELED';

export type PaymentGateway = 'AAMARPAY' | 'SSLCOMMERZ' | 'MANUAL';

export type BillingCycle = 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type PaymentMethodKind =
  | 'CREDIT_CARD'
  | 'MOBILE_BANKING'
  | 'BANK_TRANSFER'
  | 'SSLCOMMERZ'
  | 'AAMARPAY';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string | null;
  pdfUrl?: string | null;
  items: InvoiceLineItem[];
  notes?: string | null;
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Voucher {
  id: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minPurchaseAmount?: number | null;
  maxUses?: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicablePlans: SubscriptionPlan[];
}

export interface PlanFeature {
  canList: boolean;
  canCollectReviews: boolean;
  canRespondReviews: boolean;
  canGetVerified: boolean;
  canUseWidgets: boolean;
  canGenerateQR: boolean;
  canSendInvitations: boolean;
  reviewWidget: boolean;
  trustScoreWidget: boolean;
  customDomain: boolean;
  badgeDisplay: boolean;
  analytics: boolean;
  reviewInvitationsLimit: number;
  documentUploadLimit: number;
  supportLevel: 'EMAIL' | 'PRIORITY_EMAIL' | 'PHONE_AND_EMAIL';
}

export interface PublicUser {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: UserRole;
}

export interface PublicBusiness {
  id: string;
  slug: string;
  displayName: string;
  logo?: string;
  city?: string;
  ratingAverage?: number;
  ratingCount: number;
  verificationLevel: VerificationLevel;
  isVerified: boolean;
}

export interface PublicReview {
  id: string;
  rating: number;
  title?: string;
  content: string;
  author: Pick<PublicUser, 'id' | 'firstName' | 'avatar'>;
  responseContent?: string;
  responseAt?: string;
  createdAt: string;
  helpfulCount: number;
}