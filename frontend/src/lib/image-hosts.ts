/**
 * Single source of truth for image hostnames allowed by `next/image`.
 *
 * Shared by `next.config.ts` (which turns this into `images.remotePatterns`)
 * and `src/components/ui/safe-image.tsx` (which uses it as a runtime gate
 * before handing a URL to `next/image`). The two consumers cannot drift
 * because they import the same array.
 *
 * Wildcard semantics mirror Next's `**` glob: `suffix` patterns match any
 * depth of subdomain (e.g. `.r2.dev` matches `pub-xyz.r2.dev`,
 * `a.b.c.r2.dev`, and `r2.dev` itself). `host` patterns match exactly.
 *
 * Why each entry is here:
 *   - R2 (`.r2.dev`, `.r2.cloudflarestorage.com`)            — Cloudflare R2 storage
 *   - S3 (`.amazonaws.com`)                                 — AWS S3 regional
 *   - CloudFront (`.cloudfront.net`)                         — AWS CDN in front of S3/R2
 *   - Google OAuth (`.googleusercontent.com`)               — avatar lh3/lh4/lh6.* hosts
 *   - Facebook OAuth (`graph.facebook.com`, `.fbsbx.com`,
 *     `.fbcdn.net`)                                         — Facebook avatar CDN
 *   - `cdn.credible.com`                                    — project CDN
 */
type ImageHostPattern =
  | { readonly kind: 'exact'; readonly host: string }
  | { readonly kind: 'wildcard'; readonly suffix: string };

export const IMAGE_HOST_PATTERNS: readonly ImageHostPattern[] = [
  { kind: 'wildcard', suffix: '.r2.dev' },
  { kind: 'wildcard', suffix: '.r2.cloudflarestorage.com' },
  { kind: 'wildcard', suffix: '.amazonaws.com' },
  { kind: 'wildcard', suffix: '.cloudfront.net' },
  { kind: 'wildcard', suffix: '.googleusercontent.com' },
  { kind: 'exact', host: 'graph.facebook.com' },
  { kind: 'wildcard', suffix: '.fbsbx.com' },
  { kind: 'wildcard', suffix: '.fbcdn.net' },
  { kind: 'exact', host: 'cdn.credible.com' },
];

export function isAllowedImageHost(hostname: string): boolean {
  if (!hostname) return false;
  for (const pattern of IMAGE_HOST_PATTERNS) {
    if (pattern.kind === 'exact') {
      if (hostname === pattern.host) return true;
    } else {
      // `.suffix` matches any depth: `r2.dev`, `a.r2.dev`, `a.b.r2.dev`.
      if (hostname === pattern.suffix.slice(1)) return true;
      if (hostname.endsWith(pattern.suffix)) return true;
    }
  }
  return false;
}
