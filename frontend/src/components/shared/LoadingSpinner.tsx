import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
  xl: 'w-16 h-16 border-[3px]',
};

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full border-white/10 border-t-brand-500 animate-spin',
        sizeMap[size],
        className,
      )}
    />
  );
}

export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-white/5 border-t-brand-500 animate-spin" />
        <div
          className="absolute inset-2 rounded-full border-2 border-white/5 border-b-violet-500 animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
        />
      </div>
      {label && <p className="text-sm text-slate-400 animate-pulse">{label}</p>}
    </div>
  );
}
