/**
 * Responsive design type definitions for mobile-first approach
 */

export type ViewportSize = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';
export type DeviceTier = 'high' | 'medium' | 'low';
export type NetworkSpeed = 'fast' | 'medium' | 'slow';

export interface ResponsiveBreakpoint {
  min: number;
  max: number;
}

export interface ResponsiveBreakpoints {
  mobile: ResponsiveBreakpoint;
  tablet: ResponsiveBreakpoint;
  desktop: ResponsiveBreakpoint;
}

export interface DeviceCapabilities {
  tier: DeviceTier;
  maxPixelRatio: number;
  supportsWebGL2: boolean;
  maxTextureSize: number;
  estimatedMemory: number;
  touchSupport: boolean;
  orientationSupport: boolean;
  networkSpeed: NetworkSpeed;
  hasVoiceSupport: boolean;
  supportsPWA: boolean;
}

export interface PerformanceTier {
  pixelRatio: number;
  shadowQuality: 'high' | 'medium' | 'low' | 'disabled';
  particleCount: number;
  antialiasing: boolean;
  postProcessing: boolean;
  maxLODLevel: number;
}

export interface ResponsiveConfig {
  viewport: ViewportSize;
  orientation: Orientation;
  deviceCapabilities: DeviceCapabilities;
  performanceSettings: PerformanceTier;
  layoutSettings: {
    showSidebar: boolean;
    useFullScreenModals: boolean;
    enableGestures: boolean;
    touchTargetSize: number;
    navigationStyle: 'tabs' | 'hamburger' | 'sidebar';
  };
}

export interface ViewportDimensions {
  width: number;
  height: number;
  pixelRatio: number;
}

export interface TouchInteraction {
  type: 'tap' | 'drag' | 'pinch' | 'longpress' | 'doubletap' | 'swipe';
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  scale?: number;
  duration: number;
  target: HTMLElement;
  velocity?: { x: number; y: number };
}

export interface ResponsiveLayoutState {
  currentViewport: ViewportSize;
  currentOrientation: Orientation;
  dimensions: ViewportDimensions;
  isTransitioning: boolean;
  lastTransitionTime: number;
}