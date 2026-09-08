/**
 * Admin-extended service.
 *
 * Keeps the data-access layer for admin-extended endpoints (users, businesses,
 * professionals, payments, subscriptions, contact, audit, settings) in one
 * place so the controller stays thin.
 */
import type { Prisma, User, UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../../lib/db/prisma';

const USER_SAFE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
} satisfies Prisma.UserSelect;

export const adminExtendedService = {
  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------

  async listUsers(filter: {
    search?: string;
    role?: UserRole;
    status?: UserStatus;
    page: number;
    perPage: number;
  }) {
    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (filter.role) where.role = filter.role;
    if (filter.status) where.status = filter.status;
    if (filter.search) {
      const q = filter.search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }
    const skip = (filter.page - 1) * filter.perPage;
    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filter.perPage,
        select: USER_SAFE_SELECT,
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total };
  },

  async getUser(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SAFE_SELECT,
        business: {
          select: {
            id: true,
            slug: true,
            displayName: true,
            status: true,
            verificationStatus: true,
          },
        },
        professional: {
          select: {
            id: true,
            slug: true,
            displayName: true,
            status: true,
            verificationStatus: true,
          },
        },
        _count: { select: { reviews: true } },
      },
    });
    return user;
  },

  async updateUser(id: string, input: { role?: UserRole; status?: UserStatus }) {
    return prisma.user.update({ where: { id }, data: input, select: USER_SAFE_SELECT });
  },

  // ---------------------------------------------------------------------------
  // Businesses
  // ---------------------------------------------------------------------------

  async listBusinesses(filter: {
    search?: string;
    status?: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'SUSPENDED' | 'CLOSED';
    verificationStatus?:
      | 'NOT_STARTED'
      | 'PENDING'
      | 'DOCUMENTS_UPLOADED'
      | 'AUTO_CHECKING'
      | 'HUMAN_REVIEW_REQUIRED'
      | 'APPROVED'
      | 'REJECTED';
    page: number;
    perPage: number;
  }) {
    const where: Prisma.BusinessWhereInput = { deletedAt: null };
    if (filter.status) where.status = filter.status;
    if (filter.verificationStatus) where.verificationStatus = filter.verificationStatus;
    if (filter.search) {
      const q = filter.search.trim();
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { legalName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }
    const skip = (filter.page - 1) * filter.perPage;
    const [items, total] = await prisma.$transaction([
      prisma.business.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filter.perPage,
        include: {
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.business.count({ where }),
    ]);
    return { items, total };
  },

  async getBusiness(id: string) {
    return prisma.business.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        _count: { select: { reviews: true, payments: true, subscriptions: true } },
      },
    });
  },

  async setBusinessStatus(id: string, status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'SUSPENDED' | 'CLOSED') {
    return prisma.business.update({ where: { id }, data: { status } });
  },

  // ---------------------------------------------------------------------------
  // Professionals
  // ---------------------------------------------------------------------------

  async listProfessionals(filter: {
    search?: string;
    status?: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'SUSPENDED' | 'CLOSED';
    verificationStatus?:
      | 'NOT_STARTED'
      | 'PENDING'
      | 'DOCUMENTS_UPLOADED'
      | 'AUTO_CHECKING'
      | 'HUMAN_REVIEW_REQUIRED'
      | 'APPROVED'
      | 'REJECTED';
    page: number;
    perPage: number;
  }) {
    const where: Prisma.ProfessionalWhereInput = { deletedAt: null };
    if (filter.status) where.status = filter.status;
    if (filter.verificationStatus) where.verificationStatus = filter.verificationStatus;
    if (filter.search) {
      const q = filter.search.trim();
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { profession: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }
    const skip = (filter.page - 1) * filter.perPage;
    const [items, total] = await prisma.$transaction([
      prisma.professional.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filter.perPage,
        include: {
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.professional.count({ where }),
    ]);
    return { items, total };
  },

  async getProfessional(id: string) {
    return prisma.professional.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        _count: { select: { reviews: true, payments: true, subscriptions: true } },
      },
    });
  },

  async setProfessionalStatus(
    id: string,
    status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'SUSPENDED' | 'CLOSED',
  ) {
    return prisma.professional.update({ where: { id }, data: { status } });
  },

  // ---------------------------------------------------------------------------
  // Payments
  // ---------------------------------------------------------------------------

  async listPayments(filter: {
    status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELED';
    gateway?: 'AAMARPAY' | 'SSLCOMMERZ';
    page: number;
    perPage: number;
  }) {
    const where: Prisma.PaymentWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.gateway) where.gateway = filter.gateway;
    const skip = (filter.page - 1) * filter.perPage;
    const [items, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filter.perPage,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          business: { select: { id: true, displayName: true, slug: true } },
          professional: { select: { id: true, displayName: true, slug: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);
    return { items, total };
  },

  async getPayment(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        business: { select: { id: true, displayName: true, slug: true } },
        professional: { select: { id: true, displayName: true, slug: true } },
      },
    });
  },

  async refundPayment(
    id: string,
    input: { amount?: number; reason: string },
  ) {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return null;
    const total = Number(payment.amount);
    const alreadyRefunded = Number(payment.refundAmount ?? 0);
    const amount = input.amount ?? Math.max(0, total - alreadyRefunded);
    const newRefunded = alreadyRefunded + amount;
    const newStatus =
      newRefunded >= total ? 'REFUNDED' : payment.status === 'CANCELED' ? 'CANCELED' : 'SUCCESS';
    return prisma.payment.update({
      where: { id },
      data: {
        refundAmount: newRefunded,
        refundedAt: new Date(),
        refundReason: input.reason,
        status: newStatus,
      },
    });
  },

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------

  async listSubscriptions(filter: {
    plan?: 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
    status?: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';
    page: number;
    perPage: number;
  }) {
    const where: Prisma.SubscriptionWhereInput = {};
    if (filter.plan) where.plan = filter.plan;
    if (filter.status) where.status = filter.status;
    const skip = (filter.page - 1) * filter.perPage;
    const [items, total] = await prisma.$transaction([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filter.perPage,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          business: { select: { id: true, displayName: true, slug: true } },
        },
      }),
      prisma.subscription.count({ where }),
    ]);
    return { items, total };
  },

  async getSubscription(id: string) {
    return prisma.subscription.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        business: { select: { id: true, displayName: true, slug: true } },
      },
    });
  },

  async cancelSubscription(id: string, reason: string) {
    return prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELED', canceledAt: new Date() },
    });
  },

  async overrideSubscriptionPlan(
    id: string,
    input: { plan: 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'; validUntil?: Date },
  ) {
    return prisma.subscription.update({
      where: { id },
      data: { plan: input.plan, currentPeriodEnd: input.validUntil ?? undefined },
    });
  },

  // ---------------------------------------------------------------------------
  // Contact requests
  // ---------------------------------------------------------------------------

  async listContactRequests(filter: {
    status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'REJECTED';
    page: number;
    perPage: number;
  }) {
    const where: Prisma.ContactRequestWhereInput = {};
    if (filter.status) where.status = filter.status;
    const skip = (filter.page - 1) * filter.perPage;
    const [items, total] = await prisma.$transaction([
      prisma.contactRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filter.perPage,
        include: {
          business: { select: { id: true, displayName: true, slug: true } },
        },
      }),
      prisma.contactRequest.count({ where }),
    ]);
    return { items, total };
  },

  async getContactRequest(id: string) {
    return prisma.contactRequest.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, displayName: true, slug: true } },
        requester: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  },

  async updateContactRequest(
    id: string,
    input: { status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'REJECTED'; response?: string },
  ) {
    return prisma.contactRequest.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.response !== undefined ? { notes: input.response } : {}),
      },
    });
  },

  // ---------------------------------------------------------------------------
  // Audit log
  // ---------------------------------------------------------------------------

  async listAuditLogs(filter: {
    actorId?: string;
    action?: string;
    from?: Date;
    to?: Date;
    page: number;
    perPage: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {};
    if (filter.actorId) where.actorId = filter.actorId;
    if (filter.action) where.action = { contains: filter.action, mode: 'insensitive' };
    if (filter.from || filter.to) {
      where.createdAt = {
        ...(filter.from ? { gte: filter.from } : {}),
        ...(filter.to ? { lte: filter.to } : {}),
      };
    }
    const skip = (filter.page - 1) * filter.perPage;
    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filter.perPage,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  },

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  async listSettings() {
    return prisma.setting.findMany({ orderBy: { key: 'asc' } });
  },

  async upsertSetting(key: string, value: unknown, updatedBy: string | null) {
    return prisma.setting.upsert({
      where: { key },
      create: { key, valueJson: value as Prisma.InputJsonValue, updatedBy },
      update: { valueJson: value as Prisma.InputJsonValue, updatedBy },
    });
  },
};

export type AdminExtendedService = typeof adminExtendedService;
