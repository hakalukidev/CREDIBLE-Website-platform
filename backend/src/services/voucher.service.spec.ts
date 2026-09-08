import { describe, expect, it, vi, beforeEach } from 'vitest';

const { findUniqueMock, findFirstMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  findFirstMock: vi.fn(),
}));

vi.mock('../../config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
  isDev: false,
  isProd: false,
  isTest: true,
}));
vi.mock('../lib/logger/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../lib/db/prisma', () => ({
  prisma: {
    voucher: { findUnique: findUniqueMock, findFirst: findFirstMock },
    voucherRedemption: { findFirst: findFirstMock },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn({})),
  },
}));

import { voucherService } from './voucherService';

const baseVoucher = {
  id: 'v1',
  code: 'WELCOME10',
  description: null,
  discountType: 'PERCENTAGE' as const,
  discountValue: 10,
  maxDiscountAmount: 50,
  minPurchaseAmount: 100,
  maxUses: null,
  usedCount: 0,
  validFrom: new Date('2024-01-01'),
  validUntil: new Date('2099-01-01'),
  isActive: true,
  applicablePlans: ['BASIC', 'PROFESSIONAL'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  findUniqueMock.mockReset();
  findFirstMock.mockReset();
});

describe('voucherService.validate', () => {
  it('rejects when voucher does not exist', async () => {
    findUniqueMock.mockResolvedValue(null);
    const result = await voucherService.validate({ code: 'NOPE', planId: 'BASIC', amount: 200 });
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/not found/i);
  });

  it('rejects inactive vouchers', async () => {
    findUniqueMock.mockResolvedValue({ ...baseVoucher, isActive: false });
    const result = await voucherService.validate({ code: 'WELCOME10', planId: 'BASIC', amount: 200 });
    expect(result.valid).toBe(false);
  });

  it('rejects when below minimum purchase amount', async () => {
    findUniqueMock.mockResolvedValue({ ...baseVoucher, minPurchaseAmount: 500 });
    const result = await voucherService.validate({ code: 'WELCOME10', planId: 'BASIC', amount: 200 });
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/minimum purchase/i);
  });

  it('rejects when voucher is not applicable to the requested plan', async () => {
    findUniqueMock.mockResolvedValue({ ...baseVoucher, applicablePlans: ['BASIC'] });
    const result = await voucherService.validate({ code: 'WELCOME10', planId: 'ENTERPRISE', amount: 200 });
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/not applicable/i);
  });

  it('caps percentage discount at the max cap', async () => {
    findUniqueMock.mockResolvedValue({ ...baseVoucher });
    const result = await voucherService.validate({ code: 'WELCOME10', planId: 'BASIC', amount: 1000 });
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(50);
    expect(result.discountedPrice).toBe(950);
  });

  it('applies percentage without cap correctly', async () => {
    findUniqueMock.mockResolvedValue({ ...baseVoucher, maxDiscountAmount: null });
    const result = await voucherService.validate({ code: 'WELCOME10', planId: 'BASIC', amount: 1000 });
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(100);
    expect(result.discountedPrice).toBe(900);
  });

  it('applies fixed discount up to the order amount', async () => {
    findUniqueMock.mockResolvedValue({ ...baseVoucher, discountType: 'FIXED_AMOUNT', discountValue: 200 });
    const result = await voucherService.validate({ code: 'WELCOME10', planId: 'BASIC', amount: 100 });
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(100);
    expect(result.discountedPrice).toBe(0);
  });

  it('rejects when maxUses is exhausted', async () => {
    findUniqueMock.mockResolvedValue({ ...baseVoucher, maxUses: 5, usedCount: 5 });
    const result = await voucherService.validate({ code: 'WELCOME10', planId: 'BASIC', amount: 200 });
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/usage limit/i);
  });

  it('rejects when the same business has already redeemed it', async () => {
    findUniqueMock.mockResolvedValue({ ...baseVoucher });
    findFirstMock.mockResolvedValue({ id: 'r1' });
    const result = await voucherService.validate({
      code: 'WELCOME10',
      planId: 'BASIC',
      amount: 200,
      businessId: 'biz1',
    });
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/already used/i);
  });

  it('rejects outside the validity window', async () => {
    findUniqueMock.mockResolvedValue({
      ...baseVoucher,
      validFrom: new Date('2099-01-01'),
      validUntil: new Date('2099-12-31'),
    });
    const result = await voucherService.validate({ code: 'WELCOME10', planId: 'BASIC', amount: 200 });
    expect(result.valid).toBe(false);
  });
});
