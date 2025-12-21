// SimpleFilamentTest.tsx - A simple test component to verify filament rendering
'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function SimpleFilamentTest() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Create a simple glowing torus around the globe
  const geometry = new THREE.TorusGeometry(2.5, 0.05, 8, 100)
  const material = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.8,
    emissive: 0x004444
  })
  
  // Animate the torus
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
    }
  })
  
  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  )
}