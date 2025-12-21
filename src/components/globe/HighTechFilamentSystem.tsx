// HighTechFilamentSystem.tsx - High-tech luminous filament ribbons with flowing energy
'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ThreatDataPoint } from '@/types/threat'

// Vertex shader for the energy ribbon
const ribbonVertexShader = `
attribute float ribbonU;
attribute float ribbonV;
attribute vec3 ribbonNormal;
attribute vec3 ribbonTangent;

uniform float time;
uniform float flowSpeed;
uniform float noiseAmplitude;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vRibbonU;
varying float vRibbonV;

// Simple noise function
float noise(vec3 p) {
    return sin(p.x * 12.9898 + p.y * 78.233 + p.z * 37.719) * 0.5 + 0.5;
}

void main() {
    vUv = uv;
    vRibbonU = ribbonU;
    vRibbonV = ribbonV;
    
    // Add subtle noise-based movement for organic feel
    vec3 pos = position;
    float noiseVal = noise(position + time * 0.5);
    pos += ribbonNormal * sin(time * 2.0 + ribbonU * 10.0) * noiseAmplitude;
    
    vPosition = pos;
    vNormal = normalize(normalMatrix * ribbonNormal);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

// Fragment shader for the energy ribbon with flowing streaks
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

void main() {
    // Distance from center of ribbon (0 = center, 1 = edge)
    float distFromCenter = abs(vRibbonV - 0.5) * 2.0;
    
    // Create multiple flowing streaks
    float streaks = 0.0;
    for(float i = 0.0; i < 3.0; i++) {
        float offset = i * 0.33;
        float streak = sin((vRibbonU + time * flowSpeed + offset) * streakCount * 3.14159);
        streak = pow(max(0.0, streak), 2.0);
        streaks += streak * (1.0 - i * 0.2); // Diminishing intensity
    }
    
    // Color gradient across the ribbon width
    vec3 color = mix(color1, color2, vRibbonV);
    color = mix(color, color3, distFromCenter * 0.5);
    
    // Apply flowing streaks
    color *= (0.3 + streaks * 0.7);
    
    // Soft falloff at edges
    float edgeFalloff = 1.0 - pow(distFromCenter, 1.5);
    
    // Center bright line
    float centerLine = 1.0 - smoothstep(0.0, 0.1, distFromCenter);
    centerLine *= sin(time * 3.0 + vRibbonU * 8.0) * 0.3 + 0.7;
    
    // Combine effects
    float intensity = edgeFalloff * glowIntensity + centerLine * 2.0;
    
    // Pulsing effect
    float pulse = sin(time * 2.0 + vRibbonU * 4.0) * 0.2 + 0.8;
    intensity *= pulse;
    
    gl_FragColor = vec4(color * intensity, intensity * 0.8);
}
`

// Particle vertex shader
const particleVertexShader = `
attribute float particleT;
attribute float particleOffset;
attribute float particleSize;
attribute float particlePhase;

uniform float time;
uniform float particleSpeed;
uniform vec3 splinePoints[20];
uniform int splineLength;

varying float vIntensity;
varying float vPhase;

vec3 getSplinePosition(float t) {
    float scaledT = t * float(splineLength - 1);
    int index = int(floor(scaledT));
    float frac = scaledT - float(index);
    
    if(index >= splineLength - 1) return splinePoints[splineLength - 1];
    if(index < 0) return splinePoints[0];
    
    return mix(splinePoints[index], splinePoints[index + 1], frac);
}

void main() {
    // Animate particle along spline
    float animatedT = mod(particleT + time * particleSpeed + particleOffset, 1.0);
    vec3 splinePos = getSplinePosition(animatedT);
    
    // Add orbital motion
    float orbitAngle = time * 2.0 + particlePhase;
    vec3 offset = vec3(cos(orbitAngle), sin(orbitAngle), 0.0) * 0.1;
    
    vec3 finalPos = splinePos + offset;
    
    vIntensity = sin(animatedT * 3.14159) * (sin(time * 3.0 + particlePhase) * 0.3 + 0.7);
    vPhase = particlePhase;
    
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Safe distance calculation to prevent gigantic particles
    float distanceFromCamera = length(mvPosition.xyz);
    float safeDistance = max(distanceFromCamera, 3.0); // Prevent division by very small numbers
    float sizeScale = clamp(300.0 / safeDistance, 0.5, 5.0); // Limit the scaling range
    gl_PointSize = clamp(particleSize * sizeScale * vIntensity, 1.0, 150.0); // Hard limits on final size
}
`

// Particle fragment shader
const particleFragmentShader = `
uniform vec3 particleColor;
uniform float time;

varying float vIntensity;
varying float vPhase;

void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if(dist > 0.5) discard;
    
    // Soft circular particle
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha = pow(alpha, 1.5);
    
    // Sparkle effect
    float sparkle = sin(time * 8.0 + vPhase * 10.0) * 0.4 + 0.6;
    
    float finalIntensity = vIntensity * alpha * sparkle;
    
    gl_FragColor = vec4(particleColor * finalIntensity * 2.0, finalIntensity);
}
`

export interface HighTechFilamentSystemProps {
  dataPoints?: ThreatDataPoint[]
  isLoading?: boolean
  intensity?: number
}

export function HighTechFilamentSystem({
  dataPoints = [],
  isLoading = false,
  intensity = 1.0
}: HighTechFilamentSystemProps) {
  const groupRef = useRef<THREE.Group>(null)
  const ribbonMeshRef = useRef<THREE.Mesh | null>(null)
  const particleSystemRef = useRef<THREE.Points | null>(null)
  
  // Create spline paths and ribbon geometry
  const { ribbonGeometry, particleGeometry, splinePoints } = useMemo(() => {
    // Create a flowing spline around the globe
    const points: THREE.Vector3[] = []
    const globeRadius = 2.2
    const segments = 100
    
    // Create an elegant curved path
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const angle1 = t * Math.PI * 4 // Multiple wraps
      const angle2 = Math.sin(t * Math.PI * 3) * 0.4 // Vertical oscillation
      const radiusVar = globeRadius + Math.sin(t * Math.PI * 6) * 0.2 // Radius variation
      
      const x = Math.cos(angle1) * Math.cos(angle2) * radiusVar
      const y = Math.sin(angle2) * radiusVar
      const z = Math.sin(angle1) * Math.cos(angle2) * radiusVar
      
      points.push(new THREE.Vector3(x, y, z))
    }
    
    const curve = new THREE.CatmullRomCurve3(points, true)
    
    // Create ribbon geometry
    const ribbonSegments = 200
    const ribbonWidth = 0.15
    const ribbonGeometry = new THREE.BufferGeometry()
    
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    const ribbonUs: number[] = []
    const ribbonVs: number[] = []
    const normals: number[] = []
    const tangents: number[] = []
    
    for (let i = 0; i <= ribbonSegments; i++) {
      const t = i / ribbonSegments
      const point = curve.getPoint(t)
      const tangent = curve.getTangent(t).normalize()
      
      // Create Frenet frame
      const up = new THREE.Vector3(0, 1, 0)
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize()
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize()
      
      // Create ribbon cross-section
      for (let j = 0; j <= 8; j++) {
        const v = j / 8
        const offset = (v - 0.5) * ribbonWidth
        const pos = point.clone().add(binormal.clone().multiplyScalar(offset))
        
        positions.push(pos.x, pos.y, pos.z)
        uvs.push(t, v)
        ribbonUs.push(t)
        ribbonVs.push(v)
        normals.push(normal.x, normal.y, normal.z)
        tangents.push(tangent.x, tangent.y, tangent.z)
        
        // Create triangles
        if (i < ribbonSegments && j < 8) {
          const a = i * 9 + j
          const b = i * 9 + j + 1
          const c = (i + 1) * 9 + j
          const d = (i + 1) * 9 + j + 1
          
          indices.push(a, b, c)
          indices.push(b, d, c)
        }
      }
    }
    
    ribbonGeometry.setIndex(indices)
    ribbonGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    ribbonGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    ribbonGeometry.setAttribute('ribbonU', new THREE.Float32BufferAttribute(ribbonUs, 1))
    ribbonGeometry.setAttribute('ribbonV', new THREE.Float32BufferAttribute(ribbonVs, 1))
    ribbonGeometry.setAttribute('ribbonNormal', new THREE.Float32BufferAttribute(normals, 3))
    ribbonGeometry.setAttribute('ribbonTangent', new THREE.Float32BufferAttribute(tangents, 3))
    
    // Create particle system
    const particleCount = 50
    const particleGeometry = new THREE.BufferGeometry()
    const particlePositions: number[] = []
    const particleTs: number[] = []
    const particleOffsets: number[] = []
    const particleSizes: number[] = []
    const particlePhases: number[] = []
    
    for (let i = 0; i < particleCount; i++) {
      particlePositions.push(0, 0, 0) // Will be computed in shader
      particleTs.push(Math.random())
      particleOffsets.push(Math.random())
      particleSizes.push(3 + Math.random() * 4)
      particlePhases.push(Math.random() * Math.PI * 2)
    }
    
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3))
    particleGeometry.setAttribute('particleT', new THREE.Float32BufferAttribute(particleTs, 1))
    particleGeometry.setAttribute('particleOffset', new THREE.Float32BufferAttribute(particleOffsets, 1))
    particleGeometry.setAttribute('particleSize', new THREE.Float32BufferAttribute(particleSizes, 1))
    particleGeometry.setAttribute('particlePhase', new THREE.Float32BufferAttribute(particlePhases, 1))
    
    // Convert spline points for shader
    const splinePointsArray = points.slice(0, 20).map(p => [p.x, p.y, p.z]).flat()
    
    return { ribbonGeometry, particleGeometry, splinePoints: splinePointsArray }
  }, [])
  
  // Create materials
  const ribbonMaterial = useMemo(() => {
    const hasProtectionData = dataPoints.some(point => point.threatType === 'protection')
    
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(hasProtectionData ? 0x00D8FF : 0xFF4444) }, // Cyan or Red
        color2: { value: new THREE.Color(hasProtectionData ? 0x0077FF : 0xFF8800) }, // Blue or Orange  
        color3: { value: new THREE.Color(hasProtectionData ? 0x8A3BFF : 0xFFAA00) }, // Purple or Yellow
        flowSpeed: { value: 1.5 },
        streakCount: { value: 3.0 },
        glowIntensity: { value: intensity * (isLoading ? 2.0 : 1.5) },
        ribbonWidth: { value: 0.15 },
        noiseAmplitude: { value: 0.02 }
      },
      vertexShader: ribbonVertexShader,
      fragmentShader: ribbonFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  }, [dataPoints, isLoading, intensity])
  
  const particleMaterial = useMemo(() => {
    const hasProtectionData = dataPoints.some(point => point.threatType === 'protection')
    
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        particleColor: { value: new THREE.Color(hasProtectionData ? 0x00FFFF : 0xFF6666) },
        particleSpeed: { value: 0.3 },
        splinePoints: { value: splinePoints },
        splineLength: { value: 20 }
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }, [dataPoints, splinePoints])
  
  // Create meshes
  useEffect(() => {
    if (!groupRef.current) return
    
    // Create ribbon mesh
    const ribbonMesh = new THREE.Mesh(ribbonGeometry, ribbonMaterial)
    ribbonMeshRef.current = ribbonMesh
    groupRef.current.add(ribbonMesh)
    
    // Create particle system
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial)
    particleSystemRef.current = particleSystem
    groupRef.current.add(particleSystem)
    
    const currentGroupRef = groupRef.current
    return () => {
      currentGroupRef?.remove(ribbonMesh)
      currentGroupRef?.remove(particleSystem)
    }
  }, [ribbonGeometry, ribbonMaterial, particleGeometry, particleMaterial])
  
  // Animation loop
  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    // Update ribbon uniforms
    if (ribbonMeshRef.current?.material instanceof THREE.ShaderMaterial) {
      ribbonMeshRef.current.material.uniforms.time.value = time
    }
    
    // Update particle uniforms
    if (particleSystemRef.current?.material instanceof THREE.ShaderMaterial) {
      particleSystemRef.current.material.uniforms.time.value = time
    }
    
    // Slow rotation of entire system
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002
    }
  })
  
  return <group ref={groupRef} />
}