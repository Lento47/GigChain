import React from 'react';
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import SkeletonLoader, { SkeletonCard, SkeletonTable, SkeletonChart, SkeletonDashboard } from './SkeletonLoader';
import './LoadingStates.css';

// Enhanced Loading Spinner
export const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  message = 'Loading...', 
  showMessage = true,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'loading-spinner-sm',
    md: 'loading-spinner-md', 
    lg: 'loading-spinner-lg',
    xl: 'loading-spinner-xl'
  };

  const colorClasses = {
    primary: 'loading-spinner-primary',
    secondary: 'loading-spinner-secondary',
    success: 'loading-spinner-success',
    warning: 'loading-spinner-warning',
    error: 'loading-spinner-error'
  };

  return (
    <div className={`loading-spinner-container ${className}`} role="status" aria-live="polite">
      <div className={`loading-spinner ${sizeClasses[size]} ${colorClasses[color]}`}>
        <Loader2 className="animate-spin" />
      </div>
      {showMessage && (
        <span className="loading-message" aria-label={message}>
          {message}
        </span>
      )}
    </div>
  );
};

// Button Loading State
export const ButtonLoading = ({ 
  children, 
  loading = false, 
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  loadingText = 'Loading...',
  ...props 
}) => {
  const baseClasses = `btn-loading btn-${variant} btn-${size}`;
  const stateClasses = loading ? 'loading' : '';
  
  return (
    <button
      className={`${baseClasses} ${stateClasses} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-label={loading ? loadingText : undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Page Loading State
export const PageLoading = ({ 
  type = 'spinner',
  message = 'Loading page...',
  showProgress = false,
  progress = 0 
}) => {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <div className="page-loading-content">
        {type === 'skeleton' ? (
          <SkeletonDashboard />
        ) : (
          <>
            <LoadingSpinner size="lg" message={message} />
            {showProgress && (
              <div className="loading-progress">
                <div className="loading-progress-bar">
                  <div 
                    className="loading-progress-fill" 
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                  />
                </div>
                <span className="loading-progress-text">{progress}%</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Inline Loading State
export const InlineLoading = ({ 
  message = 'Loading...', 
  size = 'sm',
  showSpinner = true 
}) => (
  <div className="inline-loading" role="status" aria-live="polite">
    {showSpinner && <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />}
    <span>{message}</span>
  </div>
);

// Success State
export const SuccessState = ({ 
  message = 'Success!', 
  description = null,
  showIcon = true,
  className = '' 
}) => (
  <div className={`success-state ${className}`} role="status" aria-live="polite">
    {showIcon && <CheckCircle className="success-icon" size={24} />}
    <div className="success-content">
      <span className="success-message">{message}</span>
      {description && <p className="success-description">{description}</p>}
    </div>
  </div>
);

// Error State
export const ErrorState = ({ 
  message = 'Something went wrong', 
  description = null,
  onRetry = null,
  showIcon = true,
  className = '' 
}) => (
  <div className={`error-state ${className}`} role="alert" aria-live="assertive">
    {showIcon && <AlertCircle className="error-icon" size={24} />}
    <div className="error-content">
      <span className="error-message">{message}</span>
      {description && <p className="error-description">{description}</p>}
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="btn-secondary btn-sm error-retry"
          type="button"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  </div>
);

// Empty State
export const EmptyState = ({ 
  icon: Icon = null,
  title = 'No data available',
  description = 'There\'s nothing to show here yet.',
  action = null,
  className = '' 
}) => (
  <div className={`empty-state ${className}`} role="status">
    {Icon && <Icon className="empty-state-icon" size={48} />}
    <div className="empty-state-content">
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  </div>
);

// Refresh Loading State
export const RefreshLoading = ({ 
  isRefreshing = false,
  onRefresh = null,
  lastUpdated = null,
  className = ''
}) => {
  const handleRefresh = () => {
    if (onRefresh && !isRefreshing) {
      onRefresh();
    }
  };

  return (
    <div className={`refresh-loading ${className}`}>
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="refresh-button"
        aria-label={isRefreshing ? 'Refreshing...' : 'Refresh data'}
        type="button"
      >
        <RefreshCw 
          size={16} 
          className={`refresh-icon ${isRefreshing ? 'animate-spin' : ''}`} 
        />
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </button>
      {lastUpdated && (
        <span className="last-updated">
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

// Export all loading states
export {
  SkeletonLoader,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonDashboard
};
