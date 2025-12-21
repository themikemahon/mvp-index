// PostProcessingPipeline.tsx - Advanced post-processing effects for filament visualization
'use client'

import { useRef, useMemo } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import { 
  EffectComposer, 
  Bloom, 
  ChromaticAberration, 
  ToneMapping,
  SMAA
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

// Extend Three.js with post-processing components
extend({ EffectComposer, Bloom, ChromaticAberration, ToneMapping, SMAA })

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
  
  // Create selective bloom layer for filament materials
  const bloomLayer = useMemo(() => new THREE.Layers(), [])
  bloomLayer.set(1) // Layer 1 for bloom-enabled objects
  
  // Selective bloom configuration
  const selectiveBloomParams = useMemo(() => ({
    intensity: bloomIntensity,
    radius: bloomRadius,
    threshold: bloomThreshold,
    smoothWidth: 0.01,
    blendFunction: BlendFunction.ADD
  }), [bloomIntensity, bloomRadius, bloomThreshold])
  
  // Chromatic aberration configuration
  const chromaticAberrationParams = useMemo(() => ({
    offset: new THREE.Vector2(chromaticAberrationIntensity, chromaticAberrationIntensity),
    radialModulation: true,
    modulationOffset: 0.15
  }), [chromaticAberrationIntensity])
  
  // Tone mapping configuration
  const toneMappingParams = useMemo(() => ({
    mode: ToneMappingMode.ACES_FILMIC,
    resolution: 256,
    whitePoint: 4.0,
    middleGrey: 0.6,
    minLuminance: 0.01,
    averageLuminance: 1.0,
    adaptationRate: 2.0
  }), [])
  
  // Update bloom layer materials
  useFrame(() => {
    if (enableSelectiveBloom && composerRef.current) {
      // This would be used to selectively apply bloom to filament materials
      // The actual implementation would involve material switching
    }
  })
  
  return (
    <>
      {children}
      <EffectComposer ref={composerRef} multisampling={0}>
        {/* Selective Bloom Effect */}
        <Bloom
          intensity={selectiveBloomParams.intensity}
          radius={selectiveBloomParams.radius}
          luminanceThreshold={selectiveBloomParams.threshold}
          blendFunction={selectiveBloomParams.blendFunction}
        />
        
        {/* Chromatic Aberration for premium visual quality */}
        <ChromaticAberration
          offset={chromaticAberrationParams.offset}
          radialModulation={chromaticAberrationParams.radialModulation}
          modulationOffset={chromaticAberrationParams.modulationOffset}
        />
        
        {/* Tone Mapping for HDR-like appearance */}
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
        
        {/* Temporal Anti-Aliasing for smooth animations */}
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