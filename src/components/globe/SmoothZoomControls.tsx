'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export interface SmoothZoomControlsProps {
  enableZoom?: boolean
  enableRotate?: boolean
  enablePan?: boolean
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
}

export function SmoothZoomControls({
  enableZoom = true,
  enableRotate = true,
  enablePan = true,
  minDistance = 4,
  maxDistance = 25,
  zoomSpeed = 0.2,
  rotateSpeed = 0.5,
  panSpeed = 0.8,
  dampingFactor = 0.03,
  autoRotate = false,
  autoRotateSpeed = 0.5,
  target = new THREE.Vector3(0, 0, 0),
  onZoomChange
}: SmoothZoomControlsProps) {
  const { camera, gl, invalidate } = useThree()
  
  // State for smooth interpolation
  const state = useRef({
    spherical: new THREE.Spherical(),
    sphericalDelta: new THREE.Spherical(),
    scale: 1,
    panOffset: new THREE.Vector3(),
    zoomChanged: false,
    rotateStart: new THREE.Vector2(),
    rotateEnd: new THREE.Vector2(),
    rotateDelta: new THREE.Vector2(),
    panStart: new THREE.Vector2(),
    panEnd: new THREE.Vector2(),
    panDelta: new THREE.Vector2(),
    dollyStart: new THREE.Vector2(),
    dollyEnd: new THREE.Vector2(),
    dollyDelta: new THREE.Vector2(),
    isMouseDown: false,
    mouseButton: -1,
    lastDistance: 0
  })

  // Initialize spherical coordinates from camera position
  useEffect(() => {
    const offset = new THREE.Vector3()
    offset.copy(camera.position).sub(target)
    state.current.spherical.setFromVector3(offset)
    state.current.lastDistance = offset.length()
  }, [camera, target])

  // Smooth zoom function with exponential scaling
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

  // Handle mouse wheel with smooth acceleration
  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault()
    
    // Normalize wheel delta across browsers and devices
    let delta = 0
    if (event.deltaY) {
      delta = event.deltaY > 0 ? 1 : -1
    }
    
    // Apply smooth zoom with momentum
    handleZoom(delta * 2) // Multiply for more responsive feel
    invalidate()
  }, [handleZoom, invalidate])

  // Handle mouse events for rotation and panning
  const handleMouseDown = useCallback((event: MouseEvent) => {
    event.preventDefault()
    
    state.current.isMouseDown = true
    state.current.mouseButton = event.button

    const rect = gl.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    if (event.button === 0 && enableRotate) { // Left mouse button
      state.current.rotateStart.set(x, y)
    } else if (event.button === 2 && enablePan) { // Right mouse button
      state.current.panStart.set(x, y)
    }
  }, [gl, enableRotate, enablePan])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!state.current.isMouseDown) return
    
    event.preventDefault()

    const rect = gl.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    if (state.current.mouseButton === 0 && enableRotate) {
      state.current.rotateEnd.set(x, y)
      state.current.rotateDelta.subVectors(state.current.rotateEnd, state.current.rotateStart).multiplyScalar(rotateSpeed)
      
      // Apply rotation with smooth damping - inverted Y-axis for intuitive control
      state.current.sphericalDelta.theta -= 2 * Math.PI * state.current.rotateDelta.x
      state.current.sphericalDelta.phi += 2 * Math.PI * state.current.rotateDelta.y  // Inverted Y-axis
      
      state.current.rotateStart.copy(state.current.rotateEnd)
    } else if (state.current.mouseButton === 2 && enablePan) {
      state.current.panEnd.set(x, y)
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
  }, [gl, enableRotate, enablePan, rotateSpeed, panSpeed, camera, target, invalidate])

  const handleMouseUp = useCallback(() => {
    state.current.isMouseDown = false
    state.current.mouseButton = -1
  }, [])

  // Set up event listeners
  useEffect(() => {
    const element = gl.domElement
    
    element.addEventListener('wheel', handleWheel, { passive: false })
    element.addEventListener('mousedown', handleMouseDown)
    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseup', handleMouseUp)
    element.addEventListener('contextmenu', (e) => e.preventDefault())
    
    return () => {
      element.removeEventListener('wheel', handleWheel)
      element.removeEventListener('mousedown', handleMouseDown)
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseup', handleMouseUp)
      element.removeEventListener('contextmenu', (e) => e.preventDefault())
    }
  }, [gl, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp])

  // Update camera position with smooth interpolation
  useFrame(() => {
    // Apply auto rotation
    if (autoRotate && !state.current.isMouseDown) {
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

    // Notify about zoom changes
    const currentDistance = offset.length()
    if (Math.abs(currentDistance - state.current.lastDistance) > 0.01) {
      state.current.lastDistance = currentDistance
      onZoomChange?.(currentDistance)
    }
  })

  return null
}