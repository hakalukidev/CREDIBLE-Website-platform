import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VERIFICATION_STAGES } from '@credible/shared';

interface ApplicationProgressProps {
  current: string; // VerificationStatus
  className?: string;
}

const ORDER = ['PENDING', 'DOCUMENTS_UPLOADED', 'AUTO_CHECKING', 'HUMAN_REVIEW_REQUIRED', 'APPROVED'];

export function ApplicationProgress({ current, className }: ApplicationProgressProps) {
  const currentIdx = ORDER.indexOf(current);
  const isRejected = current === 'REJECTED';

  return (
    <ol className={cn('grid gap-4 sm:grid-cols-5', className)}>
      {VERIFICATION_STAGES.map((stage, idx) => {
        const stageIdx = ORDER.indexOf(stage.key as (typeof ORDER)[number]);
        const status =
          isRejected && idx === ORDER.length - 1
            ? 'rejected'
            : stageIdx < currentIdx
              ? 'complete'
              : stageIdx === currentIdx
                ? 'current'
                : 'upcoming';
        const Icon =
          status === 'complete'
            ? CheckCircle2
            : status === 'current'
              ? Clock
              : Circle;

        const color =
          status === 'complete'
            ? 'text-success'
            : status === 'current'
              ? 'text-primary'
              : status === 'rejected'
                ? 'text-destructive'
                : 'text-muted-foreground/40';

        return (
          <li key={stage.key} className="flex flex-col gap-2 rounded-md border bg-card p-3">
            <Icon className={cn('h-5 w-5', color)} aria-hidden />
            <p className="text-sm font-medium leading-tight">{stage.label}</p>
            <p className="text-xs text-muted-foreground leading-snug">{stage.description}</p>
          </li>
        );
      })}
    </ol>
  );
}