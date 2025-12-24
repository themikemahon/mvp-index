'use client'

import { ThreatDataPoint } from '@/types/threat'
import { useResponsive } from '@/hooks/useResponsive'
import { DataPointDetail } from './DataPointDetail'
import { MobileDataPointDetail } from './MobileDataPointDetail'

export interface ResponsiveDataPointDetailProps {
  dataPoint: ThreatDataPoint | null
  relatedThreats?: ThreatDataPoint[]
  isVisible: boolean
  onClose: () => void
  onNavigateToThreat?: (threat: ThreatDataPoint) => void
  position?: { x: number; y: number }
}

/**
 * Responsive wrapper that automatically chooses between desktop and mobile
 * data point detail components based on viewport size
 */
export function ResponsiveDataPointDetail({
  dataPoint,
  relatedThreats = [],
  isVisible,
  onClose,
  onNavigateToThreat,
  position
}: ResponsiveDataPointDetailProps) {
  const { isMobile, isTablet } = useResponsive()

  // Use mobile-optimized component for mobile and tablet viewports
  if (isMobile || isTablet) {
    return (
      <MobileDataPointDetail
        dataPoint={dataPoint}
        relatedThreats={relatedThreats}
        isVisible={isVisible}
        onClose={onClose}
        onNavigateToThreat={onNavigateToThreat}
        position={position}
      />
    )
  }

  // Use desktop component for desktop viewports
  return (
    <DataPointDetail
      dataPoint={dataPoint}
      isVisible={isVisible}
      onClose={onClose}
      position={position}
    />
  )
}