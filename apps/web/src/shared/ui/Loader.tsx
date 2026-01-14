interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'white';
  className?: string;
}

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function Loader({ size = 'md', variant = 'primary', className = '' }: LoaderProps) {
  const color = variant === 'white' ? '#ffffff' : '#3182F6';
  const secondaryColor = variant === 'white' ? 'rgba(255,255,255,0.4)' : 'rgba(49,130,246,0.3)';

  return (
    <svg
      className={`animate-pulse-grow ${sizeClasses[size]} ${className}`}
      viewBox="0 0 32 32"
      fill="none"
    >
      {/* Growth chart line */}
      <path
        d="M6 20 L10 17 L14 19 L22 11"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="animate-draw-line"
      />

      {/* Arrow head */}
      <path
        d="M18 11 L22 11 L22 15"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="animate-draw-line"
      />

      {/* Periodic dots with staggered animation */}
      <circle cx="6" cy="26" r="2" fill={secondaryColor} className="animate-dot-1" />
      <circle cx="12" cy="26" r="2" fill={secondaryColor} className="animate-dot-2" />
      <circle cx="18" cy="26" r="2" fill={color} className="animate-dot-3" />
    </svg>
  );
}
