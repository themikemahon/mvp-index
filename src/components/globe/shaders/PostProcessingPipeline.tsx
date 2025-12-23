// PostProcessingPipeline.tsx - Advanced post-processing effects for filament visualization
'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { 
  EffectComposer, 
  Bloom, 
  ChromaticAberration, 
  ToneMapping,
  SMAA
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

export interface PostProcessingPipelineProps {
  children: React.ReactNode
  bloomIntensity?: number
  bloomRadius?: number
  bloomThreshold?: number
  chromaticAberrationIntensity?: number
  enableToneMapping?: boolean
  enableAntiAliasing?: boolean
  enableSelectiveBloom?: boolean
}

export function PostProcessingPipeline({
  children,
  bloomIntensity = 1.5,
  bloomRadius = 0.8,
  bloomThreshold = 0.1,
  chromaticAberrationIntensity = 0.0005,
  enableToneMapping = true,
  enableAntiAliasing = true,
  enableSelectiveBloom = true
}: PostProcessingPipelineProps) {
  const composerRef = useRef<any>(null)
  const frameCount = useRef(0)
  
  // Create selective bloom layer for filament materials
  const bloomLayer = useMemo(() => new THREE.Layers(), [])
  bloomLayer.set(1) // Layer 1 for bloom-enabled objects
  
  // Balanced bloom for natural color enhancement
  const selectiveBloomParams = useMemo(() => ({
    intensity: bloomIntensity * 1.3, // Moderate bloom intensity for subtle glow
    radius: bloomRadius * 0.9, // Good color spread without overdoing it
    threshold: bloomThreshold * 0.7, // Capture colors without being too aggressive
    smoothWidth: 0.02, // Balanced precision
    blendFunction: BlendFunction.ADD
  }), [bloomIntensity, bloomRadius, bloomThreshold])
  
  // Optimize chromatic aberration for color enhancement without heavy performance cost
  const chromaticAberrationParams = useMemo(() => ({
    offset: new THREE.Vector2(chromaticAberrationIntensity * 0.5, chromaticAberrationIntensity * 0.5), // Moderate intensity
    radialModulation: false, // Disable for better performance
    modulationOffset: 0.1 // Reduced for subtler effect
  }), [chromaticAberrationIntensity])
  
  // Simplified tone mapping for better performance
  const toneMappingParams = useMemo(() => ({
    mode: ToneMappingMode.REINHARD2, // Faster than ACES_FILMIC
    resolution: 128, // Reduced resolution for performance
    whitePoint: 4.0,
    middleGrey: 0.6,
    minLuminance: 0.01,
    averageLuminance: 1.0,
    adaptationRate: 1.5 // Slightly faster adaptation
  }), [])
  
  // Throttle expensive post-processing updates
  useFrame(() => {
    frameCount.current++
    
    if (enableSelectiveBloom && composerRef.current) {
      // Only update selective bloom every few frames for performance
      if (frameCount.current % 2 === 0) {
        // This would be used to selectively apply bloom to filament materials
        // The actual implementation would involve material switching
      }
    }
  })
  
  return (
    <>
      {children}
      <EffectComposer ref={composerRef} multisampling={2}>
        {/* Selective Bloom Effect - optimized settings */}
        <Bloom
          intensity={selectiveBloomParams.intensity}
          radius={selectiveBloomParams.radius}
          luminanceThreshold={selectiveBloomParams.threshold}
          blendFunction={selectiveBloomParams.blendFunction}
        />
        
        {/* Chromatic Aberration - reduced intensity for performance */}
        <ChromaticAberration
          offset={chromaticAberrationParams.offset}
          radialModulation={chromaticAberrationParams.radialModulation}
          modulationOffset={chromaticAberrationParams.modulationOffset}
        />
        
        {/* Tone Mapping - optimized for performance */}
        <>
          {enableToneMapping && (
            <ToneMapping
              mode={toneMappingParams.mode}
              resolution={toneMappingParams.resolution}
              whitePoint={toneMappingParams.whitePoint}
              middleGrey={toneMappingParams.middleGrey}
              minLuminance={toneMappingParams.minLuminance}
              averageLuminance={toneMappingParams.averageLuminance}
              adaptationRate={toneMappingParams.adaptationRate}
            />
          )}
        </>
        
        {/* Temporal Anti-Aliasing - only when needed */}
        <>
          {enableAntiAliasing && <SMAA />}
        </>
      </EffectComposer>
    </>
  )
}

// Hook for configuring materials to work with selective bloom
export function useSelectiveBloom() {
  const bloomLayer = useMemo(() => new THREE.Layers(), [])
  bloomLayer.set(1)
  
  const enableBloom = (object: THREE.Object3D) => {
    object.layers.enable(1)
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.layers.enable(1)
      }
    })
  }
  
  const disableBloom = (object: THREE.Object3D) => {
    object.layers.disable(1)
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.layers.disable(1)
      }
    })
  }
  
  return { enableBloom, disableBloom, bloomLayer }
}

// Custom bloom material for filament effects
export class BloomMaterial extends THREE.MeshStandardMaterial {
  constructor(parameters?: THREE.MeshStandardMaterialParameters) {
    super(parameters)
    
    // Configure for bloom
    this.transparent = true
    this.blending = THREE.AdditiveBlending
    this.depthWrite = false
    
    // Set emissive properties for bloom detection
    this.emissive = this.color.clone()
    this.emissiveIntensity = 1.0
  }
  
  setBloomIntensity(intensity: number) {
    this.emissiveIntensity = intensity
  }
  
  setBloomColor(color: THREE.Color) {
    this.emissive = color.clone()
    this.color = color.clone()
  }
}