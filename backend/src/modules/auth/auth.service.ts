import { ConflictError, UnauthorizedError, BadRequestError } from '../../lib/errors/AppError';
import { hashPassword, verifyPassword } from '../../lib/utils/password';
import { hashOtp, randomToken, verifyOtp as verifyOtpHash } from '@credible/shared/utils/crypto';
import { issueTokenPair, signRefreshToken, verifyRefreshToken } from '../../lib/utils/jwt';
import { prisma } from '../../lib/db/prisma';
import { env } from '../../config/env';
import { queues } from '../../lib/queue/queues';
import { authRepository } from './auth.repository';
import type { RegisterInput, LoginInput } from '@credible/shared';
import type { AuthSession } from '@credible/types';

export const authService = {
  async register(input: RegisterInput): Promise<AuthSession> {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists', 'EMAIL_TAKEN');
    }

    const passwordHash = await hashPassword(input.password);

    // The shared schema constrains `role` to CUSTOMER | BUSINESS | PROFESSIONAL,
    // so this assignment is type-safe. (Admins must be provisioned via seed.)
    const role = input.role ?? 'CUSTOMER';

    const user = await authRepository.createUser({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role,
    });

    // Issue a fresh email-verification code so the new owner can confirm
    // ownership of the address in one tap from the modal. Failures are
    // non-fatal — the user can request a new code from the dashboard
    // banner if the email bounces.
    const { code: verifyCode } = await this.requestOtp(input.email, undefined, 'email_verify');
    await queues['send-email']
      .add('email-verification', {
        template: 'emailVerificationOtp',
        to: input.email,
        vars: {
          firstName: user.firstName,
          code: verifyCode,
          expiresInMinutes: Math.round(env.OTP_EXPIRES_IN_SECONDS / 60),
        },
      })
      .catch(() => undefined);

    const tokens = issueTokenPair({ id: user.id, email: user.email, role: user.role });

    // Persist refresh token (optional table; left out of minimal backbone but hooked)
    const { expiresAt } = signRefreshToken(user.id);
    // Guard against the RefreshToken model being absent from the Prisma schema:
    // accessing `.create` on `undefined` would throw synchronously and bypass
    // the Promise .catch(), so we check the model exists first.
    const refreshTokenModel = (prisma as unknown as { refreshToken?: unknown }).refreshToken;
    if (refreshTokenModel && typeof (refreshTokenModel as { create?: unknown }).create === 'function') {
      await (refreshTokenModel as { create: (args: unknown) => Promise<unknown> })
        .create({
          data: {
            id: randomToken(16),
            userId: user.id,
            expiresAt,
            revokedAt: null,
          },
        })
        .catch(() => {
          // table may not exist yet; not critical for MVP
        });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        emailVerified: false,
      },
      tokens,
    };
  },

  async login(input: LoginInput): Promise<AuthSession> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid credentials');
    }
    if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
      throw new UnauthorizedError('Account is not active');
    }
    const ok = await verifyPassword(user.passwordHash, input.password);
    if (!ok) throw new UnauthorizedError('Invalid credentials');

    await authRepository.updateUser(user.id, { lastLoginAt: new Date() });

    const tokens = issueTokenPair({ id: user.id, email: user.email, role: user.role });
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        avatar: user.avatar ?? undefined,
        emailVerified: user.emailVerifiedAt !== null,
      },
      tokens,
    };
  },

  async refresh(refreshToken: string) {
    const { userId } = verifyRefreshToken(refreshToken);
    const user = await authRepository.findUserById(userId);
    if (!user || user.status === 'DELETED' || user.status === 'SUSPENDED') {
      throw new UnauthorizedError('User no longer active');
    }
    const tokens = issueTokenPair({ id: user.id, email: user.email, role: user.role });
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        emailVerified: user.emailVerifiedAt !== null,
      },
      tokens,
    };
  },

  async requestOtp(email: string | undefined, phone: string | undefined, purpose: string) {
    if (!email && !phone) throw new BadRequestError('Email or phone is required');

    const code = String(
      Math.floor(Math.random() * (10 ** env.OTP_LENGTH - 1)) + 10 ** (env.OTP_LENGTH - 1),
    );
    const codeHash = hashOtp(code);

    await authRepository.createOtp({
      email,
      phone,
      codeHash,
      purpose,
      expiresAt: new Date(Date.now() + env.OTP_EXPIRES_IN_SECONDS * 1000),
    });

    // In production the code is sent via email/SMS and never returned.
    // We still surface it for internal callers (e.g. the register
    // flow passes it straight into the email template) and for the
    // development-only `devCode` echo used by `/auth/otp/request`
    // integration tests.
    return {
      sent: true,
      code,
      devCode: process.env.NODE_ENV === 'development' ? code : undefined,
    };
  },

  async verifyOtp(
    email: string | undefined,
    phone: string | undefined,
    code: string,
    purpose: string,
  ): Promise<{ verified: boolean; userId?: string }> {
    const otp = await authRepository.findActiveOtp(email, phone, purpose);
    if (!otp) throw new BadRequestError('Invalid or expired code', 'OTP_INVALID');
    if (otp.attempts >= 5) throw new BadRequestError('Too many attempts', 'OTP_LOCKED');

    const ok = verifyOtpHash(code, otp.codeHash);
    if (!ok) {
      await authRepository.incrementOtpAttempts(otp.id);
      throw new BadRequestError('Incorrect code', 'OTP_INVALID');
    }
    await authRepository.consumeOtp(otp.id);

    let userId: string | undefined;
    if (email && purpose === 'email_verify') {
      const user = await authRepository.findUserByEmail(email);
      if (user) {
        await authRepository.updateUser(user.id, { emailVerifiedAt: new Date() });
        userId = user.id;
      }
    }
    if (phone && purpose === 'phone_verify') {
      const user = await authRepository.findUserByPhone(phone);
      if (user) {
        await authRepository.updateUser(user.id, { phoneVerifiedAt: new Date() });
        userId = user.id;
      }
    }

    return { verified: true, userId };
  },
};