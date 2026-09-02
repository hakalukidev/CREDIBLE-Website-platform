'use client';

import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DAY_ORDER,
  dayLabel,
  formatRange,
  getEntry,
  isOpenNow,
  todayKey,
} from '@/lib/business-hours';
import type { BusinessHoursJson } from '@/types/business';
import { cn } from '@/lib/utils';

interface Props {
  hours?: BusinessHoursJson;
  className?: string;
}

/**
 * Public-facing hours-of-operation card. Shows a 7-day table and an
 * "Open now" / "Closed" badge derived from the current local time.
 *
 * Returns `null` when the business has no hours configured at all — no
 * empty card on the page.
 */
export function HoursCard({ hours, className }: Props) {
  const { isOpen, hasHours } = isOpenNow(hours);
  if (!hasHours) return null;
  const today = todayKey();

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
            Hours
          </h3>
          <Badge
            variant={isOpen ? 'default' : 'secondary'}
            className={cn(
              'text-[10px] font-bold uppercase tracking-wide',
              isOpen ? 'bg-success text-success-foreground' : '',
            )}
          >
            {isOpen ? 'Open now' : 'Closed'}
          </Badge>
        </div>
        <dl className="mt-3 space-y-1.5 text-sm">
          {DAY_ORDER.map((day) => {
            const entry = getEntry(hours, day);
            const isToday = day === today;
            return (
              <div
                key={day}
                className={cn(
                  'flex items-baseline justify-between gap-3',
                  isToday ? 'font-medium' : 'text-muted-foreground',
                )}
              >
                <dt>
                  <span>{dayLabel(day)}</span>
                  {isToday && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-primary">
                      Today
                    </span>
                  )}
                </dt>
                <dd className={cn(entry?.closed ? 'text-muted-foreground/70' : '')}>
                  {formatRange(entry)}
                </dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}