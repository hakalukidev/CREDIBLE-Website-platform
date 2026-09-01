import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
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
