'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function PaymentFailedPage() {
  const search = useSearchParams();
  const tranId = search.get('tran_id');
  const reason = search.get('reason');

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <CardTitle>Payment was not completed</CardTitle>
        </div>
        <CardDescription>
          We couldn&rsquo;t confirm your payment. No money has been charged to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {reason && (
          <p>
            <strong>Reason:</strong> {reason}
          </p>
        )}
        {tranId && (
          <p>
            <strong>Reference:</strong> <code>{tranId}</code>
          </p>
        )}
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/business/subscription/plans">Try again</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/business/subscription">Back to subscription</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}