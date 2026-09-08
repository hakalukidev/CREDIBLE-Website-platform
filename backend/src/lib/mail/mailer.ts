import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../logger/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
  });
  return transporter;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(input: SendMailInput): Promise<void> {
  try {
    await getTransporter().sendMail({
      from: env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? input.html.replace(/<[^>]+>/g, ''),
    });
    logger.info({ to: input.to, subject: input.subject }, 'Email sent');
  } catch (err) {
    logger.error({ err, to: input.to }, 'Failed to send email');
    throw err;
  }
}

// Template helpers — kept simple here; add a real template engine later.
export function renderTemplate(name: string, vars: Record<string, unknown>): { subject: string; html: string } {
  const escape = (s: unknown): string =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const baseLink = (path: string): string =>
    `${process.env.WEB_URL ?? 'http://localhost:3000'}${path}`;

  const templates: Record<string, (v: Record<string, unknown>) => { subject: string; html: string }> = {
    welcome: (v) => ({
      subject: 'Welcome to Credible',
      html: `<p>Hi ${escape(v.firstName ?? 'there')},</p><p>Welcome to Credible — the trusted place to find and review businesses.</p>`,
    }),
    verificationApproved: () => ({
      subject: 'Your business has been verified on Credible',
      html: `<p>Congratulations! Your business has been approved for the Credible Verified badge.</p>`,
    }),
    verificationRejected: (v) => ({
      subject: 'Update on your verification application',
      html: `<p>Unfortunately your verification was not approved. Reason: ${escape(v.reason ?? 'Not provided')}.</p>`,
    }),

    // ----- Phase 2 — guest review flow & notifications -----
    reviewOtpRequested: (v) => ({
      subject: `Your Credible verification code for ${escape(v.businessName ?? 'a business')}`,
      html: `
        <p>Hi,</p>
        <p>Use this code to verify your review of <strong>${escape(v.businessName)}</strong> on Credible:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0;">${escape(v.code)}</p>
        <p>It expires in ${escape(v.expiresInMinutes ?? 5)} minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `.trim(),
    }),
    reviewSubmittedThanks: (v) => ({
      subject: 'Thanks for your review on Credible',
      html: `
        <p>Hi ${escape(v.firstName ?? 'there')},</p>
        <p>Thanks for sharing your experience at <strong>${escape(v.businessName)}</strong>. Your review helps others make informed choices.</p>
        <p>You can edit your review within 24 hours from <a href="${escape(v.editLink ?? baseLink('/'))}">your dashboard</a>.</p>
      `.trim(),
    }),
    reviewRespondedByBusiness: (v) => ({
      subject: `${escape(v.businessName ?? 'A business')} responded to your review`,
      html: `
        <p>The team at <strong>${escape(v.businessName)}</strong> responded to your review on Credible:</p>
        <blockquote style="border-left:3px solid #1A56DB;padding:8px 12px;margin:12px 0;color:#374151;">${escape(v.responseContent)}</blockquote>
        <p><a href="${escape(v.reviewLink ?? baseLink('/'))}">View the conversation</a></p>
      `.trim(),
    }),
    reviewInvitationRequested: (v) => ({
      subject: `${escape(v.inviterName ?? v.businessName ?? 'A business')} invited you to leave a review on Credible`,
      html: `
        <p>Hi ${escape(v.customerName ?? 'there')},</p>
        ${v.message ? `<p>${escape(v.message)}</p>` : ''}
        <p><strong>${escape(v.businessName)}</strong> would love to hear about your experience.</p>
        <p><a href="${escape(v.reviewLink)}" style="display:inline-block;background:#1A56DB;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Leave a review</a></p>
      `.trim(),
    }),

    // ----- Phase 3 — verification lifecycle emails -----
    verificationSubmittedConfirmation: (v) => ({
      subject: `Verification application submitted — ${escape(v.businessName ?? 'your business')}`,
      html: `
        <p>Hi ${escape(v.firstName ?? 'there')},</p>
        <p>We received the verification application for <strong>${escape(v.businessName)}</strong> (id <code>${escape(v.applicationId)}</code>).</p>
        <p>Our automated checks will start shortly, then a human reviewer will look over the case. We'll email you the moment we have an update.</p>
        <p>Track progress: <a href="${escape(v.dashboardLink ?? baseLink('/business/verification'))}">your dashboard</a>.</p>
      `.trim(),
    }),
    verificationStatusUpdate: (v) => ({
      subject: `Your verification application is now ${escape(String(v.status ?? '')).toLowerCase()}`,
      html: `
        <p>Hi ${escape(v.firstName ?? 'there')},</p>
        <p>Your verification application for <strong>${escape(v.businessName)}</strong> is now <strong>${escape(String(v.status))}</strong>.</p>
        <p><a href="${escape(v.dashboardLink ?? baseLink('/business/verification'))}">View details</a></p>
      `.trim(),
    }),
    verificationApprovedWithBadge: (v) => ({
      subject: `Congratulations — ${escape(v.businessName ?? 'your business')} is now verified on Credible`,
      html: `
        <p>Hi ${escape(v.firstName ?? 'there')},</p>
        <p>Great news — <strong>${escape(v.businessName)}</strong> has been approved for the <strong>${escape(String(v.level ?? 'BASIC'))}</strong> Credible Verified badge.</p>
        <p>Your badge now shows on your public profile. You can also embed it on your website from the badge management page.</p>
        <p><a href="${escape(v.dashboardLink ?? baseLink('/business/verification/badge'))}">Manage your badge</a></p>
      `.trim(),
    }),
    verificationRejectedWithReason: (v) => ({
      subject: `Update on your verification application — ${escape(v.businessName ?? '')}`,
      html: `
        <p>Hi ${escape(v.firstName ?? 'there')},</p>
        <p>Unfortunately your verification application for <strong>${escape(v.businessName)}</strong> was not approved.</p>
        <p><strong>Reason:</strong> ${escape(v.reason ?? 'Not provided')}</p>
        <p>You can submit an appeal with additional documentation from your dashboard.</p>
        <p><a href="${escape(v.dashboardLink ?? baseLink('/business/verification'))}">Submit an appeal</a></p>
      `.trim(),
    }),
    adminNewApplication: (v) => ({
      subject: `New verification application — ${escape(v.businessName ?? '')}`,
      html: `
        <p>A new verification application has been submitted by <strong>${escape(v.businessName)}</strong>.</p>
        <p>Application: <code>${escape(v.applicationId)}</code></p>
        <p>Documents: ${escape(String(v.documentCount ?? 0))}</p>
        <p><a href="${escape(v.adminReviewUrl ?? baseLink('/admin/verification'))}">Open admin queue</a></p>
      `.trim(),
    }),

    // ----- Phase 4 — subscription / payment emails -----
    paymentConfirmation: (v) => ({
      subject: `Payment confirmation — ${escape(String(v.businessName ?? 'your business'))}`,
      html: `
        <p>Hi ${escape(v.firstName ?? 'there')},</p>
        <p>Thank you for subscribing to Credible. Your payment has been confirmed.</p>
        <ul>
          <li><strong>Plan:</strong> ${escape(String(v.plan ?? ''))}</li>
          <li><strong>Billing cycle:</strong> ${escape(String(v.billingCycle ?? ''))}</li>
          <li><strong>Amount:</strong> ${escape(String(v.amount ?? '0'))} ${escape(String(v.currency ?? 'BDT'))}</li>
          <li><strong>Valid until:</strong> ${escape(String(v.endDate ?? ''))}</li>
        </ul>
        <p>Invoice: <code>${escape(String(v.invoiceNumber ?? 'pending'))}</code></p>
        <p><a href="${escape(String(v.dashboardUrl ?? baseLink('/business/subscription')))}">Manage subscription</a></p>
      `.trim(),
    }),
    paymentFailed: (v) => ({
      subject: `Payment failed — please update your payment method`,
      html: `
        <p>Hi ${escape(v.firstName ?? 'there')},</p>
        <p>We were unable to process your recent payment for <strong>${escape(String(v.businessName ?? 'your business'))}</strong>.</p>
        <ul>
          <li><strong>Amount:</strong> ${escape(String(v.amount ?? '0'))} ${escape(String(v.currency ?? 'BDT'))}</li>
        </ul>
        <p>Please update your payment method from your subscription dashboard to keep premium features active.</p>
        <p><a href="${escape(String(v.updateUrl ?? baseLink('/business/subscription')))}">Update payment</a></p>
      `.trim(),
    }),
    subscriptionCancelled: (v) => ({
      subject: `Your Credible subscription was cancelled`,
      html: `
        <p>Hi ${escape(v.firstName ?? 'there')},</p>
        <p>Your <strong>${escape(String(v.plan ?? ''))}</strong> plan for <strong>${escape(String(v.businessName ?? 'your business'))}</strong> has been cancelled.</p>
        ${v.reason ? `<p><strong>Reason:</strong> ${escape(String(v.reason))}</p>` : ''}
        <p>You can reactivate any time before your access expires.</p>
        <p><a href="${escape(String(v.reactivateUrl ?? baseLink('/business/subscription')))}">Reactivate</a></p>
      `.trim(),
    }),
    subscriptionExpiringSoon: (v) => ({
      subject:
        v.type === 'USAGE_WARNING'
          ? `You're approaching your plan limit on Credible`
          : `Your Credible subscription expires soon`,
      html:
        v.type === 'USAGE_WARNING'
          ? `
        <p>Hi ${escape(v.firstName ?? 'there')},</p>
        <p>Your <strong>${escape(String(v.businessName ?? 'your business'))}</strong> has used <strong>${escape(String(v.used ?? 0))}/${escape(String(v.limit ?? 0))}</strong> ${escape(String(v.metric ?? ''))} this month.</p>
        <p>Consider upgrading to keep your premium features active.</p>
        <p><a href="${escape(String(v.upgradeUrl ?? baseLink('/business/subscription/plans')))}">View plans</a></p>
      `.trim()
          : `
        <p>Hi ${escape(v.firstName ?? 'there')},</p>
        <p>Your Credible subscription will expire in <strong>${escape(String(v.days ?? 'a few'))} days</strong>.</p>
        <p>Renew now to avoid any interruption to your premium features.</p>
        <p><a href="${escape(String(v.renewalUrl ?? baseLink('/business/subscription')))}">Renew subscription</a></p>
      `.trim(),
    }),
    invoiceIssued: (v) => ({
      subject: `Invoice ${escape(String(v.invoiceNumber ?? ''))} — Credible`,
      html: `
        <p>Hi ${escape(v.firstName ?? 'there')},</p>
        <p>An invoice for your Credible subscription is ready.</p>
        <ul>
          <li><strong>Invoice:</strong> ${escape(String(v.invoiceNumber ?? ''))}</li>
          <li><strong>Amount:</strong> ${escape(String(v.amount ?? '0'))} ${escape(String(v.currency ?? 'BDT'))}</li>
        </ul>
        <p><a href="${escape(String(v.invoiceUrl ?? baseLink('/business/subscription/invoices')))}">View invoice</a></p>
      `.trim(),
    }),
    voucherRedeemed: (v) => ({
      subject: `Voucher ${escape(String(v.code ?? ''))} redeemed`,
      html: `
        <p>Hi ${escape(v.firstName ?? 'there')},</p>
        <p>Voucher <code>${escape(String(v.code ?? ''))}</code> was applied to your subscription. You saved <strong>${escape(String(v.discount ?? '0'))} ${escape(String(v.currency ?? 'BDT'))}</strong>.</p>
      `.trim(),
    }),
  };
  const t = templates[name];
  if (!t) throw new Error(`Email template "${name}" not found`);
  return t(vars);
}