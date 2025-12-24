'use client'

import { useState, useEffect, useCallback } from 'react'

export interface LoadingStep {
  key: string
  label: string
  isComplete: boolean
}

export function useAppLoader() {
  const [isLoading, setIsLoading] = useState(true)
  const [startTime] = useState(Date.now())
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([
    { key: 'database', label: 'Connecting to threat database...', isComplete: false },
    { key: 'threats', label: 'Loading threat intelligence data...', isComplete: false },
    { key: 'models', label: 'Preparing 3D Earth model...', isComplete: false },
    { key: 'shaders', label: 'Initializing visualization shaders...', isComplete: false },
    { key: 'ui', label: 'Setting up user interface...', isComplete: false }
  ])

  const markStepComplete = useCallback((stepKey: string) => {
    setLoadingSteps(prev => 
      prev.map(step => 
        step.key === stepKey 
          ? { ...step, isComplete: true }
          : step
      )
    )
  }, [])

  const markStepIncomplete = useCallback((stepKey: string) => {
    setLoadingSteps(prev => 
      prev.map(step => 
        step.key === stepKey 
          ? { ...step, isComplete: false }
          : step
      )
    )
  }, [])

  const completeLoading = useCallback(() => {
    // Ensure minimum loading time of 2 seconds for better UX
    const elapsed = Date.now() - startTime
    const minLoadTime = 2000
    
    if (elapsed < minLoadTime) {
      setTimeout(() => {
        setIsLoading(false)
      }, minLoadTime - elapsed)
    } else {
      setIsLoading(false)
    }
  }, [startTime])

  const resetLoading = useCallback(() => {
    setIsLoading(true)
    setLoadingSteps(prev => 
      prev.map(step => ({ ...step, isComplete: false }))
    )
  }, [])

  // Auto-complete some steps based on timing
  useEffect(() => {
    // Database connection step - complete immediately as it's handled by the API
    const dbTimer = setTimeout(() => {
      markStepComplete('database')
    }, 300)

    // 3D models step - simulate model loading time
    const modelsTimer = setTimeout(() => {
      markStepComplete('models')
    }, 800)

    // Shaders step - simulate shader compilation
    const shadersTimer = setTimeout(() => {
      markStepComplete('shaders')
    }, 1200)

    // UI step - complete after other steps
    const uiTimer = setTimeout(() => {
      markStepComplete('ui')
    }, 1500)

    return () => {
      clearTimeout(dbTimer)
      clearTimeout(modelsTimer)
      clearTimeout(shadersTimer)
      clearTimeout(uiTimer)
    }
  }, [markStepComplete])

  return {
    isLoading,
    loadingSteps,
    markStepComplete,
    markStepIncomplete,
    completeLoading,
    resetLoading
  }
}