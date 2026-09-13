/**
 * Admin gateway service.
 *
 * Every `POST /admin/login` path — wrong account, wrong password, suspended
 * admin, bad 2FA code — resolves to the SAME generic "Invalid credentials"
 * error. No code path ever reveals whether a login id exists.
 */
import { BadRequestError, UnauthorizedError } from '../../lib/errors/AppError';
import { hashOtp, verifyOtp as verifyOtpHash } from '@credible/shared/utils/crypto';
import { verifyPassword } from '../../lib/utils/password';
import { signAdminToken } from '../../lib/utils/jwt';
import { prisma } from '../../lib/db/prisma';
import { env } from '../../config/env';
import { audit } from '../../lib/audit/log';
import { queues } from '../../lib/queue/queues';
import type { AdminLoginInput } from '@credible/shared';

const OTP_PURPOSE = 'admin_2fa';
const OTP_MAX_ATTEMPTS = 5;

interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

export interface AdminLoginResult {
  twoFactorRequired: boolean;
  user?: { id: string; email: string; firstName?: string | null; lastName?: string | null };
  token?: string;
  expiresIn?: number;
}

export const adminAuthService = {
  /**
   * Resolves a loginId to an ADMIN user, or null when the account does not
   * exist / isn't an admin. Both branches are deliberately coalesced by the
   * caller so timing and error text stay uniform.
   */
  async findAdmin(loginId: string) {
    const isEmail = loginId.includes('@');
    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: loginId.toLowerCase() } })
      : await prisma.user.findUnique({ where: { phone: loginId } });

    if (!user || user.role !== 'ADMIN' || !user.passwordHash) return null;
    return user;
  },

  async isTwoFactorEnabled(): Promise<boolean> {
    const setting = await prisma.setting.findUnique({ where: { key: 'admin.2fa.enabled' } });
    const raw = setting?.valueJson;
    return typeof raw === 'boolean' ? raw : false;
  },

  /**
   * Validates a one-time code for an admin (purpose `admin_2fa`). Returns
   * false on any failure (missing / expired / attempted / wrong code). Never
   * leaks whether a code was ever issued.
   */
  async verifyTwoFactor(email: string, code: string): Promise<boolean> {
    const otp = await prisma.otpToken.findFirst({
      where: {
        email,
        purpose: OTP_PURPOSE,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) return false;
    if (otp.attempts >= OTP_MAX_ATTEMPTS) return false;
    if (!verifyOtpHash(code, otp.codeHash)) {
      await prisma.otpToken
        .update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } })
        .catch(() => undefined);
      return false;
    }
    await prisma.otpToken.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
    return true;
  },

  async login(input: AdminLoginInput, meta: RequestMeta): Promise<AdminLoginResult> {
    const user = await this.findAdmin(input.loginId);

    // Fail the password check even when the admin does not exist so the
    // response shape and timing do not fingerprint valid accounts.
    const passwordOk = user ? await verifyPassword(user.passwordHash!, input.password) : false;

    if (!user || !passwordOk) {
      await audit({
        actorId: user?.id ?? null,
        action: 'admin.login.failed',
        target: 'ADMIN_LOGIN',
        meta: { loginId: input.loginId, reason: 'credentials' },
        ip: meta.ip,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
      await audit({
        actorId: user.id,
        action: 'admin.login.failed',
        target: 'ADMIN_LOGIN',
        meta: { loginId: input.loginId, reason: 'account_inactive' },
        ip: meta.ip,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    const twoFactorEnabled = await this.isTwoFactorEnabled();
    if (twoFactorEnabled) {
      if (!input.otp) {
        await audit({
          actorId: user.id,
          action: 'admin.login.challenge',
          target: 'ADMIN_LOGIN',
          meta: { loginId: input.loginId },
          ip: meta.ip,
          userAgent: meta.userAgent,
        });
        return { twoFactorRequired: true };
      }
      const otpOk = await this.verifyTwoFactor(user.email, input.otp);
      if (!otpOk) {
        await audit({
          actorId: user.id,
          action: 'admin.login.failed',
          target: 'ADMIN_LOGIN',
          meta: { loginId: input.loginId, reason: 'otp' },
          ip: meta.ip,
          userAgent: meta.userAgent,
        });
        throw new UnauthorizedError('Invalid credentials');
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { token, expiresIn } = signAdminToken({ id: user.id, email: user.email });

    await audit({
      actorId: user.id,
      action: 'admin.login.success',
      target: 'ADMIN_LOGIN',
      meta: { loginId: input.loginId, twoFactor: twoFactorEnabled },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return {
      twoFactorRequired: false,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
      expiresIn,
    };
  },

  /**
   * Emails a one-time sign-in code to a valid admin. Invalid credentials are
   * answered silently (no email is sent) so the gateway never confirms that an
   * account exists.
   */
  async requestTwoFactorCode(input: { loginId: string; password: string }, meta: RequestMeta) {
    const user = await this.findAdmin(input.loginId);
    const passwordOk = user ? await verifyPassword(user.passwordHash!, input.password) : false;
    if (!user || !passwordOk) {
      await audit({
        actorId: user?.id ?? null,
        action: 'admin.login.otp.request',
        target: 'ADMIN_LOGIN',
        meta: { loginId: input.loginId, reason: 'credentials' },
        ip: meta.ip,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    const code = String(
      Math.floor(Math.random() * (10 ** env.OTP_LENGTH - 1)) + 10 ** (env.OTP_LENGTH - 1),
    );
    const expiresMinutes = Math.round(env.OTP_EXPIRES_IN_SECONDS / 60) || 10;

    await prisma.otpToken.create({
      data: {
        email: user.email,
        codeHash: hashOtp(code),
        purpose: OTP_PURPOSE,
        expiresAt: new Date(Date.now() + env.OTP_EXPIRES_IN_SECONDS * 1000),
      },
    });

    await audit({
      actorId: user.id,
      action: 'admin.login.otp.request',
      target: 'ADMIN_LOGIN',
      meta: { loginId: input.loginId, sent: true },
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    await queues['send-email']
      .add('admin-2fa', {
        template: 'adminTwoFactorOtp',
        to: user.email,
        vars: { firstName: user.firstName, code, expiresInMinutes: expiresMinutes },
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[admin-auth] failed to queue 2FA email', err);
      });

    return { sent: true, devCode: process.env.NODE_ENV === 'development' ? code : undefined };
  },

  async logout(actorId: string | null, meta: RequestMeta) {
    await audit({
      actorId,
      action: 'admin.logout',
      target: 'ADMIN_LOGOUT',
      meta: null,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return;
  },
};