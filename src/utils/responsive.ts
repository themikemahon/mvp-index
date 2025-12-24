/**
 * Responsive breakpoint system and utilities
 */

import { 
  ResponsiveBreakpoints, 
  ViewportSize, 
  Orientation, 
  ViewportDimensions,
  ResponsiveLayoutState 
} from '@/types/responsive';

// Mobile-first responsive breakpoints
export const BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: { min: 320, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: Infinity }
};

// Minimum touch target size for accessibility (44px)
export const MIN_TOUCH_TARGET_SIZE = 44;

// Transition timing for smooth layout changes
export const LAYOUT_TRANSITION_DURATION = 300; // ms

/**
 * Determines viewport category based on width
 */
export function getViewportSize(width: number): ViewportSize {
  if (width >= BREAKPOINTS.desktop.min) {
    return 'desktop';
  } else if (width >= BREAKPOINTS.tablet.min) {
    return 'tablet';
  } else {
    return 'mobile';
  }
}

/**
 * Determines device orientation
 */
export function getOrientation(width: number, height: number): Orientation {
  return width > height ? 'landscape' : 'portrait';
}

/**
 * Gets current viewport dimensions
 */
export function getViewportDimensions(): ViewportDimensions {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return {
      width: 1024,
      height: 768,
      pixelRatio: 1
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1
  };
}

/**
 * Checks if current viewport matches a specific size
 */
export function isViewportSize(targetSize: ViewportSize): boolean {
  const dimensions = getViewportDimensions();
  const currentSize = getViewportSize(dimensions.width);
  return currentSize === targetSize;
}

/**
 * Checks if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browsers
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Checks if device supports orientation changes
 */
export function supportsOrientationChange(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'orientation' in window ||
    'onorientationchange' in window ||
    ('screen' in window && (window as any).screen && 'orientation' in (window as any).screen)
  );
}

/**
 * Gets the current device orientation angle
 */
export function getOrientationAngle(): number {
  if (typeof window === 'undefined') return 0;
  
  // @ts-ignore - orientation property exists on window in mobile browsers
  return window.orientation || 0;
}

/**
 * Debounce utility for viewport change events
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle utility for high-frequency events like scroll/touch
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Creates a responsive layout state object
 */
export function createResponsiveLayoutState(): ResponsiveLayoutState {
  const dimensions = getViewportDimensions();
  
  return {
    currentViewport: getViewportSize(dimensions.width),
    currentOrientation: getOrientation(dimensions.width, dimensions.height),
    dimensions,
    isTransitioning: false,
    lastTransitionTime: Date.now()
  };
}

/**
 * Checks if a layout transition should be smooth or instant
 */
export function shouldUseTransition(
  lastTransitionTime: number,
  minInterval: number = 100
): boolean {
  return Date.now() - lastTransitionTime > minInterval;
}