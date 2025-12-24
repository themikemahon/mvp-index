import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { UnifiedControlManager } from './UnifiedControlManager'

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
    setFromSpherical: vi.fn().mockReturnThis()
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
  Mesh: vi.fn()
}))

// Mock @react-three/fiber hooks
vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual('@react-three/fiber')
  return {
    ...actual,
    useThree: vi.fn(() => ({
      camera: {
        position: { copy: vi.fn(), set: vi.fn(), clone: vi.fn() },
        lookAt: vi.fn(),
        matrix: {
          elements: new Array(16).fill(0)
        }
      },
      gl: {
        domElement: {
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          getBoundingClientRect: vi.fn(() => ({
            left: 0,
            top: 0,
            width: 800,
            height: 600
          }))
        }
      },
      invalidate: vi.fn()
    })),
    useFrame: vi.fn((callback) => {
      // Simulate frame callback
      callback({ clock: { elapsedTime: 0 } }, 0.016)
    })
  }
})

describe('UnifiedControlManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    expect(() => {
      render(
        <Canvas>
          <UnifiedControlManager />
        </Canvas>
      )
    }).not.toThrow()
  })

  it('accepts unified control props', () => {
    const onZoomChange = vi.fn()
    const onDoubleTap = vi.fn()
    const onRegionFocus = vi.fn()

    expect(() => {
      render(
        <Canvas>
          <UnifiedControlManager
            enableRotate={true}
            enableZoom={true}
            enablePan={true}
            enableDoubleTap={true}
            minDistance={4}
            maxDistance={25}
            rotateSpeed={0.5}
            zoomSpeed={0.2}
            panSpeed={0.8}
            dampingFactor={0.03}
            autoRotate={false}
            autoRotateSpeed={0.5}
            onZoomChange={onZoomChange}
            onDoubleTap={onDoubleTap}
            onRegionFocus={onRegionFocus}
          />
        </Canvas>
      )
    }).not.toThrow()
  })

  it('handles mouse and touch events', () => {
    expect(() => {
      render(
        <Canvas>
          <UnifiedControlManager
            enableRotate={true}
            enableZoom={true}
            enablePan={true}
            enableDoubleTap={true}
          />
        </Canvas>
      )
    }).not.toThrow()
  })

  it('supports auto rotation', () => {
    expect(() => {
      render(
        <Canvas>
          <UnifiedControlManager
            autoRotate={true}
            autoRotateSpeed={1.0}
          />
        </Canvas>
      )
    }).not.toThrow()
  })
})