import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  onVisible?: () => void;
}

const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = <div className="animate-pulse bg-slate-800 rounded-lg h-32"></div>,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  onVisible
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasBeenVisible(true);
          // Call onVisible callback if provided
          if (onVisible) {
            onVisible();
          }
          // Disconnect observer after first intersection
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, onVisible]);

  return (
    <div ref={elementRef} className={className}>
      {hasBeenVisible ? children : fallback}
    </div>
  );
};

export default LazyWrapper;
