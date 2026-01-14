import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader } from './Loader';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

const loaderSizeMap = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'lg',
      fullWidth = false,
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = `btn btn-${variant} btn-${size}`;
    const widthClass = fullWidth ? 'btn-full' : '';
    const disabledClass = disabled || loading ? 'opacity-70 cursor-not-allowed' : '';

    // Use white loader for buttons with white text
    const loaderVariant = variant === 'primary' || variant === 'danger' ? 'white' : 'primary';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${widthClass} ${disabledClass} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader size={loaderSizeMap[size]} variant={loaderVariant} />
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
