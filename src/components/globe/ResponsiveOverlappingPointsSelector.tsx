'use client'

import { ThreatDataPoint } from '@/types/threat'
import { useResponsive } from '@/hooks/useResponsive'
import { OverlappingPointsSelector } from './OverlappingPointsSelector'
import { MobileOverlappingPointsSelector } from './MobileOverlappingPointsSelector'

export interface ResponsiveOverlappingPointsSelectorProps {
  dataPoints: ThreatDataPoint[]
  isVisible: boolean
  onSelect: (dataPoint: ThreatDataPoint) => void
  onClose: () => void
  position?: { x: number; y: number }
}

/**
 * Responsive wrapper that automatically chooses between desktop and mobile
 * overlapping points selector components based on viewport size
 */
export function ResponsiveOverlappingPointsSelector({
  dataPoints,
  isVisible,
  onSelect,
  onClose,
  position
}: ResponsiveOverlappingPointsSelectorProps) {
  const { isMobile, isTablet } = useResponsive()

  // Use mobile-optimized component for mobile and tablet viewports
  if (isMobile || isTablet) {
    return (
      <MobileOverlappingPointsSelector
        dataPoints={dataPoints}
        isVisible={isVisible}
        onSelect={onSelect}
        onClose={onClose}
        position={position}
      />
    )
  }

  // Use desktop component for desktop viewports
  return (
    <OverlappingPointsSelector
      dataPoints={dataPoints}
      isVisible={isVisible}
      onSelect={onSelect}
      onClose={onClose}
      position={position}
    />
  )
}