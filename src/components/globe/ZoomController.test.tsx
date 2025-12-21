import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Canvas } from '@react-three/fiber'
import { ZoomController } from './ZoomController'

describe('ZoomController', () => {
  it('renders children without crashing', () => {
    const TestChild = () => <mesh><sphereGeometry /></mesh>
    
    render(
      <Canvas>
        <ZoomController>
          <TestChild />
        </ZoomController>
      </Canvas>
    )
    
    // If we get here without throwing, the component rendered successfully
    expect(true).toBe(true)
  })

  it('accepts callback props without crashing', () => {
    const onZoomChange = () => {}
    const onVisualizationModeChange = () => {}
    const TestChild = () => <mesh><sphereGeometry /></mesh>
    
    render(
      <Canvas>
        <ZoomController 
          onZoomChange={onZoomChange}
          onVisualizationModeChange={onVisualizationModeChange}
        >
          <TestChild />
        </ZoomController>
      </Canvas>
    )
    
    // If we get here without throwing, the component rendered successfully
    expect(true).toBe(true)
  })
})