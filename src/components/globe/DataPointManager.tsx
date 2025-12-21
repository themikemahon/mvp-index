'use client'

import { useMemo, useRef } from 'react'
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

// Get color based on threat type and severity
function getThreatColor(threatType: ThreatType, severity: number): { color: string; emissive: string } {
  switch (threatType) {
    case 'protection':
      // Blue/purple for protection data
      return severity >= 7 
        ? { color: '#4c1d95', emissive: '#6d28d9' } // Deep purple
        : { color: '#1e40af', emissive: '#3b82f6' } // Blue
    
    case 'vulnerability':
      // Red for vulnerabilities
      return severity >= 7
        ? { color: '#dc2626', emissive: '#ef4444' } // Bright red
        : { color: '#b91c1c', emissive: '#dc2626' } // Dark red
    
    case 'scam':
      // Orange for scams
      return severity >= 7
        ? { color: '#ea580c', emissive: '#f97316' } // Bright orange
        : { color: '#c2410c', emissive: '#ea580c' } // Dark orange
    
    case 'financial_risk':
      // Yellow for financial risks
      return severity >= 7
        ? { color: '#eab308', emissive: '#facc15' } // Bright yellow
        : { color: '#ca8a04', emissive: '#eab308' } // Dark yellow
    
    default:
      return { color: '#6b7280', emissive: '#9ca3af' } // Gray fallback
  }
}

// Cluster nearby data points for performance optimization
function clusterDataPoints(
  dataPoints: ThreatDataPoint[], 
  zoomLevel: number,
  clusterDistance: number = 0.3
): ClusteredDataPoint[] {
  // At high zoom levels, don't cluster
  if (zoomLevel > 8) {
    return dataPoints.map(point => {
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

  const clusters: ClusteredDataPoint[] = []
  const processed = new Set<string>()

  dataPoints.forEach(point => {
    if (processed.has(point.id)) return

    const position = latLngToVector3(point.coordinates.latitude, point.coordinates.longitude)
    const cluster: ClusteredDataPoint = {
      id: `cluster-${point.id}`,
      position,
      dataPoints: [point],
      averageSeverity: point.severity,
      dominantThreatType: point.threatType,
      color: '',
      emissiveColor: ''
    }

    processed.add(point.id)

    // Find nearby points to cluster
    dataPoints.forEach(otherPoint => {
      if (processed.has(otherPoint.id)) return

      const otherPosition = latLngToVector3(
        otherPoint.coordinates.latitude, 
        otherPoint.coordinates.longitude
      )

      if (position.distanceTo(otherPosition) < clusterDistance) {
        cluster.dataPoints.push(otherPoint)
        processed.add(otherPoint.id)
      }
    })

    // Calculate cluster properties
    const totalSeverity = cluster.dataPoints.reduce((sum, p) => sum + p.severity, 0)
    cluster.averageSeverity = totalSeverity / cluster.dataPoints.length

    // Find dominant threat type
    const typeCounts = cluster.dataPoints.reduce((counts, p) => {
      counts[p.threatType] = (counts[p.threatType] || 0) + 1
      return counts
    }, {} as Record<ThreatType, number>)

    cluster.dominantThreatType = Object.entries(typeCounts).reduce((a, b) => 
      typeCounts[a[0] as ThreatType] > typeCounts[b[0] as ThreatType] ? a : b
    )[0] as ThreatType

    // Set colors based on dominant type and average severity
    const colors = getThreatColor(cluster.dominantThreatType, cluster.averageSeverity)
    cluster.color = colors.color
    cluster.emissiveColor = colors.emissive

    clusters.push(cluster)
  })

  return clusters
}

// Generate heat map texture based on data points
// Enhanced for better visual appeal as the primary visualization
function generateHeatMapTexture(
  dataPoints: ThreatDataPoint[],
  width: number = 1024, // Higher resolution for better quality
  height: number = 512
): THREE.Texture {
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
    
    // Color based on threat type and severity with enhanced visibility
    const colors = getThreatColor(point.threatType, point.severity)
    const alpha = Math.min(0.9, (point.severity / 10) + 0.2) // Minimum visibility
    
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
    
    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`)
    gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.6})`)
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

  // Generate heat map texture
  const heatMapTexture = useMemo(() => {
    if (dataPoints.length === 0) return null
    return generateHeatMapTexture(dataPoints)
  }, [dataPoints])

  // Cluster data points based on zoom level
  const clusteredPoints = useMemo(() => {
    return clusterDataPoints(dataPoints, zoomLevel)
  }, [dataPoints, zoomLevel])

  // Calculate opacity values for smooth transitions
  // Heat map is primary and stays visible longer
  const heatMapOpacity = visualizationMode === 'heatmap' 
    ? Math.max(0.1, 1 - transitionProgress * 1.5) // Keep some heat map even during transition
    : Math.max(0, 0.3 - transitionProgress * 0.5) // Fade out more gradually
  
  // Dots only appear when significantly zoomed in
  const pixelOpacity = transitionProgress > 0.5 
    ? Math.min(1, (transitionProgress - 0.5) * 2) // Only start showing dots at 50% transition
    : 0

  // Add subtle animation to data points
  useFrame((state) => {
    if (groupRef.current) {
      // Subtle pulsing effect for data points
      const time = state.clock.getElapsedTime()
      groupRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          const baseIntensity = 0.3
          const pulseIntensity = 0.1
          const phase = (index * 0.5) + (time * 2)
          child.material.emissiveIntensity = baseIntensity + Math.sin(phase) * pulseIntensity
        }
      })
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
      {/* Heat Map Layer - Always visible, primary visualization */}
      {heatMapTexture && heatMapOpacity > 0 && (
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

      {/* Individual Data Points Layer - Only visible when zoomed in close */}
      {pixelOpacity > 0 && 
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
                opacity={pixelOpacity}
                emissive={clusteredPoint.emissiveColor}
                emissiveIntensity={0.3}
              />
            </mesh>
          )
        })
      }

      {/* Transition Effect - Particles that appear during mode switching */}
      {transitionProgress > 0.1 && transitionProgress < 0.9 && (
        <group>
          {clusteredPoints
            .slice(0, Math.floor(clusteredPoints.length * transitionProgress))
            .map((clusteredPoint) => (
              <group key={`transition-group-${clusteredPoint.id}`}>
                {/* Main transition particle */}
                <mesh position={clusteredPoint.position}>
                  <sphereGeometry args={[0.015, 8, 6]} />
                  <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={Math.sin(transitionProgress * Math.PI) * 0.5}
                    emissive="#ffffff"
                    emissiveIntensity={0.2}
                  />
                </mesh>
                
                {/* Additional small particles around each data point */}
                {Array.from({ length: 3 }, (_, i) => {
                  const angle = (i / 3) * Math.PI * 2
                  const radius = 0.05
                  const offset = new THREE.Vector3(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius * 0.5,
                    Math.sin(angle + Math.PI * 0.5) * radius
                  )
                  const particlePosition = clusteredPoint.position.clone().add(offset)
                  
                  return (
                    <mesh key={`particle-${i}`} position={particlePosition}>
                      <sphereGeometry args={[0.008, 6, 4]} />
                      <meshStandardMaterial
                        color={clusteredPoint.emissiveColor}
                        transparent
                        opacity={Math.sin(transitionProgress * Math.PI + i) * 0.3}
                        emissive={clusteredPoint.emissiveColor}
                        emissiveIntensity={0.4}
                      />
                    </mesh>
                  )
                })}
              </group>
            ))
          }
        </group>
      )}
    </group>
  )
}