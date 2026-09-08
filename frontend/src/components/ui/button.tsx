import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] will-change-transform',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm shadow-primary/30 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm shadow-secondary/25 hover:bg-secondary/90 hover:shadow-md hover:shadow-secondary/25',
        outline:
          'border border-border bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:bg-primary/5 hover:text-primary shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm shadow-destructive/30 hover:bg-destructive/90',
        success:
          'bg-success text-success-foreground shadow-sm shadow-success/30 hover:bg-success/90',
        link: 'text-primary underline-offset-4 hover:underline rounded-sm',
        'gradient-primary':
          'bg-gradient-to-br from-brand-600 via-primary to-brand-500 text-white shadow-md shadow-brand-600/30 hover:shadow-lg hover:shadow-brand-600/40 hover:brightness-110 bg-[length:200%_200%] anim-gradient hover:bg-gradient-to-br',
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
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

/**
 * Find the first valid React element among children. We avoid the Radix Slot
 * pattern entirely because the `asChild` consumers in this project (Next.js
 * `<Link>`, plain `<a>`, etc.) don't need its Slottable/escape-hatch machinery.
 * Instead we clone the element and forward our classes/ref/handlers onto it.
 */
function findSingleChild(children: React.ReactNode): React.ReactElement | null {
  let found: React.ReactElement | null = null;
  React.Children.forEach(children, (child) => {
    if (found) return;
    if (React.isValidElement(child)) found = child;
  });
  return found;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, type, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className);

    // asChild: merge our props onto the consumer's single child element.
    if (asChild) {
      const child = findSingleChild(children);
      if (!child) {
        // Defensive fallback: no valid child to project onto, render a real <button>.
        return (
          <button className={classes} ref={ref} type={type ?? 'button'} {...props}>
            {children}
          </button>
        );
      }
      const childProps = (child.props ?? {}) as Record<string, unknown>;
      const mergedProps: Record<string, unknown> = { ...props, className: classes };
      // Preserve the child's own className by appending ours.
      if (typeof childProps.className === 'string' && childProps.className) {
        mergedProps.className = cn(classes, childProps.className);
      }
      // Forward the ref onto the child element when possible.
      if (ref) mergedProps.ref = ref;
      return React.cloneElement(child, mergedProps);
    }

    const spinner = loading ? (
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
    ) : null;

    return (
      <button
        className={classes}
        ref={ref}
        type={type ?? 'button'}
        disabled={disabled || loading}
        {...props}
      >
        {spinner}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };