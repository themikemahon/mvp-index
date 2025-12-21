'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

export interface VisualizationModeManagerProps {
  mode: 'heatmap' | 'pixels'
  transitionProgress: number
  dataPoints?: Array<{
    id: string
    coordinates: { latitude: number; longitude: number }
    severity: number
    threatType: string
  }>
}

// Convert lat/lng to 3D sphere coordinates
function latLngToVector3(lat: number, lng: number, radius: number = 2): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  
  return new THREE.Vector3(x, y, z)
}

// Generate heat map texture based on data points
function generateHeatMapTexture(
  dataPoints: Array<{ coordinates: { latitude: number; longitude: number }; severity: number }>,
  width: number = 512,
  height: number = 256
): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  
  // Clear canvas with transparent background
  context.clearRect(0, 0, width, height)
  
  // Create heat map by drawing blurred circles for each data point
  dataPoints.forEach(point => {
    const { latitude, longitude } = point.coordinates
    
    // Convert lat/lng to canvas coordinates
    const x = ((longitude + 180) / 360) * width
    const y = ((90 - latitude) / 180) * height
    
    // Create radial gradient based on severity
    const radius = Math.max(10, point.severity * 3)
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
    
    // Color based on severity (red for high, yellow for medium, orange for low)
    const alpha = Math.min(0.8, point.severity / 10)
    if (point.severity >= 7) {
      gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`)
      gradient.addColorStop(1, `rgba(255, 0, 0, 0)`)
    } else if (point.severity >= 4) {
      gradient.addColorStop(0, `rgba(255, 165, 0, ${alpha})`)
      gradient.addColorStop(1, `rgba(255, 165, 0, 0)`)
    } else {
      gradient.addColorStop(0, `rgba(255, 255, 0, ${alpha})`)
      gradient.addColorStop(1, `rgba(255, 255, 0, 0)`)
    }
    
    context.fillStyle = gradient
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  })
  
  // Apply blur effect for smoother heat map appearance
  context.filter = 'blur(2px)'
  context.globalCompositeOperation = 'source-over'
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.needsUpdate = true
  
  return texture
}

export function VisualizationModeManager({ 
  mode, 
  transitionProgress, 
  dataPoints = [] 
}: VisualizationModeManagerProps) {
  
  // Generate heat map texture
  const heatMapTexture = useMemo(() => {
    if (dataPoints.length === 0) return null
    return generateHeatMapTexture(dataPoints)
  }, [dataPoints])
  
  // Generate individual pixel positions
  const pixelPositions = useMemo(() => {
    return dataPoints.map(point => ({
      ...point,
      position: latLngToVector3(
        point.coordinates.latitude, 
        point.coordinates.longitude,
        2.01 // Slightly above globe surface
      )
    }))
  }, [dataPoints])
  
  // Create materials with transition opacity
  const heatMapOpacity = Math.max(0, 1 - transitionProgress * 2)
  const pixelOpacity = Math.max(0, (transitionProgress - 0.5) * 2)
  
  return (
    <group>
      {/* Heat Map Layer */}
      {mode === 'heatmap' && heatMapTexture && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[2.005, 64, 32]} />
          <meshBasicMaterial
            map={heatMapTexture}
            transparent
            opacity={heatMapOpacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
      
      {/* Individual Pixels Layer */}
      {(mode === 'pixels' || transitionProgress > 0.3) && pixelPositions.map((point, index) => (
        <mesh key={point.id} position={point.position}>
          <sphereGeometry args={[0.02, 8, 6]} />
          <meshStandardMaterial
            color={
              point.severity >= 7 ? '#ff0000' :
              point.severity >= 4 ? '#ffa500' : '#ffff00'
            }
            transparent
            opacity={pixelOpacity}
            emissive={
              point.severity >= 7 ? '#ff0000' :
              point.severity >= 4 ? '#ffa500' : '#ffff00'
            }
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
      
      {/* Transition Effect - Particles that appear during mode switching */}
      {transitionProgress > 0.1 && transitionProgress < 0.9 && (
        <group>
          {pixelPositions.slice(0, Math.floor(pixelPositions.length * transitionProgress)).map((point, index) => (
            <mesh key={`transition-${point.id}`} position={point.position}>
              <sphereGeometry args={[0.015, 6, 4]} />
              <meshStandardMaterial
                color="#ffffff"
                transparent
                opacity={Math.sin(transitionProgress * Math.PI) * 0.5}
                emissive="#ffffff"
                emissiveIntensity={0.2}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}