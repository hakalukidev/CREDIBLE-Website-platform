import type { NextConfig } from 'next';
import { IMAGE_HOST_PATTERNS } from './src/lib/image-hosts';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  typedRoutes: true,
  // Adding @tanstack packages to transpilePackages to work around a
  // Turbopack bundling bug where `resolveQueryValue` (and other named
  // exports from query-core) are not properly registered in the
  // module namespace, causing `TypeError: ... is not a function` at
  // runtime inside `useQuery`. Forcing Next to transpile these
  // packages ensures the exports resolve correctly.
  transpilePackages: [
    '@credible/shared',
    '@credible/types',
    '@tanstack/react-query',
    '@tanstack/query-core',
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
    // Built from `IMAGE_HOST_PATTERNS` so this list stays in lock-step with
    // the runtime allowlist in `src/components/ui/safe-image.tsx`. See
    // `src/lib/image-hosts.ts` for the canonical list and rationale.
    remotePatterns: IMAGE_HOST_PATTERNS.map((pattern) => ({
      protocol: 'https',
      hostname:
        pattern.kind === 'exact'
          ? pattern.host
          : // wildcard suffix is stored as `.foo` for the runtime matcher,
            // but Next expects `**.foo` to match any depth of subdomain.
            `**${pattern.suffix}`,
    })),
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            // interest-cohort=() opts out of FLoC.
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Long-lived immutable caching for hashed production assets. In dev
        // mode we MUST allow revalidation, otherwise HMR chunks get stuck
        // and the browser keeps importing stale factories — which manifests
        // as "module factory is not available" errors after edits.
        source: '/_next/static/:path*',
        headers:
          process.env.NODE_ENV === 'production'
            ? [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
            : [{ key: 'Cache-Control', value: 'no-cache, must-revalidate' }],
      },
      {
        // Authenticated/private areas: never cache at the CDN.
        source: '/(api|admin|account|business/dashboard)/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' }],
      },
    ];
  },
};

export default nextConfig;