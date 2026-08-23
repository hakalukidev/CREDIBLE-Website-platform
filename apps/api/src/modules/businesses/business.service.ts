import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors/AppError';
import { slugify, withRandomSuffix } from '@credible/shared';
import type {
  BusinessProfileUpdateInput,
  CreateBusinessInput,
  SearchBusinessesQuery,
  UpdateBusinessInput,
} from '@credible/shared';
import { businessRepository } from './business.repository';

export const businessService = {
  async create(ownerId: string, input: CreateBusinessInput) {
    const existing = await businessRepository.findByOwner(ownerId);
    if (existing) {
      throw new ConflictError('You already have a business profile', 'BUSINESS_EXISTS');
    }
    let slug = slugify(input.displayName);
    if (!slug) slug = `business-${Date.now()}`;
    if (await businessRepository.findBySlug(slug)) slug = withRandomSuffix(slug);

    return businessRepository.create({
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
      ...(categoryIds
        ? {
            category: {
              set: categoryIds.length === 0 ? [] : categoryIds.map((id) => ({ id })),
            },
          }
        : {}),
    });
  },

  async publish(ownerId: string, businessId: string) {
    const business = await businessRepository.findById(businessId);
    if (!business) throw new NotFoundError('Business');
    if (business.ownerId !== ownerId) throw new ForbiddenError();
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
      verifiedOnly: params.verifiedOnly,
      minRating: params.minRating,
      skip: params.skip,
      take: params.take,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder ?? 'desc',
    });
    return { items, total };
  },
};
