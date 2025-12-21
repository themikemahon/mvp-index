'use client'

import { useRef, useState, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface CursorParticleRingProps {
  intensity?: number
  visualizationMode?: 'heatmap' | 'pixels'
}

export function CursorParticleRing({ 
  intensity = 1.0, 
  visualizationMode = 'heatmap' 
}: CursorParticleRingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const [mousePosition, setMousePosition] = useState<THREE.Vector3 | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [orbitalAxis, setOrbitalAxis] = useState<THREE.Vector3>(new THREE.Vector3(0, 1, 0))
  const { camera, gl, scene } = useThree()
  
  // Create orbital particle system that matches filament behavior
  const { geometry, material } = useMemo(() => {
    const particleCount = 380 // Even more particles for better coverage (was 120)
    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []
    const sizes: number[] = []
    const phases: number[] = []
    const orbitalT: number[] = []
    const orbitalRadius: number[] = []
    
    // Create particles in orbital formation (like the filaments)
    for (let i = 0; i < particleCount; i++) {
      // Distribute particles along orbital path
      const t = i / particleCount
      const angle = t * Math.PI * 2
      const radius = 2.3 + Math.random() * 0.3 // Tighter radius range to prevent extreme positions
      
      // Initial orbital position (will be rotated by group)
      const x = Math.cos(angle) * radius
      const y = 0
      const z = Math.sin(angle) * radius
      
      positions.push(x, y, z)
      sizes.push(1.5 + Math.random() * 1.0) // More reasonable particle sizes
      phases.push(Math.random() * Math.PI * 2)
      orbitalT.push(t)
      orbitalRadius.push(radius)
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
    geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1))
    geometry.setAttribute('orbitalT', new THREE.Float32BufferAttribute(orbitalT, 1))
    geometry.setAttribute('orbitalRadius', new THREE.Float32BufferAttribute(orbitalRadius, 1))
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        opacity: { value: 0 },
        color: { value: new THREE.Color(0x00ffff) }, // Brighter cyan (was 0x4fc3f7)
        flowSpeed: { value: 0.5 }
      },
      vertexShader: `
        attribute float size;
        attribute float phase;
        attribute float orbitalT;
        attribute float orbitalRadius;
        uniform float time;
        uniform float opacity;
        uniform float flowSpeed;
        
        varying float vOpacity;
        varying float vPhase;
        varying float vFlow;
        
        void main() {
          vPhase = phase;
          vOpacity = opacity;
          
          // Animate particles along orbital path (like filaments) with bounds checking
          float animatedT = mod(orbitalT + time * flowSpeed, 1.0);
          float angle = animatedT * 6.28318; // 2 * PI
          
          // Create orbital position with controlled radius
          float clampedRadius = clamp(orbitalRadius, 2.2, 2.8); // Prevent extreme radii
          
          // Safety check: ensure we're within reasonable bounds
          if (clampedRadius > 10.0 || opacity < 0.01) {
            gl_Position = vec4(0.0, 0.0, -1000.0, 1.0); // Move far away if invalid
            gl_PointSize = 0.0;
            return;
          }
          
          vec3 orbitalPos = vec3(
            cos(angle) * clampedRadius,
            sin(time * 2.0 + phase) * 0.1, // Slight vertical oscillation
            sin(angle) * clampedRadius
          );
          
          // Add some orbital variation for organic feel - controlled
          float heightOffset = sin(animatedT * 3.14159 + phase) * 0.15; // Reduced from 0.2
          orbitalPos.y += heightOffset;
          
          vFlow = sin(animatedT * 3.14159); // Flow intensity along orbit
          
          vec4 mvPosition = modelViewMatrix * vec4(orbitalPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Much larger particles that pulse with orbital flow - with size limits
          float pulse = sin(time * 3.0 + phase) * 0.2 + 0.8;
          float flowPulse = vFlow * 0.3 + 0.7;
          
          // Calculate distance-based size with limits
          float distanceFromCamera = length(mvPosition.xyz);
          float distanceScale = clamp(30.0 / max(distanceFromCamera, 5.0), 0.2, 2.0); // More conservative scaling
          
          float finalSize = size * 25.0 * pulse * flowPulse * opacity * distanceScale; // Reduced base size
          gl_PointSize = clamp(finalSize, 1.0, 80.0); // Smaller maximum size to prevent gigantic particles
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        
        varying float vOpacity;
        varying float vPhase;
        varying float vFlow;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          if(dist > 0.5) discard;
          
          // Soft circular particle with enhanced brightness
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha = pow(alpha, 1.0); // Even softer edges for more glow (was 1.2)
          
          // Flow effect like filaments - more pronounced
          float flowIntensity = vFlow * 0.5 + 0.5; // Increased from 0.4 + 0.6
          
          // Sparkle effect synchronized with orbital motion
          float sparkle = sin(time * 4.0 + vPhase * 3.0) * 0.2 + 0.8;
          
          float finalAlpha = alpha * vOpacity * flowIntensity * sparkle * 2.0; // Increased from 1.4 to 2.0
          
          // Brighter color variation based on flow
          vec3 finalColor = mix(color * 1.2, color * 1.6, vFlow * 0.5); // Brighter colors
          
          gl_FragColor = vec4(finalColor, finalAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    
    return { geometry, material }
  }, [])
  
  // Calculate orbital axis based on mouse movement (like filaments do)
  const calculateOrbitalAxis = useCallback((intersectionPoint: THREE.Vector3, mouseVelocity: THREE.Vector2) => {
    // Create orbital axis based on mouse movement direction and intersection point
    const axis = new THREE.Vector3(
      mouseVelocity.y + (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.5,
      -mouseVelocity.x + (Math.random() - 0.5) * 0.3
    ).normalize()
    
    return axis
  }, [])
  
  // Mouse tracking and orbital positioning
  const lastMousePos = useRef({ x: 0, y: 0 })
  
  useFrame((state) => {
    if (!groupRef.current || !material) return
    
    // Update time uniform for orbital animation
    material.uniforms.time.value = state.clock.elapsedTime
    
    // Get mouse position and calculate velocity
    const currentMousePos = { x: state.pointer.x, y: state.pointer.y }
    const mouseVelocity = new THREE.Vector2(
      currentMousePos.x - lastMousePos.current.x,
      currentMousePos.y - lastMousePos.current.y
    )
    lastMousePos.current = currentMousePos
    
    // Mouse position in normalized device coordinates
    const mouse = new THREE.Vector2()
    mouse.x = (state.pointer.x) * 2 - 1
    mouse.y = -(state.pointer.y) * 2 + 1
    
    // Create raycaster
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera)
    
    // Find globe in scene
    const globe = scene.children.find(child => {
      if (child.type === 'Group') {
        return child.children.some(grandchild => 
          grandchild.type === 'Mesh' && 
          (grandchild as THREE.Mesh).geometry?.type === 'SphereGeometry'
        )
      }
      return false
    })
    
    if (globe) {
      const sphereMesh = globe.children.find(child => 
        child.type === 'Mesh' && 
        (child as THREE.Mesh).geometry?.type === 'SphereGeometry'
      ) as THREE.Mesh
      
      if (sphereMesh) {
        const intersects = raycaster.intersectObject(sphereMesh)
        
        if (intersects.length > 0 && visualizationMode === 'heatmap') {
          setIsHovering(true)
          const intersectionPoint = intersects[0].point
          setMousePosition(intersectionPoint.clone())
          
          // Position orbital ring at intersection point
          groupRef.current.position.copy(intersectionPoint)
          
          // Calculate and apply orbital axis based on mouse movement
          const newAxis = calculateOrbitalAxis(intersectionPoint, mouseVelocity)
          setOrbitalAxis(newAxis)
          
          // Create orbital inclination (like filaments)
          const inclination = Math.random() * 0.5 + 0.2
          const rotationMatrix = new THREE.Matrix4()
          rotationMatrix.makeRotationAxis(newAxis, inclination)
          groupRef.current.setRotationFromMatrix(rotationMatrix)
          
          // Continuous orbital rotation (like filaments)
          const orbitalSpeed = 0.3
          const rotationAngle = state.clock.elapsedTime * orbitalSpeed
          const quaternion = new THREE.Quaternion()
          quaternion.setFromAxisAngle(newAxis, rotationAngle)
          groupRef.current.setRotationFromQuaternion(quaternion)
          
          // Fast fade-in with controlled intensity
          const targetOpacity = intensity * 3.0 // Reduced from 4.0 since we have better size control
          const currentOpacity = material.uniforms.opacity.value
          material.uniforms.opacity.value = THREE.MathUtils.lerp(currentOpacity, targetOpacity, 0.4)
          
          // Update flow speed based on mouse movement
          const mouseSpeed = mouseVelocity.length()
          material.uniforms.flowSpeed.value = 0.5 + mouseSpeed * 2.0
        } else {
          setIsHovering(false)
          
          // Aggressive fade out when not hovering over globe
          const currentOpacity = material.uniforms.opacity.value
          material.uniforms.opacity.value = THREE.MathUtils.lerp(currentOpacity, 0, 0.3) // Faster fade out
          
          // Move particles away from view when not hovering
          if (currentOpacity < 0.01) {
            groupRef.current.position.set(0, 0, -1000) // Move far away
          }
        }
      }
    }
  })
  
  return (
    <group ref={groupRef}>
      <points ref={particlesRef} geometry={geometry} material={material} />
    </group>
  )
}