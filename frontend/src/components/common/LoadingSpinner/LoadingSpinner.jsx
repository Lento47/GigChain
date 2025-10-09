import React from 'react';

export const LoadingSpinner = ({ size = 'medium', message = 'Cargando...', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`loading-container ${className}`}>
      <div className={`loading-spinner ${sizeClasses[size]}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {message && (
        <p className="loading-message">{message}</p>
      )}
    </div>
  );
};

export const SkeletonLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={`skeleton-loader ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="skeleton-line" style={{ 
          width: `${Math.random() * 40 + 60}%`,
          animationDelay: `${index * 0.1}s`
        }}></div>
      ))}
    </div>
  );
};

export const MetricSkeleton = () => {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <div className="skeleton-circle"></div>
        <div className="skeleton-small"></div>
      </div>
      <div className="metric-content">
        <div className="skeleton-medium"></div>
        <div className="skeleton-large"></div>
        <div className="skeleton-progress"></div>
        <div className="skeleton-small"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
