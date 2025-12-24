'use client';

import { InteractiveGlobe } from '@/components'
import SearchBar from '@/components/ui/SearchBar'
import AnimatedControls from '@/components/ui/AnimatedControls'
import { ThreatDataPoint, ThreatType, ThreatFilters } from '@/types/threat'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const [threatData, setThreatData] = useState<ThreatDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<ThreatDataPoint[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [searchBarOpacity, setSearchBarOpacity] = useState(1)
  const [filteredDataPoints, setFilteredDataPoints] = useState<ThreatDataPoint[]>([])

  // Load threat data from Neon database
  useEffect(() => {
    async function loadThreatData() {
      try {
        setLoading(true)
        
        // Load all threats globally
        const response = await fetch('/api/threats?bounds=-90,-180,90,180')
        
        if (!response.ok) {
          throw new Error(`Failed to load threats: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success && data.data) {
          setThreatData(data.data)
          setFilteredDataPoints(data.data)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        console.error('Failed to load threat data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadThreatData()
  }, [])

  const handleSearch = (query: string, results: ThreatDataPoint[]) => {
    setSearchResults(results)
    setHasSearched(true)
  }

  const handleResultsChange = (results: ThreatDataPoint[]) => {
    setSearchResults(results)
  }

  const handleFiltersChange = (filters: ThreatFilters) => {
    // Apply filters to the loaded threat data
    let filtered = threatData

    if (filters.threatTypes && filters.threatTypes.length > 0) {
      filtered = filtered.filter(point => filters.threatTypes!.includes(point.threatType))
    }

    if (filters.regions && filters.regions.length > 0) {
      filtered = filtered.filter(point => filters.regions!.includes(point.region))
    }

    if (filters.brands && filters.brands.length > 0) {
      filtered = filtered.filter(point => 
        point.brands.some(brand => filters.brands!.includes(brand))
      )
    }

    if (filters.topics && filters.topics.length > 0) {
      filtered = filtered.filter(point => 
        point.topics.some(topic => filters.topics!.includes(topic))
      )
    }

    if (filters.severityMin !== undefined) {
      filtered = filtered.filter(point => point.severity >= filters.severityMin!)
    }

    if (filters.severityMax !== undefined) {
      filtered = filtered.filter(point => point.severity <= filters.severityMax!)
    }

    setFilteredDataPoints(filtered)
  }

  // Handle zoom-based fade effects
  const handleZoomChange = (distance: number) => {
    const fadeThreshold = 6
    const fadeRange = 2
    
    let opacity = 1
    if (distance <= fadeThreshold - fadeRange) {
      opacity = 0
    } else if (distance < fadeThreshold) {
      opacity = (distance - (fadeThreshold - fadeRange)) / fadeRange
    }
    
    setSearchBarOpacity(opacity)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading threat data from Neon database...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">❌ Error loading data: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Full-screen Globe Background */}
      <div className="absolute inset-0 w-full h-full">
        <InteractiveGlobe 
          className="w-full h-full" 
          dataPoints={filteredDataPoints}
          onZoomChange={handleZoomChange}
        />
      </div>
      
      {/* Top Navigation Bar */}
      <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between">
        {/* Left - Filters Button */}
        <div className="flex-shrink-0 w-24 flex justify-start" style={{ marginTop: '8px' }}>
          <AnimatedControls 
            onFiltersChange={handleFiltersChange}
            showOnlyFilters={true}
          />
        </div>
        
        {/* Center - Search Bar */}
        <div className="absolute left-1/2 top-0 transform -translate-x-1/2 w-full max-w-4xl px-12">
          <SearchBar 
            onSearch={handleSearch}
            onResultsChange={handleResultsChange}
            className="w-full"
            opacity={searchBarOpacity}
          />
          
          {/* Search results count */}
          {hasSearched && (
            <div className="mt-2 text-center" style={{ opacity: searchBarOpacity }}>
              <span className="text-xs text-white/40 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                {searchResults.length > 0 
                  ? `Found ${searchResults.length} threat${searchResults.length === 1 ? '' : 's'}`
                  : 'No threats found for your query'
                }
              </span>
            </div>
          )}
        </div>
        
        {/* Right - Controls Button */}
        <div className="flex-shrink-0 w-24 flex justify-end" style={{ marginTop: '8px' }}>
          <AnimatedControls 
            onFiltersChange={handleFiltersChange}
            showOnlyControls={true}
          />
        </div>
      </div>
      
      {/* Bottom Left - Brand/Title */}
      <div className="absolute bottom-6 left-6 z-10 text-white">
        <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">
          MVP Index
        </h1>
        <p className="text-sm text-gray-300 max-w-xs leading-relaxed">
          The Most Vulnerable Planet: An Interactive Visualization of Digital Threat Intelligence
        </p>
      </div>
      
      {/* Bottom Center - Gen Digital Branding */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="text-xs text-gray-600 text-center">
          Powered by <span className="text-gray-400 font-medium">Gen Digital</span> Threat Labs
        </div>
      </div>
    </div>
  )
}