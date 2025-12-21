'use client'

import { useState, useEffect } from 'react'
import { ThreatDataPoint, ThreatType } from '@/types/threat'

export interface DataPointDetailProps {
  dataPoint: ThreatDataPoint | null
  isVisible: boolean
  onClose: () => void
  position?: { x: number; y: number }
}

// Format date for display
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Get threat type display name and styling
function getThreatTypeInfo(threatType: ThreatType): { 
  label: string
  bgColor: string
  textColor: string
} {
  switch (threatType) {
    case 'vulnerability':
      return {
        label: 'Vulnerability',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800'
      }
    case 'scam':
      return {
        label: 'Scam',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800'
      }
    case 'financial_risk':
      return {
        label: 'Financial Risk',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800'
      }
    case 'protection':
      return {
        label: 'Protection',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
      }
    default:
      return {
        label: 'Unknown',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800'
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

export function DataPointDetail({
  dataPoint,
  isVisible,
  onClose,
  position
}: DataPointDetailProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!dataPoint || !isAnimating) {
    return null
  }

  const threatTypeInfo = getThreatTypeInfo(dataPoint.threatType)
  const severityInfo = getSeverityInfo(dataPoint.severity)

  // Calculate position for the detail panel
  const panelStyle: React.CSSProperties = position ? {
    position: 'fixed',
    left: Math.min(position.x + 20, window.innerWidth - 400),
    top: Math.min(position.y - 50, window.innerHeight - 300),
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
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isVisible ? 'bg-opacity-30' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Detail Panel */}
      <div
        style={panelStyle}
        className={`bg-white rounded-lg shadow-2xl border border-gray-200 w-96 max-w-[90vw] max-h-[80vh] overflow-hidden transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {dataPoint.title}
              </h3>
              {dataPoint.subhead && (
                <p className="text-sm text-gray-600 mt-1">
                  {dataPoint.subhead}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${threatTypeInfo.bgColor} ${threatTypeInfo.textColor}`}>
              {threatTypeInfo.label}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityInfo.bgColor} ${severityInfo.color}`}>
              Severity: {dataPoint.severity}/10 ({severityInfo.label})
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-96">
          {/* Description */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {dataPoint.description}
            </p>
          </div>

          {/* Statistical Data */}
          {dataPoint.isQuantitative && dataPoint.statisticalData && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Statistical Information</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-900">
                  {dataPoint.statisticalData.value.toLocaleString()} {dataPoint.statisticalData.unit}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {dataPoint.statisticalData.context}
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Location</h4>
            <div className="text-sm text-gray-700">
              <div>
                Coordinates: {dataPoint.coordinates.latitude.toFixed(4)}°, {dataPoint.coordinates.longitude.toFixed(4)}°
              </div>
              {dataPoint.region && (
                <div className="mt-1">Region: {dataPoint.region}</div>
              )}
            </div>
          </div>

          {/* Brands */}
          {dataPoint.brands && dataPoint.brands.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Related Brands</h4>
              <div className="flex flex-wrap gap-1">
                {dataPoint.brands.map((brand, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {dataPoint.topics && dataPoint.topics.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Topics</h4>
              <div className="flex flex-wrap gap-1">
                {dataPoint.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {dataPoint.sources && dataPoint.sources.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Sources</h4>
              <div className="space-y-1">
                {dataPoint.sources.map((source, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    {source.startsWith('http') ? (
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {source}
                      </a>
                    ) : (
                      source
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <div className="font-medium">Created</div>
                <div>{formatDate(dataPoint.createdAt)}</div>
              </div>
              <div>
                <div className="font-medium">Updated</div>
                <div>{formatDate(dataPoint.updatedAt)}</div>
              </div>
              {dataPoint.expirationDate && (
                <div className="col-span-2">
                  <div className="font-medium">Expires</div>
                  <div>{formatDate(dataPoint.expirationDate)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}