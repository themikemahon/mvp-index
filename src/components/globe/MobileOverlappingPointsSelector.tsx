'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ThreatDataPoint, ThreatType } from '@/types/threat'
import { useResponsive } from '@/hooks/useResponsive'

export interface MobileOverlappingPointsSelectorProps {
  dataPoints: ThreatDataPoint[]
  isVisible: boolean
  onSelect: (dataPoint: ThreatDataPoint) => void
  onClose: () => void
  position?: { x: number; y: number }
}

// Get threat type icon
function getThreatTypeIcon(threatType: ThreatType): string {
  switch (threatType) {
    case 'vulnerability':
      return '🔴'
    case 'scam':
      return '🟠'
    case 'financial_risk':
      return '🟡'
    case 'protection':
      return '🔵'
    default:
      return '⚪'
  }
}

// Get threat type color for mobile
function getThreatTypeColor(threatType: ThreatType): string {
  switch (threatType) {
    case 'vulnerability':
      return 'border-red-200 bg-red-50 hover:bg-red-100 active:bg-red-200'
    case 'scam':
      return 'border-orange-200 bg-orange-50 hover:bg-orange-100 active:bg-orange-200'
    case 'financial_risk':
      return 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200'
    case 'protection':
      return 'border-blue-200 bg-blue-50 hover:bg-blue-100 active:bg-blue-200'
    default:
      return 'border-gray-200 bg-gray-50 hover:bg-gray-100 active:bg-gray-200'
  }
}

// Get severity badge color
function getSeverityBadgeColor(severity: number): string {
  if (severity >= 9) {
    return 'bg-red-600 text-white'
  } else if (severity >= 7) {
    return 'bg-red-500 text-white'
  } else if (severity >= 5) {
    return 'bg-orange-500 text-white'
  } else if (severity >= 3) {
    return 'bg-yellow-500 text-white'
  } else {
    return 'bg-green-500 text-white'
  }
}

export function MobileOverlappingPointsSelector({
  dataPoints,
  isVisible,
  onSelect,
  onClose,
  position
}: MobileOverlappingPointsSelectorProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const { isMobile, isTablet } = useResponsive()
  const modalRef = useRef<HTMLDivElement>(null)
  const startTouchRef = useRef<{ x: number; y: number; time: number } | null>(null)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  // Handle swipe to close on mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile && !isTablet) return
    
    const touch = e.touches[0]
    startTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
  }, [isMobile, isTablet])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!startTouchRef.current || (!isMobile && !isTablet)) return

    const touch = e.changedTouches[0]
    const deltaY = touch.clientY - startTouchRef.current.y
    const deltaTime = Date.now() - startTouchRef.current.time
    
    // Calculate velocity
    const velocityY = Math.abs(deltaY) / deltaTime

    // Swipe down to close
    if (deltaY > 50 && deltaTime < 500 && velocityY > 0.1) {
      onClose()
    }

    startTouchRef.current = null
  }, [isMobile, isTablet, onClose])

  if (!isAnimating || dataPoints.length === 0) {
    return null
  }

  // If only one data point, select it immediately
  if (dataPoints.length === 1) {
    onSelect(dataPoints[0])
    return null
  }

  // Sort by severity (highest first)
  const sortedDataPoints = [...dataPoints].sort((a, b) => b.severity - a.severity)

  // Use full-screen modal on mobile/tablet, positioned modal on desktop
  const useFullScreen = isMobile || isTablet

  const modalClasses = useFullScreen
    ? 'fixed inset-0 bg-white z-50'
    : 'fixed bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-w-[90vw] max-h-96 z-50'

  const modalStyle: React.CSSProperties = useFullScreen
    ? {}
    : position
    ? {
        left: Math.min(position.x + 20, window.innerWidth - 320),
        top: Math.min(position.y - 50, window.innerHeight - 200),
      }
    : {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }

  return (
    <>
      {/* Backdrop - only show on desktop */}
      {!useFullScreen && (
        <div 
          className={`fixed inset-0 bg-black transition-opacity duration-200 z-40 ${
            isVisible ? 'bg-opacity-20' : 'bg-opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
        />
      )}

      {/* Selector Modal */}
      <div
        ref={modalRef}
        style={modalStyle}
        className={`${modalClasses} overflow-hidden transition-all duration-200 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className={`${useFullScreen ? 'bg-white border-b border-gray-200 px-4 py-4' : 'bg-gray-50 px-4 py-3 border-b border-gray-200'}`}>
          <div className="flex items-center justify-between">
            {useFullScreen ? (
              <button
                onClick={onClose}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center"
                aria-label="Close"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>
            ) : (
              <h3 className="text-sm font-semibold text-gray-900">
                Multiple Threats ({dataPoints.length})
              </h3>
            )}

            {!useFullScreen && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {useFullScreen && (
            <div className="mt-2">
              <h1 className="text-xl font-semibold text-gray-900">
                Multiple Threats
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {dataPoints.length} threats found at this location
              </p>
            </div>
          )}

          {!useFullScreen && (
            <p className="text-xs text-gray-600 mt-1">
              Select a threat to view details
            </p>
          )}
        </div>

        {/* Data Points List */}
        <div className={`${useFullScreen ? 'flex-1 overflow-y-auto px-4 py-2' : 'overflow-y-auto max-h-80'}`}>
          {sortedDataPoints.map((dataPoint, index) => (
            <button
              key={dataPoint.id}
              onClick={() => onSelect(dataPoint)}
              className={`w-full ${useFullScreen ? 'p-4 mb-3' : 'px-4 py-3'} text-left border-2 rounded-lg transition-all ${getThreatTypeColor(dataPoint.threatType)} ${
                useFullScreen ? 'shadow-sm' : 'border-b border-gray-100 last:border-b-0 rounded-none first:rounded-t-lg last:rounded-b-lg'
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Threat Type Icon */}
                <div className={`flex-shrink-0 ${useFullScreen ? 'text-2xl' : 'text-lg'}`}>
                  {getThreatTypeIcon(dataPoint.threatType)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className={`${useFullScreen ? 'text-lg' : 'text-sm'} font-semibold text-gray-900`}>
                      {dataPoint.title}
                    </h4>
                    
                    {/* Severity Badge */}
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${getSeverityBadgeColor(dataPoint.severity)}`}>
                      {dataPoint.severity}
                    </span>
                  </div>
                  
                  {dataPoint.subhead && (
                    <p className={`${useFullScreen ? 'text-sm' : 'text-xs'} text-gray-600 mt-1 ${useFullScreen ? 'line-clamp-2' : 'line-clamp-1'}`}>
                      {dataPoint.subhead}
                    </p>
                  )}

                  {/* Enhanced Metadata for Mobile */}
                  <div className={`flex flex-wrap items-center gap-2 mt-2 ${useFullScreen ? 'text-sm' : 'text-xs'} text-gray-500`}>
                    <span className="capitalize bg-gray-200 px-2 py-1 rounded-full">
                      {dataPoint.threatType.replace('_', ' ')}
                    </span>
                    
                    {dataPoint.region && (
                      <span className="bg-gray-200 px-2 py-1 rounded-full">
                        📍 {dataPoint.region}
                      </span>
                    )}
                    
                    {dataPoint.brands && dataPoint.brands.length > 0 && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        🏢 {dataPoint.brands[0]}{dataPoint.brands.length > 1 ? ` +${dataPoint.brands.length - 1}` : ''}
                      </span>
                    )}

                    {dataPoint.topics && dataPoint.topics.length > 0 && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        🏷️ {dataPoint.topics.length} topic{dataPoint.topics.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Quick Stats for Mobile */}
                  {useFullScreen && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Created: {new Date(dataPoint.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {dataPoint.isQuantitative ? '📊 Has data' : '📝 Qualitative'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 text-gray-400">
                  <svg className={`${useFullScreen ? 'w-6 h-6' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Mobile Footer with Swipe Hint */}
        {useFullScreen && (
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span>Swipe down to close</span>
            </div>
          </div>
        )}

        {/* Desktop Footer */}
        {!useFullScreen && (
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Click on any threat above to view detailed information
            </p>
          </div>
        )}
      </div>
    </>
  )
}