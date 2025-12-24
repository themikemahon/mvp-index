/**
 * Viewport change listeners and orientation handling utilities
 */

import { debounce, throttle } from './responsive';

export type ViewportChangeCallback = (dimensions: { width: number; height: number }) => void;
export type OrientationChangeCallback = (orientation: number) => void;

/**
 * Sets up viewport change listeners with proper debouncing
 */
export function setupViewportListeners(
  onViewportChange: ViewportChangeCallback,
  onOrientationChange?: OrientationChangeCallback,
  debounceMs: number = 100
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op for SSR
  }

  const debouncedViewportChange = debounce((dimensions: { width: number; height: number }) => {
    onViewportChange(dimensions);
  }, debounceMs);

  const debouncedOrientationChange = onOrientationChange ? debounce((orientation: number) => {
    onOrientationChange(orientation);
  }, debounceMs) : undefined;

  // Resize handler
  const handleResize = () => {
    debouncedViewportChange({
      width: window.innerWidth,
      height: window.innerHeight
    });
  };

  // Orientation change handler
  const handleOrientationChange = () => {
    if (debouncedOrientationChange) {
      // @ts-ignore - orientation exists on window in mobile browsers
      const orientation = window.orientation || 0;
      debouncedOrientationChange(orientation);
    }
    
    // Also trigger viewport change after orientation change
    setTimeout(() => {
      handleResize();
    }, 100); // Small delay to ensure dimensions are updated
  };

  // Add event listeners
  window.addEventListener('resize', handleResize, { passive: true });
  
  if (onOrientationChange) {
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true });
  }

  // Visual viewport API support (for mobile keyboards)
  if ('visualViewport' in window && window.visualViewport) {
    const handleVisualViewportChange = () => {
      debouncedViewportChange({
        width: window.visualViewport!.width,
        height: window.visualViewport!.height
      });
    };
    
    window.visualViewport.addEventListener('resize', handleVisualViewportChange, { passive: true });
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
    
    if (onOrientationChange) {
      window.removeEventListener('orientationchange', handleOrientationChange);
    }
    
    if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', handleResize);
    }
  };
}

/**
 * Creates a throttled scroll listener for performance
 */
export function setupScrollListener(
  onScroll: (scrollY: number) => void,
  throttleMs: number = 16 // ~60fps
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op for SSR
  }

  const throttledScroll = throttle(() => {
    onScroll(window.scrollY);
  }, throttleMs);

  window.addEventListener('scroll', throttledScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', throttledScroll);
  };
}

/**
 * Detects if the virtual keyboard is open (mobile)
 */
export function detectVirtualKeyboard(
  onKeyboardToggle: (isOpen: boolean) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op for SSR
  }

  let initialViewportHeight = window.innerHeight;
  const threshold = 150; // Pixels - threshold for keyboard detection

  const handleResize = debounce(() => {
    const currentHeight = window.innerHeight;
    const heightDifference = initialViewportHeight - currentHeight;
    const isKeyboardOpen = heightDifference > threshold;
    
    onKeyboardToggle(isKeyboardOpen);
  }, 100);

  // Update initial height on orientation change
  const handleOrientationChange = () => {
    setTimeout(() => {
      initialViewportHeight = window.innerHeight;
    }, 500); // Wait for orientation change to complete
  };

  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleOrientationChange, { passive: true });

  // Visual Viewport API provides more accurate keyboard detection
  if ('visualViewport' in window && window.visualViewport) {
    const handleVisualViewportChange = () => {
      const heightDifference = window.innerHeight - window.visualViewport!.height;
      const isKeyboardOpen = heightDifference > threshold;
      onKeyboardToggle(isKeyboardOpen);
    };
    
    window.visualViewport.addEventListener('resize', handleVisualViewportChange, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.visualViewport!.removeEventListener('resize', handleVisualViewportChange);
    };
  }

  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleOrientationChange);
  };
}

/**
 * Sets up media query listeners for specific breakpoints
 */
export function setupMediaQueryListener(
  query: string,
  onMatch: (matches: boolean) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op for SSR
  }

  const mediaQuery = window.matchMedia(query);
  
  // Initial check
  onMatch(mediaQuery.matches);
  
  // Listen for changes
  const handleChange = (e: MediaQueryListEvent) => {
    onMatch(e.matches);
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
}