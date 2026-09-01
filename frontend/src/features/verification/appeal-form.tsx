'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/input';
import { appealVerificationSchema } from '@credible/shared';
import { useAppealApplication, extractError } from './verification-hooks';

interface Props {
  businessId: string;
  applicationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormValues = z.infer<typeof appealVerificationSchema>;

export function AppealForm({ businessId, applicationId, open, onOpenChange }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(appealVerificationSchema),
    defaultValues: { reason: '' },
  });
  const appeal = useAppealApplication(businessId, applicationId);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await appeal.mutateAsync(values.reason);
      toast.success('Appeal submitted — our team will re-review your case');
      onOpenChange(false);
      form.reset();
    } catch (err) {
      toast.error(extractError(err).message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit an appeal</DialogTitle>
          <DialogDescription>
            Briefly explain why you believe the decision should be reconsidered. You can
            also re-upload additional documents from the application page once it's
            reopened.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="reason">Reason for appeal</Label>
            <Textarea
              id="reason"
              rows={5}
              placeholder="Tell us what changed or what we may have missed…"
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={appeal.isPending}>
              Submit appeal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
