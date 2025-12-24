import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { TouchControlManager } from './TouchControlManager'

// Mock Three.js
vi.mock('three', () => ({
  Vector3: vi.fn(() => ({
    copy: vi.fn().mockReturnThis(),
    sub: vi.fn().mockReturnThis(),
    length: vi.fn(() => 8),
    set: vi.fn().mockReturnThis(),
    clone: vi.fn().mockReturnThis(),
    lookAt: vi.fn()
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
  }
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

describe('TouchControlManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    expect(() => {
      render(
        <Canvas>
          <TouchControlManager />
        </Canvas>
      )
    }).not.toThrow()
  })

  it('accepts touch control props', () => {
    const onZoomChange = vi.fn()
    const onDoubleTap = vi.fn()

    expect(() => {
      render(
        <Canvas>
          <TouchControlManager
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
            onZoomChange={onZoomChange}
            onDoubleTap={onDoubleTap}
          />
        </Canvas>
      )
    }).not.toThrow()
  })

  it('initializes with default props', () => {
    expect(() => {
      render(
        <Canvas>
          <TouchControlManager />
        </Canvas>
      )
    }).not.toThrow()
  })

  it('handles disabled controls', () => {
    expect(() => {
      render(
        <Canvas>
          <TouchControlManager
            enableRotate={false}
            enableZoom={false}
            enablePan={false}
            enableDoubleTap={false}
          />
        </Canvas>
      )
    }).not.toThrow()
  })
})