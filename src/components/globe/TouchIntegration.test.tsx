import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { MobileOptimizedGlobeRenderer } from './MobileOptimizedGlobeRenderer'

// Mock device detection
vi.mock('@/utils/deviceDetection', () => ({
  detectDeviceCapabilities: vi.fn(() => ({
    tier: 'medium',
    maxPixelRatio: 2,
    supportsWebGL2: true,
    maxTextureSize: 4096,
    estimatedMemory: 4000,
    touchSupport: true,
    orientationSupport: true,
    networkSpeed: 'fast',
    hasVoiceSupport: false,
    supportsPWA: true
  })),
  getPerformanceSettings: vi.fn(() => ({
    pixelRatio: 1.5,
    shadowQuality: 'medium',
    particleCount: 1000,
    antialiasing: true,
    postProcessing: true,
    maxLODLevel: 2
  }))
}))

// Mock Three.js
vi.mock('three', () => ({
  Vector3: vi.fn(() => ({
    copy: vi.fn().mockReturnThis(),
    sub: vi.fn().mockReturnThis(),
    length: vi.fn(() => 8),
    set: vi.fn().mockReturnThis(),
    clone: vi.fn().mockReturnThis(),
    lookAt: vi.fn(),
    setFromMatrixColumn: vi.fn().mockReturnThis(),
    multiplyScalar: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    setFromSpherical: vi.fn().mockReturnThis(),
    lerpVectors: vi.fn().mockReturnThis()
  })),
  Spherical: vi.fn(() => ({
    setFromVector3: vi.fn(),
    theta: 0,
    phi: Math.PI / 2,
    radius: 8
  })),
  Vector2: vi.fn(() => ({
    set: vi.fn().mockReturnThis(),
    copy: vi.fn().mockReturnThis(),
    subVectors: vi.fn().mockReturnThis(),
    multiplyScalar: vi.fn().mockReturnThis()
  })),
  MathUtils: {
    lerp: vi.fn((a, b, t) => a + (b - a) * t)
  },
  Raycaster: vi.fn(() => ({
    setFromCamera: vi.fn(),
    intersectObject: vi.fn(() => [])
  })),
  SphereGeometry: vi.fn(),
  Mesh: vi.fn(),
  Color: vi.fn(),
  Group: vi.fn()
}))

// Mock @react-three/drei
vi.mock('@react-three/drei', () => {
  const mockUseGLTF = vi.fn(() => ({
    scene: { clone: vi.fn(() => ({})), traverse: vi.fn() },
    materials: {}
  }))
  mockUseGLTF.preload = vi.fn()
  
  return {
    useGLTF: mockUseGLTF
  }
})

// Mock other globe components
vi.mock('./ZoomController', () => ({
  ZoomController: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('./DataPointManager', () => ({
  DataPointManager: () => null
}))

vi.mock('./OrbitalFilaments', () => ({
  OrbitalFilaments: () => null
}))

vi.mock('./AmbientParticles', () => ({
  AmbientParticles: () => null
}))

vi.mock('./shaders/PostProcessingPipeline', () => ({
  PostProcessingPipeline: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('./StarField', () => ({
  StarField: () => null
}))

describe('Touch Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders MobileOptimizedGlobeRenderer with touch controls', () => {
    const onDataPointClick = vi.fn()
    const onDataPointHover = vi.fn()
    const onZoomChange = vi.fn()
    const onReady = vi.fn()

    expect(() => {
      render(
        <MobileOptimizedGlobeRenderer
          dataPoints={[]}
          onDataPointClick={onDataPointClick}
          onDataPointHover={onDataPointHover}
          onZoomChange={onZoomChange}
          onReady={onReady}
        />
      )
    }).not.toThrow()
  })

  it('handles touch control callbacks', () => {
    const onZoomChange = vi.fn()
    
    expect(() => {
      render(
        <MobileOptimizedGlobeRenderer
          onZoomChange={onZoomChange}
        />
      )
    }).not.toThrow()
  })

  it('supports data point interactions on mobile', () => {
    const mockDataPoints = [
      {
        id: '1',
        title: 'Test Threat',
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
        severity: 8,
        threatType: 'malware' as const,
        timestamp: '2024-01-01T00:00:00Z'
      }
    ]

    const onDataPointClick = vi.fn()

    expect(() => {
      render(
        <MobileOptimizedGlobeRenderer
          dataPoints={mockDataPoints}
          onDataPointClick={onDataPointClick}
        />
      )
    }).not.toThrow()
  })
})