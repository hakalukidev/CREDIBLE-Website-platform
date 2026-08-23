/**
 * Centralised query-key factories. Use these instead of inline string literals
 * so that `invalidateQueries` calls stay type-safe and consistent across the
 * application.
 *
 * Convention:
 *   qk.<area>.<resource>(id, …filters)
 */
export const qk = {
  reviews: {
    list: (businessId: string, page: number, perPage = 10) =>
      ['reviews', 'list', businessId, page, perPage] as const,
    owner: (page: number, perPage: number, filters?: Record<string, unknown>) =>
      ['reviews', 'owner', page, perPage, filters ?? {}] as const,
    ownerOne: (reviewId: string) => ['reviews', 'owner', 'one', reviewId] as const,
    status: (businessId: string, identifier: string) =>
      ['reviews', 'status', businessId, identifier] as const,
  },
  businesses: {
    me: () => ['businesses', 'me'] as const,
    profile: (slug: string) => ['businesses', 'profile', slug] as const,
    search: (params: Record<string, unknown>) => ['business-search', params] as const,
    qrCode: () => ['businesses', 'me', 'qr'] as const,
  },
  categories: {
    list: () => ['categories', 'list'] as const,
  },
  verification: {
    eligibility: (businessId: string) => ['verification', 'eligibility', businessId] as const,
    status: (businessId: string) => ['verification', 'status', businessId] as const,
    applications: (businessId: string) => ['verification', 'applications', businessId] as const,
    application: (businessId: string, applicationId: string) =>
      ['verification', 'application', businessId, applicationId] as const,
    documents: (businessId: string, applicationId: string) =>
      ['verification', 'documents', businessId, applicationId] as const,
    badge: (businessId: string) => ['verification', 'badge', businessId] as const,
    embed: (businessId: string) => ['verification', 'embed', businessId] as const,
    adminList: (filters: Record<string, unknown>) => ['verification', 'admin', 'list', filters] as const,
    adminApplication: (applicationId: string) =>
      ['verification', 'admin', 'application', applicationId] as const,
    adminStats: () => ['verification', 'admin', 'stats'] as const,
  },
  billing: {
    current: () => ['billing', 'current'] as const,
    plans: () => ['billing', 'plans'] as const,
    invoices: (page: number, perPage: number) => ['billing', 'invoices', page, perPage] as const,
    invoice: (id: string) => ['billing', 'invoice', id] as const,
    payments: (page: number, perPage: number) => ['billing', 'payments', page, perPage] as const,
    adminPayments: (filters: Record<string, unknown>) => ['billing', 'admin', 'payments', filters] as const,
    adminStats: () => ['billing', 'admin', 'stats'] as const,
    adminSubscriptions: (filters: Record<string, unknown>) =>
      ['billing', 'admin', 'subscriptions', filters] as const,
    adminVouchers: (filters: Record<string, unknown>) =>
      ['billing', 'admin', 'vouchers', filters] as const,
  },
  analytics: {
    business: (range: string) => ['analytics', 'business', range] as const,
    admin: (range: string) => ['analytics', 'admin', range] as const,
  },
};

export type QueryKeyOf<T extends (...args: any[]) => any> = ReturnType<T>;