'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface UsageMeterProps {
  month: string;
  used: number;
  limit: number;
  label: string;
}

export function UsageMeter({ month, used, limit, label }: UsageMeterProps) {
  const pct = limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const tone = pct >= 90 ? 'bg-destructive' : pct >= 75 ? 'bg-amber-500' : 'bg-primary';
  const isUnlimited = !Number.isFinite(limit) || limit >= Number.MAX_SAFE_INTEGER;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {used.toLocaleString()}
          {isUnlimited ? '' : ` / ${limit.toLocaleString()}`}
          {isUnlimited && <Sparkles className="ml-1 inline h-3 w-3 text-amber-500" />}
        </span>
      </div>
      <Progress value={pct} className={tone} />
      <p className="text-xs text-muted-foreground">
        {month} ·{' '}
        {isUnlimited
          ? 'Unlimited on your plan'
          : `${limit - used > 0 ? `${(limit - used).toLocaleString()} left` : 'Limit reached'}`}
      </p>
    </div>
  );
}

interface UsageMetersCardProps {
  month: string;
  metrics: Array<{ used: number; limit: number; label: string }>;
}

export function UsageMetersCard({ month, metrics }: UsageMetersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>This month&rsquo;s usage</CardTitle>
        <CardDescription>Counters reset on the first day of every month.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((m) => (
          <UsageMeter key={m.label} month={month} used={m.used} limit={m.limit} label={m.label} />
        ))}
      </CardContent>
    </Card>
  );
}