import { OwnerReviewsList } from '@/components/business/reviews-list';

export const metadata = { title: 'Reviews · Business dashboard' };

export default function BusinessReviewsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Respond to your reviewers and report anything that doesn't meet our community guidelines.
        </p>
      </header>
      <OwnerReviewsList />
    </div>
  );
}