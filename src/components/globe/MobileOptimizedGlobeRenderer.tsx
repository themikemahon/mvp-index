'use client'

import { useRef, useState, useCallback, forwardRef, useImperativeHandle, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { ZoomController, ZoomLevel } from './ZoomController'
import { UnifiedControlManager } from './UnifiedControlManager'
import { DataPointManager } from './DataPointManager'
import { OrbitalFilaments } from './OrbitalFilaments'
import { AmbientParticles } from './AmbientParticles'
import { PostProcessingPipeline } from './shaders/PostProcessingPipeline'
import { StarField } from './StarField'
import { ThreatDataPoint } from '@/types/threat'
import { detectDeviceCapabilities, getPerformanceSettings } from '@/utils/deviceDetection'
import { DeviceCapabilities, PerformanceTier } from '@/types/responsive'

interface MobileOptimizedGlobeRendererProps {
  className?: string
  dataPoints?: ThreatDataPoint[]
  onDataPointClick?: (dataPoint: ThreatDataPoint) => void
  onDataPointHover?: (dataPoint: ThreatDataPoint | null) => void
  onZoomChange?: (distance: number) => void
  onReady?: () => void
}

export interface MobileOptimizedGlobeRendererRef {
  navigateToLocation: (lat: number, lng: number, distance?: number) => void
}

// Progressive loading states
type LoadingState = 'loading' | 'low-quality' | 'high-quality' | 'error'

// LOD Earth Model Component with progressive loading
function LODEarthModel({ performanceSettings, loadingState }: { 
  performanceSettings: PerformanceTier
  loadingState: LoadingState 
}) {
  const earthRef = useRef<THREE.Group>(null)
  const [currentModel, setCurrentModel] = useState<THREE.Group | null>(null)

  // Progressive model loading based on performance tier and network
  const modelPath = useMemo(() => {
    if (loadingState === 'loading' || performanceSettings.maxLODLevel <= 1) {
      return null // Use fallback sphere
    }
    
    if (performanceSettings.maxLODLevel >= 3 && loadingState === 'high-quality') {
      return '/models/Earth_1_12756.glb' // High-quality model
    }
    
    // For medium quality or initial load, we could use a lower-poly model
    // For now, we'll use the same model but with different material settings
    return '/models/Earth_1_12756.glb'
  }, [performanceSettings.maxLODLevel, loadingState])

  // Load model with error handling
  const gltfResult = useGLTF(modelPath || '', true)
  const { scene, materials } = gltfResult

  // Configure materials based on performance settings
  useEffect(() => {
    if (materials && scene) {
      Object.values(materials).forEach((material: any) => {
        if (material.isMeshStandardMaterial || material.isMeshBasicMaterial) {
          material.needsUpdate = true
          material.transparent = false
          material.opacity = 1

          if (material.isMeshStandardMaterial) {
            // Adjust material quality based on performance tier
            if (performanceSettings.maxLODLevel >= 3) {
              // High quality
              material.roughness = 0.2
              material.metalness = 0.2
              material.emissive = new THREE.Color(0x223344)
              material.emissiveIntensity = 0.2
            } else if (performanceSettings.maxLODLevel >= 2) {
              // Medium quality
              material.roughness = 0.4
              material.metalness = 0.1
              material.emissive = new THREE.Color(0x112233)
              material.emissiveIntensity = 0.1
            } else {
              // Low quality - convert to basic material for performance
              const basicMaterial = new THREE.MeshBasicMaterial({
                color: material.color || 0x1e3a8a,
                map: material.map
              })
              // Replace the material in the mesh
              scene.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material === material) {
                  child.material = basicMaterial
                }
              })
            }
          }
        }
      })
      
      const clonedScene = scene.clone()
      setCurrentModel(clonedScene)
    }
  }, [materials, scene, performanceSettings.maxLODLevel])

  const EARTH_SCALE = 0.00395

  if (!currentModel) {
    return <FallbackEarth performanceSettings={performanceSettings} />
  }

  return (
    <group ref={earthRef}>
      <primitive 
        object={currentModel} 
        scale={[EARTH_SCALE, EARTH_SCALE, EARTH_SCALE]}
        position={[0, 0, 0]}
      />
      {/* Invisible collision sphere for hover detection */}
      <mesh position={[0, 0, 0]} visible={false}>
        <sphereGeometry args={[2.0, 32, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}

// Performance-optimized fallback sphere
function FallbackEarth({ performanceSettings }: { performanceSettings: PerformanceTier }) {
  // Adjust geometry complexity based on performance tier
  const segments = useMemo(() => {
    if (performanceSettings.maxLODLevel >= 3) return [64, 32]
    if (performanceSettings.maxLODLevel >= 2) return [32, 16]
    return [16, 8]
  }, [performanceSettings.maxLODLevel])

  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[2.0, segments[0], segments[1]]} />
      <meshStandardMaterial
        color="#1e3a8a"
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  )
}

// Progressive loading manager
function useProgressiveLoading(deviceCapabilities: DeviceCapabilities): LoadingState {
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')

  useEffect(() => {
    // Simulate progressive loading based on network speed and device tier
    const loadingSequence = async () => {
      // Always start with loading state
      setLoadingState('loading')
      
      // Determine loading strategy based on device capabilities
      if (deviceCapabilities.networkSpeed === 'slow' || deviceCapabilities.tier === 'low') {
        // For slow networks or low-end devices, skip to low quality quickly
        setTimeout(() => setLoadingState('low-quality'), 500)
      } else if (deviceCapabilities.networkSpeed === 'medium' || deviceCapabilities.tier === 'medium') {
        // Medium devices: load low quality first, then upgrade
        setTimeout(() => setLoadingState('low-quality'), 300)
        setTimeout(() => setLoadingState('high-quality'), 1500)
      } else {
        // High-end devices with fast networks: load high quality directly
        setTimeout(() => setLoadingState('high-quality'), 800)
      }
    }

    loadingSequence()
  }, [deviceCapabilities])

  return loadingState
}

// Mobile-optimized Earth component
function MobileEarth({ performanceSettings }: { performanceSettings: PerformanceTier }) {
  const deviceCapabilities = useMemo(() => detectDeviceCapabilities(), [])
  const loadingState = useProgressiveLoading(deviceCapabilities)

  return (
    <LODEarthModel 
      performanceSettings={performanceSettings}
      loadingState={loadingState}
    />
  )
}

// Mobile-optimized Globe component
function MobileGlobe({ 
  dataPoints, 
  visualizationMode, 
  transitionProgress,
  zoomLevel,
  onDataPointClick,
  onDataPointHover,
  isDataPointHovered,
  performanceSettings
}: { 
  dataPoints?: ThreatDataPoint[]
  visualizationMode: 'heatmap' | 'pixels'
  transitionProgress: number
  zoomLevel: number
  onDataPointClick?: (dataPoint: ThreatDataPoint) => void
  onDataPointHover?: (dataPoint: ThreatDataPoint | null) => void
  isDataPointHovered?: boolean
  performanceSettings: PerformanceTier
}) {
  const groupRef = useRef<THREE.Group>(null)
  const rotationSpeedRef = useRef(0.1)
  const targetRotationSpeedRef = useRef(0.1)
  
  // Set initial rotation offset
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = 2.535 // 145 degrees initial rotation
    }
  }, [])

  // Optimized rotation with performance considerations
  useFrame((_, delta) => {
    if (groupRef.current) {
      const shouldSlowDown = visualizationMode === 'pixels' && isDataPointHovered
      targetRotationSpeedRef.current = shouldSlowDown ? 0 : 0.1
      
      // Adjust lerp factor based on performance tier
      const lerpFactor = delta * (performanceSettings.maxLODLevel >= 2 ? 6 : 4)
      rotationSpeedRef.current = THREE.MathUtils.lerp(
        rotationSpeedRef.current, 
        targetRotationSpeedRef.current, 
        lerpFactor
      )
      
      groupRef.current.rotation.y += delta * rotationSpeedRef.current
    }
  })

  return (
    <group ref={groupRef}>
      {/* Mobile-optimized Earth model */}
      <MobileEarth performanceSettings={performanceSettings} />
      
      {/* Data visualization with performance optimizations */}
      <DataPointManager
        dataPoints={dataPoints || []}
        zoomLevel={zoomLevel}
        visualizationMode={visualizationMode}
        transitionProgress={transitionProgress}
        onDataPointClick={onDataPointClick}
        onDataPointHover={onDataPointHover}
      />
      
      {/* Conditional effects based on performance tier */}
      {performanceSettings.maxLODLevel >= 2 && (
        <OrbitalFilaments
          dataPoints={dataPoints || []}
          intensity={performanceSettings.maxLODLevel >= 3 ? 1.5 : 1.0}
          visualizationMode={visualizationMode}
        />
      )}
      
      {performanceSettings.maxLODLevel >= 2 && (
        <AmbientParticles
          dataPoints={dataPoints || []}
          intensity={performanceSettings.maxLODLevel >= 3 ? 1.0 : 0.7}
        />
      )}
    </group>
  )
}

// Mobile-optimized Scene component
function MobileScene({ 
  dataPoints, 
  onDataPointClick, 
  onDataPointHover,
  onZoomChange,
  navigationRef,
  onReady,
  performanceSettings
}: { 
  dataPoints?: ThreatDataPoint[]
  onDataPointClick?: (dataPoint: ThreatDataPoint) => void
  onDataPointHover?: (dataPoint: ThreatDataPoint | null) => void
  onZoomChange?: (distance: number) => void
  navigationRef?: React.RefObject<any>
  onReady?: () => void
  performanceSettings: PerformanceTier
}) {
  const [currentZoomLevel, setCurrentZoomLevel] = useState<ZoomLevel | null>(null)
  const [visualizationMode, setVisualizationMode] = useState<'heatmap' | 'pixels'>('heatmap')
  const [transitionProgress, setTransitionProgress] = useState(0)
  const [isDataPointHovered, setIsDataPointHovered] = useState(false)
  const { camera } = useThree()

  const handleZoomChange = useCallback((zoomLevel: ZoomLevel) => {
    setCurrentZoomLevel(zoomLevel)
    onZoomChange?.(zoomLevel.distance)
  }, [onZoomChange])

  const handleVisualizationModeChange = useCallback((mode: 'heatmap' | 'pixels', progress: number) => {
    setVisualizationMode(mode)
    setTransitionProgress(progress)
  }, [])

  const handleDataPointHover = useCallback((dataPoint: ThreatDataPoint | null) => {
    setIsDataPointHovered(dataPoint !== null)
    onDataPointHover?.(dataPoint)
  }, [onDataPointHover])

  const numericZoomLevel = currentZoomLevel?.distance ? (20 - currentZoomLevel.distance) : 5

  const latLngToVector3 = useCallback((lat: number, lng: number, radius: number = 2) => {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta))
    const z = radius * Math.sin(phi) * Math.sin(theta)
    const y = radius * Math.cos(phi)
    
    return new THREE.Vector3(x, y, z)
  }, [])

  const navigateToLocation = useCallback((lat: number, lng: number, distance: number = 6) => {
    const targetPosition = latLngToVector3(lat, lng, distance)
    const endTarget = latLngToVector3(lat, lng, 0)
    
    const startPosition = camera.position.clone()
    
    let progress = 0
    const duration = performanceSettings.maxLODLevel >= 2 ? 2000 : 1500 // Faster on low-end devices
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      progress = Math.min(elapsed / duration, 1)
      
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      camera.position.lerpVectors(startPosition, targetPosition, easeProgress)
      camera.lookAt(endTarget)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }, [camera, latLngToVector3, performanceSettings.maxLODLevel])

  useEffect(() => {
    if (navigationRef?.current) {
      navigationRef.current.navigateToLocation = navigateToLocation
    }
  }, [navigateToLocation, navigationRef])

  useEffect(() => {
    if (onReady) {
      const timer = setTimeout(() => {
        onReady()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [onReady])

  // Performance-optimized lighting setup
  const lightingIntensity = useMemo(() => {
    if (performanceSettings.maxLODLevel >= 3) return { ambient: 2.2, hemisphere: 1.5, rim: 5.2 }
    if (performanceSettings.maxLODLevel >= 2) return { ambient: 1.8, hemisphere: 1.2, rim: 4.0 }
    return { ambient: 1.5, hemisphere: 1.0, rim: 3.0 }
  }, [performanceSettings.maxLODLevel])

  return (
    <PostProcessingPipeline
      bloomIntensity={performanceSettings.postProcessing ? 2 : 0}
      bloomRadius={0.6}
      bloomThreshold={0.2}
      chromaticAberrationIntensity={performanceSettings.postProcessing ? 0.0003 : 0}
      enableToneMapping={false}
      enableAntiAliasing={performanceSettings.antialiasing}
      enableSelectiveBloom={performanceSettings.postProcessing}
    >
      <ZoomController
        onZoomChange={handleZoomChange}
        onVisualizationModeChange={handleVisualizationModeChange}
      >
        {/* Performance-optimized lighting */}
        <ambientLight intensity={lightingIntensity.ambient} />
        
        <hemisphereLight
          args={["#87CEEB", "#362d1a", lightingIntensity.hemisphere]}
        />
        
        {/* Conditional lighting based on performance */}
        {performanceSettings.maxLODLevel >= 2 && (
          <>
            <directionalLight
              position={[10, 10, 5]}
              intensity={0}
              color="#ffffff"
              castShadow={performanceSettings.shadowQuality !== 'disabled'}
              shadow-mapSize-width={performanceSettings.shadowQuality === 'high' ? 2048 : 1024}
              shadow-mapSize-height={performanceSettings.shadowQuality === 'high' ? 2048 : 1024}
            />
            
            <directionalLight
              position={[-20, -15, -20]}
              intensity={0}
              color="#e0f2fe"
            />
          </>
        )}
        
        {/* Rim lighting */}
        <pointLight position={[0, 0, -10]} intensity={lightingIntensity.rim} color="#3b82f6" />
        
        {/* Performance-optimized star field */}
        <StarField 
          count={performanceSettings.particleCount} 
          radius={80} 
        />

        {/* Mobile-optimized globe */}
        <MobileGlobe 
          dataPoints={dataPoints}
          visualizationMode={visualizationMode}
          transitionProgress={transitionProgress}
          zoomLevel={numericZoomLevel}
          onDataPointClick={onDataPointClick}
          onDataPointHover={handleDataPointHover}
          isDataPointHovered={isDataPointHovered}
          performanceSettings={performanceSettings}
        />
        
        {/* Mobile-optimized controls with touch support */}
        <UnifiedControlManager
          enableZoom={true}
          enableRotate={true}
          enablePan={true}
          enableDoubleTap={true}
          minDistance={4}
          maxDistance={25}
          zoomSpeed={performanceSettings.maxLODLevel >= 2 ? 0.15 : 0.2}
          rotateSpeed={performanceSettings.maxLODLevel >= 2 ? 0.4 : 0.5}
          panSpeed={0.6}
          dampingFactor={performanceSettings.maxLODLevel >= 2 ? 0.03 : 0.05}
          autoRotate={false}
          onZoomChange={onZoomChange}
          onDoubleTap={(position) => {
            console.log('Double tap at:', position)
          }}
          onRegionFocus={(lat, lng) => {
            // Focus on the tapped region by navigating to it
            if (navigationRef?.current?.navigateToLocation) {
              navigationRef.current.navigateToLocation(lat, lng, 6)
            }
          }}
        />
      </ZoomController>
    </PostProcessingPipeline>
  )
}

export const MobileOptimizedGlobeRenderer = forwardRef<MobileOptimizedGlobeRendererRef, MobileOptimizedGlobeRendererProps>(({ 
  className = '', 
  dataPoints, 
  onDataPointClick, 
  onDataPointHover,
  onZoomChange,
  onReady
}, ref) => {
  const navigationRef = useRef<any>({})
  
  // Detect device capabilities and get performance settings
  const deviceCapabilities = useMemo(() => detectDeviceCapabilities(), [])
  const performanceSettings = useMemo(() => getPerformanceSettings(deviceCapabilities), [deviceCapabilities])

  useImperativeHandle(ref, () => ({
    navigateToLocation: (lat: number, lng: number, distance: number = 6) => {
      if (navigationRef.current?.navigateToLocation) {
        navigationRef.current.navigateToLocation(lat, lng, distance)
      }
    }
  }), [])

  // Mobile-optimized Canvas settings
  const canvasSettings = useMemo(() => ({
    camera: {
      position: [0, 0, 8] as [number, number, number],
      fov: 45,
      near: 0.01,
      far: 1000
    },
    gl: {
      antialias: performanceSettings.antialiasing,
      alpha: true,
      powerPreference: (deviceCapabilities.tier === 'high' ? 'high-performance' : 'default') as WebGLPowerPreference,
      pixelRatio: performanceSettings.pixelRatio
    }
  }), [performanceSettings, deviceCapabilities.tier])

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={canvasSettings.camera}
        shadows={performanceSettings.shadowQuality !== 'disabled'}
        gl={canvasSettings.gl}
        dpr={performanceSettings.pixelRatio} // Explicit pixel ratio control
      >
        <MobileScene 
          dataPoints={dataPoints} 
          onDataPointClick={onDataPointClick}
          onDataPointHover={onDataPointHover}
          onZoomChange={onZoomChange}
          navigationRef={navigationRef}
          onReady={onReady}
          performanceSettings={performanceSettings}
        />
      </Canvas>
    </div>
  )
})

MobileOptimizedGlobeRenderer.displayName = 'MobileOptimizedGlobeRenderer'

// Conditional preloading based on device capabilities
if (typeof window !== 'undefined') {
  const capabilities = detectDeviceCapabilities()
  if (capabilities.tier !== 'low' && capabilities.networkSpeed !== 'slow') {
    useGLTF.preload('/models/Earth_1_12756.glb')
  }
}