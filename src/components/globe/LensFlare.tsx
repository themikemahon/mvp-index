'use client'

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface LensFlareProps {
  position?: [number, number, number]
  intensity?: number
  color?: string
}

export function LensFlare({ 
  position = [10, 8, 5], 
  intensity = 1.0,
  color = '#ffffff'
}: LensFlareProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()
  
  // Create lens flare elements with different sizes and opacities
  const flareElements = useMemo(() => {
    const elements = []
    const flareColor = new THREE.Color(color)
    
    // Main bright center
    elements.push({
      size: 2.0,
      opacity: 0.8,
      color: flareColor.clone(),
      distance: 0
    })
    
    // Secondary flares at different distances along the line
    const distances = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2]
    const sizes = [1.5, 1.0, 0.8, 0.6, 0.4, 0.3]
    const opacities = [0.6, 0.4, 0.3, 0.2, 0.15, 0.1]
    
    distances.forEach((distance, i) => {
      elements.push({
        size: sizes[i],
        opacity: opacities[i],
        color: flareColor.clone().multiplyScalar(0.8 + Math.random() * 0.4),
        distance
      })
    })
    
    return elements
  }, [color])
  
  useFrame(() => {
    if (!groupRef.current || !camera) return
    
    const lightPos = new THREE.Vector3(...position)
    const cameraPos = camera.position.clone()
    
    // Calculate the direction from light to camera
    const direction = cameraPos.clone().sub(lightPos).normalize()
    
    // Position flare elements along the line from light to camera
    groupRef.current.children.forEach((child, index) => {
      if (child instanceof THREE.Mesh) {
        const element = flareElements[index]
        if (element) {
          const flarePos = lightPos.clone().add(
            direction.clone().multiplyScalar(element.distance * 15)
          )
          child.position.copy(flarePos)
          
          // Make flares face the camera
          child.lookAt(camera.position)
          
          // Animate opacity based on viewing angle
          const dot = direction.dot(camera.getWorldDirection(new THREE.Vector3()))
          const visibility = Math.max(0, dot) * intensity
          
          if (child.material instanceof THREE.MeshBasicMaterial) {
            child.material.opacity = element.opacity * visibility
          }
        }
      }
    })
  })
  
  return (
    <group ref={groupRef}>
      {flareElements.map((element, index) => (
        <mesh key={index}>
          <planeGeometry args={[element.size, element.size]} />
          <meshBasicMaterial
            color={element.color}
            transparent={true}
            opacity={element.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}