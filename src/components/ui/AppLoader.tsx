'use client'

import { useState, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'

interface AppLoaderProps {
  isVisible: boolean
  onLoadComplete: () => void
  loadingSteps: {
    key: string
    label: string
    isComplete: boolean
  }[]
}

export function AppLoader({ isVisible, onLoadComplete, loadingSteps }: AppLoaderProps) {
  const [fadeOut, setFadeOut] = useState(false)

  // Preload the Earth model
  useGLTF.preload('/models/Earth_1_12756.glb')

  useEffect(() => {
    const completedSteps = loadingSteps.filter(step => step.isComplete).length
    const totalSteps = loadingSteps.length
    
    if (completedSteps === totalSteps && totalSteps > 0) {
      // All steps complete, start fade out after a brief delay
      const timer = setTimeout(() => {
        setFadeOut(true)
        // Complete the loading process after fade animation
        setTimeout(onLoadComplete, 600)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [loadingSteps, onLoadComplete])

  if (!isVisible) return null

  const completedSteps = loadingSteps.filter(step => step.isComplete).length
  const totalSteps = loadingSteps.length
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-600 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Simple centered content */}
      <div className="text-center max-w-md mx-auto px-6">
        {/* Title and subtitle */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">MVP Index</h1>
          <p className="text-gray-400 text-sm">
            The Most Vulnerable Planet
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-800 rounded-full h-1">
            <div 
              className="bg-white h-1 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Simple loading text */}
        <div className="text-xs text-gray-500">
          Loading... {Math.round(progress)}%
        </div>
      </div>
    </div>
  )
}