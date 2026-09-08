'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Calls `window.print()` — hidden in print stylesheets via `@media print`. */
export function PrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="mr-1.5 h-4 w-4" />
      Print
    </Button>
  );
}
