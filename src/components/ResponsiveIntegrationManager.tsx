'use client';

import { useEffect, useCallback, useState } from 'react';
import { useResponsive, useLayoutSettings, useDeviceCapabilities } from '@/hooks/useResponsive';
import { getResponsiveLayoutManager } from '@/utils/ResponsiveLayoutManager';

/**
 * ResponsiveIntegrationManager
 * 
 * This component manages the integration of all responsive components:
 * - Wires responsive layout manager with UI components
 * - Connects touch controls to globe renderer based on device capabilities
 * - Integrates mobile navigation with existing routing
 * - Ensures proper component communication and state management
 * 
 * Requirements: All requirements integration
 */
export interface ResponsiveIntegrationManagerProps {
  children: React.ReactNode;
  onLayoutChange?: (isMobile: boolean, isTablet: boolean) => void;
  onPerformanceChange?: (tier: 'high' | 'medium' | 'low') => void;
}

export function ResponsiveIntegrationManager({
  children,
  onLayoutChange,
  onPerformanceChange
}: ResponsiveIntegrationManagerProps) {
  const { isMobile, isTablet, isDesktop, config } = useResponsive();
  const layoutSettings = useLayoutSettings();
  const deviceCapabilities = useDeviceCapabilities();
  
  // Prevent hydration mismatch by ensuring client-side only rendering for dynamic values
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Notify parent components of layout changes
  useEffect(() => {
    if (isClient) {
      onLayoutChange?.(isMobile, isTablet);
    }
  }, [isMobile, isTablet, onLayoutChange, isClient]);

  // Notify parent components of performance tier changes
  useEffect(() => {
    if (isClient) {
      onPerformanceChange?.(deviceCapabilities.tier);
    }
  }, [deviceCapabilities.tier, onPerformanceChange, isClient]);

  // Initialize responsive layout manager
  useEffect(() => {
    if (!isClient) return;
    
    const layoutManager = getResponsiveLayoutManager();
    
    // Force initial layout detection
    layoutManager.forceUpdate();
    
    // Optimize for current device
    layoutManager.optimizeForDevice();
    
    return () => {
      // Cleanup is handled by the singleton manager
    };
  }, [isClient]);

  // Handle viewport changes and orientation changes
  useEffect(() => {
    const layoutManager = getResponsiveLayoutManager();
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Re-optimize when app becomes visible (handles device rotation, etc.)
        setTimeout(() => {
          layoutManager.forceUpdate();
          layoutManager.optimizeForDevice();
        }, 100);
      }
    };

    // Listen for visibility changes to handle app switching
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Apply responsive CSS classes to document body
  useEffect(() => {
    if (!isClient) return; // Only run on client to prevent hydration mismatch
    
    const classes = [
      `viewport-${config.viewport}`,
      `orientation-${config.orientation}`,
      `device-${deviceCapabilities.tier}`,
      `touch-${layoutSettings.enableGestures ? 'enabled' : 'disabled'}`
    ];

    // Add classes to body
    document.body.classList.add(...classes);

    // Set CSS custom properties for responsive values
    document.documentElement.style.setProperty('--touch-target-size', `${layoutSettings.touchTargetSize}px`);
    document.documentElement.style.setProperty('--viewport-width', `${config.viewport}`);
    document.documentElement.style.setProperty('--device-tier', deviceCapabilities.tier);

    return () => {
      // Remove classes on cleanup
      document.body.classList.remove(...classes);
    };
  }, [config, layoutSettings, deviceCapabilities, isClient]);

  // Handle touch event prevention for mobile devices
  useEffect(() => {
    if (isMobile || isTablet) {
      // Prevent default touch behaviors that might interfere with globe interaction
      const preventDefaultTouch = (e: TouchEvent) => {
        // Only prevent default on the canvas/globe area
        const target = e.target as HTMLElement;
        if (target.tagName === 'CANVAS' || target.closest('canvas')) {
          e.preventDefault();
        }
      };

      // Prevent zoom on double-tap for the entire document
      const preventDoubleTabZoom = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };

      document.addEventListener('touchstart', preventDefaultTouch, { passive: false });
      document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
      document.addEventListener('touchend', preventDoubleTabZoom, { passive: false });

      return () => {
        document.removeEventListener('touchstart', preventDefaultTouch);
        document.removeEventListener('touchmove', preventDefaultTouch);
        document.removeEventListener('touchend', preventDoubleTabZoom);
      };
    }
  }, [isMobile, isTablet]);

  // Handle keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle escape key to close modals on mobile
      if (e.key === 'Escape' && (isMobile || isTablet)) {
        // Dispatch custom event that mobile components can listen to
        window.dispatchEvent(new CustomEvent('mobile-escape-pressed'));
      }

      // Handle tab navigation improvements for touch devices
      if (e.key === 'Tab' && (isMobile || isTablet)) {
        // Ensure focus is visible on touch devices
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      // Remove keyboard navigation class when using mouse/touch
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('touchstart', handleMouseDown);
    };
  }, [isMobile, isTablet]);

  // Performance monitoring and adjustment
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      let frameCount = 0;
      let lastTime = performance.now();
      let fps = 60;

      const measureFPS = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
          fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          frameCount = 0;
          lastTime = currentTime;

          // Dispatch performance event for components to react to
          window.dispatchEvent(new CustomEvent('performance-update', {
            detail: { fps, deviceTier: deviceCapabilities.tier }
          }));

          // Auto-adjust performance if FPS is consistently low
          if (fps < 20 && deviceCapabilities.tier !== 'low') {
            console.warn('Low FPS detected, consider reducing visual effects');
            window.dispatchEvent(new CustomEvent('performance-degradation', {
              detail: { fps, suggestion: 'reduce-effects' }
            }));
          }
        }

        requestAnimationFrame(measureFPS);
      };

      // Start FPS monitoring only on lower-end devices
      if (deviceCapabilities.tier !== 'high') {
        requestAnimationFrame(measureFPS);
      }
    }
  }, [deviceCapabilities.tier]);

  // Memory pressure monitoring for mobile devices
  useEffect(() => {
    if ((isMobile || isTablet) && 'memory' in performance) {
      const checkMemoryPressure = () => {
        const memInfo = (performance as any).memory;
        if (memInfo) {
          const usedRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
          
          if (usedRatio > 0.8) {
            // High memory usage - suggest cleanup
            window.dispatchEvent(new CustomEvent('memory-pressure', {
              detail: { usedRatio, suggestion: 'cleanup-recommended' }
            }));
          }
        }
      };

      // Check memory every 30 seconds on mobile
      const memoryInterval = setInterval(checkMemoryPressure, 30000);
      
      return () => {
        clearInterval(memoryInterval);
      };
    }
  }, [isMobile, isTablet]);

  return (
    <div 
      className={`responsive-integration-manager ${isClient ? `${config.viewport} ${config.orientation} ${deviceCapabilities.tier}-tier` : 'loading'}`}
      data-viewport={isClient ? config.viewport : 'loading'}
      data-orientation={isClient ? config.orientation : 'loading'}
      data-device-tier={isClient ? deviceCapabilities.tier : 'loading'}
      data-touch-enabled={isClient ? layoutSettings.enableGestures : false}
    >
      {children}
    </div>
  );
}

/**
 * Hook for components to access responsive integration state
 */
export function useResponsiveIntegration() {
  const { config, isMobile, isTablet, isDesktop } = useResponsive();
  const layoutSettings = useLayoutSettings();
  const deviceCapabilities = useDeviceCapabilities();

  const shouldUseMobileRenderer = isMobile || isTablet || deviceCapabilities.tier === 'low';
  const shouldUseTouchControls = layoutSettings.enableGestures;
  const shouldUseFullScreenModals = layoutSettings.useFullScreenModals;
  const shouldShowHamburgerMenu = layoutSettings.navigationStyle === 'hamburger';
  const shouldShowTabInterface = layoutSettings.navigationStyle === 'tabs';

  return {
    // Device state
    isMobile,
    isTablet,
    isDesktop,
    
    // Configuration
    config,
    layoutSettings,
    deviceCapabilities,
    
    // Integration decisions
    shouldUseMobileRenderer,
    shouldUseTouchControls,
    shouldUseFullScreenModals,
    shouldShowHamburgerMenu,
    shouldShowTabInterface,
    
    // Utility values
    touchTargetSize: layoutSettings.touchTargetSize,
    navigationStyle: layoutSettings.navigationStyle
  };
}

export default ResponsiveIntegrationManager;