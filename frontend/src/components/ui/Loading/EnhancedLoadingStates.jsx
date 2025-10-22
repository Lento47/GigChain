import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import './EnhancedLoadingStates.css';

// Progressive Loading Component
export const ProgressiveLoading = ({ 
  steps = [],
  currentStep = 0,
  showProgress = true,
  showStepLabels = true,
  className = ''
}) => {
  const progress = steps.length > 0 ? (currentStep / steps.length) * 100 : 0;
  
  return (
    <div className={`progressive-loading ${className}`} role="progressbar" aria-live="polite">
      <div className="progressive-loading-content">
        <div className="progressive-loading-icon">
          <Loader2 className="animate-spin" size={32} />
        </div>
        
        {showProgress && (
          <div className="progressive-loading-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              />
            </div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
        )}
        
        {showStepLabels && steps.length > 0 && (
          <div className="progressive-loading-steps">
            <div className="current-step">
              {currentStep < steps.length ? steps[currentStep] : 'Complete'}
            </div>
            <div className="step-counter">
              Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Shimmer Loading Effect
export const ShimmerLoading = ({ 
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = ''
}) => (
  <div 
    className={`shimmer-loading ${className}`}
    style={{ width, height, borderRadius }}
    role="progressbar"
    aria-label="Loading content..."
  >
    <div className="shimmer-effect" />
  </div>
);

// Pulse Loading Effect
export const PulseLoading = ({ 
  size = 'md',
  color = 'primary',
  children,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'pulse-loading-sm',
    md: 'pulse-loading-md',
    lg: 'pulse-loading-lg'
  };
  
  return (
    <div className={`pulse-loading ${sizeClasses[size]} pulse-${color} ${className}`}>
      {children}
    </div>
  );
};

// Dots Loading Animation
export const DotsLoading = ({ 
  size = 'md',
  color = 'primary',
  count = 3,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'dots-loading-sm',
    md: 'dots-loading-md',
    lg: 'dots-loading-lg'
  };
  
  return (
    <div className={`dots-loading ${sizeClasses[size]} dots-${color} ${className}`} role="status">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="dot" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Skeleton Text with Animation
export const SkeletonText = ({ 
  lines = 1,
  width = ['100%'],
  height = '1em',
  spacing = '0.5em',
  className = ''
}) => {
  const widths = Array.isArray(width) ? width : [width];
  
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="skeleton-text-line"
          style={{
            width: widths[i % widths.length],
            height,
            marginBottom: i < lines - 1 ? spacing : 0
          }}
        />
      ))}
    </div>
  );
};

// Enhanced Skeleton Card
export const EnhancedSkeletonCard = ({ 
  showAvatar = true,
  showImage = false,
  showActions = true,
  imageHeight = '200px',
  className = ''
}) => (
  <div className={`enhanced-skeleton-card ${className}`}>
    {showImage && (
      <div className="skeleton-card-image" style={{ height: imageHeight }}>
        <ShimmerLoading width="100%" height="100%" borderRadius="8px 8px 0 0" />
      </div>
    )}
    
    <div className="skeleton-card-content">
      <div className="skeleton-card-header">
        {showAvatar && (
          <ShimmerLoading width="48px" height="48px" borderRadius="50%" />
        )}
        <div className="skeleton-card-title">
          <SkeletonText lines={1} width={['70%']} height="1.2em" />
          <SkeletonText lines={1} width={['50%']} height="1em" />
        </div>
      </div>
      
      <div className="skeleton-card-body">
        <SkeletonText lines={3} width={['100%', '90%', '60%']} />
      </div>
      
      {showActions && (
        <div className="skeleton-card-actions">
          <ShimmerLoading width="80px" height="36px" borderRadius="6px" />
          <ShimmerLoading width="100px" height="36px" borderRadius="6px" />
        </div>
      )}
    </div>
  </div>
);

// Loading Overlay
export const LoadingOverlay = ({ 
  show = false,
  message = 'Loading...',
  backdrop = true,
  children,
  className = ''
}) => {
  if (!show) return children;
  
  return (
    <div className={`loading-overlay ${className}`}>
      {children}
      <div className={`loading-overlay-backdrop ${backdrop ? 'with-backdrop' : ''}`}>
        <div className="loading-overlay-content">
          <Loader2 className="animate-spin" size={32} />
          <span className="loading-overlay-message">{message}</span>
        </div>
      </div>
    </div>
  );
};

// Connection Status Loading
export const ConnectionLoading = ({ 
  isConnected = true,
  isConnecting = false,
  onRetry = null,
  className = ''
}) => {
  if (isConnected && !isConnecting) return null;
  
  return (
    <div className={`connection-loading ${className}`} role="status">
      <div className="connection-loading-content">
        {isConnecting ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <WifiOff size={20} />
            <span>Connection lost</span>
            {onRetry && (
              <button onClick={onRetry} className="retry-button">
                <RefreshCw size={16} />
                Retry
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Smart Loading Component that adapts based on content type
export const SmartLoading = ({ 
  type = 'auto',
  content = null,
  isLoading = true,
  error = null,
  retry = null,
  className = ''
}) => {
  if (error) {
    return (
      <div className={`smart-loading error ${className}`} role="alert">
        <AlertCircle size={24} />
        <span>{error}</span>
        {retry && (
          <button onClick={retry} className="retry-button">
            <RefreshCw size={16} />
            Try Again
          </button>
        )}
      </div>
    );
  }
  
  if (!isLoading) {
    return content;
  }
  
  // Auto-detect loading type based on content
  if (type === 'auto') {
    if (React.isValidElement(content)) {
      const elementType = content.type?.name || content.type;
      
      if (elementType === 'table' || content.props?.className?.includes('table')) {
        type = 'table';
      } else if (content.props?.className?.includes('card')) {
        type = 'card';
      } else if (content.props?.className?.includes('list')) {
        type = 'list';
      } else {
        type = 'text';
      }
    } else {
      type = 'spinner';
    }
  }
  
  const loadingComponents = {
    spinner: <DotsLoading />,
    text: <SkeletonText lines={3} />,
    card: <EnhancedSkeletonCard />,
    table: <SkeletonText lines={5} width={['100%', '90%', '80%', '95%', '85%']} />,
    list: <SkeletonText lines={4} width={['80%', '70%', '90%', '60%']} />
  };
  
  return (
    <div className={`smart-loading ${type} ${className}`}>
      {loadingComponents[type] || loadingComponents.spinner}
    </div>
  );
};

// Lazy Loading Component
export const LazyLoading = ({ 
  children,
  fallback = <DotsLoading />,
  threshold = 0.1,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState(null);
  
  useEffect(() => {
    if (!ref) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    
    observer.observe(ref);
    
    return () => observer.disconnect();
  }, [ref, threshold]);
  
  return (
    <div ref={setRef} className={`lazy-loading ${className}`}>
      {isVisible ? children : fallback}
    </div>
  );
};

// Loading Button with States
export const LoadingButton = ({ 
  children,
  loading = false,
  success = false,
  error = false,
  disabled = false,
  loadingText = 'Loading...',
  successText = 'Success!',
  errorText = 'Error',
  onClick,
  className = '',
  ...props
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  
  useEffect(() => {
    if (success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  const getContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="animate-spin" size={16} />
          {loadingText}
        </>
      );
    }
    
    if (showSuccess) {
      return (
        <>
          <CheckCircle size={16} />
          {successText}
        </>
      );
    }
    
    if (error) {
      return (
        <>
          <AlertCircle size={16} />
          {errorText}
        </>
      );
    }
    
    return children;
  };
  
  return (
    <button
      className={`loading-button ${loading ? 'loading' : ''} ${showSuccess ? 'success' : ''} ${error ? 'error' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {getContent()}
    </button>
  );
};

export default {
  ProgressiveLoading,
  ShimmerLoading,
  PulseLoading,
  DotsLoading,
  SkeletonText,
  EnhancedSkeletonCard,
  LoadingOverlay,
  ConnectionLoading,
  SmartLoading,
  LazyLoading,
  LoadingButton
};
