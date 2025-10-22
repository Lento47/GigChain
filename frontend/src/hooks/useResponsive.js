import { useState, useEffect } from 'react';

// Responsive breakpoints
const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
  wide: 1536
};

export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const [orientation, setOrientation] = useState(
    typeof window !== 'undefined' && window.innerWidth > window.innerHeight 
      ? 'landscape' 
      : 'portrait'
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    // Debounce resize events for better performance
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Responsive utilities
  const isMobile = screenSize.width <= BREAKPOINTS.mobile;
  const isTablet = screenSize.width <= BREAKPOINTS.tablet && screenSize.width > BREAKPOINTS.mobile;
  const isLaptop = screenSize.width <= BREAKPOINTS.laptop && screenSize.width > BREAKPOINTS.tablet;
  const isDesktop = screenSize.width <= BREAKPOINTS.desktop && screenSize.width > BREAKPOINTS.laptop;
  const isWide = screenSize.width > BREAKPOINTS.desktop;

  // Touch device detection
  const isTouchDevice = typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Mobile-first helpers
  const isMobileDevice = isMobile || isTablet;
  const isDesktopDevice = isLaptop || isDesktop || isWide;

  // Current breakpoint
  const getCurrentBreakpoint = () => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    if (isLaptop) return 'laptop';
    if (isDesktop) return 'desktop';
    return 'wide';
  };

  // Grid columns based on screen size
  const getGridColumns = (mobile = 1, tablet = 2, laptop = 3, desktop = 4) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    if (isLaptop) return laptop;
    return desktop;
  };

  // Safe area insets for mobile devices
  const getSafeAreaInsets = () => {
    if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };
    
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0,
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0
    };
  };

  return {
    // Screen size data
    screenSize,
    orientation,
    
    // Breakpoint booleans
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
    isWide,
    
    // Device type helpers
    isTouchDevice,
    isMobileDevice,
    isDesktopDevice,
    
    // Utility functions
    getCurrentBreakpoint,
    getGridColumns,
    getSafeAreaInsets,
    
    // Breakpoint constants
    breakpoints: BREAKPOINTS
  };
};

// Hook for media queries
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

// Hook for container queries (polyfill for better browser support)
export const useContainerQuery = (containerRef, query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        // Simple query parser (extend as needed)
        if (query.includes('min-width')) {
          const minWidth = parseInt(query.match(/min-width:\s*(\d+)px/)?.[1]) || 0;
          setMatches(width >= minWidth);
        } else if (query.includes('max-width')) {
          const maxWidth = parseInt(query.match(/max-width:\s*(\d+)px/)?.[1]) || Infinity;
          setMatches(width <= maxWidth);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, query]);

  return matches;
};

// Touch gesture hook
export const useSwipeGesture = (onSwipeLeft, onSwipeRight, threshold = 50) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
};

export default useResponsive;
