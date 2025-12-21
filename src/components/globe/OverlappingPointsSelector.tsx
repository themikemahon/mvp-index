'use client'

import { useState, useEffect } from 'react'
import { ThreatDataPoint, ThreatType } from '@/types/threat'

export interface OverlappingPointsSelectorProps {
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

// Get threat type color
function getThreatTypeColor(threatType: ThreatType): string {
  switch (threatType) {
    case 'vulnerability':
      return 'border-red-200 hover:border-red-300 hover:bg-red-50'
    case 'scam':
      return 'border-orange-200 hover:border-orange-300 hover:bg-orange-50'
    case 'financial_risk':
      return 'border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50'
    case 'protection':
      return 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
    default:
      return 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
  }
}

export function OverlappingPointsSelector({
  dataPoints,
  isVisible,
  onSelect,
  onClose,
  position
}: OverlappingPointsSelectorProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!isAnimating || dataPoints.length === 0) {
    return null
  }

  // If only one data point, select it immediately
  if (dataPoints.length === 1) {
    onSelect(dataPoints[0])
    return null
  }

  // Calculate position for the selector panel
  const panelStyle: React.CSSProperties = position ? {
    position: 'fixed',
    left: Math.min(position.x + 20, window.innerWidth - 320),
    top: Math.min(position.y - 50, window.innerHeight - 200),
    zIndex: 1000
  } : {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-200 z-40 ${
          isVisible ? 'bg-opacity-20' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Selector Panel */}
      <div
        style={panelStyle}
        className={`bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-w-[90vw] max-h-96 overflow-hidden transition-all duration-200 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Multiple Threats ({dataPoints.length})
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Select a threat to view details
          </p>
        </div>

        {/* Data Points List */}
        <div className="overflow-y-auto max-h-80">
          {dataPoints
            .sort((a, b) => b.severity - a.severity) // Sort by severity (highest first)
            .map((dataPoint, index) => (
              <button
                key={dataPoint.id}
                onClick={() => onSelect(dataPoint)}
                className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${getThreatTypeColor(dataPoint.threatType)}`}
              >
                <div className="flex items-start space-x-3">
                  {/* Threat Type Icon */}
                  <div className="flex-shrink-0 text-lg">
                    {getThreatTypeIcon(dataPoint.threatType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {dataPoint.title}
                      </h4>
                      <span className="ml-2 text-xs text-gray-500 flex-shrink-0">
                        {dataPoint.severity}/10
                      </span>
                    </div>
                    
                    {dataPoint.subhead && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {dataPoint.subhead}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                      <span className="capitalize">
                        {dataPoint.threatType.replace('_', ' ')}
                      </span>
                      {dataPoint.region && (
                        <>
                          <span>•</span>
                          <span>{dataPoint.region}</span>
                        </>
                      )}
                      {dataPoint.brands && dataPoint.brands.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{dataPoint.brands[0]}{dataPoint.brands.length > 1 ? ` +${dataPoint.brands.length - 1}` : ''}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))
          }
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Click on any threat above to view detailed information
          </p>
        </div>
      </div>
    </>
  )
}