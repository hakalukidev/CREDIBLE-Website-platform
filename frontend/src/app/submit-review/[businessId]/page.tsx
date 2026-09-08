import { SubmitReviewWizard } from '@/features/review/submit-review-wizard';

interface PageProps {
  params: Promise<{ businessId: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function fetchBusinessName(businessId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${API_URL}/businesses/id/${encodeURIComponent(businessId)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { success: true; data: { displayName: string } };
    return json.data.displayName;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { businessId } = await params;
  const name = await fetchBusinessName(businessId);
  return { title: name ? `Review ${name}` : 'Leave a review' };
}

export default async function SubmitReviewPage({ params }: PageProps) {
  const { businessId } = await params;
  const name = await fetchBusinessName(businessId);
  return (
    <div className="container-narrow py-10">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {name ? `Write a review of ${name}` : 'Write a review'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Verified, transparent feedback keeps the community trustworthy.
        </p>
      </header>
      <SubmitReviewWizard
        businessId={businessId}
        businessName={name ?? 'this business'}
      />
    </div>
  );
}