// CursorResponsiveFilaments.tsx - Dynamic filaments that appear and follow cursor movement
'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ThreatDataPoint } from '@/types/threat'

// Same high-quality shaders from the previous system
const ribbonVertexShader = `
attribute float ribbonU;
attribute float ribbonV;
attribute vec3 ribbonNormal;
attribute vec3 ribbonTangent;

uniform float time;
uniform float flowSpeed;
uniform float noiseAmplitude;
uniform float fadeIn;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vRibbonU;
varying float vRibbonV;
varying float vFadeIn;

float noise(vec3 p) {
    return sin(p.x * 12.9898 + p.y * 78.233 + p.z * 37.719) * 0.5 + 0.5;
}

void main() {
    vUv = uv;
    vRibbonU = ribbonU;
    vRibbonV = ribbonV;
    vFadeIn = fadeIn;
    
    vec3 pos = position;
    float noiseVal = noise(position + time * 0.5);
    pos += ribbonNormal * sin(time * 2.0 + ribbonU * 10.0) * noiseAmplitude;
    
    vPosition = pos;
    vNormal = normalize(normalMatrix * ribbonNormal);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const ribbonFragmentShader = `
uniform float time;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform float flowSpeed;
uniform float streakCount;
uniform float glowIntensity;
uniform float ribbonWidth;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vRibbonU;
varying float vRibbonV;
varying float vFadeIn;

void main() {
    float distFromCenter = abs(vRibbonV - 0.5) * 2.0;
    
    float streaks = 0.0;
    for(float i = 0.0; i < 3.0; i++) {
        float offset = i * 0.33;
        float streak = sin((vRibbonU + time * flowSpeed + offset) * streakCount * 3.14159);
        streak = pow(max(0.0, streak), 2.0);
        streaks += streak * (1.0 - i * 0.2);
    }
    
    vec3 color = mix(color1, color2, vRibbonV);
    color = mix(color, color3, distFromCenter * 0.5);
    color *= (0.3 + streaks * 0.7);
    
    float edgeFalloff = 1.0 - pow(distFromCenter, 1.5);
    float centerLine = 1.0 - smoothstep(0.0, 0.1, distFromCenter);
    centerLine *= sin(time * 3.0 + vRibbonU * 8.0) * 0.3 + 0.7;
    
    float intensity = edgeFalloff * glowIntensity + centerLine * 2.0;
    float pulse = sin(time * 2.0 + vRibbonU * 4.0) * 0.2 + 0.8;
    intensity *= pulse * vFadeIn; // Apply fade-in effect
    
    gl_FragColor = vec4(color * intensity, intensity * 0.8 * vFadeIn);
}
`

interface FilamentTrail {
  id: number
  points: THREE.Vector3[]
  age: number
  maxAge: number
  mesh: THREE.Mesh | null
  geometry: THREE.BufferGeometry | null
  material: THREE.ShaderMaterial | null
}

export interface CursorResponsiveFilamentsProps {
  dataPoints?: ThreatDataPoint[]
  isLoading?: boolean
  intensity?: number
}

export function CursorResponsiveFilaments({
  dataPoints = [],
  isLoading = false,
  intensity = 1.0
}: CursorResponsiveFilamentsProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera, gl, raycaster } = useThree()
  
  // State for cursor tracking and filament management
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [hoverDuration, setHoverDuration] = useState(0)
  const filamentsRef = useRef<FilamentTrail[]>([])
  const nextFilamentId = useRef(0)
  const lastMousePosition = useRef<THREE.Vector3 | null>(null)
  const globeRef = useRef<THREE.Object3D | null>(null)
  
  // Find the globe object for raycasting
  useEffect(() => {
    const findGlobe = (object: THREE.Object3D): THREE.Object3D | null => {
      if (object.type === 'Mesh' && (object as THREE.Mesh).geometry?.type === 'SphereGeometry') {
        return object
      }
      for (const child of object.children) {
        const found = findGlobe(child)
        if (found) return found
      }
      return null
    }
    
    if (groupRef.current?.parent) {
      globeRef.current = findGlobe(groupRef.current.parent)
    }
  }, [])
  
  // Mouse event handlers
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const rect = gl.domElement.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    setMousePosition({ x, y })
    
    // Raycast to globe surface
    if (globeRef.current) {
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      const intersects = raycaster.intersectObject(globeRef.current, true)
      
      if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point
        const surfacePoint = intersectionPoint.clone().normalize().multiplyScalar(2.15)
        lastMousePosition.current = surfacePoint
        setIsHovering(true)
      } else {
        setIsHovering(false)
      }
    }
  }, [gl, camera, raycaster])
  
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    setHoverDuration(0)
  }, [])
  
  // Set up mouse listeners
  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [gl, handleMouseMove, handleMouseLeave])
  
  // Create a single filament geometry
  const createFilamentGeometry = useCallback((points: THREE.Vector3[]) => {
    if (points.length < 2) return null
    
    const curve = new THREE.CatmullRomCurve3(points, false)
    const segments = Math.min(points.length * 10, 100)
    const ribbonWidth = 0.08
    
    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    const ribbonUs: number[] = []
    const ribbonVs: number[] = []
    const normals: number[] = []
    const tangents: number[] = []
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const point = curve.getPoint(t)
      const tangent = curve.getTangent(t).normalize()
      
      // Create Frenet frame
      const up = point.clone().normalize() // Use radial direction as up
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize()
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize()
      
      // Create ribbon cross-section
      for (let j = 0; j <= 4; j++) {
        const v = j / 4
        const offset = (v - 0.5) * ribbonWidth
        const pos = point.clone().add(binormal.clone().multiplyScalar(offset))
        
        positions.push(pos.x, pos.y, pos.z)
        uvs.push(t, v)
        ribbonUs.push(t)
        ribbonVs.push(v)
        normals.push(normal.x, normal.y, normal.z)
        tangents.push(tangent.x, tangent.y, tangent.z)
        
        // Create triangles
        if (i < segments && j < 4) {
          const a = i * 5 + j
          const b = i * 5 + j + 1
          const c = (i + 1) * 5 + j
          const d = (i + 1) * 5 + j + 1
          
          indices.push(a, b, c)
          indices.push(b, d, c)
        }
      }
    }
    
    geometry.setIndex(indices)
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setAttribute('ribbonU', new THREE.Float32BufferAttribute(ribbonUs, 1))
    geometry.setAttribute('ribbonV', new THREE.Float32BufferAttribute(ribbonVs, 1))
    geometry.setAttribute('ribbonNormal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setAttribute('ribbonTangent', new THREE.Float32BufferAttribute(tangents, 3))
    
    return geometry
  }, [])
  
  // Create filament material
  const createFilamentMaterial = useCallback((fadeIn: number = 1.0) => {
    const hasProtectionData = dataPoints.some(point => point.threatType === 'protection')
    
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(hasProtectionData ? 0x00D8FF : 0xFF4444) },
        color2: { value: new THREE.Color(hasProtectionData ? 0x0077FF : 0xFF8800) },
        color3: { value: new THREE.Color(hasProtectionData ? 0x8A3BFF : 0xFFAA00) },
        flowSpeed: { value: 2.0 },
        streakCount: { value: 4.0 },
        glowIntensity: { value: intensity * 2.0 },
        ribbonWidth: { value: 0.08 },
        noiseAmplitude: { value: 0.01 },
        fadeIn: { value: fadeIn }
      },
      vertexShader: ribbonVertexShader,
      fragmentShader: ribbonFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  }, [dataPoints, intensity])
  
  // Animation and filament management
  useFrame((state, deltaTime) => {
    const time = state.clock.elapsedTime
    
    // Update hover duration
    if (isHovering) {
      setHoverDuration(prev => prev + deltaTime)
    } else {
      setHoverDuration(prev => Math.max(0, prev - deltaTime * 2))
    }
    
    // Spawn new filaments based on hover duration
    if (isHovering && lastMousePosition.current && hoverDuration > 0) {
      const shouldSpawnFilament = Math.random() < (hoverDuration * 0.5) // More likely with longer hover
      
      if (shouldSpawnFilament && filamentsRef.current.length < 8) {
        // Create a curved path from the cursor position
        const startPoint = lastMousePosition.current.clone()
        const points: THREE.Vector3[] = [startPoint]
        
        // Generate a flowing path
        for (let i = 1; i <= 20; i++) {
          const t = i / 20
          const angle = t * Math.PI * 2 + Math.random() * 0.5
          const radius = 2.1 + Math.sin(t * Math.PI * 3) * 0.3
          const offset = new THREE.Vector3(
            Math.cos(angle) * 0.2,
            Math.sin(angle) * 0.2,
            Math.random() * 0.1 - 0.05
          )
          
          const nextPoint = startPoint.clone()
            .add(offset)
            .normalize()
            .multiplyScalar(radius)
          
          points.push(nextPoint)
        }
        
        const geometry = createFilamentGeometry(points)
        if (geometry) {
          const material = createFilamentMaterial(0)
          const mesh = new THREE.Mesh(geometry, material)
          
          const filament: FilamentTrail = {
            id: nextFilamentId.current++,
            points,
            age: 0,
            maxAge: 3 + Math.random() * 2, // 3-5 seconds lifetime
            mesh,
            geometry,
            material
          }
          
          filamentsRef.current.push(filament)
          if (groupRef.current) {
            groupRef.current.add(mesh)
          }
        }
      }
    }
    
    // Update existing filaments
    filamentsRef.current = filamentsRef.current.filter(filament => {
      filament.age += deltaTime
      
      if (filament.mesh && filament.material) {
        // Update shader uniforms
        filament.material.uniforms.time.value = time
        
        // Fade in/out animation
        const fadeInDuration = 0.5
        const fadeOutDuration = 1.0
        let fadeValue = 1.0
        
        if (filament.age < fadeInDuration) {
          fadeValue = filament.age / fadeInDuration
        } else if (filament.age > filament.maxAge - fadeOutDuration) {
          fadeValue = (filament.maxAge - filament.age) / fadeOutDuration
        }
        
        filament.material.uniforms.fadeIn.value = Math.max(0, fadeValue)
        
        // Remove expired filaments
        if (filament.age > filament.maxAge) {
          if (groupRef.current && filament.mesh) {
            groupRef.current.remove(filament.mesh)
          }
          filament.geometry?.dispose()
          filament.material?.dispose()
          return false
        }
      }
      
      return true
    })
  })
  
  // Cleanup on unmount
  useEffect(() => {
    const currentGroupRef = groupRef.current
    return () => {
      filamentsRef.current.forEach(filament => {
        if (filament.mesh) {
          currentGroupRef?.remove(filament.mesh)
        }
        filament.geometry?.dispose()
        filament.material?.dispose()
      })
      filamentsRef.current = []
    }
  }, [])
  
  return <group ref={groupRef} />
}