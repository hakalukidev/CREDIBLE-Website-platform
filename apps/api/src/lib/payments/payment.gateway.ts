/**
 * Payment gateway abstraction.
 * Adapters for SSLCommerz and aamarPay live in their own modules and register
 * themselves via `registerAdapter` during server startup.
 */

import type { PaymentGateway } from '@credible/types';

export interface CreateSessionInput {
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
}

export interface SessionResult {
  gateway: PaymentGateway;
  redirectUrl: string;
  sessionKey: string;
}

export interface IpnPayload {
  gateway: PaymentGateway;
  status: 'SUCCESS' | 'FAILED' | 'CANCEL';
  orderId: string;
  gatewayTxnId?: string;
  amount: number;
  currency: string;
  raw: Record<string, unknown>;
}

export interface PaymentGatewayAdapter {
  createSession(input: CreateSessionInput): Promise<SessionResult>;
  /**
   * Verifies an IPN payload against the gateway. The adapter is responsible
   * for signature / server-to-server validation before returning a normalised
   * payload to the caller. If verification fails, the adapter must throw.
   */
  verifyIpn(body: Record<string, unknown>, headers: Record<string, string>): Promise<IpnPayload>;
}

const adapters: Partial<Record<PaymentGateway, PaymentGatewayAdapter>> = {};

export function registerAdapter(gateway: PaymentGateway, adapter: PaymentGatewayAdapter): void {
  adapters[gateway] = adapter;
}

export function getAdapter(gateway: PaymentGateway): PaymentGatewayAdapter | undefined {
  return adapters[gateway];
}

export function listRegisteredGateways(): PaymentGateway[] {
  return Object.keys(adapters) as PaymentGateway[];
}