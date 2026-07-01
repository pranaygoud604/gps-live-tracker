import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'brand';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  danger: 'bg-red-500/15 text-red-400 border-red-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  neutral: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  brand: 'bg-brand-500/15 text-brand-400 border-brand-500/20',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-emerald-400',
  danger: 'bg-red-400',
  warning: 'bg-amber-400',
  info: 'bg-blue-400',
  neutral: 'bg-slate-400',
  brand: 'bg-brand-400',
};

const sizeStyles = {
  sm: 'text-2xs px-1.5 py-0.5 rounded-md gap-1',
  md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5',
};

export function Badge({
  variant = 'neutral',
  dot = false,
  pulse = false,
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className={cn('relative flex-shrink-0 w-1.5 h-1.5 rounded-full', dotColors[variant])}>
          {pulse && (
            <span
              className={cn(
                'absolute inset-0 rounded-full animate-ping opacity-75',
                dotColors[variant],
              )}
            />
          )}
        </span>
      )}
      {children}
    </span>
  );
}
