/**
 * Analytics service — Phase 5.
 *
 * Provides aggregated metrics for the business dashboard (per-business) and
 * the admin dashboard (platform-wide). All queries are read-only and use the
 * indexes added in the Phase 5 migration.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db/prisma';
import type { SubscriptionPlan } from '@credible/types';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ReviewAnalytics {
  total: number;
  average: number;
  ratingDistribution: Array<{ rating: number; count: number }>;
  dailyTrend: Array<{ date: string; count: number }>;
  flaggedCount: number;
}

export interface VisitAnalytics {
  total: number;
  uniqueIps: number;
  dailyVisits: Array<{ date: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
}

export interface WidgetAnalytics {
  impressions: number;
  byType: Array<{ widgetType: string; count: number }>;
  dailyImpressions: Array<{ date: string; count: number }>;
}

export interface BusinessAnalytics {
  reviews: ReviewAnalytics;
  visits: VisitAnalytics;
  widgets: WidgetAnalytics;
  summary: {
    totalReviews: number;
    averageRating: number;
    totalVisits: number;
    widgetImpressions: number;
    responseRate: number;
  };
}

export interface AdminAnalytics {
  totalBusinesses: number;
  verifiedBusinesses: number;
  pendingVerifications: number;
  totalUsers: number;
  totalReviews: number;
  averageRating: number;
  flaggedReviews: number;
  subscriptionStats: Record<SubscriptionPlan, number>;
  monthlyRevenue: Array<{ month: string; amount: number }>;
  totalRevenue: number;
  revenueGrowth: number;
  userGrowth: number;
  verificationRate: number;
  widgetImpressions: number;
  reviewDistribution: Record<number, number>;
}

function startOfDay(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0];
}

function rangePreset(preset: string): DateRange {
  const to = new Date();
  let from = new Date();
  switch (preset) {
    case '7d':
      from.setDate(to.getDate() - 7);
      break;
    case '90d':
      from.setDate(to.getDate() - 90);
      break;
    case 'year':
      from = new Date(to.getFullYear(), 0, 1);
      break;
    case '30d':
    default:
      from.setDate(to.getDate() - 30);
  }
  return { from, to };
}

function defaultRange(): DateRange {
  return rangePreset('30d');
}

export const analyticsService = {
  /** Convert a free-form range string ("7d", "30d", "90d", "year", or "from:to") to a DateRange. */
  parseRange(input: string | undefined | null): DateRange {
    if (!input) return defaultRange();
    if (input.includes(':')) {
      const [a, b] = input.split(':');
      const from = new Date(a);
      const to = new Date(b);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) return { from, to };
    }
    return rangePreset(input);
  },

  // -------------------------------------------------------------------------
  // Per-business analytics
  // -------------------------------------------------------------------------
  async getBusinessAnalytics(businessId: string, range: DateRange): Promise<BusinessAnalytics> {
    const [reviews, visits, widgets, responded] = await Promise.all([
      prisma.review.findMany({
        where: { businessId, createdAt: { gte: range.from, lte: range.to } },
        select: { rating: true, createdAt: true, status: true },
      }),
      prisma.visitLog.findMany({
        where: { businessId, createdAt: { gte: range.from, lte: range.to } },
        select: { createdAt: true, referrer: true, ipHash: true },
      }),
      prisma.widgetImpression.findMany({
        where: { businessId, createdAt: { gte: range.from, lte: range.to } },
        select: { createdAt: true, widgetType: true },
      }),
      prisma.review.count({
        where: { businessId, responseContent: { not: null } },
      }),
    ]);

    // Reviews
    const total = reviews.length;
    const average = total ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / total : 0;
    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: reviews.filter((r: { rating: number; status: string }) => r.rating === rating).length,
    }));
    const reviewByDay = new Map<string, number>();
    reviews.forEach((r: { createdAt: Date; status: string }) => {
      const k = startOfDay(r.createdAt);
      reviewByDay.set(k, (reviewByDay.get(k) ?? 0) + 1);
    });
    const flaggedCount = reviews.filter((r: { rating: number; status: string }) => r.status === 'FLAGGED').length;

    // Visits
    const visitByDay = new Map<string, number>();
    const referrerCounts = new Map<string, number>();
    const uniqueIps = new Set<string>();
    visits.forEach((v: { createdAt: Date; referrer: string | null; ipHash: string | null }) => {
      const k = startOfDay(v.createdAt);
      visitByDay.set(k, (visitByDay.get(k) ?? 0) + 1);
      const ref = v.referrer ?? '(direct)';
      referrerCounts.set(ref, (referrerCounts.get(ref) ?? 0) + 1);
      if (v.ipHash) uniqueIps.add(v.ipHash);
    });

    // Widgets
    const widgetByType = new Map<string, number>();
    const widgetByDay = new Map<string, number>();
    widgets.forEach((w: { createdAt: Date; widgetType: string }) => {
      widgetByType.set(w.widgetType, (widgetByType.get(w.widgetType) ?? 0) + 1);
      const k = startOfDay(w.createdAt);
      widgetByDay.set(k, (widgetByDay.get(k) ?? 0) + 1);
    });

    const totalReviews = await prisma.review.count({
      where: { businessId, status: 'PUBLISHED' },
    });
    const responseRate = totalReviews > 0 ? Math.round((responded / totalReviews) * 100) : 0;

    return {
      reviews: {
        total,
        average,
        ratingDistribution,
        dailyTrend: Array.from(reviewByDay.entries())
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([date, count]) => ({ date, count })),
        flaggedCount,
      },
      visits: {
        total: visits.length,
        uniqueIps: uniqueIps.size,
        dailyVisits: Array.from(visitByDay.entries())
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([date, count]) => ({ date, count })),
        topReferrers: Array.from(referrerCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([referrer, count]) => ({ referrer, count })),
      },
      widgets: {
        impressions: widgets.length,
        byType: Array.from(widgetByType.entries()).map(([widgetType, count]) => ({
          widgetType,
          count,
        })),
        dailyImpressions: Array.from(widgetByDay.entries())
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([date, count]) => ({ date, count })),
      },
      summary: {
        totalReviews,
        averageRating: average,
        totalVisits: visits.length,
        widgetImpressions: widgets.length,
        responseRate,
      },
    };
  },

  // -------------------------------------------------------------------------
  // Platform-wide admin analytics
  // -------------------------------------------------------------------------
  async getAdminAnalytics(range: DateRange): Promise<AdminAnalytics> {
    const [
      totalBusinesses,
      verifiedBusinesses,
      pendingVerifications,
      totalUsers,
      totalReviewsAll,
      reviewDistRows,
      flaggedReviews,
      subscriptionRows,
      successfulPayments,
      priorPayments,
      widgetImpressions,
    ] = await Promise.all([
      prisma.business.count({ where: { deletedAt: null } }),
      prisma.business.count({
        where: { deletedAt: null, verificationStatus: 'APPROVED' },
      }),
      prisma.verificationApplication.count({
        where: { status: { in: ['PENDING', 'DOCUMENTS_UPLOADED', 'AUTO_CHECKING', 'HUMAN_REVIEW_REQUIRED'] } },
      }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.review.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
      prisma.review.groupBy({ by: ['rating'], _count: { _all: true } }),
      prisma.review.count({ where: { status: 'FLAGGED' } }),
      prisma.subscription.groupBy({ by: ['plan'], _count: { _all: true } }),
      prisma.payment.findMany({
        where: { status: 'SUCCESS', paidAt: { gte: range.from, lte: range.to } },
        select: { amount: true, paidAt: true },
      }),
      prisma.payment.findMany({
        where: {
          status: 'SUCCESS',
          paidAt: {
            gte: new Date(range.from.getTime() - (range.to.getTime() - range.from.getTime())),
            lt: range.from,
          },
        },
        select: { amount: true },
      }),
      prisma.widgetImpression.count({
        where: { createdAt: { gte: range.from, lte: range.to } },
      }),
    ]);

    const subscriptionStats: Record<SubscriptionPlan, number> = {
      FREE: 0,
      BASIC: 0,
      PROFESSIONAL: 0,
      ENTERPRISE: 0,
    };
    subscriptionRows.forEach((s: { plan: string; _count: { _all: number } }) => {
      subscriptionStats[s.plan as SubscriptionPlan] = s._count._all;
    });

    const reviewDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviewDistRows.forEach((r: { rating: number; _count: { _all: number } }) => {
      reviewDistribution[r.rating] = r._count._all;
    });

    const monthlyRevenue = new Map<string, number>();
    successfulPayments.forEach((p: { paidAt: Date; amount: { toString(): string } }) => {
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue.set(key, (monthlyRevenue.get(key) ?? 0) + Number(p.amount));
    });

    const totalRevenue = Array.from(monthlyRevenue.values()).reduce(
      (s: number, v: number) => s + v,
      0,
    );
    const priorTotal = priorPayments.reduce(
      (s: number, p: { amount: { toString(): string } }) => s + Number(p.amount),
      0,
    );
    const revenueGrowth = priorTotal > 0 ? Math.round(((totalRevenue - priorTotal) / priorTotal) * 100) : 0;

    const priorUsers = await prisma.user.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: new Date(range.from.getTime() - (range.to.getTime() - range.from.getTime())),
          lt: range.from,
        },
      },
    });
    const newUsers = await prisma.user.count({
      where: { deletedAt: null, createdAt: { gte: range.from, lte: range.to } },
    });
    const userGrowth = priorUsers > 0 ? Math.round((newUsers / priorUsers) * 100) : 0;

    return {
      totalBusinesses,
      verifiedBusinesses,
      pendingVerifications,
      totalUsers,
      totalReviews: totalReviewsAll._count._all,
      averageRating: Number(totalReviewsAll._avg.rating ?? 0),
      flaggedReviews,
      subscriptionStats,
      monthlyRevenue: Array.from(monthlyRevenue.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([month, amount]) => ({ month, amount: Math.round(amount) })),
      totalRevenue: Math.round(totalRevenue),
      revenueGrowth,
      userGrowth,
      verificationRate: totalBusinesses > 0 ? Math.round((verifiedBusinesses / totalBusinesses) * 100) : 0,
      widgetImpressions,
      reviewDistribution,
    };
  },

  /** Export business analytics as CSV rows. */
  async exportBusinessAnalyticsCsv(businessId: string, range: DateRange): Promise<string> {
    const data = await this.getBusinessAnalytics(businessId, range);
    const rows = [
      'metric,value',
      `total_reviews,${data.summary.totalReviews}`,
      `average_rating,${data.summary.averageRating.toFixed(2)}`,
      `total_visits,${data.summary.totalVisits}`,
      `widget_impressions,${data.summary.widgetImpressions}`,
      `response_rate,${data.summary.responseRate}%`,
      '',
      'rating_distribution',
      'rating,count',
      ...data.reviews.ratingDistribution.map((r) => `${r.rating},${r.count}`),
    ];
    return rows.join('\n');
  },

  /** Export admin analytics as CSV rows. */
  async exportAdminAnalyticsCsv(range: DateRange): Promise<string> {
    const data = await this.getAdminAnalytics(range);
    const rows = [
      'metric,value',
      `total_businesses,${data.totalBusinesses}`,
      `verified_businesses,${data.verifiedBusinesses}`,
      `verification_rate,${data.verificationRate}%`,
      `total_users,${data.totalUsers}`,
      `total_reviews,${data.totalReviews}`,
      `average_rating,${data.averageRating.toFixed(2)}`,
      `flagged_reviews,${data.flaggedReviews}`,
      `total_revenue_bdt,${data.totalRevenue}`,
      `revenue_growth,${data.revenueGrowth}%`,
      `user_growth,${data.userGrowth}%`,
      `widget_impressions,${data.widgetImpressions}`,
      '',
      'subscription_distribution',
      'plan,count',
      ...Object.entries(data.subscriptionStats).map(([k, v]) => `${k},${v}`),
    ];
    return rows.join('\n');
  },
};

// Helper used by the admin dashboard to run Prisma raw queries safely.
export const safeCount = async (query: Prisma.Sql) => {
  const rows = await prisma.$queryRaw<Array<{ count: bigint | number }>>(query);
  return Number(rows[0]?.count ?? 0);
};