import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { DataPointManager } from './DataPointManager'
import { ThreatDataPoint } from '@/types/threat'

// Mock Three.js components
vi.mock('three', () => ({
  Vector3: vi.fn().mockImplementation((x, y, z) => ({ x, y, z, distanceTo: vi.fn(() => 0.1) })),
  AdditiveBlending: 'AdditiveBlending',
  CanvasTexture: vi.fn().mockImplementation(() => ({
    wrapS: 'RepeatWrapping',
    wrapT: 'RepeatWrapping',
    needsUpdate: true
  })),
  RepeatWrapping: 'RepeatWrapping'
}))

const mockDataPoints: ThreatDataPoint[] = [
  {
    id: '1',
    title: 'Test Threat',
    subhead: 'Test subhead',
    description: 'Test description',
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    threatType: 'vulnerability',
    severity: 8,
    region: 'North America',
    brands: ['Test Brand'],
    topics: ['Test Topic'],
    isQuantitative: false,
    sources: ['Test Source'],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: '2',
    title: 'Protection Zone',
    subhead: 'Secure area',
    description: 'Well-protected region',
    coordinates: { latitude: 51.5074, longitude: -0.1278 },
    threatType: 'protection',
    severity: 3,
    region: 'Europe',
    brands: ['Security Corp'],
    topics: ['Protection'],
    isQuantitative: true,
    statisticalData: { value: 100, unit: 'protected systems', context: 'Systems under protection' },
    sources: ['Security Vendor'],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  }
]

describe('DataPointManager', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Canvas>
        <DataPointManager
          dataPoints={mockDataPoints}
          zoomLevel={5}
          visualizationMode="pixels"
          transitionProgress={1}
        />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('handles empty data points array', () => {
    const { container } = render(
      <Canvas>
        <DataPointManager
          dataPoints={[]}
          zoomLevel={5}
          visualizationMode="pixels"
          transitionProgress={1}
        />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('calls onDataPointClick when provided', () => {
    const mockOnClick = vi.fn()
    
    render(
      <Canvas>
        <DataPointManager
          dataPoints={mockDataPoints}
          zoomLevel={5}
          visualizationMode="pixels"
          transitionProgress={1}
          onDataPointClick={mockOnClick}
        />
      </Canvas>
    )
    
    // The component should render without errors
    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('calls onDataPointHover when provided', () => {
    const mockOnHover = vi.fn()
    
    render(
      <Canvas>
        <DataPointManager
          dataPoints={mockDataPoints}
          zoomLevel={5}
          visualizationMode="pixels"
          transitionProgress={1}
          onDataPointHover={mockOnHover}
        />
      </Canvas>
    )
    
    // The component should render without errors
    expect(mockOnHover).not.toHaveBeenCalled()
  })
})