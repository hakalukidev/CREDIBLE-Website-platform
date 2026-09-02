import { describe, expect, it } from 'vitest';
import { IMAGE_HOST_PATTERNS, isAllowedImageHost } from './image-hosts';

describe('IMAGE_HOST_PATTERNS', () => {
  it('is non-empty', () => {
    expect(IMAGE_HOST_PATTERNS.length).toBeGreaterThan(0);
  });

  it('contains no duplicate exact hosts', () => {
    const exacts = IMAGE_HOST_PATTERNS.filter((p) => p.kind === 'exact').map((p) => p.host);
    expect(new Set(exacts).size).toBe(exacts.length);
  });
});

describe('isAllowedImageHost', () => {
  it.each([
    // R2
    ['pub-f7f98658bcc54ebaaa03def302a263a1.r2.dev', true],
    ['anything.r2.dev', true],
    ['r2.dev', true],
    // R2 raw endpoint
    ['abc.r2.cloudflarestorage.com', true],
    // S3
    ['credible-documents.s3.us-east-1.amazonaws.com', true],
    ['anything.amazonaws.com', true],
    // CloudFront
    ['d123abc.cloudfront.net', true],
    // Google OAuth
    ['lh3.googleusercontent.com', true],
    ['lh6.googleusercontent.com', true],
    // Facebook
    ['graph.facebook.com', true],
    ['platform-lookaside.fbsbx.com', true],
    ['scontent.fbcdn.net', true],
    // Project CDN
    ['cdn.credible.com', true],
    // Negatives — these must NOT be allowed
    ['', false],
    ['evil.com', false],
    ['r2.dev.evil.com', false],
    ['example.com', false],
  ])('isAllowedImageHost(%j) === %j', (hostname, expected) => {
    expect(isAllowedImageHost(hostname)).toBe(expected);
  });
});
