import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import React from 'react';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center rounded-xl text-sm font-medium transition active:scale-[.99] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
  {
    variants: {
      variant: {
        default: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200',
        outline: 'border border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
        gradient: 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white hover:from-indigo-500 hover:to-sky-500',
        glow: 'text-white shadow-[0_0_0_0_rgba(0,0,0,0)] hover:shadow-[0_8px_24px_-8px_rgba(79,70,229,0.6)] bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-600 hover:from-indigo-500 hover:to-sky-500',
        ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-5',
        xl: 'h-12 px-6',
      },
      spark: {
        true: '',
        false: '',
      },
    },
    defaultVariants: { variant: 'default', size: 'md', spark: false },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  variant?: NonNullable<VariantProps<typeof buttonVariants>['variant']>;
  size?: NonNullable<VariantProps<typeof buttonVariants>['size']>;
  spark?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, spark = false, children, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants({ variant, size, spark }), className)} {...props}>
        <span className="relative z-10">{children}</span>
        {spark ? (
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
            <span className="absolute -inset-20 animate-[spin_6s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(59,130,246,0.35)_310deg,transparent_360deg)]" />
          </span>
        ) : null}
      </button>
    );
  }
);
Button.displayName = 'Button';
