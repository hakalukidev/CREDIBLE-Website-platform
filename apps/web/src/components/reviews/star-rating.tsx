import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  outOf?: number;
  className?: string;
  ariaLabel?: string;
}

export function StarRating({ value, outOf = 5, className, ariaLabel }: StarRatingProps) {
  const safeValue = Math.max(0, Math.min(outOf, value));
  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={ariaLabel ?? `${safeValue} out of ${outOf} stars`}
    >
      {Array.from({ length: outOf }).map((_, i) => {
        const filled = safeValue >= i + 1;
        const half = !filled && safeValue >= i + 0.5;
        return (
          <Star
            key={i}
            className={cn(
              'h-4 w-4',
              filled
                ? 'fill-secondary text-secondary'
                : half
                  ? 'fill-secondary/50 text-secondary'
                  : 'fill-transparent text-muted-foreground/40',
            )}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

interface RatingInputProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  name?: string;
}

export function RatingInput({ value, onChange, disabled, name = 'rating' }: RatingInputProps) {
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const active = value >= starValue;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            disabled={disabled}
            onClick={() => onChange(starValue)}
            className="p-0.5 disabled:opacity-50"
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                active ? 'fill-secondary text-secondary' : 'text-muted-foreground/40',
              )}
            />
          </button>
        );
      })}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}