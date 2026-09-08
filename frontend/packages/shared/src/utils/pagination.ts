import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants/roles';

export interface NormalizedPagination {
  page: number;
  perPage: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

export interface RawPagination {
  page?: number | string;
  perPage?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | string;
}

export function normalizePagination(input: RawPagination = {}): NormalizedPagination {
  const page = Math.max(1, Number(input.page) || 1);
  const perPageRaw = Number(input.perPage) || DEFAULT_PAGE_SIZE;
  const perPage = Math.min(MAX_PAGE_SIZE, Math.max(1, perPageRaw));
  const sortOrder = (input.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
    take: perPage,
    sortBy: input.sortBy,
    sortOrder,
  };
}

export function buildPaginationMeta(total: number, page: number, perPage: number) {
  return {
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}