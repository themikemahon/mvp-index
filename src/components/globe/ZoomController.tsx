'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export interface ZoomLevel {
  distance: number
  visualizationMode: 'heatmap' | 'pixels'
  transitionThreshold: number
}

export interface ZoomControllerProps {
  onZoomChange?: (zoomLevel: ZoomLevel, progress: number) => void
  onVisualizationModeChange?: (mode: 'heatmap' | 'pixels', progress: number) => void
  children?: React.ReactNode
}

// Define zoom levels based on camera distance from globe
// Heat map is the primary view, dots only appear when zoomed in close
// More granular levels for smoother transitions
const ZOOM_LEVELS: ZoomLevel[] = [
  {
    distance: 25, // Very far out - global heat map view
    visualizationMode: 'heatmap',
    transitionThreshold: 22
  },
  {
    distance: 22, // Far out - global heat map view
    visualizationMode: 'heatmap',
    transitionThreshold: 19
  },
  {
    distance: 19, // Far out - global heat map view
    visualizationMode: 'heatmap',
    transitionThreshold: 16
  },
  {
    distance: 16, // Medium-far distance - still heat map
    visualizationMode: 'heatmap',
    transitionThreshold: 13
  },
  {
    distance: 13, // Medium distance - still heat map
    visualizationMode: 'heatmap',
    transitionThreshold: 10
  },
  {
    distance: 10, // Getting closer - still heat map
    visualizationMode: 'heatmap',
    transitionThreshold: 8
  },
  {
    distance: 8, // Close - transition to individual dots
    visualizationMode: 'pixels',
    transitionThreshold: 6.5
  },
  {
    distance: 6.5, // Closer - individual dots more visible
    visualizationMode: 'pixels',
    transitionThreshold: 5
  },
  {
    distance: 5, // Very close - individual dots clearly visible
    visualizationMode: 'pixels',
    transitionThreshold: 4
  }
]

export function ZoomController({ 
  onZoomChange, 
  onVisualizationModeChange,
  children 
}: ZoomControllerProps) {
  const { camera } = useThree()
  const [currentZoomLevel, setCurrentZoomLevel] = useState<ZoomLevel>(ZOOM_LEVELS[0])
  const [previousMode, setPreviousMode] = useState<'heatmap' | 'pixels'>('heatmap')
  const [transitionProgress, setTransitionProgress] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Animation state for smooth transitions
  const animationRef = useRef<{
    startTime: number
    duration: number
    fromProgress: number
    toProgress: number
  } | null>(null)

  // Calculate current camera distance from origin (globe center)
  const getCameraDistance = useCallback(() => {
    return camera.position.length()
  }, [camera])

  // Determine appropriate zoom level based on camera distance
  const getZoomLevelForDistance = useCallback((distance: number): ZoomLevel => {
    // Find the closest zoom level
    let closestLevel = ZOOM_LEVELS[0]
    let minDiff = Math.abs(distance - closestLevel.distance)

    for (const level of ZOOM_LEVELS) {
      const diff = Math.abs(distance - level.distance)
      if (diff < minDiff) {
        minDiff = diff
        closestLevel = level
      }
    }

    return closestLevel
  }, [])

  // Calculate transition progress between visualization modes
  // Clear separation: heatmap for far distances, pixels for close distances
  const calculateTransitionProgress = useCallback((distance: number): number => {
    const transitionThreshold = 5.5  // Single threshold for clean state separation - reduced for later detail mode

    if (distance >= transitionThreshold) {
      return 0 // Full heatmap mode
    } else {
      return 1 // Full pixel mode
    }
  }, [])

  // Initialize camera position and state on first render
  useEffect(() => {
    if (!isInitialized) {
      // Ensure camera starts at a consistent position - closer for better heat map view
      camera.position.set(0, 0, 8)
      camera.lookAt(0, 0, 0)
      
      // Initialize with correct zoom level
      const initialDistance = camera.position.length()
      const initialZoomLevel = getZoomLevelForDistance(initialDistance)
      const initialProgress = calculateTransitionProgress(initialDistance)
      
      setCurrentZoomLevel(initialZoomLevel)
      setTransitionProgress(initialProgress)
      
      // Notify parent components of initial state
      onZoomChange?.(initialZoomLevel, initialProgress)
      onVisualizationModeChange?.('heatmap', initialProgress)
      
      setIsInitialized(true)
    }
  }, [camera, isInitialized, onZoomChange, onVisualizationModeChange, getZoomLevelForDistance, calculateTransitionProgress])

  // Smooth transition animation using easing
  const easeInOutCubic = useCallback((t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }, [])

  // Update zoom state and handle transitions with separated visual/computational updates
  useFrame((state, delta) => {
    const currentDistance = getCameraDistance()
    
    // Visual updates (opacity, transitions) run at 60fps for smoothness
    // Handle smooth animation if we're transitioning
    let finalProgress = calculateTransitionProgress(currentDistance)
    if (animationRef.current) {
      const elapsed = state.clock.elapsedTime - animationRef.current.startTime
      const animationProgress = Math.min(elapsed / animationRef.current.duration, 1)
      const easedProgress = easeInOutCubic(animationProgress)
      
      finalProgress = THREE.MathUtils.lerp(
        animationRef.current.fromProgress,
        animationRef.current.toProgress,
        easedProgress
      )

      // Complete animation
      if (animationProgress >= 1) {
        animationRef.current = null
        setIsTransitioning(false)
      }
    }

    // Always update transition progress for smooth visuals
    if (Math.abs(finalProgress - transitionProgress) > 0.005) { // Smaller threshold for smoother visuals
      setTransitionProgress(finalProgress)
    }

    // Throttle expensive computations to every 2nd frame
    if (Math.floor(state.clock.elapsedTime * 60) % 2 !== 0) return
    
    const newZoomLevel = getZoomLevelForDistance(currentDistance)

    // Check if visualization mode should change - clear state separation
    const newMode = currentDistance >= 5.5 ? 'heatmap' : 'pixels'
    
    // Start transition animation if mode is changing and not already transitioning
    if (newMode !== previousMode && !isTransitioning) {
      setIsTransitioning(true)
      setPreviousMode(newMode)
      
      animationRef.current = {
        startTime: state.clock.elapsedTime,
        duration: 0.6, // Smooth transition duration
        fromProgress: transitionProgress,
        toProgress: calculateTransitionProgress(currentDistance)
      }
    }

    // Update state only if there's a meaningful change
    if (newZoomLevel !== currentZoomLevel) {
      setCurrentZoomLevel(newZoomLevel)
      onZoomChange?.(newZoomLevel, finalProgress)
    }

    // Notify about visualization mode changes with debouncing
    if (newMode !== previousMode) {
      onVisualizationModeChange?.(newMode, finalProgress)
    }
  })

  return <>{children}</>
}

// Hook for components to access zoom state
export function useZoomController() {
  const { camera } = useThree()
  const [zoomState, setZoomState] = useState({
    distance: 8,
    mode: 'heatmap' as 'heatmap' | 'pixels',
    progress: 0,
    isTransitioning: false
  })

  useFrame(() => {
    const distance = camera.position.length()
    const progress = distance >= 5.5 ? 0 : 1 // Clear binary state
    const mode = distance >= 5.5 ? 'heatmap' : 'pixels' // Clear binary state
    
    setZoomState(prev => ({
      distance,
      mode,
      progress,
      isTransitioning: Math.abs(distance - 5.5) < 0.5 // Narrow transition zone
    }))
  })

  return zoomState
}