import { prisma } from '../../lib/db/prisma';
import type { Prisma } from '@prisma/client';

export const verificationRepository = {
  createApplication(data: Prisma.VerificationApplicationCreateInput) {
    return prisma.verificationApplication.create({ data });
  },
  findApplication(id: string) {
    return prisma.verificationApplication.findUnique({
      where: { id },
      include: { documents: true, business: true },
    });
  },
  findLatestForBusiness(businessId: string) {
    return prisma.verificationApplication.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: { documents: true },
    });
  },
  updateApplication(id: string, data: Prisma.VerificationApplicationUpdateInput) {
    return prisma.verificationApplication.update({ where: { id }, data });
  },
  createDocument(data: Prisma.VerificationDocumentCreateInput) {
    return prisma.verificationDocument.create({ data });
  },
  findDocument(id: string) {
    return prisma.verificationDocument.findUnique({ where: { id } });
  },
  updateDocument(id: string, data: Prisma.VerificationDocumentUpdateInput) {
    return prisma.verificationDocument.update({ where: { id }, data });
  },
  listDocumentsForApplication(applicationId: string) {
    return prisma.verificationDocument.findMany({ where: { applicationId } });
  },
  async listPending() {
    return prisma.verificationApplication.findMany({
      where: { status: { in: ['PENDING', 'DOCUMENTS_UPLOADED', 'AUTO_CHECKING', 'HUMAN_REVIEW_REQUIRED'] } },
      orderBy: { createdAt: 'asc' },
      include: { business: true, documents: true },
    });
  },
};
