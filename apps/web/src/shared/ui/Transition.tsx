import { ReactNode, useEffect, useState } from 'react';

interface TransitionProps {
  children: ReactNode;
  show?: boolean;
  appear?: boolean;
  className?: string;
  duration?: number;
  type?: 'fade' | 'slide-up' | 'slide-left' | 'scale';
}

/**
 * Simple CSS transition wrapper
 */
export function Transition({
  children,
  show = true,
  appear = true,
  className = '',
  duration = 200,
  type = 'fade',
}: TransitionProps) {
  const [shouldRender, setShouldRender] = useState(appear ? false : show);
  const [isVisible, setIsVisible] = useState(appear ? false : show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  // Initial appear animation
  useEffect(() => {
    if (appear) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    }
  }, [appear]);

  if (!shouldRender) return null;

  const baseStyles: React.CSSProperties = {
    transition: `all ${duration}ms ease-out`,
  };

  const typeStyles: Record<typeof type, { visible: React.CSSProperties; hidden: React.CSSProperties }> = {
    fade: {
      visible: { opacity: 1 },
      hidden: { opacity: 0 },
    },
    'slide-up': {
      visible: { opacity: 1, transform: 'translateY(0)' },
      hidden: { opacity: 0, transform: 'translateY(16px)' },
    },
    'slide-left': {
      visible: { opacity: 1, transform: 'translateX(0)' },
      hidden: { opacity: 0, transform: 'translateX(16px)' },
    },
    scale: {
      visible: { opacity: 1, transform: 'scale(1)' },
      hidden: { opacity: 0, transform: 'scale(0.95)' },
    },
  };

  const currentStyles = isVisible ? typeStyles[type].visible : typeStyles[type].hidden;

  return (
    <div className={className} style={{ ...baseStyles, ...currentStyles }}>
      {children}
    </div>
  );
}

interface AnimatedStepProps {
  children: ReactNode;
  stepKey: string | number;
  className?: string;
}

/**
 * Animated step transition for multi-step forms
 */
export function AnimatedStep({ children, stepKey, className = '' }: AnimatedStepProps) {
  const [displayedKey, setDisplayedKey] = useState(stepKey);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (stepKey !== displayedKey) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayedKey(stepKey);
        setIsAnimating(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [stepKey, displayedKey]);

  return (
    <div
      className={className}
      style={{
        transition: 'opacity 150ms ease-out, transform 150ms ease-out',
        opacity: isAnimating ? 0 : 1,
        transform: isAnimating ? 'translateX(-8px)' : 'translateX(0)',
      }}
    >
      {children}
    </div>
  );
}
