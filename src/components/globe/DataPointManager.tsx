'use client'

import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ThreatDataPoint, ThreatType } from '@/types/threat'

export interface DataPointManagerProps {
  dataPoints: ThreatDataPoint[]
  zoomLevel: number
  visualizationMode: 'heatmap' | 'pixels'
  transitionProgress: number
  onDataPointClick?: (dataPoint: ThreatDataPoint) => void
  onDataPointHover?: (dataPoint: ThreatDataPoint | null) => void
}

interface ClusteredDataPoint {
  id: string
  position: THREE.Vector3
  dataPoints: ThreatDataPoint[]
  averageSeverity: number
  dominantThreatType: ThreatType
  color: string
  emissiveColor: string
}

// Convert lat/lng to 3D sphere coordinates
function latLngToVector3(lat: number, lng: number, radius: number = 2.05): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  
  return new THREE.Vector3(x, y, z)
}

// Get color based on threat type and severity - production-matching vibrant colors
function getThreatColor(threatType: ThreatType, severity: number): { color: string; emissive: string } {
  switch (threatType) {
    case 'vulnerability':
      // Bright red matching production screenshot
      return severity >= 7 
        ? { color: '#ff0000', emissive: '#ff4444' } // Pure red with bright glow
        : { color: '#dd0000', emissive: '#ff2222' } // Strong red with glow
    
    case 'scam':
      // Bright orange matching production screenshot
      return severity >= 7
        ? { color: '#ff8800', emissive: '#ffaa44' } // Vivid orange with warm glow
        : { color: '#ee7700', emissive: '#ff9933' } // Strong orange with glow
    
    case 'financial_risk':
      // Bright yellow matching production screenshot
      return severity >= 7
        ? { color: '#ffff00', emissive: '#ffff66' } // Pure yellow with bright glow
        : { color: '#eeee00', emissive: '#ffff44' } // Strong yellow with glow
    
    case 'protection':
      // Bright blue matching production screenshot
      return severity >= 7 
        ? { color: '#0088ff', emissive: '#44aaff' } // Bright blue with cyan glow
        : { color: '#0066dd', emissive: '#3399ff' } // Strong blue with light glow
    
    default:
      return { color: '#9ca3af', emissive: '#d1d5db' } // Gray fallback
  }
}

// Cluster nearby data points for performance optimization
// Now with spatial indexing for better performance
function clusterDataPoints(
  dataPoints: ThreatDataPoint[], 
  zoomLevel: number,
  clusterDistance: number = 0.3
): ClusteredDataPoint[] {
  // At high zoom levels, don't cluster but limit the number of points for performance
  if (zoomLevel > 8) {
    return dataPoints.slice(0, 200).map(point => { // Limit to 200 points max
      const position = latLngToVector3(point.coordinates.latitude, point.coordinates.longitude)
      const colors = getThreatColor(point.threatType, point.severity)
      
      return {
        id: point.id,
        position,
        dataPoints: [point],
        averageSeverity: point.severity,
        dominantThreatType: point.threatType,
        color: colors.color,
        emissiveColor: colors.emissive
      }
    })
  }

  // Use spatial grid for faster clustering
  const gridSize = 0.5 // Adjust based on cluster distance
  const grid = new Map<string, ThreatDataPoint[]>()
  
  // Group points into grid cells
  dataPoints.forEach(point => {
    const position = latLngToVector3(point.coordinates.latitude, point.coordinates.longitude)
    const gridX = Math.floor(position.x / gridSize)
    const gridY = Math.floor(position.y / gridSize)
    const gridZ = Math.floor(position.z / gridSize)
    const gridKey = `${gridX},${gridY},${gridZ}`
    
    if (!grid.has(gridKey)) {
      grid.set(gridKey, [])
    }
    grid.get(gridKey)!.push(point)
  })

  const clusters: ClusteredDataPoint[] = []
  
  // Process each grid cell
  grid.forEach(cellPoints => {
    if (cellPoints.length === 0) return
    
    // For cells with few points, create individual clusters
    if (cellPoints.length <= 3) {
      cellPoints.forEach(point => {
        const position = latLngToVector3(point.coordinates.latitude, point.coordinates.longitude)
        const colors = getThreatColor(point.threatType, point.severity)
        
        clusters.push({
          id: point.id,
          position,
          dataPoints: [point],
          averageSeverity: point.severity,
          dominantThreatType: point.threatType,
          color: colors.color,
          emissiveColor: colors.emissive
        })
      })
    } else {
      // For cells with many points, create a single cluster
      const centerPoint = cellPoints[0]
      const position = latLngToVector3(centerPoint.coordinates.latitude, centerPoint.coordinates.longitude)
      
      // Calculate cluster properties
      const totalSeverity = cellPoints.reduce((sum, p) => sum + p.severity, 0)
      const averageSeverity = totalSeverity / cellPoints.length

      // Find dominant threat type
      const typeCounts = cellPoints.reduce((counts, p) => {
        counts[p.threatType] = (counts[p.threatType] || 0) + 1
        return counts
      }, {} as Record<ThreatType, number>)

      const dominantThreatType = Object.entries(typeCounts).reduce((a, b) => 
        typeCounts[a[0] as ThreatType] > typeCounts[b[0] as ThreatType] ? a : b
      )[0] as ThreatType

      const colors = getThreatColor(dominantThreatType, averageSeverity)
      
      clusters.push({
        id: `cluster-${centerPoint.id}`,
        position,
        dataPoints: cellPoints,
        averageSeverity,
        dominantThreatType,
        color: colors.color,
        emissiveColor: colors.emissive
      })
    }
  })

  return clusters.slice(0, 150) // Limit total clusters for performance
}

// Generate heat map texture based on data points
// Enhanced for better visual appeal as the primary visualization
// Now with caching for better performance
const textureCache = new Map<string, THREE.Texture>()

function generateHeatMapTexture(
  dataPoints: ThreatDataPoint[],
  width: number = 1024, // Higher resolution for better quality
  height: number = 512
): THREE.Texture {
  // Create cache key based on data points
  const cacheKey = dataPoints
    .map(p => `${p.id}-${p.coordinates.latitude}-${p.coordinates.longitude}-${p.severity}-${p.threatType}`)
    .sort()
    .join('|')
  
  // Return cached texture if available
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!
  }
  
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  
  // Clear canvas with transparent background
  context.clearRect(0, 0, width, height)
  
  // Set blend mode for better heat map effect
  context.globalCompositeOperation = 'screen'
  
  // Create heat map by drawing blurred circles for each data point
  dataPoints.forEach(point => {
    const { latitude, longitude } = point.coordinates
    
    // Convert lat/lng to canvas coordinates
    const x = ((longitude + 180) / 360) * width
    const y = ((90 - latitude) / 180) * height
    
    // Create radial gradient based on severity - larger radius for better visibility
    const baseRadius = Math.max(12, point.severity * 4)
    const gradient = context.createRadialGradient(x, y, 0, x, y, baseRadius)
    
    // Color based on threat type and severity with natural visibility
    const colors = getThreatColor(point.threatType, point.severity)
    const alpha = Math.min(0.8, (point.severity / 10) + 0.3) // Moderate visibility levels
    
    // Convert hex to RGB for better alpha control
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 255, g: 255, b: 255 }
    }
    
    const rgb = hexToRgb(colors.emissive)
    
    // Enhanced gradient for more vibrant heat map
    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`)
    gradient.addColorStop(0.2, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.8})`) // Stronger core
    gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.6})`) // Extended visibility
    gradient.addColorStop(0.8, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.3})`) // Wider glow
    gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`)
    
    context.fillStyle = gradient
    context.fillRect(x - baseRadius, y - baseRadius, baseRadius * 2, baseRadius * 2)
  })
  
  // Apply blur effect for smoother heat map appearance
  context.filter = 'blur(4px)'
  context.globalCompositeOperation = 'source-over'
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.needsUpdate = true
  
  // Cache the texture
  textureCache.set(cacheKey, texture)
  
  // Clean up old cache entries if we have too many
  if (textureCache.size > 10) {
    const firstKey = textureCache.keys().next().value
    if (firstKey) {
      const oldTexture = textureCache.get(firstKey)
      oldTexture?.dispose()
      textureCache.delete(firstKey)
    }
  }
  
  return texture
}

export function DataPointManager({
  dataPoints,
  zoomLevel,
  visualizationMode,
  transitionProgress,
  onDataPointClick,
  onDataPointHover
}: DataPointManagerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const animationTimeRef = useRef(0)
  const lastComputeTime = useRef(0)

  // Memoize heat map texture with stable reference
  const heatMapTexture = useMemo(() => {
    if (dataPoints.length === 0) return null
    return generateHeatMapTexture(dataPoints)
  }, [dataPoints])

  // Optimize clustering with debounced zoom level changes
  const clusteredPoints = useMemo(() => {
    // Round zoom level to reduce recalculations
    const roundedZoom = Math.round(zoomLevel * 2) / 2
    return clusterDataPoints(dataPoints, roundedZoom)
  }, [dataPoints, Math.round(zoomLevel * 2) / 2])

  // Calculate smooth opacity values at 60fps for visual smoothness
  const [smoothOpacities, setSmoothOpacities] = useState({ 
    heatMapOpacity: 1.0, // Start with heat map fully visible
    pixelOpacity: 0.0    // Start with dots hidden
  })

  // Separate visual updates (60fps) from computational updates (throttled)
  useFrame((state, delta) => {
    animationTimeRef.current += delta
    const currentTime = state.clock.getElapsedTime()
    
    // Clear state-based opacity calculations
    const targetHeatMapOpacity = visualizationMode === 'heatmap' ? 1.0 : 0.0 // Binary: full or off
    const targetPixelOpacity = visualizationMode === 'pixels' ? 1.0 : 0.0 // Binary: full or off

    // Smooth interpolation for opacity changes at 60fps
    const lerpFactor = Math.min(1, delta * 6) // Smooth but responsive
    setSmoothOpacities(prev => ({
      heatMapOpacity: THREE.MathUtils.lerp(prev.heatMapOpacity, targetHeatMapOpacity, lerpFactor),
      pixelOpacity: THREE.MathUtils.lerp(prev.pixelOpacity, targetPixelOpacity, lerpFactor)
    }))
    
    // Throttle expensive operations (material updates) to every 3rd frame
    if (currentTime - lastComputeTime.current > 1/20) { // 20fps for material updates
      lastComputeTime.current = currentTime
      
      if (groupRef.current && smoothOpacities.pixelOpacity > 0) {
        const time = state.clock.getElapsedTime()
        
        // Batch update materials with production-matching color vibrancy
        groupRef.current.children.forEach((child, index) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            const baseIntensity = 1.0 // Maximum base intensity for production matching
            const pulseIntensity = 0.2 // Subtle pulsing to avoid overwhelming effect
            const phase = (index * 0.3) + (time * 1.5)
            child.material.emissiveIntensity = baseIntensity + Math.sin(phase) * pulseIntensity
            
            // Production-matching material settings for maximum vibrancy
            child.material.roughness = 0.05 // Very smooth surface for maximum glow
            child.material.metalness = 0.3 // More metallic for better reflection
          }
        })
      }
    }
  })

  const handleDataPointClick = (clusteredPoint: ClusteredDataPoint) => {
    if (onDataPointClick) {
      if (clusteredPoint.dataPoints.length === 1) {
        // Single data point - select directly
        onDataPointClick(clusteredPoint.dataPoints[0])
      } else {
        // Multiple data points - trigger selection interface
        // For now, we'll pass the first one but in a real implementation
        // this would trigger the OverlappingPointsSelector
        onDataPointClick(clusteredPoint.dataPoints[0])
      }
    }
  }

  const handleDataPointHover = (clusteredPoint: ClusteredDataPoint | null) => {
    if (onDataPointHover) {
      onDataPointHover(clusteredPoint ? clusteredPoint.dataPoints[0] : null)
    }
  }

  return (
    <group ref={groupRef}>
      {/* Heat Map Layer - Only visible in heatmap mode */}
      {visualizationMode === 'heatmap' && heatMapTexture && smoothOpacities.heatMapOpacity > 0.01 && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[2.005, 64, 32]} />
          <meshBasicMaterial
            map={heatMapTexture}
            transparent
            opacity={smoothOpacities.heatMapOpacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Individual Data Points Layer - Only visible in pixels mode */}
      {visualizationMode === 'pixels' && smoothOpacities.pixelOpacity > 0.01 && 
        clusteredPoints.map((clusteredPoint) => {
          const size = clusteredPoint.dataPoints.length > 1 
            ? Math.min(0.05, 0.02 + (clusteredPoint.dataPoints.length * 0.005))
            : 0.02

          return (
            <mesh
              key={clusteredPoint.id}
              position={clusteredPoint.position}
              onClick={() => handleDataPointClick(clusteredPoint)}
              onPointerEnter={() => handleDataPointHover(clusteredPoint)}
              onPointerLeave={() => handleDataPointHover(null)}
            >
              <sphereGeometry args={[size, 12, 8]} />
              <meshStandardMaterial
                color={clusteredPoint.color}
                transparent
                opacity={smoothOpacities.pixelOpacity}
                emissive={clusteredPoint.emissiveColor}
                emissiveIntensity={1.0} // Maximum emissive intensity for production-matching vibrancy
                roughness={0.05} // Very smooth surface for maximum glow
                metalness={0.3} // More metallic for better reflection
              />
            </mesh>
          )
        })
      }

      {/* No transition effects - clean binary states */}
    </group>
  )
}