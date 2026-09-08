'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

function PaymentSuccessPageInner() {
  const search = useSearchParams();
  const tranId = search.get('tran_id');
  const gateway = search.get('gateway');

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <CardTitle>Payment received</CardTitle>
        </div>
        <CardDescription>
          Your subscription is now active. We&rsquo;ll send a confirmation email shortly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {tranId && (
          <p>
            <strong>Transaction ID:</strong> <code>{tranId}</code>
          </p>
        )}
        {gateway && (
          <p>
            <strong>Gateway:</strong> <code>{gateway}</code>
          </p>
        )}
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/business/subscription">Go to subscription</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/business/subscription/invoices">View invoices</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessPageInner />
    </Suspense>
  );
}
