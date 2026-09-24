'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Single form-row primitive used across the auth/profile dialogs.
 * Replaces 4+ inline copies (certification form, profile/account
 * section, both create-* dialogs).
 */
export function Field({ label, error, required, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      <div>{children}</div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
