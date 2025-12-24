/**
 * Responsive Layout Manager
 * Orchestrates layout changes across breakpoints and manages component visibility
 */

import { 
  ResponsiveConfig,
  ResponsiveLayoutState,
  ViewportSize,
  Orientation,
  DeviceCapabilities
} from '@/types/responsive';
import { 
  getViewportDimensions,
  getViewportSize,
  getOrientation,
  createResponsiveLayoutState,
  shouldUseTransition,
  debounce,
  LAYOUT_TRANSITION_DURATION
} from '@/utils/responsive';
import { 
  detectDeviceCapabilities,
  getPerformanceSettings
} from '@/utils/deviceDetection';

export type LayoutChangeCallback = (config: ResponsiveConfig) => void;

export class ResponsiveLayoutManager {
  private state: ResponsiveLayoutState;
  private config: ResponsiveConfig;
  private callbacks: Set<LayoutChangeCallback> = new Set();
  private resizeObserver?: ResizeObserver;
  private orientationChangeHandler: () => void;
  private resizeHandler: () => void;

  constructor() {
    this.state = createResponsiveLayoutState();
    this.config = this.createInitialConfig();
    
    // Debounced handlers to prevent excessive updates
    this.orientationChangeHandler = debounce(() => {
      this.handleOrientationChange();
    }, 100);
    
    this.resizeHandler = debounce(() => {
      this.handleResize();
    }, 50);
    
    this.setupEventListeners();
  }

  /**
   * Gets current responsive configuration
   */
  public getConfig(): ResponsiveConfig {
    return { ...this.config };
  }

  /**
   * Gets current layout state
   */
  public getState(): ResponsiveLayoutState {
    return { ...this.state };
  }

  /**
   * Subscribes to layout changes
   */
  public subscribe(callback: LayoutChangeCallback): () => void {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Forces a layout update (useful for testing or manual triggers)
   */
  public forceUpdate(): void {
    this.updateLayout();
  }

  /**
   * Detects current viewport and updates configuration
   */
  public detectViewport(): ViewportSize {
    const dimensions = getViewportDimensions();
    return getViewportSize(dimensions.width);
  }

  /**
   * Updates layout configuration based on current viewport
   */
  public updateLayout(targetViewport?: ViewportSize): void {
    const dimensions = getViewportDimensions();
    const viewport = targetViewport || getViewportSize(dimensions.width);
    const orientation = getOrientation(dimensions.width, dimensions.height);
    
    // Check if layout actually changed
    const hasViewportChanged = viewport !== this.state.currentViewport;
    const hasOrientationChanged = orientation !== this.state.currentOrientation;
    const hasDimensionsChanged = 
      dimensions.width !== this.state.dimensions.width ||
      dimensions.height !== this.state.dimensions.height;
    
    if (!hasViewportChanged && !hasOrientationChanged && !hasDimensionsChanged) {
      return; // No changes needed
    }

    // Update state
    const previousState = { ...this.state };
    this.state = {
      currentViewport: viewport,
      currentOrientation: orientation,
      dimensions,
      isTransitioning: shouldUseTransition(this.state.lastTransitionTime),
      lastTransitionTime: Date.now()
    };

    // Update configuration
    this.config = {
      ...this.config,
      viewport,
      orientation,
      layoutSettings: this.getLayoutSettings(viewport, orientation)
    };

    // Notify subscribers
    this.notifyCallbacks();

    // Handle transition timing
    if (this.state.isTransitioning) {
      setTimeout(() => {
        this.state.isTransitioning = false;
      }, LAYOUT_TRANSITION_DURATION);
    }
  }

  /**
   * Handles orientation change events
   */
  public handleOrientationChange(): void {
    // Small delay to ensure dimensions are updated after orientation change
    setTimeout(() => {
      this.updateLayout();
    }, 100);
  }

  /**
   * Optimizes settings for current device
   */
  public optimizeForDevice(): void {
    const capabilities = detectDeviceCapabilities();
    const performanceSettings = getPerformanceSettings(capabilities);
    
    this.config = {
      ...this.config,
      deviceCapabilities: capabilities,
      performanceSettings
    };
    
    this.notifyCallbacks();
  }

  /**
   * Cleanup method to remove event listeners
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('orientationchange', this.orientationChangeHandler);
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    this.callbacks.clear();
  }

  /**
   * Creates initial responsive configuration
   */
  private createInitialConfig(): ResponsiveConfig {
    // Use default capabilities for initial render to prevent hydration mismatch
    const capabilities = typeof window === 'undefined' 
      ? { tier: 'medium' as const, maxPixelRatio: 1, supportsWebGL2: false, maxTextureSize: 2048, estimatedMemory: 4, touchSupport: false, orientationSupport: false, networkSpeed: 'medium' as const, hasVoiceSupport: false, supportsPWA: false }
      : detectDeviceCapabilities();
      
    const performanceSettings = getPerformanceSettings(capabilities);
    const viewport = this.state.currentViewport;
    const orientation = this.state.currentOrientation;
    
    return {
      viewport,
      orientation,
      deviceCapabilities: capabilities,
      performanceSettings,
      layoutSettings: this.getLayoutSettings(viewport, orientation)
    };
  }

  /**
   * Gets layout settings based on viewport and orientation
   */
  private getLayoutSettings(viewport: ViewportSize, orientation: Orientation) {
    const isMobile = viewport === 'mobile';
    const isTablet = viewport === 'tablet';
    
    return {
      showSidebar: !isMobile,
      useFullScreenModals: isMobile,
      enableGestures: isMobile || isTablet,
      touchTargetSize: isMobile ? 44 : isTablet ? 40 : 32,
      navigationStyle: isMobile ? 'hamburger' as const : 
                      isTablet ? 'tabs' as const : 
                      'sidebar' as const
    };
  }

  /**
   * Sets up event listeners for viewport changes
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Window resize listener
    window.addEventListener('resize', this.resizeHandler, { passive: true });
    
    // Orientation change listener
    window.addEventListener('orientationchange', this.orientationChangeHandler, { passive: true });
    
    // Visual viewport API support (for mobile keyboards)
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', this.resizeHandler, { passive: true });
    }
    
    // ResizeObserver for more precise element-based detection
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        this.resizeHandler();
      });
      
      // Observe document body
      this.resizeObserver.observe(document.body);
    }
  }

  /**
   * Handles window resize events
   */
  private handleResize(): void {
    this.updateLayout();
  }

  /**
   * Notifies all subscribers of configuration changes
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.config);
      } catch (error) {
        console.error('Error in responsive layout callback:', error);
      }
    });
  }
}

// Singleton instance for global use
let globalLayoutManager: ResponsiveLayoutManager | null = null;

/**
 * Gets the global responsive layout manager instance
 */
export function getResponsiveLayoutManager(): ResponsiveLayoutManager {
  if (!globalLayoutManager) {
    globalLayoutManager = new ResponsiveLayoutManager();
  }
  return globalLayoutManager;
}

/**
 * Cleanup function for the global layout manager
 */
export function cleanupResponsiveLayoutManager(): void {
  if (globalLayoutManager) {
    globalLayoutManager.destroy();
    globalLayoutManager = null;
  }
}