import Link from 'next/link';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/verification/verified-badge';
import { VERIFICATION_LEVEL_LABELS } from '@credible/shared';
import { claimReviewSchema } from '@/lib/seo/structured-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface VerifyResponse {
  valid: boolean;
  businessName: string;
  badgeType: 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';
  issuedAt: string;
  status: 'ACTIVE' | 'REVOKED';
  verificationUrl: string;
  revokedAt?: string | null;
}

export const metadata = {
  title: 'Verify Credible Badge',
  description: 'Verify the authenticity of a Credible Verified badge.',
};

export default async function VerifyBadgePage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  let result: VerifyResponse | null = null;
  try {
    const res = await fetch(`${API_URL}/verify/${encodeURIComponent(hash)}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const body = (await res.json()) as { success: true; data: VerifyResponse };
      result = body.data;
    }
  } catch {
    // ignore — render "not found" below.
  }

  if (!result) {
    return (
      <div className="container-narrow py-12">
        <div className="flex flex-col items-center text-center">
          <ShieldAlert className="h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">Badge Not Found</h1>
        </div>
        <Card className="mt-6 border-destructive/40">
          <CardContent className="pt-6">
            <p className="font-semibold text-destructive">
              We couldn't find a verified business matching this badge.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              The badge ID is invalid, or the business has been removed. If you received
              this link from a business owner, please confirm the URL is correct.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result.status === 'REVOKED') {
    return (
      <div className="container-narrow py-12">
        <div className="flex flex-col items-center text-center">
          <ShieldAlert className="h-12 w-12 text-amber-600" />
          <h1 className="mt-4 text-2xl font-bold">Badge Revoked</h1>
        </div>
        <Card className="mt-6 border-amber-200">
          <CardContent className="pt-6">
            <p>
              <strong>{result.businessName}</strong> had its Credible Verified badge
              revoked on{' '}
              {result.revokedAt
                ? new Date(result.revokedAt).toLocaleDateString()
                : 'an unknown date'}
              . The badge is no longer active.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-narrow py-12">
      {/* ClaimReview structured data — feeds Google fact-check ecosystems. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            claimReviewSchema({
              claimReviewed: `${result.businessName} holds a valid Credible Verified badge of level ${result.badgeType}`,
              claimUrl: result.verificationUrl,
              reviewUrl: `${SITE_URL}/verify/${hash}`,
              verdict: result.status === 'ACTIVE' ? 'Verified' : 'Refuted',
              businessName: result.businessName,
              badgeHash: hash,
              issuedAt: result.issuedAt,
            }),
          ),
        }}
      />

      <div className="flex flex-col items-center text-center">
        <ShieldCheck className="h-12 w-12 text-success" />
        <h1 className="mt-4 text-2xl font-bold">This badge is genuine</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We have verified that this business is currently a Credible Verified partner.
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-lg font-semibold">{result.businessName}</p>
              <VerifiedBadge level={result.badgeType} />
            </div>
          </div>
          <p className="text-sm">
            <span className="text-muted-foreground">Verified level: </span>
            <strong>{VERIFICATION_LEVEL_LABELS[result.badgeType]}</strong>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Issued on: </span>
            {new Date(result.issuedAt).toLocaleDateString()}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Badge ID: </span>
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {hash}
            </code>
          </p>

          {result.verificationUrl && (
            <div className="pt-2">
              <Button asChild>
                <Link href={`/search?q=${encodeURIComponent(result.businessName)}`}>
                  Find more reviews
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
