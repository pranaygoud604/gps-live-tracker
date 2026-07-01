import { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'motion';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hoverable = false, glow = false, padding = 'md', as = 'div', ...props }, ref) => {
    const baseClass = cn(
      'glass rounded-2xl',
      paddingStyles[padding],
      hoverable && 'card-hover cursor-pointer',
      glow && 'shadow-glow-sm',
      className,
    );

    if (as === 'motion') {
      return (
        <motion.div
          ref={ref}
          className={baseClass}
          {...(props as HTMLMotionProps<'div'>)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseClass} {...props}>
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-sm font-semibold text-slate-200 tracking-wide uppercase', className)} {...props}>
      {children}
    </h3>
  );
}
