'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EditReviewForm } from '@/features/review/edit-review-form';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{ reviewId: string }>;
}

export default function EditReviewPage({ params }: PageProps) {
  const { reviewId } = use(params);
  return (
    <div className="container-narrow py-10 space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/account/reviews">
          <ArrowLeft className="h-4 w-4" /> Back to your reviews
        </Link>
      </Button>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Edit your review</h1>
      </header>
      <EditReviewForm reviewId={reviewId} />
    </div>
  );
}