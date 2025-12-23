// FilamentSystem.tsx - Main component integrating all digital filament effects
'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { FilamentShaderMaterial } from './shaders/FilamentShader'
import { ParticleSystem } from './shaders/ParticleSystem'
import { CursorTrail } from './shaders/CursorTrail'
import { useSelectiveBloom } from './shaders/PostProcessingPipeline'
import { ThreatDataPoint } from '@/types/threat'

export interface FilamentSystemProps {
  dataPoints?: ThreatDataPoint[]
  isLoading?: boolean
  enableCursorTrail?: boolean
  enableParticles?: boolean
  enableFilaments?: boolean
  intensity?: number
  opacity?: number
  className?: string
}

export function FilamentSystem({
  dataPoints = [],
  isLoading = false,
  enableCursorTrail = true,
  enableParticles = true,
  enableFilaments = true,
  intensity = 1.0,
  opacity = 0.8,
  className = ''
}: FilamentSystemProps) {
  const groupRef = useRef<THREE.Group>(null)
  const filamentMeshRef = useRef<THREE.Mesh>(null)
  const particleSystemRef = useRef<ParticleSystem | null>(null)
  const cursorTrailRef = useRef<CursorTrail | null>(null)
  
  const { camera, gl, scene } = useThree()
  const { enableBloom } = useSelectiveBloom()
  
  // State for mouse tracking
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isMouseOverGlobe, setIsMouseOverGlobe] = useState(false)
  
  // Create filament paths around the globe
  const filamentPaths = useRef<THREE.CatmullRomCurve3[]>([])
  
  // Initialize filament system
  useEffect(() => {
    if (!groupRef.current) return
    
    // Create filament paths
    createFilamentPaths()
    
    // Create particle system
    if (enableParticles) {
      const particleSystem = new ParticleSystem({
        particleCount: 2000,
        emissionRate: 100,
        particleLife: 3.0,
        particleSize: 1.5,
        color: new THREE.Color(0x00ffff),
        velocity: 0.5,
        spread: 0.3
      })
      
      particleSystemRef.current = particleSystem
      groupRef.current.add(particleSystem)
      
      // Enable bloom for particles
      enableBloom(particleSystem)
    }
    
    // Create cursor trail
    if (enableCursorTrail) {
      const cursorTrail = new CursorTrail({
        maxTrailLength: 30,
        trailLifetime: 2.5,
        segmentCount: 60,
        thickness: 0.03,
        color: new THREE.Color(0x00ffff),
        secondaryColor: new THREE.Color(0x8a2be2),
        intensity: intensity
      })
      
      cursorTrail.setCamera(camera)
      cursorTrailRef.current = cursorTrail
      groupRef.current.add(cursorTrail)
      
      // Enable bloom for cursor trail
      enableBloom(cursorTrail)
    }
    
    // Create main filament geometry
    if (enableFilaments) {
      createFilamentGeometry()
    }
    
    // Set up mouse event listeners
    const canvas = gl.domElement
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseenter', handleMouseEnter)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseenter', handleMouseEnter)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, gl, enableParticles, enableCursorTrail, enableFilaments, intensity, enableBloom])
  
  // Create filament paths around the globe
  const createFilamentPaths = useCallback(() => {
    filamentPaths.current = []
    
    // Create several curved paths around the globe
    const pathCount = 8
    const globeRadius = 2.05
    
    for (let i = 0; i < pathCount; i++) {
      const points: THREE.Vector3[] = []
      const segments = 20
      
      // Create a path that wraps around the globe
      for (let j = 0; j <= segments; j++) {
        const t = j / segments
        const angle1 = (i / pathCount) * Math.PI * 2 + t * Math.PI * 4
        const angle2 = Math.sin(t * Math.PI * 2) * 0.5
        
        const x = Math.cos(angle1) * Math.cos(angle2) * globeRadius
        const y = Math.sin(angle2) * globeRadius
        const z = Math.sin(angle1) * Math.cos(angle2) * globeRadius
        
        points.push(new THREE.Vector3(x, y, z))
      }
      
      const path = new THREE.CatmullRomCurve3(points, true) // Closed curve
      filamentPaths.current.push(path)
    }
  }, [])
  
  // Create filament geometry
  const createFilamentGeometry = useCallback(() => {
    if (!groupRef.current || filamentPaths.current.length === 0) return
    
    // Create geometry for all filament paths
    const geometries: THREE.BufferGeometry[] = []
    
    filamentPaths.current.forEach((path, pathIndex) => {
      const segments = 100
      const tubeGeometry = new THREE.TubeGeometry(path, segments, 0.01, 8, true)
      
      // Add custom attributes for shader
      const positionArray = tubeGeometry.attributes.position.array as Float32Array
      const vertexCount = positionArray.length / 3
      
      const progressArray = new Float32Array(vertexCount)
      const offsetArray = new Float32Array(vertexCount)
      const thicknessArray = new Float32Array(vertexCount)
      const directionArray = new Float32Array(vertexCount * 3)
      
      for (let i = 0; i < vertexCount; i++) {
        const segmentIndex = Math.floor(i / 8)
        const t = segmentIndex / segments
        
        progressArray[i] = t
        offsetArray[i] = pathIndex * 0.2 // Offset each path slightly
        thicknessArray[i] = 0.01
        
        // Calculate direction (tangent)
        const tangent = path.getTangent(t)
        directionArray[i * 3] = tangent.x
        directionArray[i * 3 + 1] = tangent.y
        directionArray[i * 3 + 2] = tangent.z
      }
      
      tubeGeometry.setAttribute('progress', new THREE.BufferAttribute(progressArray, 1))
      tubeGeometry.setAttribute('offset', new THREE.BufferAttribute(offsetArray, 1))
      tubeGeometry.setAttribute('thickness', new THREE.BufferAttribute(thicknessArray, 1))
      tubeGeometry.setAttribute('direction', new THREE.BufferAttribute(directionArray, 3))
      
      geometries.push(tubeGeometry)
    })
    
    // Merge all geometries
    const mergedGeometry = new THREE.BufferGeometry()
    if (geometries.length > 0) {
      // For simplicity, just use the first geometry
      // In a full implementation, you'd merge all geometries
      mergedGeometry.copy(geometries[0])
    }
    
    // Create material
    const material = new FilamentShaderMaterial({
      primaryColor: { value: new THREE.Color(0x00ffff) },
      secondaryColor: { value: new THREE.Color(0x8a2be2) },
      globalIntensity: { value: intensity },
      opacity: { value: opacity },
      flowSpeed: { value: 1.0 },
      waveAmplitude: { value: 0.05 },
      glowIntensity: { value: 2.0 }
    })
    
    // Create mesh
    const filamentMesh = new THREE.Mesh(mergedGeometry, material)
    if (filamentMeshRef.current) {
      groupRef.current?.remove(filamentMeshRef.current)
    }
    ;(filamentMeshRef as any).current = filamentMesh
    groupRef.current?.add(filamentMesh)
    
    // Enable bloom for filaments
    enableBloom(filamentMesh)
  }, [intensity, opacity, enableBloom])
  
  // Mouse event handlers
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const rect = gl.domElement.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    setMousePosition({ x, y })
    
    // Update cursor trail
    if (cursorTrailRef.current && isMouseOverGlobe && groupRef.current) {
      cursorTrailRef.current.updateMousePosition(x, y, groupRef.current)
    }
  }, [gl, isMouseOverGlobe])
  
  const handleMouseEnter = useCallback(() => {
    setIsMouseOverGlobe(true)
  }, [])
  
  const handleMouseLeave = useCallback(() => {
    setIsMouseOverGlobe(false)
    if (cursorTrailRef.current) {
      cursorTrailRef.current.clear()
    }
  }, [])
  
  // Animation loop
  useFrame((state, deltaTime) => {
    const time = state.clock.elapsedTime
    
    // Update filament material
    if (filamentMeshRef.current?.material instanceof FilamentShaderMaterial) {
      filamentMeshRef.current.material.updateTime(time)
    }
    
    // Update particle system
    if (particleSystemRef.current && filamentPaths.current.length > 0) {
      // Emit particles along random filament paths
      const randomPath = filamentPaths.current[Math.floor(Math.random() * filamentPaths.current.length)]
      particleSystemRef.current.emitAlongPath(randomPath, deltaTime)
    }
    
    // Update cursor trail
    if (cursorTrailRef.current) {
      cursorTrailRef.current.update(deltaTime)
    }
    
    // Rotate the entire filament system slowly
    if (groupRef.current && !isLoading) {
      groupRef.current.rotation.y += deltaTime * 0.1
    }
  })
  
  // Update effects based on loading state
  useEffect(() => {
    if (isLoading) {
      // Show more prominent filaments during loading
      if (filamentMeshRef.current?.material instanceof FilamentShaderMaterial) {
        filamentMeshRef.current.material.setIntensity(intensity * 1.5)
        filamentMeshRef.current.material.setOpacity(opacity * 1.2)
      }
      
      // Increase particle emission during loading
      if (particleSystemRef.current) {
        particleSystemRef.current.setGlobalAlpha(1.0)
      }
    } else {
      // Normal intensity when not loading
      if (filamentMeshRef.current?.material instanceof FilamentShaderMaterial) {
        filamentMeshRef.current.material.setIntensity(intensity)
        filamentMeshRef.current.material.setOpacity(opacity)
      }
      
      // Reduce particles when data is loaded
      if (particleSystemRef.current) {
        particleSystemRef.current.setGlobalAlpha(0.6)
      }
    }
  }, [isLoading, intensity, opacity])
  
  // Update colors based on data points
  useEffect(() => {
    const hasProtectionData = dataPoints.some(point => point.threatType === 'protection')
    
    if (filamentMeshRef.current?.material instanceof FilamentShaderMaterial) {
      if (hasProtectionData) {
        filamentMeshRef.current.material.setProtectionColors()
      } else {
        filamentMeshRef.current.material.setThreatColors()
      }
    }
    
    if (particleSystemRef.current) {
      const color = hasProtectionData ? new THREE.Color(0x00ffff) : new THREE.Color(0xff4444)
      particleSystemRef.current.setColor(color)
    }
  }, [dataPoints])
  
  return (
    <group ref={groupRef}>
      {/* Filament effects are added programmatically in useEffect */}
    </group>
  )
}