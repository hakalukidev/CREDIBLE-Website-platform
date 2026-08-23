import { ShieldCheck, BadgeCheck, Award, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VERIFICATION_LEVEL_LABELS } from '@credible/shared';

interface VerifiedBadgeProps {
  level: 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  withLabel?: boolean;
}

export function VerifiedBadge({ level, size = 'md', className, withLabel = true }: VerifiedBadgeProps) {
  if (level === 'NONE') return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const Icon =
    level === 'CERTIFIED'
      ? Award
      : level === 'PREMIUM'
        ? ShieldCheck
        : level === 'BASIC'
          ? BadgeCheck
          : ShieldAlert;

  const colorClass =
    level === 'CERTIFIED'
      ? 'text-secondary'
      : level === 'PREMIUM'
        ? 'text-success'
        : 'text-primary';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium',
        className,
      )}
      title={VERIFICATION_LEVEL_LABELS[level]}
    >
      <Icon className={cn(sizeClasses[size], colorClass)} aria-hidden />
      {withLabel && <span className={colorClass}>{VERIFICATION_LEVEL_LABELS[level]}</span>}
    </span>
  );
}