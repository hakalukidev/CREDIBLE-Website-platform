import type { Metadata } from 'next';
import { organizationSchema } from './structured-data';

const SITE_NAME = 'Credible';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const DEFAULT_TITLE = 'Credible — Find, review, and verify trusted businesses';
const DEFAULT_DESCRIPTION =
  'Credible is a trust and verification platform where the public can search for and review businesses and professionals, and businesses can apply for the Credible Verified badge.';

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s · ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['trust', 'reviews', 'business verification', 'credible', 'BD', 'Bangladesh'],
  authors: [{ name: 'Credible' }],
  creator: 'Credible',
  publisher: 'Credible',
  openGraph: {
    type: 'website',
    locale: 'en_BD',
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    creator: '@credible',
    images: ['/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  alternates: { canonical: '/' },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export function businessMetadata(input: {
  name: string;
  description?: string;
  slug: string;
  ratingAverage?: number;
  ratingCount?: number;
  city?: string;
  logo?: string;
}): Metadata {
  const desc =
    input.description?.slice(0, 200) ??
    (input.ratingCount
      ? `${input.name}${input.city ? ` in ${input.city}` : ''} — ${input.ratingCount} reviews, ${(input.ratingAverage ?? 0).toFixed(1)} stars on Credible.`
      : `${input.name}${input.city ? ` in ${input.city}` : ''} — reviews and verification on Credible.`);
  return {
    title: input.name,
    description: desc,
    openGraph: {
      type: 'profile',
      title: `${input.name} · ${SITE_NAME}`,
      description: desc,
      url: `/business/${input.slug}`,
      images: input.logo
        ? [{ url: input.logo, width: 1200, height: 630, alt: input.name }]
        : [{ url: '/og-default.png', width: 1200, height: 630, alt: input.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${input.name} · ${SITE_NAME}`,
      description: desc,
      images: input.logo ? [input.logo] : ['/og-default.png'],
    },
    alternates: { canonical: `/business/${input.slug}` },
  };
}

/** Generic helper for non-business pages (search, blog, awards, etc.). */
export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
}): Metadata {
  const url = `${SITE_URL}${input.path}`;
  const image = `${SITE_URL}${input.image ?? '/og-default.png'}`;
  return {
    title: input.title,
    description: input.description,
    openGraph: {
      type: input.type ?? 'website',
      title: input.title,
      description: input.description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [image],
    },
    alternates: { canonical: input.path },
  };
}

export function organizationLdJson(): string {
  return JSON.stringify(organizationSchema());
}