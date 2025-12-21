// SimpleFilamentSystem.tsx - A simplified version of the filament system that should work reliably
'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ThreatDataPoint } from '@/types/threat'

export interface SimpleFilamentSystemProps {
  dataPoints?: ThreatDataPoint[]
  isLoading?: boolean
  enableCursorTrail?: boolean
  intensity?: number
  opacity?: number
}

export function SimpleFilamentSystem({
  dataPoints = [],
  isLoading = false,
  enableCursorTrail = true,
  intensity = 1.0,
  opacity = 0.8
}: SimpleFilamentSystemProps) {
  const groupRef = useRef<THREE.Group>(null)
  const filamentsRef = useRef<THREE.Mesh[]>([])
  const cursorTrailRef = useRef<THREE.Mesh | null>(null)
  
  const { gl } = useThree()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isMouseOverGlobe, setIsMouseOverGlobe] = useState(false)
  
  // Create filament paths around the globe
  useEffect(() => {
    if (!groupRef.current) return
    
    // Clear existing filaments
    filamentsRef.current.forEach(mesh => {
      groupRef.current?.remove(mesh)
      mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      }
    })
    filamentsRef.current = []
    
    // Create several curved filament paths
    const pathCount = 6
    const globeRadius = 2.1
    
    for (let i = 0; i < pathCount; i++) {
      const points: THREE.Vector3[] = []
      const segments = 50
      
      // Create a path that wraps around the globe
      for (let j = 0; j <= segments; j++) {
        const t = j / segments
        const angle1 = (i / pathCount) * Math.PI * 2 + t * Math.PI * 4
        const angle2 = Math.sin(t * Math.PI * 2) * 0.3
        
        const x = Math.cos(angle1) * Math.cos(angle2) * globeRadius
        const y = Math.sin(angle2) * globeRadius
        const z = Math.sin(angle1) * Math.cos(angle2) * globeRadius
        
        points.push(new THREE.Vector3(x, y, z))
      }
      
      // Create spline from points
      const curve = new THREE.CatmullRomCurve3(points, true)
      
      // Create tube geometry along the curve
      const tubeGeometry = new THREE.TubeGeometry(curve, segments, 0.02, 8, true)
      
      // Create glowing material
      const hasProtectionData = dataPoints.some(point => point.threatType === 'protection')
      const color = hasProtectionData ? 0x00ffff : 0xff4444
      const emissiveColor = hasProtectionData ? 0x004444 : 0x440000
      
      const material = new THREE.MeshStandardMaterial({
        color: color,
        transparent: true,
        opacity: opacity * (isLoading ? 1.2 : 0.7),
        emissive: emissiveColor,
        emissiveIntensity: intensity * (isLoading ? 1.5 : 1.0)
      })
      
      const filamentMesh = new THREE.Mesh(tubeGeometry, material)
      filamentsRef.current.push(filamentMesh)
      groupRef.current.add(filamentMesh)
    }
    
    // Set up mouse event listeners for cursor trail
    if (enableCursorTrail) {
      const canvas = gl.domElement
      canvas.addEventListener('mousemove', handleMouseMove)
      canvas.addEventListener('mouseenter', handleMouseEnter)
      canvas.addEventListener('mouseleave', handleMouseLeave)
      
      return () => {
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('mouseenter', handleMouseEnter)
        canvas.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataPoints, isLoading, intensity, opacity, enableCursorTrail, gl])
  
  // Mouse event handlers
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const rect = gl.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    setMousePosition({ x, y })
  }, [gl])
  
  const handleMouseEnter = useCallback(() => {
    setIsMouseOverGlobe(true)
  }, [])
  
  const handleMouseLeave = useCallback(() => {
    setIsMouseOverGlobe(false)
    // Clear cursor trail
    if (cursorTrailRef.current && groupRef.current) {
      groupRef.current.remove(cursorTrailRef.current)
      cursorTrailRef.current.geometry.dispose()
      if (cursorTrailRef.current.material instanceof THREE.Material) {
        cursorTrailRef.current.material.dispose()
      }
      cursorTrailRef.current = null
    }
  }, [])
  
  // Animation loop
  useFrame((state, deltaTime) => {
    const time = state.clock.elapsedTime
    
    // Animate filaments
    filamentsRef.current.forEach((mesh, index) => {
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        // Pulsing effect
        const pulse = Math.sin(time * 2 + index * 0.5) * 0.3 + 0.7
        mesh.material.emissiveIntensity = intensity * pulse * (isLoading ? 1.5 : 1.0)
        
        // Flowing opacity
        const flow = Math.sin(time * 1.5 + index * 0.8) * 0.2 + 0.8
        mesh.material.opacity = opacity * flow * (isLoading ? 1.2 : 0.7)
      }
      
      // Slight rotation for movement effect
      mesh.rotation.y += deltaTime * 0.1 * (index % 2 === 0 ? 1 : -1)
    })
    
    // Update cursor trail
    if (enableCursorTrail && isMouseOverGlobe && groupRef.current) {
      updateCursorTrail()
    }
    
    // Rotate the entire filament system slowly
    if (groupRef.current) {
      groupRef.current.rotation.y += deltaTime * 0.05
    }
  })
  
  const updateCursorTrail = useCallback(() => {
    if (!groupRef.current) return
    
    // Create a simple cursor trail effect
    // This is a simplified version - in the full implementation this would be more sophisticated
    const trailGeometry = new THREE.RingGeometry(2.0, 2.2, 32)
    const trailMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    
    // Remove old trail
    if (cursorTrailRef.current) {
      groupRef.current.remove(cursorTrailRef.current)
      cursorTrailRef.current.geometry.dispose()
      if (cursorTrailRef.current.material instanceof THREE.Material) {
        cursorTrailRef.current.material.dispose()
      }
    }
    
    // Add new trail
    const trailMesh = new THREE.Mesh(trailGeometry, trailMaterial)
    trailMesh.position.set(
      mousePosition.x * 0.5,
      mousePosition.y * 0.5,
      2.1
    )
    
    cursorTrailRef.current = trailMesh
    groupRef.current.add(trailMesh)
  }, [mousePosition])
  
  return (
    <group ref={groupRef}>
      {/* Filament effects are added programmatically in useEffect */}
    </group>
  )
}