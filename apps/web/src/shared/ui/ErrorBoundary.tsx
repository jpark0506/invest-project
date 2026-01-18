import { Component, ReactNode } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorFallback } from './Loading';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryInner extends Component<
  ErrorBoundaryProps & { resetErrorBoundary: () => void },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { resetErrorBoundary: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.resetErrorBoundary();
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorFallback
          error={this.state.error ?? undefined}
          resetErrorBoundary={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * ErrorBoundary that integrates with TanStack Query
 * Automatically resets query errors when the boundary resets
 */
export function QueryErrorBoundary({ children, fallback, onReset }: ErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundaryInner
          resetErrorBoundary={reset}
          fallback={fallback}
          onReset={onReset}
        >
          {children}
        </ErrorBoundaryInner>
      )}
    </QueryErrorResetBoundary>
  );
}
