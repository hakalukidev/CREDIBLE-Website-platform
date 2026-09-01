import type { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

interface BusinessListItem {
  slug: string;
  updatedAt?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/for-business`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/widgets`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/api-docs`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  let categoryEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 60 * 60 } });
    if (res.ok) {
      const body = (await res.json()) as { data?: Array<{ slug: string }> };
      categoryEntries = (body.data ?? []).map((c) => ({
        url: `${SITE_URL}/search?category=${c.slug}`,
        changeFrequency: 'weekly' as 'weekly',
        priority: 0.7,
      }));
    }
  } catch {
    // ignore — category sitemap entries are optional
  }

  try {
    const res = await fetch(`${API_URL}/businesses/search?perPage=200`, {
      next: { revalidate: 60 * 30 },
    });
    if (!res.ok) return [...staticEntries, ...categoryEntries];
    const body = (await res.json()) as { data: BusinessListItem[] };
    const businessEntries = body.data.map((b) => ({
      url: `${SITE_URL}/business/${b.slug}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
    return [...staticEntries, ...categoryEntries, ...businessEntries] as MetadataRoute.Sitemap;
  } catch {
    return [...staticEntries, ...categoryEntries] as MetadataRoute.Sitemap;
  }
}