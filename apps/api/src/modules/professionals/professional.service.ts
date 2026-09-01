import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors/AppError';
import { slugify, withRandomSuffix } from '@credible/shared';
import type {
  CreateProfessionalInput,
  SearchProfessionalsInput,
  UpdateProfessionalInput,
} from '@credible/shared';
import { professionalRepository } from './professional.repository';

export const professionalService = {
  async create(ownerId: string, input: CreateProfessionalInput) {
    const existing = await professionalRepository.findByOwner(ownerId);
    if (existing) {
      throw new ConflictError('You already have a professional profile', 'PROFESSIONAL_EXISTS');
    }
    const baseSlug: string = slugify(input.displayName);
    let slug: string = baseSlug || `professional-${Date.now()}`;
    if (await professionalRepository.findBySlug(slug)) slug = withRandomSuffix(slug);

    return professionalRepository.create({
      owner: { connect: { id: ownerId } },
      slug,
      title: input.title ?? '',
      displayName: input.displayName,
      headline: input.headline,
      bio: input.bio,
      profession: input.profession,
      specialties: input.specialties ?? [],
      yearsOfExperience: input.yearsOfExperience,
      languages: input.languages ?? [],
      avatar: input.avatar,
      coverImage: input.coverImage,
      email: input.email,
      phone: input.phone,
      website: input.website,
      city: input.city,
      state: input.state,
      country: input.country ?? 'BD',
      category: input.categoryId ? { connect: { id: input.categoryId } } : undefined,
      status: 'DRAFT',
    });
  },

  async update(ownerId: string, professionalId: string, input: UpdateProfessionalInput) {
    const professional = await professionalRepository.findById(professionalId);
    if (!professional) throw new NotFoundError('Professional');
    if (professional.ownerId !== ownerId) throw new ForbiddenError('You do not own this professional profile');

    let slug: string = professional.slug;
    if (
      input.displayName &&
      input.displayName !== professional.displayName &&
      professional.status === 'PUBLISHED'
    ) {
      const next = slugify(input.displayName);
      if (next) {
        slug = (await professionalRepository.findBySlug(next)) ? withRandomSuffix(next) : next;
      }
    }

    return professionalRepository.update(professionalId, { ...input, slug });
  },

  async publish(ownerId: string, professionalId: string) {
    const professional = await professionalRepository.findById(professionalId);
    if (!professional) throw new NotFoundError('Professional');
    if (professional.ownerId !== ownerId) throw new ForbiddenError();
    return professionalRepository.update(professionalId, {
      status: 'PENDING',
      publishedAt: new Date(),
    });
  },

  async getBySlug(slug: string) {
    const professional = await professionalRepository.findBySlug(slug);
    if (!professional || professional.deletedAt) throw new NotFoundError('Professional');
    return professional;
  },

  async getById(id: string) {
    const professional = await professionalRepository.findById(id);
    if (!professional || professional.deletedAt) return null;
    return professional;
  },

  async getOwned(ownerId: string) {
    const professional = await professionalRepository.findByOwner(ownerId);
    if (!professional) throw new NotFoundError('Professional profile not found');
    return professional;
  },

  async search(params: SearchProfessionalsInput & { skip: number; take: number }) {
    const { items, total } = await professionalRepository.search({
      q: params.q,
      profession: params.profession,
      city: params.city,
      categoryId: params.categoryId,
      verifiedOnly: params.verifiedOnly,
      minRating: params.minRating,
      skip: params.skip,
      take: params.take,
      sortBy: undefined,
      sortOrder: 'desc',
    });
    return { items, total };
  },
};
