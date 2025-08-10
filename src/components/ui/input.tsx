import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'block w-full rounded-xl border border-slate-300 bg-white/70 px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100',
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';
