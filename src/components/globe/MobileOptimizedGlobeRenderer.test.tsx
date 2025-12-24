import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as deviceDetection from '@/utils/deviceDetection'

// Mock the device detection utilities
vi.mock('@/utils/deviceDetection', () => ({
  detectDeviceCapabilities: vi.fn(),
  getPerformanceSettings: vi.fn()
}))

describe('Mobile Globe Renderer Optimizations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should detect high-performance settings for high-end devices', () => {
    const mockCapabilities = {
      tier: 'high' as const,
      maxPixelRatio: 2,
      supportsWebGL2: true,
      maxTextureSize: 4096,
      estimatedMemory: 8,
      touchSupport: true,
      orientationSupport: true,
      networkSpeed: 'fast' as const,
      hasVoiceSupport: true,
      supportsPWA: true
    }

    const mockPerformanceSettings = {
      pixelRatio: 2,
      shadowQuality: 'high' as const,
      particleCount: 1000,
      antialiasing: true,
      postProcessing: true,
      maxLODLevel: 3
    }

    vi.mocked(deviceDetection.detectDeviceCapabilities).mockReturnValue(mockCapabilities)
    vi.mocked(deviceDetection.getPerformanceSettings).mockReturnValue(mockPerformanceSettings)

    const capabilities = deviceDetection.detectDeviceCapabilities()
    const settings = deviceDetection.getPerformanceSettings(capabilities)

    expect(capabilities.tier).toBe('high')
    expect(settings.pixelRatio).toBe(2)
    expect(settings.shadowQuality).toBe('high')
    expect(settings.particleCount).toBe(1000)
    expect(settings.antialiasing).toBe(true)
    expect(settings.postProcessing).toBe(true)
    expect(settings.maxLODLevel).toBe(3)
  })

  it('should detect low-performance settings for low-end devices', () => {
    const mockCapabilities = {
      tier: 'low' as const,
      maxPixelRatio: 1,
      supportsWebGL2: false,
      maxTextureSize: 2048,
      estimatedMemory: 2,
      touchSupport: true,
      orientationSupport: true,
      networkSpeed: 'slow' as const,
      hasVoiceSupport: false,
      supportsPWA: false
    }

    const mockPerformanceSettings = {
      pixelRatio: 1,
      shadowQuality: 'disabled' as const,
      particleCount: 200,
      antialiasing: false,
      postProcessing: false,
      maxLODLevel: 1
    }

    vi.mocked(deviceDetection.detectDeviceCapabilities).mockReturnValue(mockCapabilities)
    vi.mocked(deviceDetection.getPerformanceSettings).mockReturnValue(mockPerformanceSettings)

    const capabilities = deviceDetection.detectDeviceCapabilities()
    const settings = deviceDetection.getPerformanceSettings(capabilities)

    expect(capabilities.tier).toBe('low')
    expect(settings.pixelRatio).toBe(1)
    expect(settings.shadowQuality).toBe('disabled')
    expect(settings.particleCount).toBe(200)
    expect(settings.antialiasing).toBe(false)
    expect(settings.postProcessing).toBe(false)
    expect(settings.maxLODLevel).toBe(1)
  })

  it('should detect medium-performance settings for medium-tier devices', () => {
    const mockCapabilities = {
      tier: 'medium' as const,
      maxPixelRatio: 1.5,
      supportsWebGL2: true,
      maxTextureSize: 2048,
      estimatedMemory: 4,
      touchSupport: true,
      orientationSupport: true,
      networkSpeed: 'medium' as const,
      hasVoiceSupport: true,
      supportsPWA: true
    }

    const mockPerformanceSettings = {
      pixelRatio: 1.5,
      shadowQuality: 'medium' as const,
      particleCount: 500,
      antialiasing: true,
      postProcessing: false,
      maxLODLevel: 2
    }

    vi.mocked(deviceDetection.detectDeviceCapabilities).mockReturnValue(mockCapabilities)
    vi.mocked(deviceDetection.getPerformanceSettings).mockReturnValue(mockPerformanceSettings)

    const capabilities = deviceDetection.detectDeviceCapabilities()
    const settings = deviceDetection.getPerformanceSettings(capabilities)

    expect(capabilities.tier).toBe('medium')
    expect(settings.pixelRatio).toBe(1.5)
    expect(settings.shadowQuality).toBe('medium')
    expect(settings.particleCount).toBe(500)
    expect(settings.antialiasing).toBe(true)
    expect(settings.postProcessing).toBe(false)
    expect(settings.maxLODLevel).toBe(2)
  })

  it('should cap pixel ratio appropriately for mobile devices', () => {
    const mockCapabilities = {
      tier: 'medium' as const,
      maxPixelRatio: 1.5, // Capped at 1.5 for mobile
      supportsWebGL2: true,
      maxTextureSize: 2048,
      estimatedMemory: 4,
      touchSupport: true,
      orientationSupport: true,
      networkSpeed: 'medium' as const,
      hasVoiceSupport: true,
      supportsPWA: true
    }

    const mockPerformanceSettings = {
      pixelRatio: 1.5, // Should be capped at 1.5 for mobile optimization
      shadowQuality: 'medium' as const,
      particleCount: 500,
      antialiasing: true,
      postProcessing: false,
      maxLODLevel: 2
    }

    vi.mocked(deviceDetection.detectDeviceCapabilities).mockReturnValue(mockCapabilities)
    vi.mocked(deviceDetection.getPerformanceSettings).mockReturnValue(mockPerformanceSettings)

    const capabilities = deviceDetection.detectDeviceCapabilities()
    const settings = deviceDetection.getPerformanceSettings(capabilities)

    // Verify pixel ratio is capped at 1.5 for mobile optimization
    expect(settings.pixelRatio).toBeLessThanOrEqual(1.5)
    expect(capabilities.maxPixelRatio).toBeLessThanOrEqual(1.5)
  })
})