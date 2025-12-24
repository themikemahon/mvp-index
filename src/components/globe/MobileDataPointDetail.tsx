'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ThreatDataPoint, ThreatType } from '@/types/threat'
import { useResponsive } from '@/hooks/useResponsive'

export interface MobileDataPointDetailProps {
  dataPoint: ThreatDataPoint | null
  relatedThreats?: ThreatDataPoint[]
  isVisible: boolean
  onClose: () => void
  onNavigateToThreat?: (threat: ThreatDataPoint) => void
  position?: { x: number; y: number }
}

// Format date for display
function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return 'Unknown';
  }
  
  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

// Get threat type display name and styling
function getThreatTypeInfo(threatType: ThreatType): { 
  label: string
  bgColor: string
  textColor: string
  icon: string
} {
  switch (threatType) {
    case 'vulnerability':
      return {
        label: 'Vulnerability',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        icon: '🔴'
      }
    case 'scam':
      return {
        label: 'Scam',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        icon: '🟠'
      }
    case 'financial_risk':
      return {
        label: 'Financial Risk',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        icon: '🟡'
      }
    case 'protection':
      return {
        label: 'Protection',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        icon: '🔵'
      }
    default:
      return {
        label: 'Unknown',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        icon: '⚪'
      }
  }
}

// Get severity level display
function getSeverityInfo(severity: number): {
  label: string
  color: string
  bgColor: string
} {
  if (severity >= 9) {
    return { label: 'Critical', color: 'text-red-700', bgColor: 'bg-red-50' }
  } else if (severity >= 7) {
    return { label: 'High', color: 'text-red-600', bgColor: 'bg-red-50' }
  } else if (severity >= 5) {
    return { label: 'Medium', color: 'text-orange-600', bgColor: 'bg-orange-50' }
  } else if (severity >= 3) {
    return { label: 'Low', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
  } else {
    return { label: 'Minimal', color: 'text-green-600', bgColor: 'bg-green-50' }
  }
}

export function MobileDataPointDetail({
  dataPoint,
  relatedThreats = [],
  isVisible,
  onClose,
  onNavigateToThreat,
  position
}: MobileDataPointDetailProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentThreatIndex, setCurrentThreatIndex] = useState(0)
  const { isMobile, isTablet } = useResponsive()
  const modalRef = useRef<HTMLDivElement>(null)
  const startTouchRef = useRef<{ x: number; y: number; time: number } | null>(null)

  // All threats including the main one and related ones
  const allThreats = dataPoint ? [dataPoint, ...relatedThreats.filter(t => t.id !== dataPoint.id)] : []
  const currentThreat = allThreats[currentThreatIndex]

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      setCurrentThreatIndex(0) // Reset to first threat when opening
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  // Handle swipe gestures
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
    const deltaX = touch.clientX - startTouchRef.current.x
    const deltaY = touch.clientY - startTouchRef.current.y
    const deltaTime = Date.now() - startTouchRef.current.time
    
    // Calculate velocity
    const velocityX = Math.abs(deltaX) / deltaTime
    const velocityY = Math.abs(deltaY) / deltaTime

    // Swipe thresholds
    const minSwipeDistance = 50
    const maxSwipeTime = 500
    const minVelocity = 0.1

    // Horizontal swipe for navigation between threats
    if (
      Math.abs(deltaX) > minSwipeDistance &&
      Math.abs(deltaX) > Math.abs(deltaY) * 2 &&
      deltaTime < maxSwipeTime &&
      velocityX > minVelocity &&
      allThreats.length > 1
    ) {
      if (deltaX > 0 && currentThreatIndex > 0) {
        // Swipe right - previous threat
        setCurrentThreatIndex(prev => prev - 1)
      } else if (deltaX < 0 && currentThreatIndex < allThreats.length - 1) {
        // Swipe left - next threat
        setCurrentThreatIndex(prev => prev + 1)
      }
    }
    
    // Vertical swipe down for closing
    else if (
      deltaY > minSwipeDistance &&
      Math.abs(deltaY) > Math.abs(deltaX) * 2 &&
      deltaTime < maxSwipeTime &&
      velocityY > minVelocity
    ) {
      onClose()
    }

    startTouchRef.current = null
  }, [isMobile, isTablet, allThreats.length, currentThreatIndex, onClose])

  // Navigate to specific threat
  const navigateToThreat = useCallback((threat: ThreatDataPoint) => {
    const index = allThreats.findIndex(t => t.id === threat.id)
    if (index !== -1) {
      setCurrentThreatIndex(index)
      if (onNavigateToThreat) {
        onNavigateToThreat(threat)
      }
    }
  }, [allThreats, onNavigateToThreat])

  if (!currentThreat || !isAnimating) {
    return null
  }

  // Add safety checks for all data point properties
  const safeDataPoint = {
    ...currentThreat,
    title: currentThreat.title || 'Unknown Threat',
    subhead: currentThreat.subhead || '',
    description: currentThreat.description || 'No description available',
    coordinates: currentThreat.coordinates || { latitude: 0, longitude: 0 },
    severity: currentThreat.severity || 0,
    threatType: currentThreat.threatType || 'vulnerability',
    region: currentThreat.region || '',
    brands: currentThreat.brands || [],
    topics: currentThreat.topics || [],
    sources: currentThreat.sources || [],
    createdAt: currentThreat.createdAt || new Date(),
    updatedAt: currentThreat.updatedAt || new Date(),
    expirationDate: currentThreat.expirationDate || null,
    isQuantitative: currentThreat.isQuantitative || false,
    statisticalData: currentThreat.statisticalData || null
  }

  const threatTypeInfo = getThreatTypeInfo(safeDataPoint.threatType)
  const severityInfo = getSeverityInfo(safeDataPoint.severity)

  // Use full-screen modal on mobile/tablet, positioned modal on desktop
  const useFullScreen = isMobile || isTablet

  const modalClasses = useFullScreen
    ? 'fixed inset-0 bg-white z-50'
    : 'fixed bg-white rounded-lg shadow-2xl border border-gray-200 w-96 max-w-[90vw] max-h-[80vh] z-50'

  const modalStyle: React.CSSProperties = useFullScreen
    ? {}
    : position
    ? {
        left: Math.min(position.x + 20, window.innerWidth - 400),
        top: Math.min(position.y - 50, window.innerHeight - 300),
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
          className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
            isVisible ? 'bg-opacity-30' : 'bg-opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
        />
      )}

      {/* Detail Modal */}
      <div
        ref={modalRef}
        style={modalStyle}
        className={`${modalClasses} overflow-hidden transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile Header with Navigation */}
        <div className={`${useFullScreen ? 'bg-white border-b border-gray-200 px-4 py-3' : 'bg-gray-50 px-6 py-4 border-b border-gray-200'}`}>
          <div className="flex items-center justify-between">
            {/* Back/Close Button */}
            <button
              onClick={onClose}
              className={`${useFullScreen ? 'p-2 -ml-2' : ''} text-gray-600 hover:text-gray-800 transition-colors flex items-center`}
              aria-label="Close"
            >
              {useFullScreen ? (
                <>
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-medium">Back</span>
                </>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>

            {/* Threat Counter */}
            {allThreats.length > 1 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {currentThreatIndex + 1} of {allThreats.length}
                </span>
                {useFullScreen && (
                  <div className="text-xs text-gray-400">
                    Swipe to navigate
                  </div>
                )}
              </div>
            )}

            {/* Share Button (mobile only) */}
            {useFullScreen && (
              <button
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="Share"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
            )}
          </div>

          {/* Title and Basic Info */}
          <div className="mt-3">
            <div className="flex items-start space-x-3">
              <div className="text-2xl flex-shrink-0">
                {threatTypeInfo.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className={`${useFullScreen ? 'text-xl' : 'text-lg'} font-semibold text-gray-900`}>
                  {safeDataPoint.title}
                </h1>
                {safeDataPoint.subhead && (
                  <p className="text-sm text-gray-600 mt-1">
                    {safeDataPoint.subhead}
                  </p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${threatTypeInfo.bgColor} ${threatTypeInfo.textColor}`}>
                {threatTypeInfo.label}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${severityInfo.bgColor} ${severityInfo.color}`}>
                {severityInfo.label} ({safeDataPoint.severity}/10)
              </span>
            </div>
          </div>
        </div>

        {/* Content - Single Column Layout */}
        <div className={`${useFullScreen ? 'flex-1 overflow-y-auto px-4 py-6' : 'px-6 py-4 overflow-y-auto max-h-96'}`}>
          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-base text-gray-700 leading-relaxed">
              {safeDataPoint.description}
            </p>
          </div>

          {/* Statistical Data */}
          {safeDataPoint.isQuantitative && safeDataPoint.statisticalData && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Statistical Information</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                {safeDataPoint.statisticalData.value !== undefined && safeDataPoint.statisticalData.unit ? (
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {safeDataPoint.statisticalData.value.toLocaleString()} {safeDataPoint.statisticalData.unit}
                  </div>
                ) : (
                  <div className="text-xl font-semibold text-gray-900 mb-2">
                    Statistical Data Available
                  </div>
                )}
                {safeDataPoint.statisticalData.context && (
                  <div className="text-sm text-gray-600">
                    {safeDataPoint.statisticalData.context}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Location</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-700">
                <div className="font-medium">Coordinates</div>
                <div className="text-base">
                  {safeDataPoint.coordinates.latitude.toFixed(4)}°, {safeDataPoint.coordinates.longitude.toFixed(4)}°
                </div>
                {safeDataPoint.region && (
                  <>
                    <div className="font-medium mt-2">Region</div>
                    <div className="text-base">{safeDataPoint.region}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Brands */}
          {safeDataPoint.brands && safeDataPoint.brands.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Related Brands</h2>
              <div className="flex flex-wrap gap-2">
                {safeDataPoint.brands.map((brand, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {safeDataPoint.topics && safeDataPoint.topics.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Topics</h2>
              <div className="flex flex-wrap gap-2">
                {safeDataPoint.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-2 rounded-lg text-sm bg-blue-100 text-blue-700"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {safeDataPoint.sources && safeDataPoint.sources.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Sources</h2>
              <div className="space-y-3">
                {safeDataPoint.sources.map((source, index) => (
                  <div key={index} className="text-sm">
                    {source.startsWith('http') ? (
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {source}
                      </a>
                    ) : (
                      <span className="text-gray-700">{source}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Threats Navigation */}
          {allThreats.length > 1 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Related Threats</h2>
              <div className="space-y-2">
                {allThreats.map((threat, index) => {
                  const isActive = index === currentThreatIndex
                  const relatedThreatTypeInfo = getThreatTypeInfo(threat.threatType)
                  
                  return (
                    <button
                      key={threat.id}
                      onClick={() => navigateToThreat(threat)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">{relatedThreatTypeInfo.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {threat.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            Severity: {threat.severity}/10
                          </div>
                        </div>
                        {isActive && (
                          <div className="text-blue-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Details</h2>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium text-gray-900">Created</div>
                <div className="text-gray-700">{formatDate(safeDataPoint.createdAt)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium text-gray-900">Updated</div>
                <div className="text-gray-700">{formatDate(safeDataPoint.updatedAt)}</div>
              </div>
              {safeDataPoint.expirationDate && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="font-medium text-gray-900">Expires</div>
                  <div className="text-gray-700">{formatDate(safeDataPoint.expirationDate)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Footer with Navigation Hints */}
        {useFullScreen && allThreats.length > 1 && (
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                <span>Swipe to navigate</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span>Swipe down to close</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}