import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader } from './Loader';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

const sizeStyles = {
  lg: { height: '56px', minHeight: '56px', padding: '0 24px', fontSize: '16px' },
  md: { height: '52px', minHeight: '52px', padding: '0 20px', fontSize: '16px' },
  sm: { height: '44px', minHeight: '44px', padding: '0 16px', fontSize: '14px' },
} as const;

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
      style,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = `btn btn-${variant}`;
    const widthClass = fullWidth ? 'w-full' : '';
    const disabledClass = disabled || loading ? 'opacity-70 cursor-not-allowed' : '';

    // Use white loader for buttons with white text
    const loaderVariant = variant === 'primary' || variant === 'danger' ? 'white' : 'primary';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${widthClass} ${disabledClass} ${className}`}
        style={{ ...sizeStyles[size], ...style }}
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
