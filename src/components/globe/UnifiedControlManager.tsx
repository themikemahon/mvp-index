'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { TouchInteraction } from '@/types/responsive'

export interface UnifiedControlManagerProps {
  enableZoom?: boolean
  enableRotate?: boolean
  enablePan?: boolean
  enableDoubleTap?: boolean
  minDistance?: number
  maxDistance?: number
  zoomSpeed?: number
  rotateSpeed?: number
  panSpeed?: number
  dampingFactor?: number
  autoRotate?: boolean
  autoRotateSpeed?: number
  target?: THREE.Vector3
  onZoomChange?: (distance: number) => void
  onDoubleTap?: (position: { x: number; y: number }) => void
  onRegionFocus?: (lat: number, lng: number) => void
}

interface ControlState {
  spherical: THREE.Spherical
  sphericalDelta: THREE.Spherical
  scale: number
  panOffset: THREE.Vector3
  zoomChanged: boolean
  lastDistance: number
  
  // Mouse state
  isMouseDown: boolean
  mouseButton: number
  rotateStart: THREE.Vector2
  rotateEnd: THREE.Vector2
  rotateDelta: THREE.Vector2
  panStart: THREE.Vector2
  panEnd: THREE.Vector2
  panDelta: THREE.Vector2
  
  // Touch state
  touches: Map<number, Touch>
  lastTouchTime: number
  lastTapPosition: { x: number; y: number } | null
  isRotating: boolean
  isZooming: boolean
  isPanning: boolean
  zoomStart: number
}

export function UnifiedControlManager({
  enableZoom = true,
  enableRotate = true,
  enablePan = true,
  enableDoubleTap = true,
  minDistance = 4,
  maxDistance = 25,
  zoomSpeed = 0.2,
  rotateSpeed = 0.5,
  panSpeed = 0.8,
  dampingFactor = 0.03,
  autoRotate = false,
  autoRotateSpeed = 0.5,
  target = new THREE.Vector3(0, 0, 0),
  onZoomChange,
  onDoubleTap,
  onRegionFocus
}: UnifiedControlManagerProps) {
  const { camera, gl, invalidate } = useThree()
  
  // Unified control state
  const state = useRef<ControlState>({
    spherical: new THREE.Spherical(),
    sphericalDelta: new THREE.Spherical(),
    scale: 1,
    panOffset: new THREE.Vector3(),
    zoomChanged: false,
    lastDistance: 0,
    
    // Mouse state
    isMouseDown: false,
    mouseButton: -1,
    rotateStart: new THREE.Vector2(),
    rotateEnd: new THREE.Vector2(),
    rotateDelta: new THREE.Vector2(),
    panStart: new THREE.Vector2(),
    panEnd: new THREE.Vector2(),
    panDelta: new THREE.Vector2(),
    
    // Touch state
    touches: new Map(),
    lastTouchTime: 0,
    lastTapPosition: null,
    isRotating: false,
    isZooming: false,
    isPanning: false,
    zoomStart: 0
  })

  // Initialize spherical coordinates from camera position
  useEffect(() => {
    const offset = new THREE.Vector3()
    offset.copy(camera.position).sub(target)
    state.current.spherical.setFromVector3(offset)
    state.current.lastDistance = offset.length()
    
    // Ensure consistent initial state
    if (state.current.lastDistance < minDistance || state.current.lastDistance > maxDistance) {
      const safeDistance = Math.max(minDistance, Math.min(maxDistance, 8))
      camera.position.set(0, 0, safeDistance)
      camera.lookAt(target)
      state.current.spherical.setFromVector3(camera.position.clone().sub(target))
      state.current.lastDistance = safeDistance
      onZoomChange?.(safeDistance)
    }
  }, [camera, target, minDistance, maxDistance, onZoomChange])

  // Convert screen coordinates to normalized device coordinates
  const getScreenCoordinates = useCallback((clientX: number, clientY: number) => {
    const rect = gl.domElement.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 2 - 1
    const y = -((clientY - rect.top) / rect.height) * 2 + 1
    return { x, y }
  }, [gl])

  // Calculate distance between two touches
  const getTouchDistance = useCallback((touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Get center point between two touches
  const getTouchCenter = useCallback((touch1: Touch, touch2: Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }, [])

  // Convert screen coordinates to globe lat/lng
  const screenToGlobeCoordinates = useCallback((screenX: number, screenY: number) => {
    const coords = getScreenCoordinates(screenX, screenY)
    
    // Create a raycaster to find intersection with globe
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(coords.x, coords.y)
    raycaster.setFromCamera(mouse, camera)
    
    // Create a sphere geometry for intersection testing (radius 2 to match globe)
    const sphereGeometry = new THREE.SphereGeometry(2, 32, 16)
    const sphereMesh = new THREE.Mesh(sphereGeometry)
    
    const intersects = raycaster.intersectObject(sphereMesh)
    
    if (intersects.length > 0) {
      const point = intersects[0].point
      
      // Convert 3D point to lat/lng
      const radius = point.length()
      const lat = 90 - (Math.acos(point.y / radius) * 180 / Math.PI)
      const lng = ((Math.atan2(point.z, -point.x) * 180 / Math.PI) + 180) % 360 - 180
      
      return { lat, lng }
    }
    
    return null
  }, [getScreenCoordinates, camera])

  // Handle zoom with smooth scaling
  const handleZoom = useCallback((delta: number) => {
    if (!enableZoom) return

    // Use exponential scaling for smoother zoom feel
    const zoomScale = Math.pow(0.95, zoomSpeed * Math.abs(delta))
    
    if (delta < 0) {
      state.current.scale *= zoomScale
    } else if (delta > 0) {
      state.current.scale /= zoomScale
    }

    state.current.zoomChanged = true
  }, [enableZoom, zoomSpeed])

  // Mouse wheel handler
  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault()
    
    // Normalize wheel delta across browsers and devices
    let delta = 0
    if (event.deltaY) {
      delta = event.deltaY > 0 ? 1 : -1
    }
    
    // Apply smooth zoom with momentum
    handleZoom(delta * 2)
    invalidate()
  }, [handleZoom, invalidate])

  // Mouse event handlers
  const handleMouseDown = useCallback((event: MouseEvent) => {
    event.preventDefault()
    
    state.current.isMouseDown = true
    state.current.mouseButton = event.button

    const coords = getScreenCoordinates(event.clientX, event.clientY)

    if (event.button === 0 && enableRotate) { // Left mouse button
      state.current.rotateStart.set(coords.x, coords.y)
    } else if (event.button === 2 && enablePan) { // Right mouse button
      state.current.panStart.set(coords.x, coords.y)
    }
  }, [getScreenCoordinates, enableRotate, enablePan])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!state.current.isMouseDown) return
    
    event.preventDefault()

    const coords = getScreenCoordinates(event.clientX, event.clientY)

    if (state.current.mouseButton === 0 && enableRotate) {
      state.current.rotateEnd.set(coords.x, coords.y)
      state.current.rotateDelta.subVectors(state.current.rotateEnd, state.current.rotateStart).multiplyScalar(rotateSpeed)
      
      // Apply rotation with smooth damping - inverted Y-axis for intuitive control
      state.current.sphericalDelta.theta -= 2 * Math.PI * state.current.rotateDelta.x
      state.current.sphericalDelta.phi += 2 * Math.PI * state.current.rotateDelta.y
      
      state.current.rotateStart.copy(state.current.rotateEnd)
    } else if (state.current.mouseButton === 2 && enablePan) {
      state.current.panEnd.set(coords.x, coords.y)
      state.current.panDelta.subVectors(state.current.panEnd, state.current.panStart).multiplyScalar(panSpeed)
      
      // Calculate pan in world space
      const offset = new THREE.Vector3()
      offset.copy(camera.position).sub(target)
      const targetDistance = offset.length()
      
      // Pan proportional to distance
      const panX = state.current.panDelta.x * targetDistance * 0.5
      const panY = state.current.panDelta.y * targetDistance * 0.5
      
      const panVector = new THREE.Vector3()
      panVector.setFromMatrixColumn(camera.matrix, 0) // Right vector
      panVector.multiplyScalar(-panX)
      
      const upVector = new THREE.Vector3()
      upVector.setFromMatrixColumn(camera.matrix, 1) // Up vector
      upVector.multiplyScalar(panY)
      
      state.current.panOffset.add(panVector).add(upVector)
      state.current.panStart.copy(state.current.panEnd)
    }
    
    invalidate()
  }, [getScreenCoordinates, enableRotate, enablePan, rotateSpeed, panSpeed, camera, target, invalidate])

  const handleMouseUp = useCallback(() => {
    state.current.isMouseDown = false
    state.current.mouseButton = -1
  }, [])

  // Touch event handlers
  const handleTouchStart = useCallback((event: TouchEvent) => {
    event.preventDefault()
    
    const touches = Array.from(event.touches)
    const currentTime = Date.now()
    
    // Update touch tracking
    state.current.touches.clear()
    touches.forEach(touch => {
      state.current.touches.set(touch.identifier, touch)
    })

    if (touches.length === 1) {
      // Single touch - rotation or potential double tap
      const touch = touches[0]
      const coords = getScreenCoordinates(touch.clientX, touch.clientY)
      
      // Check for double tap
      if (enableDoubleTap && state.current.lastTapPosition) {
        const timeDiff = currentTime - state.current.lastTouchTime
        const dx = Math.abs(touch.clientX - state.current.lastTapPosition.x)
        const dy = Math.abs(touch.clientY - state.current.lastTapPosition.y)
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (timeDiff < 300 && distance < 50) {
          // Double tap detected
          const globeCoords = screenToGlobeCoordinates(touch.clientX, touch.clientY)
          if (globeCoords && onRegionFocus) {
            onRegionFocus(globeCoords.lat, globeCoords.lng)
          }
          onDoubleTap?.({ x: touch.clientX, y: touch.clientY })
          state.current.lastTapPosition = null
          return
        }
      }
      
      // Start rotation
      if (enableRotate) {
        state.current.isRotating = true
        state.current.rotateStart.set(coords.x, coords.y)
      }
      
      // Store tap position for double tap detection
      state.current.lastTapPosition = { x: touch.clientX, y: touch.clientY }
      state.current.lastTouchTime = currentTime
      
    } else if (touches.length === 2) {
      // Two touches - pinch zoom and pan
      const touch1 = touches[0]
      const touch2 = touches[1]
      
      if (enableZoom) {
        state.current.isZooming = true
        state.current.zoomStart = getTouchDistance(touch1, touch2)
      }
      
      if (enablePan) {
        const center = getTouchCenter(touch1, touch2)
        const coords = getScreenCoordinates(center.x, center.y)
        state.current.isPanning = true
        state.current.panStart.set(coords.x, coords.y)
      }
      
      // Clear rotation state
      state.current.isRotating = false
    }
    
    invalidate()
  }, [getScreenCoordinates, getTouchDistance, getTouchCenter, enableRotate, enableZoom, enablePan, enableDoubleTap, onDoubleTap, invalidate])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    event.preventDefault()
    
    const touches = Array.from(event.touches)
    
    if (touches.length === 1 && state.current.isRotating && enableRotate) {
      // Single touch rotation
      const touch = touches[0]
      const coords = getScreenCoordinates(touch.clientX, touch.clientY)
      
      state.current.rotateEnd.set(coords.x, coords.y)
      state.current.rotateDelta.subVectors(state.current.rotateEnd, state.current.rotateStart).multiplyScalar(rotateSpeed)
      
      // Apply rotation with smooth damping - inverted Y-axis for intuitive control
      state.current.sphericalDelta.theta -= 2 * Math.PI * state.current.rotateDelta.x
      state.current.sphericalDelta.phi += 2 * Math.PI * state.current.rotateDelta.y
      
      state.current.rotateStart.copy(state.current.rotateEnd)
      
    } else if (touches.length === 2) {
      const touch1 = touches[0]
      const touch2 = touches[1]
      
      // Handle pinch zoom
      if (state.current.isZooming && enableZoom) {
        const currentDistance = getTouchDistance(touch1, touch2)
        const zoomDelta = (state.current.zoomStart - currentDistance) * 0.01
        handleZoom(zoomDelta)
        state.current.zoomStart = currentDistance
      }
      
      // Handle two-finger pan
      if (state.current.isPanning && enablePan) {
        const center = getTouchCenter(touch1, touch2)
        const coords = getScreenCoordinates(center.x, center.y)
        
        state.current.panEnd.set(coords.x, coords.y)
        state.current.panDelta.subVectors(state.current.panEnd, state.current.panStart).multiplyScalar(panSpeed)
        
        // Calculate pan in world space
        const offset = new THREE.Vector3()
        offset.copy(camera.position).sub(target)
        const targetDistance = offset.length()
        
        // Pan proportional to distance
        const panX = state.current.panDelta.x * targetDistance * 0.5
        const panY = state.current.panDelta.y * targetDistance * 0.5
        
        const panVector = new THREE.Vector3()
        panVector.setFromMatrixColumn(camera.matrix, 0) // Right vector
        panVector.multiplyScalar(-panX)
        
        const upVector = new THREE.Vector3()
        upVector.setFromMatrixColumn(camera.matrix, 1) // Up vector
        upVector.multiplyScalar(panY)
        
        state.current.panOffset.add(panVector).add(upVector)
        state.current.panStart.copy(state.current.panEnd)
      }
    }
    
    invalidate()
  }, [getScreenCoordinates, getTouchDistance, getTouchCenter, enableRotate, enableZoom, enablePan, rotateSpeed, panSpeed, handleZoom, camera, target, invalidate])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    event.preventDefault()
    
    const touches = Array.from(event.touches)
    
    // Update touch tracking
    state.current.touches.clear()
    touches.forEach(touch => {
      state.current.touches.set(touch.identifier, touch)
    })
    
    if (touches.length === 0) {
      // All touches ended
      state.current.isRotating = false
      state.current.isZooming = false
      state.current.isPanning = false
    } else if (touches.length === 1) {
      // Transition from multi-touch to single touch
      state.current.isZooming = false
      state.current.isPanning = false
      
      // Start rotation with remaining touch
      if (enableRotate) {
        const touch = touches[0]
        const coords = getScreenCoordinates(touch.clientX, touch.clientY)
        state.current.isRotating = true
        state.current.rotateStart.set(coords.x, coords.y)
      }
    }
    
    invalidate()
  }, [getScreenCoordinates, enableRotate, invalidate])

  // Prevent context menu on long press
  const handleContextMenu = useCallback((event: Event) => {
    event.preventDefault()
  }, [])

  // Set up event listeners
  useEffect(() => {
    const element = gl.domElement
    
    // Mouse events
    element.addEventListener('wheel', handleWheel, { passive: false })
    element.addEventListener('mousedown', handleMouseDown)
    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseup', handleMouseUp)
    
    // Touch events
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false })
    
    // Prevent context menu
    element.addEventListener('contextmenu', handleContextMenu, { passive: false })
    
    return () => {
      // Mouse events
      element.removeEventListener('wheel', handleWheel)
      element.removeEventListener('mousedown', handleMouseDown)
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseup', handleMouseUp)
      
      // Touch events
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
      
      // Context menu
      element.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [gl, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd, handleContextMenu])

  // Update camera position with smooth interpolation
  useFrame((frameState, delta) => {
    // Apply auto rotation
    if (autoRotate && !state.current.isMouseDown && !state.current.isRotating) {
      state.current.sphericalDelta.theta -= 2 * Math.PI / 60 / 60 * autoRotateSpeed
    }

    // Apply accumulated rotations with damping
    state.current.spherical.theta += state.current.sphericalDelta.theta * dampingFactor
    state.current.spherical.phi += state.current.sphericalDelta.phi * dampingFactor

    // Apply damping to rotation deltas
    state.current.sphericalDelta.theta *= (1 - dampingFactor * 2)
    state.current.sphericalDelta.phi *= (1 - dampingFactor * 2)

    // Constrain phi to prevent flipping
    const EPS = 0.000001
    state.current.spherical.phi = Math.max(EPS, Math.min(Math.PI - EPS, state.current.spherical.phi))

    // Apply zoom with smooth interpolation
    if (state.current.zoomChanged) {
      state.current.spherical.radius *= state.current.scale
      state.current.spherical.radius = Math.max(minDistance, Math.min(maxDistance, state.current.spherical.radius))
      state.current.scale = 1
      state.current.zoomChanged = false
    }

    // Update camera position
    const offset = new THREE.Vector3()
    offset.setFromSpherical(state.current.spherical)
    
    // Apply pan offset with damping
    const newTarget = new THREE.Vector3().copy(target).add(state.current.panOffset)
    camera.position.copy(newTarget).add(offset)
    camera.lookAt(newTarget)
    
    // Apply damping to pan offset
    state.current.panOffset.multiplyScalar(1 - dampingFactor)

    // Throttle zoom change notifications
    if (Math.floor(frameState.clock.elapsedTime * 30) % 1 === 0) {
      const currentDistance = offset.length()
      if (Math.abs(currentDistance - state.current.lastDistance) > 0.05) {
        state.current.lastDistance = currentDistance
        onZoomChange?.(currentDistance)
      }
    }
  })

  return null
}