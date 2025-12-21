'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ThreatDataPoint } from '@/types/threat'

const ambientParticleVertexShader = `
attribute float particleSize;
attribute float particlePhase;
attribute float particleSpeed;
attribute vec3 particleDirection;

uniform float time;
uniform float globalSpeed;

varying float vIntensity;
varying float vPhase;

void main() {
    // Animate particles in their direction
    vec3 animatedPosition = position + particleDirection * time * particleSpeed * globalSpeed;
    
    // Keep particles within a sphere around the globe
    float distance = length(animatedPosition);
    if (distance > 8.0) {
        animatedPosition = normalize(animatedPosition) * 3.0; // Reset to inner sphere
    }
    
    // Gentle pulsing based on phase
    vIntensity = sin(time * 2.0 + particlePhase) * 0.3 + 0.7;
    vPhase = particlePhase;
    
    vec4 mvPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Scale particle size based on distance - much smaller with safety limits
    float distanceFromCamera = length(mvPosition.xyz);
    float safeDistance = max(distanceFromCamera, 2.0); // Prevent division by very small numbers
    float sizeScale = clamp(30.0 / safeDistance, 0.1, 2.0); // Limit the scaling range
    gl_PointSize = clamp(particleSize * sizeScale * vIntensity, 0.5, 15.0); // Hard limits on final size
}
`

const ambientParticleFragmentShader = `
uniform vec3 particleColor;
uniform float time;

varying float vIntensity;
varying float vPhase;

void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if(dist > 0.5) discard;
    
    // Soft particle falloff
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha = pow(alpha, 1.5);
    
    // Gentle sparkle effect
    float sparkle = sin(time * 3.0 + vPhase * 5.0) * 0.2 + 0.8;
    
    float finalIntensity = vIntensity * alpha * sparkle * 0.3; // Much lower base intensity for subtle ambient effect
    
    gl_FragColor = vec4(particleColor * finalIntensity, finalIntensity * 0.2);
}
`

interface AmbientParticlesProps {
  dataPoints?: ThreatDataPoint[]
  intensity?: number
}

export function AmbientParticles({
  dataPoints = [],
  intensity = 1.0
}: AmbientParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null)
  
  // Create ambient particle system
  const { geometry, material } = useMemo(() => {
    const hasProtectionData = dataPoints.some(point => point.threatType === 'protection')
    const particleCount = 200 // Reduced ambient particles to avoid clutter
    
    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []
    const particleSizes: number[] = []
    const particlePhases: number[] = []
    const particleSpeeds: number[] = []
    const particleDirections: number[] = []
    
    for (let i = 0; i < particleCount; i++) {
      // Distribute particles in a sphere around the globe
      const radius = 3.0 + Math.random() * 4.0 // Between 3 and 7 units from center
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)
      
      positions.push(x, y, z)
      
      // Vary particle sizes - much smaller
      particleSizes.push(0.1 + Math.random() * 0.3)
      
      // Random phases for animation variation
      particlePhases.push(Math.random() * Math.PI * 2)
      
      // Random speeds for organic movement
      particleSpeeds.push(0.1 + Math.random() * 0.3)
      
      // Random movement directions (very slow drift)
      const dirX = (Math.random() - 0.5) * 0.1
      const dirY = (Math.random() - 0.5) * 0.1
      const dirZ = (Math.random() - 0.5) * 0.1
      particleDirections.push(dirX, dirY, dirZ)
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('particleSize', new THREE.Float32BufferAttribute(particleSizes, 1))
    geometry.setAttribute('particlePhase', new THREE.Float32BufferAttribute(particlePhases, 1))
    geometry.setAttribute('particleSpeed', new THREE.Float32BufferAttribute(particleSpeeds, 1))
    geometry.setAttribute('particleDirection', new THREE.Float32BufferAttribute(particleDirections, 3))
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        particleColor: { value: new THREE.Color(hasProtectionData ? 0x4a90e2 : 0xff6b6b) },
        globalSpeed: { value: intensity * 0.5 }
      },
      vertexShader: ambientParticleVertexShader,
      fragmentShader: ambientParticleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    
    return { geometry, material }
  }, [dataPoints, intensity])
  
  // Animation
  useFrame((state) => {
    if (material) {
      material.uniforms.time.value = state.clock.elapsedTime
    }
  })
  
  return (
    <points ref={particlesRef} geometry={geometry} material={material} />
  )
}