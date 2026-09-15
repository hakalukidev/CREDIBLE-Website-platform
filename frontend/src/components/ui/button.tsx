import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'relative inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full text-sm font-medium transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out-quart focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 will-change-transform active:scale-[0.97]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/95 hover:shadow-md hover:shadow-primary/35 hover:brightness-[1.03] hover:scale-[1.03]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm shadow-secondary/25 hover:bg-secondary/95 hover:shadow-md hover:shadow-secondary/35 hover:brightness-[1.03] hover:scale-[1.03]',
        outline:
          'border border-border bg-card/60 text-foreground backdrop-blur-sm hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:scale-[1.03] shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground hover:scale-[1.03]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm shadow-destructive/25 hover:bg-destructive/95 hover:brightness-[1.03] hover:scale-[1.03]',
        success:
          'bg-success text-success-foreground shadow-sm shadow-success/25 hover:bg-success/95 hover:brightness-[1.03] hover:scale-[1.03]',
        link: 'text-primary underline-offset-4 hover:underline rounded-sm hover:scale-[1.02]',
        'gradient-primary':
          'bg-gradient-to-br from-brand-600 via-primary to-brand-500 text-white shadow-md shadow-brand-600/30 hover:shadow-lg hover:shadow-brand-600/40 hover:brightness-110 hover:scale-[1.03] bg-[length:200%_200%] anim-gradient hover:bg-gradient-to-br',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-7 text-[15px]',
        'icon-sm': 'h-9 w-9',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, type, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className);

    if (asChild) {
      return (
        <Slot className={classes} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={classes}
        ref={ref}
        type={type ?? 'button'}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };