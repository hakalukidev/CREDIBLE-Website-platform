import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors/AppError';
import { slugify, withRandomSuffix } from '@credible/shared';
import { prisma } from '../../lib/db/prisma';
import type {
  BusinessProfileUpdateInput,
  CreateBusinessInput,
  SearchBusinessesQuery,
  UpdateBusinessInput,
} from '@credible/shared';
import { businessRepository } from './business.repository';

export const businessService = {
  /**
   * Create a new business and atomically upgrade the owner's role from
   * CUSTOMER → BUSINESS if applicable.
   *
   * Why a transaction:
   *   - We never want to leave an orphaned business without a matching
   *     role upgrade, and we never want to upgrade the role without
   *     creating the profile. A transaction guarantees both writes
   *     succeed or neither does.
   *
   * Why we don't rely on the existing requireRole('BUSINESS') middleware:
   *   - CUSTOMERs are now allowed to create their first business page,
   *     and we want them to be promoted to BUSINESS in the same call.
   *     The middleware checks the OLD role; the upgrade happens AFTER
   *     that check inside the transaction.
   */
  async create(ownerId: string, input: CreateBusinessInput) {
    // Outside-tx conflict check — gives a clean error code in the
    // common "user already has a business" path without opening a tx.
    const existing = await businessRepository.findByOwner(ownerId);
    if (existing) {
      throw new ConflictError('You already have a business profile', 'BUSINESS_EXISTS');
    }
    let slug = slugify(input.displayName);
    if (!slug) slug = `business-${Date.now()}`;
    if (await businessRepository.findBySlug(slug)) slug = withRandomSuffix(slug);

    return prisma.$transaction(async (tx) => {
      const business = await businessRepository.create(
        {
          owner: { connect: { id: ownerId } },
          slug,
          legalName: input.legalName,
          displayName: input.displayName,
          description: input.description,
          category: input.categoryId ? { connect: { id: input.categoryId } } : undefined,
          email: input.email,
          phone: input.phone,
          website: input.website,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          country: input.country ?? 'BD',
          yearEstablished: input.yearEstablished,
          employeeCount: input.employeeCount,
          status: 'DRAFT',
        },
        tx,
      );

      // Conditional role upgrade: only fires if the user is still
      // CUSTOMER, so we never accidentally demote an existing BUSINESS
      // or ADMIN. Using updateMany (no read needed) keeps this branch
      // to a single statement inside the transaction.
      await tx.user.updateMany({
        where: { id: ownerId, role: 'CUSTOMER' },
        data: { role: 'BUSINESS' },
      });

      const user = await tx.user.findUnique({
        where: { id: ownerId },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      });

      return { business, user };
    });
  },

  async update(ownerId: string, businessId: string, input: UpdateBusinessInput) {
    const business = await businessRepository.findById(businessId);
    if (!business) throw new NotFoundError('Business');
    if (business.ownerId !== ownerId) throw new ForbiddenError('You do not own this business');

    // If display name changes and published, regenerate slug
    let slug = business.slug;
    if (input.displayName && input.displayName !== business.displayName && business.status === 'PUBLISHED') {
      slug = slugify(input.displayName);
      if (!slug || (await businessRepository.findBySlug(slug))) slug = withRandomSuffix(slug);
    }

    return businessRepository.update(businessId, { ...input, slug });
  },

  /**
   * Phase 2 — richer owner profile update with operating hours, categories
   * (set-replace), and SEO metadata. Schema-mapped: `categoryIds` becomes a
   * `set` operation on the Prisma relation.
   */
  async updateProfile(ownerId: string, businessId: string, input: BusinessProfileUpdateInput) {
    const business = await businessRepository.findById(businessId);
    if (!business) throw new NotFoundError('Business');
    if (business.ownerId !== ownerId) throw new ForbiddenError('You do not own this business');

    let slug = business.slug;
    if (input.displayName && input.displayName !== business.displayName && business.status === 'PUBLISHED') {
      slug = slugify(input.displayName);
      if (!slug || (await businessRepository.findBySlug(slug))) slug = withRandomSuffix(slug);
    }

    const { categoryIds, ...rest } = input;
    return businessRepository.update(businessId, {
      ...rest,
      slug,
      // `Business.category` is a single (to-one) relation in the schema, so
      // only the first submitted id is used as the business's category.
      ...(categoryIds
        ? {
            category:
              categoryIds.length === 0 ? { disconnect: true } : { connect: { id: categoryIds[0] } },
          }
        : {}),
    });
  },

  async publish(ownerId: string, businessId: string) {
    const business = await businessRepository.findById(businessId);
    if (!business) throw new NotFoundError('Business');
    if (business.ownerId !== ownerId) throw new ForbiddenError();
    // Idempotent: once a profile has been submitted for publication
    // (PENDING) or is already live (PUBLISHED), re-publishing would
    // only rewrite `publishedAt` and risk losing the original submit
    // time. Skip the write and return the current row.
    if (business.status === 'PENDING' || business.status === 'PUBLISHED') {
      return business;
    }
    return businessRepository.update(businessId, {
      status: 'PENDING',
      publishedAt: new Date(),
    });
  },

  async getBySlug(slug: string) {
    const business = await businessRepository.findBySlug(slug);
    if (!business || business.deletedAt) throw new NotFoundError('Business');
    return business;
  },

  async getById(id: string) {
    const business = await businessRepository.findById(id);
    if (!business || business.deletedAt) return null;
    return business;
  },

  async getOwned(ownerId: string) {
    const business = await businessRepository.findByOwner(ownerId);
    if (!business) throw new NotFoundError('Business');
    return business;
  },

  async search(params: SearchBusinessesQuery & { skip: number; take: number }) {
    const { items, total } = await businessRepository.search({
      q: params.q,
      category: params.category,
      city: params.city,
      state: params.state,
      verifiedOnly: params.verifiedOnly,
      verificationLevel: params.verificationLevel,
      minRating: params.minRating,
      skip: params.skip,
      take: params.take,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder ?? 'desc',
    });
    return { items, total };
  },
};
