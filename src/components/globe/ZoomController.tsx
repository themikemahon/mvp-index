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
  // Heat map is primary - only show dots when zoomed in close
  const calculateTransitionProgress = useCallback((distance: number): number => {
    // Transition boundaries - heat map dominates until very close
    const heatmapThreshold = 9   // Distance where we start transitioning from heatmap
    const pixelThreshold = 6     // Distance where we complete transition to pixels

    if (distance >= heatmapThreshold) {
      return 0 // Full heatmap mode - this is the default view
    } else if (distance <= pixelThreshold) {
      return 1 // Full pixel mode - only when very close
    } else {
      // Smooth transition between thresholds with more granular steps
      const progress = (heatmapThreshold - distance) / (heatmapThreshold - pixelThreshold)
      // Use smoother easing for more fluid transition
      return progress * progress * progress * (progress * (progress * 6 - 15) + 10) // Smootherstep function
    }
  }, [])

  // Smooth transition animation using easing
  const easeInOutCubic = useCallback((t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }, [])

  // Update zoom state and handle transitions
  useFrame((state, delta) => {
    const currentDistance = getCameraDistance()
    const newZoomLevel = getZoomLevelForDistance(currentDistance)
    const rawProgress = calculateTransitionProgress(currentDistance)

    // Handle smooth animation if we're transitioning
    let finalProgress = rawProgress
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

    // Check if visualization mode should change
    const newMode = finalProgress < 0.5 ? 'heatmap' : 'pixels'
    
    // Start transition animation if mode is changing
    if (newMode !== previousMode && !isTransitioning) {
      setIsTransitioning(true)
      setPreviousMode(newMode)
      
      animationRef.current = {
        startTime: state.clock.elapsedTime,
        duration: 1.2, // Longer transition for smoother feel
        fromProgress: transitionProgress,
        toProgress: rawProgress
      }
    }

    // Update state
    if (newZoomLevel !== currentZoomLevel) {
      setCurrentZoomLevel(newZoomLevel)
      onZoomChange?.(newZoomLevel, finalProgress)
    }

    if (Math.abs(finalProgress - transitionProgress) > 0.001) {
      setTransitionProgress(finalProgress)
    }

    // Notify about visualization mode changes
    if (newMode !== previousMode || Math.abs(finalProgress - transitionProgress) > 0.001) {
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
    // Updated thresholds to match the new smoother behavior
    const progress = distance >= 9 ? 0 : distance <= 6 ? 1 : (9 - distance) / 3
    const mode = progress < 0.5 ? 'heatmap' : 'pixels' // Heat map dominates longer
    
    setZoomState(prev => ({
      distance,
      mode,
      progress,
      isTransitioning: Math.abs(progress - 0.5) < 0.2 // Wider transition zone
    }))
  })

  return zoomState
}