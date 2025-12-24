/**
 * Device capability detection and performance tier classification
 */

import { 
  DeviceCapabilities, 
  DeviceTier, 
  NetworkSpeed, 
  PerformanceTier 
} from '@/types/responsive';

/**
 * Detects device capabilities and classifies performance tier
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return getDefaultCapabilities();
  }

  const capabilities: DeviceCapabilities = {
    tier: detectDeviceTier(),
    maxPixelRatio: getMaxPixelRatio(),
    supportsWebGL2: supportsWebGL2(),
    maxTextureSize: getMaxTextureSize(),
    estimatedMemory: getEstimatedMemory(),
    touchSupport: isTouchSupported(),
    orientationSupport: supportsOrientation(),
    networkSpeed: detectNetworkSpeed(),
    hasVoiceSupport: supportsVoiceInput(),
    supportsPWA: supportsPWA()
  };

  return capabilities;
}

/**
 * Classifies device into performance tiers
 */
function detectDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'medium';

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
  
  if (!gl) return 'low';

  // Check GPU renderer info
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  let renderer = '';
  
  if (debugInfo) {
    renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
  }

  // Memory estimation
  const memory = getEstimatedMemory();
  const pixelRatio = window.devicePixelRatio || 1;
  
  // High-end device indicators
  if (
    memory >= 8 ||
    pixelRatio >= 2 ||
    renderer.includes('adreno 6') ||
    renderer.includes('mali-g') ||
    renderer.includes('apple') ||
    renderer.includes('nvidia') ||
    renderer.includes('radeon')
  ) {
    return 'high';
  }

  // Low-end device indicators
  if (
    memory <= 2 ||
    renderer.includes('adreno 3') ||
    renderer.includes('mali-4') ||
    renderer.includes('powervr sgx')
  ) {
    return 'low';
  }

  return 'medium';
}

/**
 * Gets maximum safe pixel ratio for performance
 */
function getMaxPixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  
  const devicePixelRatio = window.devicePixelRatio || 1;
  const tier = detectDeviceTier();
  
  // Cap pixel ratio based on device tier
  switch (tier) {
    case 'high':
      return Math.min(devicePixelRatio, 2);
    case 'medium':
      return Math.min(devicePixelRatio, 1.5);
    case 'low':
      return Math.min(devicePixelRatio, 1);
    default:
      return 1;
  }
}

/**
 * Checks WebGL2 support
 */
function supportsWebGL2(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  return gl !== null;
}

/**
 * Gets maximum texture size supported by GPU
 */
function getMaxTextureSize(): number {
  if (typeof window === 'undefined') return 2048;
  
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
  
  if (!gl) return 2048;
  
  return gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
}

/**
 * Estimates device memory in GB
 */
function getEstimatedMemory(): number {
  if (typeof window === 'undefined') return 4;
  
  // @ts-ignore - deviceMemory is experimental but supported in Chrome
  if ('deviceMemory' in navigator) {
    // @ts-ignore
    return navigator.deviceMemory;
  }
  
  // Fallback estimation based on other factors
  const pixelRatio = window.devicePixelRatio || 1;
  const screenArea = window.screen.width * window.screen.height;
  
  if (pixelRatio >= 2 && screenArea > 2000000) {
    return 6; // Likely high-end device
  } else if (pixelRatio >= 1.5 && screenArea > 1000000) {
    return 4; // Likely mid-range device
  } else {
    return 2; // Likely low-end device
  }
}

/**
 * Checks touch support
 */
function isTouchSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Checks orientation support
 */
function supportsOrientation(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'orientation' in window ||
    'onorientationchange' in window ||
    ('screen' in window && (window as any).screen && 'orientation' in (window as any).screen)
  );
}

/**
 * Detects network connection speed
 */
function detectNetworkSpeed(): NetworkSpeed {
  if (typeof navigator === 'undefined') return 'medium';
  
  // @ts-ignore - connection is experimental but widely supported
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) return 'medium';
  
  const effectiveType = connection.effectiveType;
  
  switch (effectiveType) {
    case '4g':
      return 'fast';
    case '3g':
      return 'medium';
    case '2g':
    case 'slow-2g':
      return 'slow';
    default:
      return 'medium';
  }
}

/**
 * Checks voice input support
 */
function supportsVoiceInput(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'webkitSpeechRecognition' in window ||
    'SpeechRecognition' in window
  );
}

/**
 * Checks PWA support
 */
function supportsPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Gets performance settings based on device capabilities
 */
export function getPerformanceSettings(capabilities: DeviceCapabilities): PerformanceTier {
  switch (capabilities.tier) {
    case 'high':
      return {
        pixelRatio: capabilities.maxPixelRatio,
        shadowQuality: 'high',
        particleCount: 1000,
        antialiasing: true,
        postProcessing: true,
        maxLODLevel: 3
      };
    
    case 'medium':
      return {
        pixelRatio: Math.min(capabilities.maxPixelRatio, 1.5),
        shadowQuality: 'medium',
        particleCount: 500,
        antialiasing: true,
        postProcessing: false,
        maxLODLevel: 2
      };
    
    case 'low':
      return {
        pixelRatio: 1,
        shadowQuality: 'disabled',
        particleCount: 200,
        antialiasing: false,
        postProcessing: false,
        maxLODLevel: 1
      };
    
    default:
      return {
        pixelRatio: 1,
        shadowQuality: 'medium',
        particleCount: 500,
        antialiasing: false,
        postProcessing: false,
        maxLODLevel: 2
      };
  }
}

/**
 * Default capabilities for server-side rendering
 */
function getDefaultCapabilities(): DeviceCapabilities {
  return {
    tier: 'medium',
    maxPixelRatio: 1,
    supportsWebGL2: false,
    maxTextureSize: 2048,
    estimatedMemory: 4,
    touchSupport: false,
    orientationSupport: false,
    networkSpeed: 'medium',
    hasVoiceSupport: false,
    supportsPWA: false
  };
}