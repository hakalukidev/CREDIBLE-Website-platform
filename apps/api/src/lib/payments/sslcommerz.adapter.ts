/**
 * SSLCommerz payment gateway adapter.
 *
 * - createSession:  POSTs to /gwprocess/v4/api.php to obtain a redirect URL.
 * - verifyIpn:      Server-to-server validation against /validator/api/validationserverAPI.php.
 *                   Throws when the transaction cannot be validated (caller should treat
 *                   the throw as an unsigned / untrusted IPN).
 *
 * Sandbox:    https://sandbox.sslcommerz.com
 * Production: https://secure.sslcommerz.com
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

const HOST_SANDBOX = 'https://sandbox.sslcommerz.com';
const HOST_PRODUCTION = 'https://secure.sslcommerz.com';

function baseUrl(): string {
  return env.SSLCZ_SANDBOX ? HOST_SANDBOX : HOST_PRODUCTION;
}

function apiPath(): string {
  return `${baseUrl()}/gwprocess/v4/api.php`;
}

function validationPath(): string {
  return `${baseUrl()}/validator/api/validationserverAPI.php`;
}

interface SslSessionResponse {
  status?: string;
  failedreason?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  redirectGatewayURL?: string;
}

interface SslValidationResponse {
  status: string; // "VALID" | "VALIDATED" | "INVALID_TRANSACTION" | "FAILED"
  tran_id?: string;
  val_id?: string;
  amount?: string;
  currency?: string;
  card_type?: string;
  card_no?: string;
  bank_tran_id?: string;
  [k: string]: unknown;
}

class SSLCommerzAdapter implements PaymentGatewayAdapter {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      timeout: 30_000,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  isConfigured(): boolean {
    return Boolean(env.SSLCZ_STORE_ID && env.SSLCZ_STORE_PASSWORD);
  }

  async createSession(input: CreateSessionInput): Promise<SessionResult> {
    if (!this.isConfigured()) {
      throw new Error('SSLCommerz is not configured. Set SSLCZ_STORE_ID and SSLCZ_STORE_PASSWORD.');
    }

    const productName = String(input.metadata?.productName ?? 'Credible Subscription');
    const productCategory = String(input.metadata?.productCategory ?? 'Subscription');

    const payload: Record<string, string> = {
      store_id: env.SSLCZ_STORE_ID!,
      store_passwd: env.SSLCZ_STORE_PASSWORD!,
      total_amount: input.amount.toFixed(2),
      currency: input.currency,
      tran_id: input.orderId,
      success_url: input.successUrl,
      fail_url: input.failUrl,
      cancel_url: input.cancelUrl,
      ipn_url: env.SSLCZ_IPN_URL ?? input.successUrl,
      cus_name: input.customerName,
      cus_email: input.customerEmail,
      cus_phone: input.customerPhone ?? '',
      cus_add1: '',
      cus_add2: '',
      cus_city: '',
      cus_state: '',
      cus_postcode: '',
      cus_country: 'Bangladesh',
      shipping_method: 'NO',
      product_name: productName,
      product_category: productCategory,
      product_profile: 'general',
      // Pass the subscription id and any other metadata via the optional a..f fields.
      value_a: input.orderId,
      value_b: input.metadata?.subscriptionId ? String(input.metadata.subscriptionId) : '',
      value_c: input.metadata?.businessId ? String(input.metadata.businessId) : '',
    };

    const body = new URLSearchParams(payload).toString();
    const { data } = await this.http.post<SslSessionResponse>(apiPath(), body);

    if (data?.status !== 'SUCCESS' || !data.GatewayPageURL) {
      logger.error({ data, orderId: input.orderId }, 'SSLCommerz session creation failed');
      throw new Error(data?.failedreason ?? 'SSLCommerz session creation failed');
    }

    return {
      gateway: 'SSLCOMMERZ',
      redirectUrl: data.GatewayPageURL,
      sessionKey: data.sessionkey ?? input.orderId,
    };
  }

  async verifyIpn(body: Record<string, unknown>, _headers: Record<string, string>): Promise<IpnPayload> {
    if (!this.isConfigured()) {
      throw new Error('SSLCommerz is not configured.');
    }
    const tran_id = String(body.tran_id ?? '');
    const val_id = String(body.val_id ?? '');
    const status = String(body.status ?? '');

    if (!tran_id || !val_id) {
      throw new Error('SSLCommerz IPN missing tran_id / val_id');
    }

    // Only VALID or VALIDATED should be considered success.
    if (status !== 'VALID' && status !== 'VALIDATED') {
      return {
        gateway: 'SSLCOMMERZ',
        status: 'FAILED',
        orderId: tran_id,
        gatewayTxnId: String(body.bank_tran_id ?? tran_id),
        amount: Number(body.amount ?? 0),
        currency: String(body.currency ?? 'BDT'),
        raw: body,
      };
    }

    // Server-to-server validation against the gateway.
    const params = {
      store_id: env.SSLCZ_STORE_ID!,
      store_passwd: env.SSLCZ_STORE_PASSWORD!,
      tran_id,
      val_id,
    };

    const { data } = await this.http.get<SslValidationResponse>(validationPath(), { params });

    if (!data || (data.status !== 'VALID' && data.status !== 'VALIDATED')) {
      logger.warn({ tran_id, status: data?.status }, 'SSLCommerz validation rejected');
      throw new Error(`SSLCommerz validation failed: ${data?.status ?? 'unknown'}`);
    }

    return {
      gateway: 'SSLCOMMERZ',
      status: 'SUCCESS',
      orderId: tran_id,
      gatewayTxnId: String(data.bank_tran_id ?? tran_id),
      amount: Number(data.amount ?? body.amount ?? 0),
      currency: String(data.currency ?? body.currency ?? 'BDT'),
      raw: { ...body, _validation: data },
    };
  }
}

let registered = false;
export function registerSSLCommerzAdapter(): void {
  if (registered) return;
  registered = true;
  const adapter = new SSLCommerzAdapter();
  registerAdapter('SSLCOMMERZ' as PaymentGateway, adapter);
  logger.info(
    { sandbox: env.SSLCZ_SANDBOX, configured: adapter.isConfigured() },
    'SSLCommerz adapter registered',
  );
}

export { SSLCommerzAdapter };
