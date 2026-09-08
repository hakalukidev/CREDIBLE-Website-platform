import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('../../config/env', () => ({
  env: {
    SSLCZ_STORE_ID: 'test_store',
    SSLCZ_STORE_PASSWORD: 'test_pass',
    SSLCZ_SANDBOX: true,
    LOG_LEVEL: 'silent',
    NODE_ENV: 'test',
  },
  isDev: false,
  isProd: false,
  isTest: true,
}));
vi.mock('../logger/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const axiosPost = vi.fn();
const axiosGet = vi.fn();
vi.mock('axios', () => ({
  default: {
    create: () => ({
      post: axiosPost,
      get: axiosGet,
    }),
  },
}));

import { registerSSLCommerzAdapter } from './sslcommerz.adapter';
import { getAdapter } from './payment.gateway';

beforeAll(() => {
  registerSSLCommerzAdapter();
});

beforeEach(() => {
  axiosPost.mockReset();
  axiosGet.mockReset();
});

describe('SSLCommerz adapter', () => {
  it('registers itself and is retrievable', () => {
    const adapter = getAdapter('SSLCOMMERZ');
    expect(adapter).toBeDefined();
  });

  it('createSession posts expected payload and returns redirect URL', async () => {
    axiosPost.mockResolvedValue({
      data: { status: 'SUCCESS', GatewayPageURL: 'https://example.com/pay' },
    });
    const adapter = getAdapter('SSLCOMMERZ')!;
    const session = await adapter.createSession({
      gateway: 'SSLCOMMERZ',
      amount: 1500,
      currency: 'BDT',
      orderId: 'cred-1',
      customerName: 'Test',
      customerEmail: 'test@example.com',
      customerPhone: '+8801',
      successUrl: 'https://x/success',
      failUrl: 'https://x/fail',
      cancelUrl: 'https://x/cancel',
    });
    expect(session.redirectUrl).toBe('https://example.com/pay');
    expect(axiosPost).toHaveBeenCalledTimes(1);
  });

  it('createSession throws when gateway reports failure', async () => {
    axiosPost.mockResolvedValue({
      data: { status: 'FAILED', failedreason: 'store credentials rejected' },
    });
    const adapter = getAdapter('SSLCOMMERZ')!;
    await expect(
      adapter.createSession({
        gateway: 'SSLCOMMERZ',
        amount: 100,
        currency: 'BDT',
        orderId: 'cred-2',
        customerName: 't',
        customerEmail: 't@example.com',
        successUrl: 'x',
        failUrl: 'x',
        cancelUrl: 'x',
      }),
    ).rejects.toThrow(/rejected|store/i);
  });

  it('verifyIpn maps status=FAILED to FAILED without server validation', async () => {
    const adapter = getAdapter('SSLCOMMERZ')!;
    const result = await adapter.verifyIpn(
      { tran_id: 'cred-3', val_id: 'v1', status: 'FAILED' },
      {},
    );
    expect(result.status).toBe('FAILED');
    expect(result.orderId).toBe('cred-3');
  });

  it('verifyIpn performs server-side validation for VALID transactions', async () => {
    axiosGet.mockResolvedValue({
      data: { status: 'VALID', amount: '1500', currency: 'BDT', bank_tran_id: 'B1' },
    });
    const adapter = getAdapter('SSLCOMMERZ')!;
    const result = await adapter.verifyIpn(
      { tran_id: 'cred-4', val_id: 'v4', status: 'VALID' },
      {},
    );
    expect(result.status).toBe('SUCCESS');
    expect(result.gatewayTxnId).toBe('B1');
    expect(result.amount).toBe(1500);
  });

  it('verifyIpn throws when server validation rejects the transaction', async () => {
    axiosGet.mockResolvedValue({
      data: { status: 'INVALID_TRANSACTION' },
    });
    const adapter = getAdapter('SSLCOMMERZ')!;
    await expect(
      adapter.verifyIpn({ tran_id: 'cred-5', val_id: 'v5', status: 'VALID' }, {}),
    ).rejects.toThrow(/INVALID_TRANSACTION|validation/i);
  });
});
