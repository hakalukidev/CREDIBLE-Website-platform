/**
 * Shared TypeScript types for the billing UI. Mirrors the API contract but
 * kept here so components don't have to depend on @credible/types internals.
 */

export type SubscriptionPlan = 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';

export type BillingCycle = 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type PaymentGateway = 'AAMARPAY' | 'SSLCOMMERZ' | 'MANUAL';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELED';

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

export interface CurrentSubscription {
  plan: SubscriptionPlan;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  billingCycle: BillingCycle | null;
  nextPaymentDate: string | null;
  autoRenew: boolean;
  amount: number | null;
  currency: string;
  cancelAtPeriodEnd: boolean;
  features: PlanFeature;
  usage: {
    month: string;
    reviewInvitations: number;
    reviewResponses: number;
    documentUploads: number;
    apiCalls: number;
    websiteViews: number;
    limit: number;
  };
}

export interface PlanInfo {
  id: SubscriptionPlan;
  code: SubscriptionPlan;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: PlanFeature;
  hasVerification: boolean;
  hasBadge: boolean;
}

export interface SubscribeResult {
  subscriptionId: string;
  paymentId: string;
  gateway: PaymentGateway;
  paymentUrl: string;
  redirectType: 'GATEWAY_REDIRECT';
  amount: number;
  currency: string;
}

export interface VoucherValidation {
  valid: boolean;
  voucherId?: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  discountAmount: number;
  discountedPrice: number;
  message: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  pdfUrl: string | null;
  items: InvoiceLineItem[];
  notes?: string | null;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  businessId: string | null;
  subscriptionId: string | null;
  gateway: PaymentGateway;
  gatewayTxnId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminBillingStats {
  totalRevenue: number;
  totalSuccessfulPayments: number;
  monthlyRevenue: number;
  subscriptionCount: Record<SubscriptionPlan, number>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    gateway: PaymentGateway;
    paidAt: string | null;
    businessName: string | null;
  }>;
}

export interface AdminPaymentRow extends PaymentRecord {
  business: { id: string; displayName: string; slug: string } | null;
  subscription: { id: string; plan: SubscriptionPlan; billingCycle: BillingCycle } | null;
}
