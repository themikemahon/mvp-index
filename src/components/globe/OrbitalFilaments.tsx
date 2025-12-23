// OrbitalFilaments.tsx - Filaments that orbit the globe, initiated by cursor movement
'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ThreatDataPoint } from '@/types/threat'

// Same high-quality shaders
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
    // Very minimal movement for clean ribbons
    float gentleWave = sin(time * 0.4 + ribbonU * 1.5) * noiseAmplitude * 0.05;
    pos += normal * gentleWave;
    
    vPosition = pos;
    vNormal = normalize(normalMatrix * normal);
    
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

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vRibbonU;
varying float vRibbonV;
varying float vFadeIn;



void main() {
    // Simple ribbon falloff from center to edges
    float edgeDist = abs(vRibbonV - 0.5) * 2.0;
    
    // Clean flowing energy along the ribbon
    float flow = sin((vRibbonU + time * flowSpeed) * streakCount * 3.14159);
    flow = pow(max(0.0, flow), 2.0) * 0.5 + 0.5;
    
    // Simple color gradient
    vec3 color = mix(color1, color2, vRibbonU);
    color = mix(color, color3, edgeDist * 0.2);
    
    // Apply flowing effect
    color *= flow;
    
    // Smooth edge falloff for clean ribbons
    float edgeFalloff = 1.0 - smoothstep(0.0, 1.0, edgeDist);
    edgeFalloff = pow(edgeFalloff, 1.5);
    
    // Clean, steady intensity
    float intensity = edgeFalloff * glowIntensity * vFadeIn;
    
    // Very subtle pulse
    float pulse = sin(time * 0.5 + vRibbonU) * 0.1 + 0.9;
    intensity *= pulse;
    
    gl_FragColor = vec4(color * intensity, intensity * 0.8 * vFadeIn);
}
`

// Particle shaders for orb effects
const particleVertexShader = `
attribute float particleT;
attribute float particleOffset;
attribute float particleSize;
attribute float particlePhase;

uniform float time;
uniform float particleSpeed;
uniform float fadeIn;

varying float vIntensity;
varying float vPhase;
varying float vFadeIn;

void main() {
    // Animate particle along orbital path
    float animatedT = mod(particleT + time * particleSpeed + particleOffset, 1.0);
    
    // Create orbital position (this will be transformed by the mesh rotation)
    float angle = animatedT * 6.28318; // 2 * PI
    vec3 orbitalPos = vec3(cos(angle) * 2.2, 0.0, sin(angle) * 2.2);
    
    // Add concentrated variation around the filament ribbon
    float ribbonOffset = (particlePhase - 3.14159) * 0.02; // Small offset perpendicular to ribbon
    float heightOffset = sin(time * 3.0 + particlePhase) * 0.015; // Very small height variation
    
    // Calculate perpendicular direction for ribbon concentration
    vec3 tangent = normalize(vec3(-sin(angle), 0.0, cos(angle)));
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 ribbonNormal = cross(tangent, up);
    
    // Concentrate particles around the ribbon path
    orbitalPos += ribbonNormal * ribbonOffset;
    orbitalPos += up * heightOffset;
    
    vIntensity = sin(animatedT * 3.14159) * (sin(time * 5.0 + particlePhase) * 0.3 + 0.7);
    vPhase = particlePhase;
    vFadeIn = fadeIn;
    
    vec4 mvPosition = modelViewMatrix * vec4(orbitalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    // Scale particle size based on distance to maintain visibility - with safety limits
    float baseSize = 120.0; // Smaller base size for more concentrated look
    float distanceFromCamera = length(mvPosition.xyz);
    float safeDistance = max(distanceFromCamera, 3.0); // Prevent division by very small numbers
    float sizeScale = clamp(safeDistance / 8.0, 0.5, 3.0); // Limit scaling range
    float finalSize = particleSize * (baseSize * sizeScale / safeDistance) * vIntensity * vFadeIn;
    gl_PointSize = clamp(finalSize, 1.0, 200.0); // Hard limits on final particle size
}
`

const particleFragmentShader = `
uniform vec3 particleColor;
uniform float time;

varying float vIntensity;
varying float vPhase;
varying float vFadeIn;

void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if(dist > 0.5) discard;
    
    // Very sharp, concentrated particle core
    float alpha = 1.0 - smoothstep(0.0, 0.3, dist); // Even sharper falloff for concentration
    alpha = pow(alpha, 2.5); // Very focused core
    
    // Gentle sparkle effect for liveliness
    float sparkle = sin(time * 8.0 + vPhase * 10.0) * 0.2 + 0.8;
    sparkle = pow(sparkle, 1.5);
    
    float finalIntensity = vIntensity * alpha * sparkle * vFadeIn;
    
    gl_FragColor = vec4(particleColor * finalIntensity * 3.0, finalIntensity); // Brighter for visibility in concentration
}
`

interface OrbitalFilament {
  id: number
  axis: THREE.Vector3 // Rotation axis for the orbital ring
  speed: number // Orbital speed
  radius: number // Distance from globe center
  inclination: number // Orbital inclination
  age: number
  maxAge: number
  mesh: THREE.Mesh | null
  geometry: THREE.BufferGeometry | null
  material: THREE.ShaderMaterial | null
  particles: THREE.Points | null // Particle system for this filament
  particleGeometry: THREE.BufferGeometry | null
  particleMaterial: THREE.ShaderMaterial | null
  initialRotation: number
}

export interface OrbitalFilamentsProps {
  dataPoints?: ThreatDataPoint[]
  intensity?: number
  visualizationMode?: 'heatmap' | 'pixels'
}

export function OrbitalFilaments({
  dataPoints = [],
  intensity = 1.0,
  visualizationMode = 'heatmap'
}: OrbitalFilamentsProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera, gl, raycaster } = useThree()
  
  const [mouseVelocity, setMouseVelocity] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [hoverDuration, setHoverDuration] = useState(0)
  const [lastModeChange, setLastModeChange] = useState(0) // Track when mode last changed
  
  const filamentsRef = useRef<OrbitalFilament[]>([])
  const nextFilamentId = useRef(0)
  const lastMousePosition = useRef({ x: 0, y: 0 })
  const globeRef = useRef<THREE.Object3D | null>(null)
  const previousVisualizationMode = useRef(visualizationMode)
  
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
    
    // Calculate mouse velocity
    const velocity = {
      x: x - lastMousePosition.current.x,
      y: y - lastMousePosition.current.y
    }
    setMouseVelocity(velocity)
    lastMousePosition.current = { x, y }
    
    // Check if hovering over globe
    if (globeRef.current) {
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      const intersects = raycaster.intersectObject(globeRef.current, true)
      setIsHovering(intersects.length > 0)
    }
  }, [gl, camera, raycaster])
  
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    setHoverDuration(0)
    setMouseVelocity({ x: 0, y: 0 })
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
  
  // Create simple orbital ribbon geometry (clean flat ribbons)
  const createOrbitalGeometry = useCallback((axis: THREE.Vector3, radius: number, inclination: number, cameraDistance: number) => {
    const segments = 200 // Fewer segments for simpler geometry
    // Scale ribbon width based on camera distance
    const baseWidth = 0.08
    const distanceScale = Math.max(1.0, cameraDistance / 8.0)
    const ribbonWidth = baseWidth * distanceScale
    
    // Create orbital path points
    const points: THREE.Vector3[] = []
    const rotationMatrix = new THREE.Matrix4()
    rotationMatrix.makeRotationAxis(axis, inclination)
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const angle = t * Math.PI * 2
      
      let point = new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      )
      
      point.applyMatrix4(rotationMatrix)
      points.push(point)
    }
    
    // Create simple ribbon geometry
    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    const ribbonUs: number[] = []
    const ribbonVs: number[] = []
    
    // Create ribbon vertices
    for (let i = 0; i < segments; i++) {
      const t = i / segments
      const nextT = (i + 1) / segments
      
      const point1 = points[i]
      const point2 = points[i + 1] || points[0]
      
      // Calculate ribbon direction (perpendicular to orbital plane)
      const direction = new THREE.Vector3().subVectors(point2, point1).normalize()
      const up = new THREE.Vector3().crossVectors(direction, axis).normalize()
      
      // Create ribbon quad
      const offset = up.multiplyScalar(ribbonWidth * 0.5)
      
      // Bottom edge
      const bottom = point1.clone().sub(offset)
      positions.push(bottom.x, bottom.y, bottom.z)
      uvs.push(t, 0)
      ribbonUs.push(t)
      ribbonVs.push(0)
      
      // Top edge
      const top = point1.clone().add(offset)
      positions.push(top.x, top.y, top.z)
      uvs.push(t, 1)
      ribbonUs.push(t)
      ribbonVs.push(1)
      
      // Create triangles for this segment
      if (i < segments - 1) {
        const base = i * 2
        // First triangle
        indices.push(base, base + 1, base + 2)
        // Second triangle
        indices.push(base + 1, base + 3, base + 2)
      }
    }
    
    // Close the loop
    const base = (segments - 1) * 2
    indices.push(base, base + 1, 0)
    indices.push(base + 1, 1, 0)
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setAttribute('ribbonU', new THREE.Float32BufferAttribute(ribbonUs, 1))
    geometry.setAttribute('ribbonV', new THREE.Float32BufferAttribute(ribbonVs, 1))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    
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
        flowSpeed: { value: 1.8 }, // Slower, more elegant flow
        streakCount: { value: 4.0 },
        glowIntensity: { value: intensity * 2.5 },
        noiseAmplitude: { value: 0.001 }, // Minimal noise for clean ribbons
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

  // Create particle geometry and material
  const createParticleSystem = useCallback((fadeIn: number = 1.0) => {
    const hasProtectionData = dataPoints.some(point => point.threatType === 'protection')
    const particleCount = 300 // Much denser particle concentration around filaments
    
    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []
    const particleTs: number[] = []
    const particleOffsets: number[] = []
    const particleSizes: number[] = []
    const particlePhases: number[] = []
    
    for (let i = 0; i < particleCount; i++) {
      positions.push(0, 0, 0) // Will be computed in shader
      
      // Create clusters of particles for more concentrated effect
      const clusterCenter = Math.floor(i / 8) / Math.floor(particleCount / 8); // 8 particles per cluster
      const clusterOffset = (Math.random() - 0.5) * 0.1; // Small random offset within cluster
      particleTs.push(clusterCenter + clusterOffset)
      
      particleOffsets.push(Math.random())
      
      // Vary particle sizes with some larger "leader" particles
      const isLeader = i % 8 === 0; // Every 8th particle is a leader
      particleSizes.push(isLeader ? 1.0 + Math.random() * 0.6 : 0.4 + Math.random() * 0.6)
      
      particlePhases.push(Math.random() * Math.PI * 2)
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('particleT', new THREE.Float32BufferAttribute(particleTs, 1))
    geometry.setAttribute('particleOffset', new THREE.Float32BufferAttribute(particleOffsets, 1))
    geometry.setAttribute('particleSize', new THREE.Float32BufferAttribute(particleSizes, 1))
    geometry.setAttribute('particlePhase', new THREE.Float32BufferAttribute(particlePhases, 1))
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        particleColor: { value: new THREE.Color(hasProtectionData ? 0x00FFFF : 0xFF6666) },
        particleSpeed: { value: 0.25 }, // Slower for more concentrated trailing effect
        fadeIn: { value: fadeIn }
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    
    return { geometry, material }
  }, [dataPoints])
  
  // Animation and filament management
  useFrame((state, deltaTime) => {
    const time = state.clock.elapsedTime
    const cameraDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0))
    
    // Track visualization mode changes
    if (previousVisualizationMode.current !== visualizationMode) {
      setLastModeChange(time)
      if (visualizationMode === 'heatmap') {
        // Reset hover duration when returning to heatmap mode to allow immediate spawning
        setHoverDuration(0.5) // Give a small boost to encourage spawning
      }
      previousVisualizationMode.current = visualizationMode
    }
    
    // Update hover duration
    if (isHovering) {
      setHoverDuration(prev => prev + deltaTime)
    } else {
      setHoverDuration(prev => Math.max(0, prev - deltaTime * 2.0)) // Faster decay when not hovering
    }
    
    // Spawn new orbital filaments based on mouse movement and hover - only in heatmap mode
    const mouseSpeed = Math.sqrt(mouseVelocity.x * mouseVelocity.x + mouseVelocity.y * mouseVelocity.y)
    
    // More responsive spawning: spawn on hover even with minimal mouse movement in heatmap mode
    const baseSpawnChance = visualizationMode === 'heatmap' && isHovering ? 0.03 : 0 // Increased base chance
    const mouseSpeedBonus = mouseSpeed * 4.0 // Increased bonus for mouse movement
    const hoverBonus = Math.min(hoverDuration * 0.8, 1.5) // Increased bonus for sustained hovering
    
    // Add a small bonus for recently returning to heatmap mode
    const modeChangeBonus = (time - lastModeChange < 2.0) ? 0.02 : 0 // Increased bonus
    
    const totalSpawnChance = baseSpawnChance + mouseSpeedBonus + hoverBonus + modeChangeBonus
    const shouldSpawnFilament = Math.random() < totalSpawnChance
    
    if (shouldSpawnFilament && filamentsRef.current.length < 3) {
      // Create orbital axis based on mouse movement direction
      const axis = new THREE.Vector3(
        mouseVelocity.y + (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.3,
        -mouseVelocity.x + (Math.random() - 0.5) * 0.5
      ).normalize()
      
      const radius = 2.15 + Math.random() * 0.3
      const inclination = (Math.random() - 0.5) * Math.PI * 0.4
      const speed = (mouseSpeed * 2 + 0.5) * (Math.random() * 0.5 + 0.5)
      
      // Use current camera distance for LOD scaling
      const geometry = createOrbitalGeometry(axis, radius, inclination, cameraDistance)
      if (geometry) {
        const material = createFilamentMaterial(0)
        const mesh = new THREE.Mesh(geometry, material)
        
        // Create particle system for this filament
        const { geometry: particleGeometry, material: particleMaterial } = createParticleSystem(0)
        const particles = new THREE.Points(particleGeometry, particleMaterial)
        
        const filament: OrbitalFilament = {
          id: nextFilamentId.current++,
          axis,
          speed,
          radius,
          inclination,
          age: 0,
          maxAge: 1.5 + Math.random() * 1.5, // 1.5-3 seconds lifetime (shorter, more dynamic)
          mesh,
          geometry,
          material,
          particles,
          particleGeometry,
          particleMaterial,
          initialRotation: Math.random() * Math.PI * 2
        }
        
        filamentsRef.current.push(filament)
        if (groupRef.current) {
          groupRef.current.add(mesh)
          groupRef.current.add(particles)
        }
      }
    }
    
    // Update existing filaments
    filamentsRef.current = filamentsRef.current.filter(filament => {
      filament.age += deltaTime
      
      if (filament.mesh && filament.material && filament.particles && filament.particleMaterial) {
        // Update shader uniforms with distance-based intensity scaling
        filament.material.uniforms.time.value = time
        filament.particleMaterial.uniforms.time.value = time
        
        // Scale intensity and reduce streak frequency based on camera distance
        const distanceScale = Math.max(1.0, cameraDistance / 8.0)
        filament.material.uniforms.glowIntensity.value = intensity * 2.5 * Math.min(2.0, distanceScale)
        // Reduce streak frequency when zoomed out to prevent aliasing
        filament.material.uniforms.streakCount.value = Math.max(2.0, 4.0 / Math.sqrt(distanceScale))
        
        // Rotate both the filament and particles around the orbital axis
        const rotationAngle = filament.initialRotation + filament.age * filament.speed
        const quaternion = new THREE.Quaternion()
        quaternion.setFromAxisAngle(filament.axis, rotationAngle)
        filament.mesh.setRotationFromQuaternion(quaternion)
        filament.particles.setRotationFromQuaternion(quaternion)
        
        // Fade in/out animation
        const fadeInDuration = 0.5
        const fadeOutDuration = 0.8
        let fadeValue = 1.0
        
        if (filament.age < fadeInDuration) {
          fadeValue = filament.age / fadeInDuration
        } else if (filament.age > filament.maxAge - fadeOutDuration) {
          fadeValue = (filament.maxAge - filament.age) / fadeOutDuration
        }
        
        // Apply visualization mode fade - only visible in heatmap mode
        const visualizationFade = visualizationMode === 'heatmap' ? 1.0 : 0.0 // Completely off in pixel mode
        const finalFadeValue = Math.max(0, fadeValue * visualizationFade)
        
        filament.material.uniforms.fadeIn.value = finalFadeValue
        filament.particleMaterial.uniforms.fadeIn.value = finalFadeValue
        
        // Remove expired filaments
        if (filament.age > filament.maxAge) {
          if (groupRef.current) {
            if (filament.mesh) groupRef.current.remove(filament.mesh)
            if (filament.particles) groupRef.current.remove(filament.particles)
          }
          filament.geometry?.dispose()
          filament.material?.dispose()
          filament.particleGeometry?.dispose()
          filament.particleMaterial?.dispose()
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
        if (filament.particles) {
          currentGroupRef?.remove(filament.particles)
        }
        filament.geometry?.dispose()
        filament.material?.dispose()
        filament.particleGeometry?.dispose()
        filament.particleMaterial?.dispose()
      })
      filamentsRef.current = []
    }
  }, [])
  
  return <group ref={groupRef} />
}