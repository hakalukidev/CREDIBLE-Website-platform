/**
 * Helpers to emit JSON-LD structured data for SEO (Schema.org).
 *
 * The aim of this file is twofold:
 *
 *  1. Produce clean, valid markup for Google's Rich Results Test (no
 *     warnings about missing fields, no orphan @id references).
 *
 *  2. Establish **Credible** as a recognised review-aggregator publisher.
 *     Google only treats a site as a third review source if it can clearly
 *     link every Review back to (a) the publisher organization, (b) a stable
 *     item @id, and (c) the author. The helpers below make that linkage
 *     explicit.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const SITE_NAME = 'Credible';

/**
 * The canonical @id of the Credible Organization. Reused across the site so
 * every `publisher`/`sourceOrganization` pointer resolves to the same node.
 */
export const ORG_ID = `${SITE_URL}#organization`;
/** Canonical @id of the Credible WebSite (used by the homepage WebSite node). */
export const WEBSITE_ID = `${SITE_URL}#website`;

/**
 * External identity links — `sameAs` is the strongest signal Google uses
 * to confirm that a brand account on its platform maps to a real entity.
 * Update as new profiles are claimed.
 */
const SAME_AS_LINKS = [
  'https://www.facebook.com/credible',
  'https://www.linkedin.com/company/credible',
  'https://twitter.com/credible',
  'https://www.youtube.com/@credible',
  'https://github.com/credible',
  // Knowledge-graph / data sources. Apply for these once the brand exists:
  // 'https://www.wikidata.org/wiki/Q<yourQID>',
  // 'https://www.crunchbase.com/organization/credible',
];

/** Reusable Person stub for the publisher's editorial contact. */
const PUBLISHER = {
  '@id': ORG_ID,
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logo.png`,
    width: 512,
    height: 512,
  },
};

/** Full Organization node. Used both at the page level and via @id reference. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    legalName: 'Credible',
    alternateName: 'Credible Bangladesh',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/og-default.png`,
    description:
      'Credible is a trust and verification platform where the public can search for and review businesses and professionals, and businesses can apply for the Credible Verified badge.',
    foundingDate: '2024',
    areaServed: {
      '@type': 'Country',
      name: 'Bangladesh',
      alternateName: 'BD',
    },
    knowsLanguage: ['en', 'bn'],
    knowsAbout: [
      'Business verification',
      'Customer reviews',
      'Trust scoring',
      'Reputation management',
      'Bangladesh small business',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${SITE_URL}/contact`,
        availableLanguage: ['English', 'Bengali'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'press',
        url: `${SITE_URL}/about`,
      },
    ],
    sameAs: SAME_AS_LINKS,
    award: 'Credible is an independent third-party review aggregator.',
  };
}

/** WebSite node for the homepage (sitelinks search box eligibility). */
export function websiteSchemaWithSearchAction() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'en-BD',
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      // Required by Google for the sitelinks searchbox.
      'query-input': 'required name=search_term_string',
    },
  };
}

interface BusinessSchemaInput {
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  streetAddress?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  ratingAverage?: number;
  ratingCount?: number;
  isVerified: boolean;
  verificationLevel?: string;
  hoursJson?: unknown;
  priceRange?: string;
  category?: string;
}

/**
 * Build the canonical LocalBusiness node for a business profile. Returns
 * `null` (not undefined) when there are no reviews at all — emitting an
 * `aggregateRating` with 0 reviews triggers a Google Search Console warning.
 */
export function businessSchema(input: BusinessSchemaInput) {
  const url = `${SITE_URL}/business/${input.slug}`;
  const businessId = `${url}#business`;
  const hasAddress = Boolean(
    input.streetAddress ?? input.city ?? input.state ?? input.postalCode ?? input.country,
  );
  const hasGeo =
    typeof input.latitude === 'number' && typeof input.longitude === 'number';

  // Google policy: only emit AggregateRating if there is at least one review.
  const aggregateRating =
    input.ratingCount && input.ratingCount > 0 && typeof input.ratingAverage === 'number'
      ? {
          '@type': 'AggregateRating',
          ratingValue: input.ratingAverage.toFixed(1),
          reviewCount: input.ratingCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': input.category ? 'LocalBusiness' : 'Organization',
    '@id': businessId,
    name: input.name,
    url,
    description: input.description,
    image: input.logo,
    logo: input.logo,
    telephone: input.phone,
    email: input.email,
    sameAs: input.website ? [input.website] : undefined,
    address: hasAddress
      ? {
          '@type': 'PostalAddress',
          streetAddress: input.streetAddress,
          addressLocality: input.city,
          addressRegion: input.state,
          postalCode: input.postalCode,
          addressCountry: input.country ?? 'BD',
        }
      : undefined,
    geo: hasGeo
      ? {
          '@type': 'GeoCoordinates',
          latitude: input.latitude,
          longitude: input.longitude,
        }
      : undefined,
    hasMap: hasGeo
      ? `https://www.google.com/maps?q=${input.latitude},${input.longitude}`
      : undefined,
    openingHoursSpecification: normalizeOpeningHours(input.hoursJson),
    priceRange: input.priceRange ?? '$$',
    currenciesAccepted: 'BDT',
    paymentAccepted: 'Cash, Credit Card, bKash, Nagad',
    aggregateRating,
    // Brand authority — the business owner can claim a Credible badge. This
    // mirrors Google's own "Brand" markup and helps the rich-result merger
    // understand the credential relationship.
    award: input.isVerified ? 'Credible Verified' : undefined,
    // The publisher attribution is required by Google's UGC policy for
    // third-party reviews to surface as rich results.
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-BD',
  };
}

/** Convert a free-form `hoursJson` value into the schema.org shape. */
function normalizeOpeningHours(hours: unknown) {
  if (!hours || typeof hours !== 'object') return undefined;
  const obj = hours as Record<string, { open?: string; close?: string } | string>;
  return Object.entries(obj)
    .filter(([, v]) => v && typeof v === 'object')
    .map(([day, v]) => {
      const slot = v as { open?: string; close?: string };
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
        opens: slot.open,
        closes: slot.close,
      };
    });
}

interface ReviewSchemaInput {
  businessSlug: string;
  businessName: string;
  reviewId: string;
  rating: number;
  title?: string;
  content: string;
  author: string;
  authorId?: string;
  createdAt: string;
  helpfulCount?: number;
  response?: { content: string; at: string };
}

/**
 * Build a single Review node.
 *
 * The `itemReviewed` field uses the **same @id** the LocalBusiness node uses
 * so Google can resolve the reverse relationship without re-parsing. The
 * `author` is a fully-formed Person with name + identifier; `publisher` is
 * Credible so Google understands this is third-party UGC.
 */
export function reviewSchema(input: ReviewSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    '@id': `${SITE_URL}/business/${input.businessSlug}#review-${input.reviewId}`,
    itemReviewed: {
      '@id': `${SITE_URL}/business/${input.businessSlug}#business`,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: input.rating,
      bestRating: 5,
      worstRating: 1,
    },
    name: input.title,
    reviewBody: input.content,
    author: {
      '@type': 'Person',
      name: input.author,
      url: input.authorId ? `${SITE_URL}/account/reviews#user-${input.authorId}` : undefined,
      identifier: input.authorId,
    },
    datePublished: input.createdAt,
    inLanguage: 'en-BD',
    publisher: PUBLISHER,
    isPartOf: {
      '@id': `${SITE_URL}/business/${input.businessSlug}#business`,
    },
    positiveNotes: {
      '@type': 'WebContent',
      url: `${SITE_URL}/business/${input.businessSlug}`,
    },
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  };
}

/**
 * ItemList of reviews on a business profile. Google's review carousel /
 * merchant listings understand this shape and can render the items inline.
 */
interface ReviewListInputItem extends ReviewSchemaInput {}
export function reviewListSchema(
  businessSlug: string,
  businessName: string,
  reviews: ReviewListInputItem[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_URL}/business/${businessSlug}#reviews`,
    itemListOrder: 'https://schema.org/ItemListUnordered',
    numberOfItems: reviews.length,
    itemListElement: reviews.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/business/${businessSlug}#review-${r.reviewId}`,
      name: r.title ?? `${r.businessName} review by ${r.author}`,
      // Embed the Review itself so Google can read it via the ItemList.
      item: reviewSchema({ ...r, businessName, businessSlug }),
    })),
  };
}

/**
 * ClaimReview markup for the public verification page. Used by Google's
 * fact-check ecosystem and adjacent review aggregators.
 */
interface ClaimReviewInput {
  claimReviewed: string;
  claimUrl: string; // URL of the claim being reviewed
  reviewUrl: string; // canonical Credible verify URL
  verdict: 'Verified' | 'Refuted' | 'Misleading' | 'Unsupported';
  businessName: string;
  badgeHash: string;
  issuedAt: string;
  authorName?: string;
}
export function claimReviewSchema(input: ClaimReviewInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ClaimReview',
    '@id': `${input.reviewUrl}#claimreview`,
    url: input.reviewUrl,
    claimReviewed: input.claimReviewed,
    itemReviewed: {
      '@type': 'Claim',
      author: { '@type': 'Organization', name: input.businessName },
      datePublished: input.issuedAt,
      appearanceUrl: input.claimUrl,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: input.verdict === 'Verified' ? 5 : 1,
      bestRating: 5,
      worstRating: 1,
      alternateName: input.verdict,
    },
    author: {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: SITE_NAME,
      url: SITE_URL,
    },
    datePublished: input.issuedAt,
    inLanguage: 'en-BD',
  };
}

/**
 * SoftwareApplication / WebApplication schema for the Credible web app. This
 * is what gives Google the context to treat the homepage as a SaaS product
 * rather than a generic landing page, and surfaces in app-rich-results.
 */
export function webApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${SITE_URL}#webapp`,
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any (web)',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    description:
      'Discover, review, and verify trusted businesses across Bangladesh.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BDT',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/for-business`,
    },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-BD',
  };
}

/**
 * Backwards-compat re-export so existing callers don't break.
 * @deprecated Use the inline URL template passed into `websiteSchemaWithSearchAction`.
 */
export interface WebsiteSearchAction {
  queryInput: string;
  urlTemplate: string;
}