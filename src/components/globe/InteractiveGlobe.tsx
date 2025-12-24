'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { GlobeRenderer } from './GlobeRenderer'
import { DataPointDetail } from './DataPointDetail'
import { OverlappingPointsSelector } from './OverlappingPointsSelector'
import { useFilters } from '@/hooks/useFilters'
import { ThreatDataPoint, ThreatFilters } from '@/types/threat'

export interface InteractiveGlobeProps {
  className?: string
  dataPoints?: ThreatDataPoint[]
  onZoomChange?: (distance: number) => void
  onReady?: () => void
}

export function InteractiveGlobe({ 
  className = '', 
  dataPoints = [],
  onZoomChange,
  onReady
}: InteractiveGlobeProps) {
  // State for data point interactions
  const [selectedDataPoint, setSelectedDataPoint] = useState<ThreatDataPoint | null>(null)
  const [hoveredDataPoint, setHoveredDataPoint] = useState<ThreatDataPoint | null>(null)
  const [overlappingPoints, setOverlappingPoints] = useState<ThreatDataPoint[]>([])
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [showOverlapSelector, setShowOverlapSelector] = useState(false)
  const [interactionPosition, setInteractionPosition] = useState<{ x: number; y: number } | undefined>()
  
  // Ref for globe renderer to access navigation methods
  const globeRef = useRef<any>(null)

  // Memoize the filter change callback to prevent unnecessary re-renders
  const handleFiltersChange = useCallback((newFilters: ThreatFilters, newFilteredData: ThreatDataPoint[]) => {
    // Filters changed - could add additional logic here if needed
  }, [])

  // Filter management
  const {
    filters,
    filteredData,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    filterSummary,
    availableOptions,
    totalCount,
    filteredCount
  } = useFilters(dataPoints, {
    persistKey: 'cyber-threat-globe-filters',
    onFiltersChange: handleFiltersChange
  })

  // Memoize the display data to prevent unnecessary recalculations
  const displayData = useMemo(() => {
    return filteredData
  }, [filteredData])

  // Handle data point click
  const handleDataPointClick = useCallback((dataPoint: ThreatDataPoint, event?: MouseEvent) => {
    // Store interaction position for positioning panels
    if (event) {
      setInteractionPosition({ x: event.clientX, y: event.clientY })
    }

    // Find all data points at similar coordinates (for overlapping detection)
    const threshold = 0.01 // Degree threshold for considering points as overlapping
    const overlapping = displayData.filter(point => 
      point.id !== dataPoint.id &&
      Math.abs(point.coordinates.latitude - dataPoint.coordinates.latitude) < threshold &&
      Math.abs(point.coordinates.longitude - dataPoint.coordinates.longitude) < threshold
    )

    if (overlapping.length > 0) {
      // Multiple points at this location - show selector
      setOverlappingPoints([dataPoint, ...overlapping])
      setShowOverlapSelector(true)
      setShowDetailPanel(false)
    } else {
      // Single point - show details directly
      setSelectedDataPoint(dataPoint)
      setShowDetailPanel(true)
      setShowOverlapSelector(false)
    }
  }, [displayData])

  // Handle data point hover
  const handleDataPointHover = useCallback((dataPoint: ThreatDataPoint | null) => {
    setHoveredDataPoint(dataPoint)
  }, [])

  // Handle overlapping point selection
  const handleOverlappingPointSelect = useCallback((dataPoint: ThreatDataPoint) => {
    setSelectedDataPoint(dataPoint)
    setShowOverlapSelector(false)
    setShowDetailPanel(true)
  }, [])

  // Handle closing panels
  const handleCloseDetailPanel = useCallback(() => {
    setShowDetailPanel(false)
    setSelectedDataPoint(null)
    setInteractionPosition(undefined)
  }, [])

  const handleCloseOverlapSelector = useCallback(() => {
    setShowOverlapSelector(false)
    setOverlappingPoints([])
    setInteractionPosition(undefined)
  }, [])

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="absolute top-20 left-4 z-30">
          <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span>Filtered:</span>
              <span className="text-blue-400">{filteredCount}</span>
              <span>of</span>
              <span>{totalCount}</span>
              <span>threats</span>
              <button
                onClick={resetFilters}
                className="ml-2 px-2 py-1 text-xs text-white/60 hover:text-white border border-white/20 rounded transition-colors"
              >
                Clear
              </button>
            </div>
            {filterSummary.length > 0 && (
              <div className="mt-1 text-xs text-white/60">
                {filterSummary.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Globe Renderer */}
      <GlobeRenderer
        ref={globeRef}
        dataPoints={displayData}
        onDataPointClick={handleDataPointClick}
        onDataPointHover={handleDataPointHover}
        onZoomChange={onZoomChange}
        onReady={onReady}
      />

      {/* Hover Tooltip */}
      {hoveredDataPoint && !showDetailPanel && !showOverlapSelector && (
        <div className="fixed pointer-events-none z-30 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm max-w-xs">
          <div className="font-semibold">{hoveredDataPoint.title}</div>
          {hoveredDataPoint.subhead && (
            <div className="text-xs opacity-90 mt-1">{hoveredDataPoint.subhead}</div>
          )}
          <div className="text-xs opacity-75 mt-1">
            Severity: {hoveredDataPoint.severity}/10 • {hoveredDataPoint.threatType.replace('_', ' ')}
          </div>
        </div>
      )}

      {/* Overlapping Points Selector */}
      <OverlappingPointsSelector
        dataPoints={overlappingPoints}
        isVisible={showOverlapSelector}
        onSelect={handleOverlappingPointSelect}
        onClose={handleCloseOverlapSelector}
        position={interactionPosition}
      />

      {/* Data Point Detail Panel */}
      <DataPointDetail
        dataPoint={selectedDataPoint}
        isVisible={showDetailPanel}
        onClose={handleCloseDetailPanel}
        position={interactionPosition}
      />

      {/* Loading State */}
      {dataPoints.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 z-20">
          <div className="bg-white rounded-lg px-6 py-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Loading threat data...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}