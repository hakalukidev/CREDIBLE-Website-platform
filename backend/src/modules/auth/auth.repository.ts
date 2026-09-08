import { prisma } from '../../lib/db/prisma';
import type { Prisma } from '@prisma/client';

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },
  findUserByPhone(phone: string) {
    return prisma.user.findUnique({ where: { phone } });
  },
  createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },
  updateUser(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },
  async upsertOAuthAccount(data: Prisma.OAuthAccountUncheckedCreateInput) {
    return prisma.oAuthAccount.upsert({
      where: { provider_providerUserId: { provider: data.provider, providerUserId: data.providerUserId } },
      create: data,
      update: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
      },
    });
  },
  createOtp(data: Prisma.OtpTokenCreateInput) {
    return prisma.otpToken.create({ data });
  },
  findActiveOtp(email: string | undefined, phone: string | undefined, purpose: string) {
    return prisma.otpToken.findFirst({
      where: {
        email,
        phone,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  consumeOtp(id: string) {
    return prisma.otpToken.update({ where: { id }, data: { consumedAt: new Date() } });
  },
  incrementOtpAttempts(id: string) {
    return prisma.otpToken.update({ where: { id }, data: { attempts: { increment: 1 } } });
  },
};