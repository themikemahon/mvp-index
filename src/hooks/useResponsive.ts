/**
 * React hook for responsive layout management
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  ResponsiveConfig,
  ResponsiveLayoutState,
  ViewportSize,
  Orientation
} from '@/types/responsive';
import { 
  ResponsiveLayoutManager,
  getResponsiveLayoutManager,
  LayoutChangeCallback
} from '@/utils/ResponsiveLayoutManager';

export interface UseResponsiveReturn {
  config: ResponsiveConfig;
  state: ResponsiveLayoutState;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  isTransitioning: boolean;
  forceUpdate: () => void;
}

/**
 * Hook for accessing responsive layout information and controls
 */
export function useResponsive(): UseResponsiveReturn {
  const [layoutManager] = useState<ResponsiveLayoutManager>(() => 
    getResponsiveLayoutManager()
  );
  
  const [config, setConfig] = useState<ResponsiveConfig>(() => 
    layoutManager.getConfig()
  );
  
  const [state, setState] = useState<ResponsiveLayoutState>(() => 
    layoutManager.getState()
  );

  // Update callback
  const handleLayoutChange = useCallback<LayoutChangeCallback>((newConfig) => {
    setConfig(newConfig);
    setState(layoutManager.getState());
  }, [layoutManager]);

  // Subscribe to layout changes
  useEffect(() => {
    const unsubscribe = layoutManager.subscribe(handleLayoutChange);
    
    // Initial update to ensure we have current state
    handleLayoutChange(layoutManager.getConfig());
    
    return unsubscribe;
  }, [layoutManager, handleLayoutChange]);

  // Force update function
  const forceUpdate = useCallback(() => {
    layoutManager.forceUpdate();
  }, [layoutManager]);

  // Computed values for convenience
  const isMobile = config.viewport === 'mobile';
  const isTablet = config.viewport === 'tablet';
  const isDesktop = config.viewport === 'desktop';
  const isPortrait = config.orientation === 'portrait';
  const isLandscape = config.orientation === 'landscape';

  return {
    config,
    state,
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    isLandscape,
    isTransitioning: state.isTransitioning,
    forceUpdate
  };
}

/**
 * Hook for viewport-specific behavior
 */
export function useViewport(): {
  viewport: ViewportSize;
  orientation: Orientation;
  dimensions: { width: number; height: number; pixelRatio: number };
} {
  const { config, state } = useResponsive();
  
  return {
    viewport: config.viewport,
    orientation: config.orientation,
    dimensions: state.dimensions
  };
}

/**
 * Hook for device capabilities
 */
export function useDeviceCapabilities() {
  const { config } = useResponsive();
  return config.deviceCapabilities;
}

/**
 * Hook for performance settings
 */
export function usePerformanceSettings() {
  const { config } = useResponsive();
  return config.performanceSettings;
}

/**
 * Hook for layout settings
 */
export function useLayoutSettings() {
  const { config } = useResponsive();
  return config.layoutSettings;
}

/**
 * Hook that returns true only for specific viewport sizes
 */
export function useMediaQuery(viewport: ViewportSize | ViewportSize[]): boolean {
  const { config } = useResponsive();
  
  if (Array.isArray(viewport)) {
    return viewport.includes(config.viewport);
  }
  
  return config.viewport === viewport;
}

/**
 * Hook for responsive CSS classes
 */
export function useResponsiveClasses(): {
  viewport: string;
  orientation: string;
  device: string;
  combined: string;
} {
  const { config } = useResponsive();
  
  const viewport = `viewport-${config.viewport}`;
  const orientation = `orientation-${config.orientation}`;
  const device = `device-${config.deviceCapabilities.tier}`;
  const combined = `${viewport} ${orientation} ${device}`;
  
  return {
    viewport,
    orientation,
    device,
    combined
  };
}