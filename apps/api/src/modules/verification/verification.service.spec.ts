import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the heavy modules BEFORE importing the service.
vi.mock('../../lib/db/prisma', () => {
  const prismaMock = {
    verificationApplication: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    verificationDocument: {
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    business: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    professional: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    review: { count: vi.fn() },
    subscription: { findFirst: vi.fn() },
    badge: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    applicationStatusHistory: { create: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  return { prisma: prismaMock };
});

vi.mock('../../lib/queue/queues', () => ({
  queues: {
    'analyze-application': { add: vi.fn().mockResolvedValue(undefined) },
    'generate-badge': { add: vi.fn().mockResolvedValue(undefined) },
    'verification-notification': { add: vi.fn().mockResolvedValue(undefined) },
    'process-document': { add: vi.fn().mockResolvedValue(undefined) },
  },
}));

vi.mock('../../lib/badge/generator', () => ({
  generateBadge: vi.fn().mockResolvedValue({
    key: 'badge/key.svg',
    url: 'https://cdn.example/badge.svg',
    mimeType: 'image/svg+xml',
    size: 1024,
  }),
}));

vi.mock('../../config/env', () => ({
  env: {
    WEB_URL: 'http://localhost:3000',
    API_URL: 'http://localhost:4000/api/v1',
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
  },
  isDev: false,
  isProd: false,
  isTest: true,
}));

vi.mock('../businesses/business.repository', () => ({
  businessRepository: {
    findById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('./verification.repository', () => ({
  verificationRepository: {
    listPending: vi.fn(),
  },
}));

vi.mock('../../lib/logger/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@credible/shared', async () => {
  const actual =
    await vi.importActual<typeof import('@credible/shared')>('@credible/shared');
  return {
    ...actual,
    generateBadgeHash: () => 'abc123hash',
  };
});

import { prisma } from '../../lib/db/prisma';
import { businessRepository } from '../businesses/business.repository';
import { verificationService } from './verification.service';
import { NotFoundError, ConflictError } from '../../lib/errors/AppError';

const businessRepo = businessRepository as unknown as {
  findById: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};
const prismaMock = prisma as unknown as {
  verificationApplication: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  business: { findUnique: ReturnType<typeof vi.fn> };
  review: { count: ReturnType<typeof vi.fn> };
  subscription: { findFirst: ReturnType<typeof vi.fn> };
  badge: { findUnique: ReturnType<typeof vi.fn> };
  applicationStatusHistory: { create: ReturnType<typeof vi.fn> };
  verificationDocument: { count: ReturnType<typeof vi.fn> };
};

const BUSINESS = {
  id: 'biz_1',
  ownerId: 'owner_1',
  displayName: 'Acme Ltd',
  slug: 'acme',
  verificationStatus: 'NOT_STARTED',
  verificationLevel: 'NONE',
  verifiedAt: null,
  badgeHash: null,
  badgeIssuedAt: null,
  verificationUrl: null,
  ratingAverage: new (class {
    toString() {
      return '4.5';
    }
  })() as unknown as number,
  email: 'owner@example.com',
};

describe('verificationService.eligibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns not eligible when review count < 5', async () => {
    businessRepo.findById.mockResolvedValue(BUSINESS);
    prismaMock.review.count.mockResolvedValue(2);
    prismaMock.subscription.findFirst.mockResolvedValue({ plan: 'PROFESSIONAL' });

    const result = await verificationService.eligibility(BUSINESS.id);

    expect(result.eligible).toBe(false);
    expect(result.checks.reviewCount.passed).toBe(false);
    expect(result.checks.avgRating.passed).toBe(true);
    expect(result.checks.plan.passed).toBe(true);
  });

  it('returns not eligible when avg rating < 4.0', async () => {
    businessRepo.findById.mockResolvedValue({ ...BUSINESS, ratingAverage: 3.4 as unknown as number });
    prismaMock.review.count.mockResolvedValue(8);
    prismaMock.subscription.findFirst.mockResolvedValue({ plan: 'PROFESSIONAL' });

    const result = await verificationService.eligibility(BUSINESS.id);

    expect(result.eligible).toBe(false);
    expect(result.checks.avgRating.passed).toBe(false);
  });

  it('returns not eligible on FREE plan', async () => {
    businessRepo.findById.mockResolvedValue(BUSINESS);
    prismaMock.review.count.mockResolvedValue(8);
    prismaMock.subscription.findFirst.mockResolvedValue({ plan: 'FREE' });

    const result = await verificationService.eligibility(BUSINESS.id);

    expect(result.eligible).toBe(false);
    expect(result.checks.plan.passed).toBe(false);
  });

  it('returns eligible when all checks pass', async () => {
    businessRepo.findById.mockResolvedValue(BUSINESS);
    prismaMock.review.count.mockResolvedValue(8);
    prismaMock.subscription.findFirst.mockResolvedValue({ plan: 'PROFESSIONAL' });

    const result = await verificationService.eligibility(BUSINESS.id);

    expect(result.eligible).toBe(true);
    expect(result.alreadyVerified).toBe(false);
  });

  it('throws NotFoundError when business does not exist', async () => {
    businessRepo.findById.mockResolvedValue(null);
    await expect(verificationService.eligibility('missing')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('verificationService.apply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects when caller is not the owner', async () => {
    businessRepo.findById.mockResolvedValue({ ...BUSINESS, ownerId: 'someone-else' });
    prismaMock.verificationApplication.create.mockResolvedValue({
      id: 'app_1',
      businessId: BUSINESS.id,
      status: 'PENDING',
      level: 'BASIC',
      type: 'BASIC',
    });

    await expect(
      verificationService.apply('owner_1', BUSINESS.id, {
        level: 'BASIC',
        type: 'BASIC',
      }),
    ).rejects.toThrow();
  });

  it('refuses when business is already verified', async () => {
    businessRepo.findById.mockResolvedValue({ ...BUSINESS, verificationStatus: 'APPROVED' });
    await expect(
      verificationService.apply('owner_1', BUSINESS.id, {
        level: 'BASIC',
        type: 'BASIC',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('verificationService.badge (public shape)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns hasBadge=false when no active badge', async () => {
    businessRepo.findById.mockResolvedValue(BUSINESS);
    prismaMock.badge.findUnique.mockResolvedValue(null);
    const result = await verificationService.badge(BUSINESS.id);
    expect(result.hasBadge).toBe(false);
    expect(result.badgeId).toBeUndefined();
  });

  it('returns the full shape for an active badge', async () => {
    businessRepo.findById.mockResolvedValue(BUSINESS);
    prismaMock.badge.findUnique.mockResolvedValue({
      id: 'b_1',
      badgeId: 'hash123',
      businessId: BUSINESS.id,
      type: 'CERTIFIED',
      imageUrl: 'https://cdn.example/badge.svg',
      verificationUrl: 'http://localhost:3000/verify/hash123',
      issuedAt: new Date('2024-01-01T00:00:00Z'),
      expiresAt: null,
      isActive: true,
      revokedAt: null,
      revocationReason: null,
    });

    const result = await verificationService.badge(BUSINESS.id);
    expect(result.hasBadge).toBe(true);
    expect(result.badgeType).toBe('CERTIFIED');
    expect(result.badgeId).toBe('hash123');
    expect(result.verificationUrl).toBe('http://localhost:3000/verify/hash123');
  });
});