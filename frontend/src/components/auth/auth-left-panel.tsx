'use client';

import { ShieldCheck, BadgeCheck, MessageSquareQuote } from 'lucide-react';
import { BrandMark } from './brand-mark';

/**
 * Left side of the two-column auth modal. Stays consistent across sign-in
 * and sign-up so the marketing story doesn't change when the user toggles
 * modes — only the right-side form does.
 *
 * Layout uses a soft accent surface that matches the site's blue tint
 * (`bg-primary/5` over the white card) so the modal reads as a single
 * composition rather than two unrelated boxes.
 */
export function AuthLeftPanel() {
  return (
    <div className="relative hidden h-full overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background lg:flex lg:flex-col lg:justify-between lg:p-10">
      {/* Decorative pattern — soft dotted grid in the bottom-right corner,
          reads as a subtle texture rather than a marketing illustration.
          Pure CSS so there's no extra asset to load. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_1px_1px,theme(colors.primary/15)_1px,transparent_0)] [background-size:18px_18px] opacity-60 [mask-image:linear-gradient(to_left,black,transparent)]"
      />

      <div className="relative">
        <BrandMark brand="Credible" tagline="Verified reviews" />
      </div>

      <div className="relative space-y-8">
        <div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">
            Trust before you decide.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Discover credible businesses, professionals, and real customer
            experiences — verified by humans, not algorithms.
          </p>
        </div>

        <ul className="space-y-3">
          <TrustPoint
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            title="Verified businesses"
            body="Every badge is awarded after document review."
          />
          <TrustPoint
            icon={<BadgeCheck className="h-3.5 w-3.5" />}
            title="Human-reviewed trust signals"
            body="No bots. No automated approvals."
          />
          <TrustPoint
            icon={<MessageSquareQuote className="h-3.5 w-3.5" />}
            title="Real customer reviews"
            body="OTP-confirmed submissions, one per person."
          />
        </ul>
      </div>

      <p className="relative text-xs text-muted-foreground">
        Bangladesh&apos;s trust layer for businesses and professionals.
      </p>
    </div>
  );
}

interface TrustPointProps {
  icon: React.ReactNode;
  title: string;
  body: string;
}

function TrustPoint({ icon, title, body }: TrustPointProps) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        {icon}
      </span>
      <div className="text-sm leading-relaxed">
        <span className="font-medium text-foreground">{title}.</span>{' '}
        <span className="text-muted-foreground">{body}</span>
      </div>
    </li>
  );
}
