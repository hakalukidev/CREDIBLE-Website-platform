import { describe, expect, it, vi } from 'vitest';

const { update, findFirst, transaction, verifyIpn, getAdapterMock } = vi.hoisted(() => ({
  update: vi.fn(),
  findFirst: vi.fn(),
  transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn({ update, findFirst })),
  verifyIpn: vi.fn(),
  getAdapterMock: vi.fn(() => ({
    createSession: vi.fn(),
    verifyIpn,
  })),
}));

vi.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    WEB_URL: 'http://localhost:3000',
    API_URL: 'http://localhost:4000/api/v1',
  },
  isDev: false,
  isProd: false,
  isTest: true,
}));
vi.mock('../lib/logger/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../lib/db/prisma', () => ({
  prisma: {
    payment: {
      findFirst,
      update,
    },
    subscription: {},
    $transaction: transaction,
  },
}));
vi.mock('../lib/queue/queues', () => ({
  queues: {
    'send-email': { add: vi.fn() },
    'process-payment-ipn': { add: vi.fn() },
  },
}));

vi.mock('../lib/payments/payment.gateway', async () => {
  const actual = await vi.importActual<typeof import('../lib/payments/payment.gateway')>(
    '../lib/payments/payment.gateway',
  );
  return {
    ...actual,
    getAdapter: (g: unknown) => (g === 'AAMARPAY' ? getAdapterMock() : undefined),
  };
});

import { paymentService } from './paymentService';

describe('paymentService.processIpn — idempotency', () => {
  it('returns early when the same order has already been processed', async () => {
    verifyIpn.mockReset();
    verifyIpn.mockResolvedValue({
      gateway: 'AAMARPAY',
      status: 'SUCCESS',
      orderId: 'cred-replay',
      amount: 1000,
      currency: 'BDT',
      raw: {},
    });
    findFirst.mockResolvedValue({ id: 'p1', status: 'SUCCESS', subscriptionId: null });
    const result = await paymentService.processIpn(
      'AAMARPAY',
      { tran_id: 'cred-replay' },
      {},
    );
    expect(result.status).toBe('SUCCESS');
    expect(result.paymentId).toBe('p1');
    expect(update).not.toHaveBeenCalled();
  });
});
