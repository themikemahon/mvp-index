'use client'

import { useRef, useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { ZoomController, ZoomLevel } from './ZoomController'
import { SmoothZoomControls } from './SmoothZoomControls'
import { DataPointManager } from './DataPointManager'
import { OrbitalFilaments } from './OrbitalFilaments'
import { AmbientParticles } from './AmbientParticles'
import { PostProcessingPipeline } from './shaders/PostProcessingPipeline'
import { StarField } from './StarField'
import { ThreatDataPoint } from '@/types/threat'

interface GlobeRendererProps {
  className?: string
  dataPoints?: ThreatDataPoint[]
  onDataPointClick?: (dataPoint: ThreatDataPoint) => void
  onDataPointHover?: (dataPoint: ThreatDataPoint | null) => void
  onZoomChange?: (distance: number) => void
  onReady?: () => void
}

export interface GlobeRendererRef {
  navigateToLocation: (lat: number, lng: number, distance?: number) => void
}

// Earth Model Component - Production Version
function EarthModel() {
  const { scene, materials } = useGLTF('/models/Earth_1_12756.glb')
  const earthRef = useRef<THREE.Group>(null)

  // Clone the scene to avoid issues with multiple instances
  const clonedScene = scene.clone()

  // Ensure materials are properly configured for maximum brightness
  useEffect(() => {
    if (materials) {
      Object.values(materials).forEach((material: any) => {
        if (material.isMeshStandardMaterial || material.isMeshBasicMaterial) {
          material.needsUpdate = true
          // Ensure the material is visible
          material.transparent = false
          material.opacity = 1
          // Maximum lighting response for brightness
          if (material.isMeshStandardMaterial) {
            material.roughness = 0.2  // Very smooth for maximum reflection
            material.metalness = 0.2  // More metallic for better light response
            // Add strong emissive glow to make it much brighter
            material.emissive = new THREE.Color(0x223344)  // Stronger blue glow
            material.emissiveIntensity = 0.2
            // Boost the material's response to lighting
            if (material.map) {
              material.map.needsUpdate = true
            }
          }
        }
      })
    }
  }, [materials])

  // Model is actually huge, needs to be scaled down to 0.005
  const EARTH_SCALE = 0.00395

  return (
    <group ref={earthRef}>
      <primitive 
        object={clonedScene} 
        scale={[EARTH_SCALE, EARTH_SCALE, EARTH_SCALE]}
        position={[0, 0, 0]}
      />
      {/* Invisible collision sphere for hover detection - matches visual Earth size */}
      <mesh position={[0, 0, 0]} visible={false}>
        <sphereGeometry args={[2.0, 32, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}

// Fallback sphere component in case model fails to load
function FallbackEarth() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[2.0, 64, 32]} />
      <meshStandardMaterial
        color="#1e3a8a"
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  )
}

// Earth component with error handling
function Earth() {
  const [modelError, setModelError] = useState(false)

  // Handle model loading errors
  const handleError = useCallback((error: any) => {
    console.warn('Failed to load Earth model, using fallback:', error)
    setModelError(true)
  }, [])

  if (modelError) {
    return <FallbackEarth />
  }

  return (
    <ErrorBoundary fallback={<FallbackEarth />} onError={handleError}>
      <EarthModel />
    </ErrorBoundary>
  )
}

// Simple error boundary for the 3D model
function ErrorBoundary({ 
  children, 
  fallback, 
  onError 
}: { 
  children: React.ReactNode
  fallback: React.ReactNode
  onError?: (error: any) => void
}) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = (error: any) => {
      setHasError(true)
      onError?.(error)
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [onError])

  if (hasError) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

function Globe({ 
  dataPoints, 
  visualizationMode, 
  transitionProgress,
  zoomLevel,
  onDataPointClick,
  onDataPointHover,
  isDataPointHovered
}: { 
  dataPoints?: ThreatDataPoint[]
  visualizationMode: 'heatmap' | 'pixels'
  transitionProgress: number
  zoomLevel: number
  onDataPointClick?: (dataPoint: ThreatDataPoint) => void
  onDataPointHover?: (dataPoint: ThreatDataPoint | null) => void
  isDataPointHovered?: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const rotationSpeedRef = useRef(0.1) // Current rotation speed
  const targetRotationSpeedRef = useRef(0.1) // Target rotation speed
  
  // Set initial rotation offset (145 degrees = ~2.535 radians)
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = 2.535 // 145 degrees initial rotation
    }
  }, [])

  // Smooth rotation with easing when hovering over data points in detail (pixels) mode
  useFrame((_, delta) => {
    if (groupRef.current) {
      // Determine target rotation speed
      const shouldSlowDown = visualizationMode === 'pixels' && isDataPointHovered
      targetRotationSpeedRef.current = shouldSlowDown ? 0 : 0.1 // Complete stop instead of slow movement
      
      // Smooth interpolation to target speed
      const lerpFactor = delta * 6 // Increased from 4 for faster easing
      rotationSpeedRef.current = THREE.MathUtils.lerp(
        rotationSpeedRef.current, 
        targetRotationSpeedRef.current, 
        lerpFactor
      )
      
      // Apply the smoothed rotation speed
      groupRef.current.rotation.y += delta * rotationSpeedRef.current
    }
  })

  return (
    <group ref={groupRef}>
      {/* The Earth globe - loaded from GLB model */}
      <Earth />
      
      {/* Data visualization layer - now a child of the rotating group */}
      <DataPointManager
        dataPoints={dataPoints || []}
        zoomLevel={zoomLevel}
        visualizationMode={visualizationMode}
        transitionProgress={transitionProgress}
        onDataPointClick={onDataPointClick}
        onDataPointHover={onDataPointHover}
      />
      
      {/* Orbital filaments that encircle the globe, initiated by cursor movement */}
      <OrbitalFilaments
        dataPoints={dataPoints || []}
        intensity={1.5}
        visualizationMode={visualizationMode}
      />
      
      {/* Ambient particles floating around the globe */}
      <AmbientParticles
        dataPoints={dataPoints || []}
        intensity={1.0}
      />
    </group>
  )
}

function Scene({ 
  dataPoints, 
  onDataPointClick, 
  onDataPointHover,
  onZoomChange,
  navigationRef,
  onReady
}: { 
  dataPoints?: ThreatDataPoint[]
  onDataPointClick?: (dataPoint: ThreatDataPoint) => void
  onDataPointHover?: (dataPoint: ThreatDataPoint | null) => void
  onZoomChange?: (distance: number) => void
  navigationRef?: React.RefObject<any>
  onReady?: () => void
}) {
  const [currentZoomLevel, setCurrentZoomLevel] = useState<ZoomLevel | null>(null)
  const [visualizationMode, setVisualizationMode] = useState<'heatmap' | 'pixels'>('heatmap')
  const [transitionProgress, setTransitionProgress] = useState(0)
  const [isDataPointHovered, setIsDataPointHovered] = useState(false)
  const { camera } = useThree()

  const handleZoomChange = useCallback((zoomLevel: ZoomLevel) => {
    setCurrentZoomLevel(zoomLevel)
    // Pass the camera distance to parent for fade effects
    onZoomChange?.(zoomLevel.distance)
  }, [onZoomChange])

  const handleVisualizationModeChange = useCallback((mode: 'heatmap' | 'pixels', progress: number) => {
    setVisualizationMode(mode)
    setTransitionProgress(progress)
  }, [])

  // Enhanced data point hover handler to track hover state
  const handleDataPointHover = useCallback((dataPoint: ThreatDataPoint | null) => {
    setIsDataPointHovered(dataPoint !== null)
    onDataPointHover?.(dataPoint)
  }, [onDataPointHover])

  // Convert ZoomLevel to numeric value for DataPointManager
  const numericZoomLevel = currentZoomLevel?.distance ? (20 - currentZoomLevel.distance) : 5

  // Helper function to convert lat/lng to 3D position on sphere
  const latLngToVector3 = useCallback((lat: number, lng: number, radius: number = 2) => {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta))
    const z = radius * Math.sin(phi) * Math.sin(theta)
    const y = radius * Math.cos(phi)
    
    return new THREE.Vector3(x, y, z)
  }, [])

  // Navigation function
  const navigateToLocation = useCallback((lat: number, lng: number, distance: number = 6) => {
    const targetPosition = latLngToVector3(lat, lng, distance)

  // Call onReady when the scene is initialized
  useEffect(() => {
    if (onReady) {
      // Add a small delay to ensure everything is properly initialized
      const timer = setTimeout(() => {
        onReady()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [onReady])
    const endTarget = latLngToVector3(lat, lng, 0) // Look at the surface point
    
    // Animate camera to target position
    const startPosition = camera.position.clone()
    
    let progress = 0
    const duration = 2000 // 2 seconds
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      progress = Math.min(elapsed / duration, 1)
      
      // Smooth easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      // Interpolate camera position
      camera.position.lerpVectors(startPosition, targetPosition, easeProgress)
      camera.lookAt(endTarget)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }, [camera, latLngToVector3])

  // Expose navigation function to parent
  useEffect(() => {
    if (navigationRef?.current) {
      navigationRef.current.navigateToLocation = navigateToLocation
    }
  }, [navigateToLocation, navigationRef])

  return (
    <PostProcessingPipeline
      bloomIntensity={2}
      bloomRadius={0.6}
      bloomThreshold={0.2}
      chromaticAberrationIntensity={0.0003}
      enableToneMapping={false}
      enableAntiAliasing={true}
      enableSelectiveBloom={true}
    >
      <ZoomController
        onZoomChange={handleZoomChange}
        onVisualizationModeChange={handleVisualizationModeChange}
      >
        {/* Maximum intensity lighting setup for very dark Earth model */}
        <ambientLight intensity={2.2} />
        
        {/* Hemisphere light for natural outdoor lighting */}
        <hemisphereLight
          args={["#87CEEB", "#362d1a", 1.5]}
        />
        
        {/* Very bright primary directional light */}
        <directionalLight
          position={[10, 10, 5]}
          intensity={0}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        {/* Bright secondary directional light for fill lighting */}
        <directionalLight
          position={[-20, -15, -20]}
          intensity={0}
          color="#e0f2fe"
        />
        
        {/* Multiple strong point lights for maximum illumination */}
        <pointLight position={[0, 0, 10]} intensity={0} color="#ffffff" />
        <pointLight position={[10, 0, 0]} intensity={0} color="#ffffff" />
        <pointLight position={[-10, 0, 0]} intensity={0} color="#ffffff" />
        <pointLight position={[0, 10, 0]} intensity={0} color="#ffffff" />
        <pointLight position={[0, -10, 0]} intensity={0} color="#ffffff" />
        
        {/* Rim lighting from behind */}
        <pointLight position={[0, 0, -10]} intensity={5.2} color="#3b82f6" />
        
        {/* Background star field */}
        <StarField count={2500} radius={80} />

        {/* The globe with integrated data visualization */}
        <Globe 
          dataPoints={dataPoints}
          visualizationMode={visualizationMode}
          transitionProgress={transitionProgress}
          zoomLevel={numericZoomLevel}
          onDataPointClick={onDataPointClick}
          onDataPointHover={handleDataPointHover}
          isDataPointHovered={isDataPointHovered}
        />
        
        {/* Smooth camera controls for fluid interaction */}
        <SmoothZoomControls
          enableZoom={true}
          enableRotate={true}
          enablePan={true}
          minDistance={4}
          maxDistance={25}
          zoomSpeed={0.15}  // Slower for more precision
          rotateSpeed={0.4}
          panSpeed={0.6}
          dampingFactor={0.03}  // Very smooth damping
          autoRotate={false}
          onZoomChange={onZoomChange}
        />
      </ZoomController>
    </PostProcessingPipeline>
  )
}

export const GlobeRenderer = forwardRef<GlobeRendererRef, GlobeRendererProps>(({ 
  className = '', 
  dataPoints, 
  onDataPointClick, 
  onDataPointHover,
  onZoomChange,
  onReady
}, ref) => {
  const navigationRef = useRef<any>({})

  useImperativeHandle(ref, () => ({
    navigateToLocation: (lat: number, lng: number, distance: number = 6) => {
      if (navigationRef.current?.navigateToLocation) {
        navigationRef.current.navigateToLocation(lat, lng, distance)
      }
    }
  }), [])

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{
          position: [0, 0, 8], // Reduced from 10 to 8 for closer initial view
          fov: 45,
          near: 0.01,  // Reduced for close-up viewing of small Earth
          far: 1000
        }}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <Scene 
          dataPoints={dataPoints} 
          onDataPointClick={onDataPointClick}
          onDataPointHover={onDataPointHover}
          onZoomChange={onZoomChange}
          navigationRef={navigationRef}
          onReady={onReady}
        />
      </Canvas>
    </div>
  )
})

GlobeRenderer.displayName = 'GlobeRenderer'

// Preload the Earth model for better performance
useGLTF.preload('/models/Earth_1_12756.glb')