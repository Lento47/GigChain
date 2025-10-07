/**
 * Optimized React Components with Memoization and Performance Best Practices
 * 
 * This file provides optimized wrappers and HOCs for common components
 */

import React, { memo, lazy, Suspense, useMemo, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Lazy load components with automatic loading fallback
 * 
 * Usage:
 *   const MyComponent = lazyLoad(() => import('./MyComponent'));
 */
export const lazyLoad = (importFunc, fallback = <LoadingSpinner />) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Optimized list rendering with memoization
 * 
 * Usage:
 *   <OptimizedList
 *     items={items}
 *     renderItem={(item) => <Item key={item.id} {...item} />}
 *     keyExtractor={(item) => item.id}
 *   />
 */
export const OptimizedList = memo(({ items, renderItem, keyExtractor, className }) => {
  const renderedItems = useMemo(
    () => items.map((item) => renderItem(item)),
    [items, renderItem]
  );

  return <div className={className}>{renderedItems}</div>;
});

OptimizedList.displayName = 'OptimizedList';

/**
 * Memoized button component to prevent unnecessary re-renders
 * 
 * Usage:
 *   <MemoButton onClick={handleClick} disabled={isLoading}>
 *     Click Me
 *   </MemoButton>
 */
export const MemoButton = memo(({ onClick, children, disabled, className, ...props }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these props change
  return (
    prevProps.onClick === nextProps.onClick &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.className === nextProps.className &&
    prevProps.children === nextProps.children
  );
});

MemoButton.displayName = 'MemoButton';

/**
 * Optimized card component with memoization
 */
export const MemoCard = memo(({ title, content, actions, className }) => {
  return (
    <div className={className}>
      {title && <h3>{title}</h3>}
      {content && <div>{content}</div>}
      {actions && <div>{actions}</div>}
    </div>
  );
});

MemoCard.displayName = 'MemoCard';

/**
 * Debounced input component to reduce re-renders
 * 
 * Usage:
 *   <DebouncedInput
 *     value={searchTerm}
 *     onChange={setSearchTerm}
 *     delay={300}
 *     placeholder="Search..."
 *   />
 */
export const DebouncedInput = memo(({ 
  value, 
  onChange, 
  delay = 300, 
  placeholder,
  className,
  ...props 
}) => {
  const [localValue, setLocalValue] = React.useState(value);
  const timeoutRef = React.useRef(null);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, delay);
  }, [onChange, delay]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
});

DebouncedInput.displayName = 'DebouncedInput';

/**
 * Virtualized list for rendering large datasets efficiently
 * 
 * Only renders visible items to improve performance
 */
export const VirtualizedList = memo(({ 
  items, 
  itemHeight, 
  renderItem, 
  containerHeight = 400,
  className 
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

  const visibleItems = useMemo(
    () => items.slice(visibleStart, visibleEnd + 1),
    [items, visibleStart, visibleEnd]
  );

  const offsetY = visibleStart * itemHeight;
  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div
      className={className}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={visibleStart + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

/**
 * HOC to add error boundary to any component
 * 
 * Usage:
 *   const SafeComponent = withErrorBoundary(MyComponent);
 */
export const withErrorBoundary = (Component, fallback = <div>Something went wrong</div>) => {
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return fallback;
      }

      return <Component {...this.props} />;
    }
  }

  ErrorBoundary.displayName = `ErrorBoundary(${Component.displayName || Component.name})`;
  return ErrorBoundary;
};

/**
 * Custom hook for infinite scroll
 * 
 * Usage:
 *   const { items, loading, hasMore } = useInfiniteScroll(fetchMore);
 */
export const useInfiniteScroll = (callback, options = {}) => {
  const { threshold = 100 } = options;
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  const observer = React.useRef();
  
  const lastElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setLoading(true);
          callback().then((result) => {
            setLoading(false);
            if (result && result.hasMore !== undefined) {
              setHasMore(result.hasMore);
            }
          });
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, callback]
  );

  return { lastElementRef, loading, hasMore };
};

/**
 * Hook for optimized event handlers
 * 
 * Ensures event handlers don't cause unnecessary re-renders
 */
export const useEventCallback = (fn) => {
  const ref = React.useRef(fn);

  React.useLayoutEffect(() => {
    ref.current = fn;
  });

  return useCallback((...args) => {
    const currentFn = ref.current;
    return currentFn(...args);
  }, []);
};

export default {
  lazyLoad,
  OptimizedList,
  MemoButton,
  MemoCard,
  DebouncedInput,
  VirtualizedList,
  withErrorBoundary,
  useInfiniteScroll,
  useEventCallback
};
