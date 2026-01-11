import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-text-secondary text-xs font-medium mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`input ${error ? 'border-error' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-2 text-error text-xs">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
