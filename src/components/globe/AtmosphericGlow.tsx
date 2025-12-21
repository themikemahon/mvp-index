'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AtmosphericGlowProps {
  radius?: number
  intensity?: number
  color?: string
}

export function AtmosphericGlow({ 
  radius = 2.1, 
  intensity = 0.8,
  color = '#4fc3f7'
}: AtmosphericGlowProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Custom shader material for atmospheric glow
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        intensity: { value: intensity },
        glowColor: { value: new THREE.Color(color) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float intensity;
        uniform vec3 glowColor;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          // Calculate fresnel effect for rim lighting
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
          
          // Add some animation to the glow
          float pulse = sin(time * 2.0) * 0.1 + 0.9;
          
          // Create the glow effect
          float glow = pow(fresnel, 2.0) * intensity * pulse;
          
          gl_FragColor = vec4(glowColor, glow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    })
  }, [intensity, color])
  
  useFrame((state) => {
    if (meshRef.current && glowMaterial.uniforms) {
      glowMaterial.uniforms.time.value = state.clock.elapsedTime
    }
  })
  
  return (
    <>
      {/* Outer atmospheric glow */}
      <mesh ref={meshRef} scale={[1.05, 1.05, 1.05]}>
        <sphereGeometry args={[radius, 64, 32]} />
        <primitive object={glowMaterial} />
      </mesh>
      
      {/* Inner subtle glow */}
      <mesh scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[radius, 32, 16]} />
        <meshBasicMaterial
          color={color}
          transparent={true}
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}