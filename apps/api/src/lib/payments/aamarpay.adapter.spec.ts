import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('../../config/env', () => ({
  env: {
    AAMARPAY_STORE_ID: 'aamar_store',
    AAMARPAY_SIGNATURE_KEY: 'sig',
    AAMARPAY_SANDBOX: true,
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
vi.mock('axios', () => ({
  default: {
    create: () => ({
      post: axiosPost,
      get: vi.fn(),
    }),
  },
}));

import { registerAamarpayAdapter } from './aamarpay.adapter';
import { getAdapter } from './payment.gateway';

beforeAll(() => {
  registerAamarpayAdapter();
});

beforeEach(() => {
  axiosPost.mockReset();
});

describe('aamarPay adapter', () => {
  it('registers itself and is retrievable', () => {
    const adapter = getAdapter('AAMARPAY');
    expect(adapter).toBeDefined();
  });

  it('createSession posts JSON payload and returns the payment URL', async () => {
    axiosPost.mockResolvedValue({
      data: { result: 'true', payment_url: 'https://example.com/pay' },
    });
    const adapter = getAdapter('AAMARPAY')!;
    const session = await adapter.createSession({
      gateway: 'AAMARPAY',
      amount: 1000,
      currency: 'BDT',
      orderId: 'cred-1',
      customerName: 'Test',
      customerEmail: 'test@example.com',
      customerPhone: '+8801',
      successUrl: 'x',
      failUrl: 'x',
      cancelUrl: 'x',
    });
    expect(session.redirectUrl).toBe('https://example.com/pay');
    expect(axiosPost).toHaveBeenCalledTimes(1);
  });

  it('createSession throws when gateway rejects', async () => {
    axiosPost.mockResolvedValue({
      data: { result: 'false', error: 'Bad signature' },
    });
    const adapter = getAdapter('AAMARPAY')!;
    await expect(
      adapter.createSession({
        gateway: 'AAMARPAY',
        amount: 100,
        currency: 'BDT',
        orderId: 'c',
        customerName: 't',
        customerEmail: 't@example.com',
        successUrl: 'x',
        failUrl: 'x',
        cancelUrl: 'x',
      }),
    ).rejects.toThrow(/signature/i);
  });

  it('verifyIpn maps pay_status=Successful to SUCCESS', async () => {
    const adapter = getAdapter('AAMARPAY')!;
    const result = await adapter.verifyIpn(
      { tran_id: 'cred-3', pay_status: 'Successful', amount: '1000', pg_txnid: 'P1' },
      {},
    );
    expect(result.status).toBe('SUCCESS');
    expect(result.gatewayTxnId).toBe('P1');
    expect(result.amount).toBe(1000);
  });

  it('verifyIpn maps pay_status=Failed to FAILED', async () => {
    const adapter = getAdapter('AAMARPAY')!;
    const result = await adapter.verifyIpn(
      { tran_id: 'cred-4', pay_status: 'Failed' },
      {},
    );
    expect(result.status).toBe('FAILED');
  });

  it('verifyIpn maps pay_status=Canceled to CANCEL', async () => {
    const adapter = getAdapter('AAMARPAY')!;
    const result = await adapter.verifyIpn(
      { tran_id: 'cred-5', pay_status: 'Canceled' },
      {},
    );
    expect(result.status).toBe('CANCEL');
  });

  it('verifyIpn throws when tran_id missing', async () => {
    const adapter = getAdapter('AAMARPAY')!;
    await expect(adapter.verifyIpn({}, {})).rejects.toThrow(/tran_id/i);
  });
});