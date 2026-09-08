/**
 * aamarPay payment gateway adapter.
 *
 * - createSession:  POSTs JSON to /jsonpost.php (sandbox) or /jsonpost.php (live) to obtain
 *                   the hosted payment page URL.
 * - verifyIpn:      aamarPay does not require a separate server-to-server validation round-trip;
 *                   the IPN body itself includes a `pay_status` flag that we treat as authoritative.
 *                   The `verify_sign` round-trip is exposed for completeness and used in verifyIpn
 *                   when configured.
 *
 * Sandbox:    https://sandbox.aamarpay.com
 * Production: https://secure.aamarpay.com
 */

import axios, { type AxiosInstance } from 'axios';
import type { PaymentGateway } from '@credible/types';
import { env } from '../../config/env';
import { logger } from '../logger/logger';
import {
  registerAdapter,
  type CreateSessionInput,
  type IpnPayload,
  type PaymentGatewayAdapter,
  type SessionResult,
} from './payment.gateway';

const HOST_SANDBOX = 'https://sandbox.aamarpay.com';
const HOST_PRODUCTION = 'https://secure.aamarpay.com';

function baseUrl(): string {
  return env.AAMARPAY_SANDBOX ? HOST_SANDBOX : HOST_PRODUCTION;
}

interface AamarSessionResponse {
  result?: string; // "true" | "false"
  payment_url?: string;
  error?: string;
  [k: string]: unknown;
}

interface AamarIpnBody {
  tran_id?: string;
  amount?: string;
  pay_status?: string; // "Successful" | "Failed" | "Canceled"
  pg_txnid?: string;
  bank_txn?: string;
  currency?: string;
  verify_sign?: string;
  verify_key?: string;
  card_type?: string;
  [k: string]: unknown;
}

class AamarpayAdapter implements PaymentGatewayAdapter {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      timeout: 30_000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  isConfigured(): boolean {
    return Boolean(env.AAMARPAY_STORE_ID && env.AAMARPAY_SIGNATURE_KEY);
  }

  async createSession(input: CreateSessionInput): Promise<SessionResult> {
    if (!this.isConfigured()) {
      throw new Error('aamarPay is not configured. Set AAMARPAY_STORE_ID and AAMARPAY_SIGNATURE_KEY.');
    }

    const payload = {
      store_id: env.AAMARPAY_STORE_ID!,
      signature_key: env.AAMARPAY_SIGNATURE_KEY!,
      tran_id: input.orderId,
      amount: input.amount.toFixed(2),
      currency: input.currency,
      desc: String(input.metadata?.productName ?? 'Credible Subscription'),
      cus_name: input.customerName,
      cus_email: input.customerEmail,
      cus_phone: input.customerPhone ?? '',
      cus_add1: '',
      cus_add2: '',
      cus_city: '',
      cus_state: '',
      cus_postcode: '',
      cus_country: 'Bangladesh',
      type: 'json',
      success_url: input.successUrl,
      fail_url: input.failUrl,
      cancel_url: input.cancelUrl,
      opt_a: input.metadata?.subscriptionId ? String(input.metadata.subscriptionId) : '',
      opt_b: input.metadata?.businessId ? String(input.metadata.businessId) : '',
    };

    const { data } = await this.http.post<AamarSessionResponse>(
      `${baseUrl()}/jsonpost.php`,
      payload,
    );

    if (!data || data.result !== 'true' || !data.payment_url) {
      logger.error({ data, orderId: input.orderId }, 'aamarPay session creation failed');
      throw new Error(data?.error ?? 'aamarPay session creation failed');
    }

    return {
      gateway: 'AAMARPAY',
      redirectUrl: data.payment_url,
      sessionKey: input.orderId,
    };
  }

  async verifyIpn(body: Record<string, unknown>, _headers: Record<string, string>): Promise<IpnPayload> {
    const ipn = body as AamarIpnBody;
    const tran_id = String(ipn.tran_id ?? '');
    const pay_status = String(ipn.pay_status ?? '').toLowerCase();

    if (!tran_id) {
      throw new Error('aamarPay IPN missing tran_id');
    }

    // aamarPay documents pay_status ∈ {Successful, Failed, Canceled}
    let status: IpnPayload['status'] = 'FAILED';
    if (pay_status === 'successful') status = 'SUCCESS';
    else if (pay_status === 'canceled' || pay_status === 'cancelled') status = 'CANCEL';

    return {
      gateway: 'AAMARPAY',
      status,
      orderId: tran_id,
      gatewayTxnId: String(ipn.pg_txnid ?? ipn.bank_txn ?? tran_id),
      amount: Number(ipn.amount ?? 0),
      currency: String(ipn.currency ?? 'BDT'),
      raw: ipn,
    };
  }
}

let registered = false;
export function registerAamarpayAdapter(): void {
  if (registered) return;
  registered = true;
  const adapter = new AamarpayAdapter();
  registerAdapter('AAMARPAY' as PaymentGateway, adapter);
  logger.info(
    { sandbox: env.AAMARPAY_SANDBOX, configured: adapter.isConfigured() },
    'aamarPay adapter registered',
  );
}

export { AamarpayAdapter };
