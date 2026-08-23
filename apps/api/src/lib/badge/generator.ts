import { randomUUID } from 'node:crypto';
import { storage } from '../storage/s3';
import { STORAGE_KEYS } from '@credible/shared';
import type { VerificationLevel } from '@credible/types';

interface BadgeInput {
  displayName: string;
  badgeHash: string;
  level: VerificationLevel;
}

interface BadgeOutput {
  key: string;
  url: string;
  mimeType: string;
  size: number;
}

const COLOR_MAP: Record<VerificationLevel, { primary: string; secondary: string; label: string }> = {
  NONE: { primary: '#6B7280', secondary: '#E5E7EB', label: 'Unverified' },
  BASIC: { primary: '#1A56DB', secondary: '#DBEAFE', label: 'Verified' },
  CERTIFIED: { primary: '#F59E0B', secondary: '#FEF3C7', label: 'Certified' },
  PREMIUM: { primary: '#059669', secondary: '#D1FAE5', label: 'Premium' },
};

export async function generateBadge(input: BadgeInput): Promise<BadgeOutput> {
  const colors = COLOR_MAP[input.level] ?? COLOR_MAP.BASIC;
  const safeName = input.displayName.replace(/[<>&]/g, '').slice(0, 40);
  const verifyUrl = `verify/${input.badgeHash}`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" width="320" height="120" role="img" aria-label="Credible ${colors.label} badge for ${safeName}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors.secondary}" />
      <stop offset="100%" stop-color="#FFFFFF" />
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="316" height="116" rx="16" ry="16" fill="url(#bg)" stroke="${colors.primary}" stroke-width="2"/>
  <g transform="translate(28, 60)">
    <circle r="28" cx="0" cy="0" fill="${colors.primary}" />
    <path d="M -10 0 L -3 8 L 12 -10" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  </g>
  <text x="76" y="56" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">${safeName}</text>
  <text x="76" y="82" font-family="Inter, Arial, sans-serif" font-size="13" fill="${colors.primary}">Credible ${colors.label}</text>
  <text x="76" y="100" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="#6B7280">${verifyUrl}</text>
</svg>`;

  const buffer = Buffer.from(svg, 'utf8');
  const key = `${STORAGE_KEYS.BADGES}/${input.badgeHash}.svg`;
  const url = await storage.uploadObject({
    key,
    body: buffer,
    contentType: 'image/svg+xml',
    bucket: process.env.S3_PUBLIC_BUCKET,
    encrypt: false,
  });

  return {
    key: `${randomUUID()}-${key}`,
    url,
    mimeType: 'image/svg+xml',
    size: buffer.length,
  };
}