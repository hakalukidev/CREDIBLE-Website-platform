// components/auth/brand-mark.tsx
//
// Brand row used in the marketing panels of the login + register pages.
// Kept separate so both screens stay visually identical and so the
// logo / wordmark never drifts between them.

import { SafeImage } from '@/components/ui/safe-image';

interface BrandMarkProps {
  /** Optional override for the brand wordmark. Defaults to "Credible". */
  brand?: string;
  /** Optional tagline shown under the wordmark. */
  tagline?: string;
  logoSrc?: string;
  logoAlt?: string;
}

export function BrandMark({
  brand = 'Credible',
  tagline = 'Verified reviews',
  logoSrc = '/logo.jpg',
  logoAlt = 'Credible logo',
}: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative block h-10 w-10 overflow-hidden rounded-lg ring-1 ring-black/5 shadow-sm">
        <SafeImage src={logoSrc} alt={logoAlt} fill sizes="40px" priority />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-xl font-bold tracking-tight">{brand}</span>
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5F6368]">
          {tagline}
        </span>
      </div>
    </div>
  );
}
