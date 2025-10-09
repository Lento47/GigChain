/**
 * OptimizedImage Component
 * =========================
 * 
 * Lazy-loaded image with blur placeholder and error handling.
 * Improves initial page load performance.
 * 
 * Usage:
 * <OptimizedImage
 *   src="/images/logo.png"
 *   alt="Logo"
 *   width={200}
 *   height={100}
 * />
 */

import React, { useState, useEffect, useRef } from 'react';
import './OptimizedImage.css';

export const OptimizedImage = React.memo(({
  src,
  alt = '',
  width,
  height,
  placeholder = 'blur',
  className = '',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  return (
    <div
      ref={imgRef}
      className={`optimized-image ${className}`}
      style={{ width, height, position: 'relative' }}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="optimized-image-placeholder">
          <div className="optimized-image-skeleton" />
        </div>
      )}

      {/* Actual Image */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          className={`optimized-image-img ${isLoaded ? 'loaded' : ''}`}
        />
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className="optimized-image-error">
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
