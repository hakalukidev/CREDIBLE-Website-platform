'use client';

/**
 * RegisterBusinessSection — single-card CTA for the "Register a Business" tab.
 *
 * The launcher opens a creation dialog (`CreateBusinessPageDialog`) so
 * the user can stay on the profile page and complete creation in one
 * flow.
 *
 * The card is only rendered for the signed-in owner.
 */

import { useState } from 'react';
import { Building2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateBusinessPageDialog } from '../create-business-page-dialog';
import type { SwitchMode } from '../page-mode';

export interface RegisterBusinessSectionProps {
  username: string;
  prefill?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  initialMode?: SwitchMode;
}

export function RegisterBusinessSection({
  username,
  prefill,
  initialMode = 'skip-docs',
}: RegisterBusinessSectionProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Card className="space-y-4 p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold">
            Register a business on Credible
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Build a verified business profile, collect reviews, and earn
            trust badges that show up next to your name across the platform.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Button className="gap-1.5" onClick={() => setOpen(true)}>
            Create business page
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
      <CreateBusinessPageDialog
        open={open}
        onOpenChange={setOpen}
        mode={initialMode}
        username={username}
        prefill={prefill}
      />
    </>
  );
}
