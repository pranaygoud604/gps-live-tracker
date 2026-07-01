import { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  glowing?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 hover:bg-brand-500 text-white border-brand-500/30',
  secondary: 'bg-white/8 hover:bg-white/12 text-white border-white/10',
  ghost: 'bg-transparent hover:bg-white/8 text-slate-300 hover:text-white border-transparent',
  danger: 'bg-red-600 hover:bg-red-500 text-white border-red-500/30',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30',
  warning: 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500/30',
};

const glowStyles: Record<ButtonVariant, string> = {
  primary: 'btn-glow',
  secondary: '',
  ghost: '',
  danger: 'btn-glow-red',
  success: 'btn-glow-green',
  warning: '',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
  xl: 'h-14 px-8 text-lg rounded-2xl gap-3',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      glowing = false,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled ? {} : { scale: 0.97 }}
        whileHover={isDisabled ? {} : { scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(
          'relative inline-flex items-center justify-center font-medium border',
          'transition-all duration-200 cursor-pointer select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          glowing && glowStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className,
        )}
        disabled={isDisabled}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
