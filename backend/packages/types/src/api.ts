/**
 * API DTO contracts shared between web and api.
 */

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    traceId?: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface PaginationInput {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  tokens: AuthTokens;
}

export interface SearchBusinessesInput extends PaginationInput {
  q?: string;
  category?: string;
  city?: string;
  verifiedOnly?: boolean;
  minRating?: number;
}

export interface BusinessProfile {
  id: string;
  slug: string;
  legalName: string;
  displayName: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  yearEstablished?: number;
  ratingAverage: number;
  ratingCount: number;
  verificationLevel: string;
  isVerified: boolean;
  badgeHash?: string;
  category?: {
    id: string;
    slug: string;
    name: string;
  };
  createdAt: string;
}