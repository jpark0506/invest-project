import { ReactNode } from 'react';

/**
 * Full page loading spinner
 */
export function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

/**
 * Section/Card loading spinner
 */
export function SectionLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  );
}

/**
 * Skeleton loader for content placeholders
 */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-border/50';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

/**
 * Card skeleton for loading states
 */
export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-4">
      <Skeleton variant="text" className="w-1/3 h-5" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-4/5" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
    </div>
  );
}

/**
 * List skeleton for loading states
 */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-1/2 h-4" />
            <Skeleton variant="text" className="w-1/4 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Error fallback component
 */
interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  message?: string;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  message = '문제가 발생했습니다',
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-4xl mb-4">😥</div>
      <p className="text-text-primary font-medium mb-2">{message}</p>
      {error && (
        <p className="text-text-secondary text-sm mb-4">{error.message}</p>
      )}
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="btn-secondary btn-sm"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

/**
 * Loading wrapper that shows skeleton while data is loading
 */
interface LoadingWrapperProps {
  isLoading: boolean;
  skeleton?: ReactNode;
  children: ReactNode;
}

export function LoadingWrapper({
  isLoading,
  skeleton = <SectionLoader />,
  children,
}: LoadingWrapperProps) {
  if (isLoading) {
    return <>{skeleton}</>;
  }
  return <>{children}</>;
}
