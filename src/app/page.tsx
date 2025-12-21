'use client';

import { InteractiveGlobe } from '@/components'
import SearchBar from '@/components/ui/SearchBar'
import AnimatedControls from '@/components/ui/AnimatedControls'
import { ThreatDataPoint, ThreatType, ThreatFilters } from '@/types/threat'
import { useState } from 'react'

// Sample threat data for demonstration - 30 data points across major global cities
const sampleThreatData: ThreatDataPoint[] = [
  // Original 10 data points
  {
    id: '1',
    title: 'Banking Malware Campaign',
    subhead: 'Sophisticated trojan targeting financial institutions',
    description: 'A new strain of banking malware has been detected targeting major financial institutions in the New York metropolitan area. The malware uses advanced evasion techniques and has already compromised several high-profile targets.',
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    threatType: 'vulnerability' as ThreatType,
    severity: 8,
    region: 'North America',
    brands: ['Chase', 'Bank of America', 'Wells Fargo'],
    topics: ['Banking', 'Malware', 'Financial Security'],
    isQuantitative: true,
    statisticalData: { value: 15000, unit: 'affected accounts', context: 'Estimated number of compromised accounts' },
    sources: ['FBI Cyber Division', 'CISA Alert'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    isActive: true
  },
  {
    id: '2',
    title: 'Cryptocurrency Scam Network',
    subhead: 'Fake investment platform targeting UK residents',
    description: 'A sophisticated cryptocurrency investment scam has been operating from London, targeting UK residents with promises of high returns. The scam has already defrauded victims of millions of pounds.',
    coordinates: { latitude: 51.5074, longitude: -0.1278 },
    threatType: 'scam' as ThreatType,
    severity: 6,
    region: 'Europe',
    brands: ['Bitcoin', 'Ethereum'],
    topics: ['Cryptocurrency', 'Investment Fraud', 'Social Engineering'],
    isQuantitative: true,
    statisticalData: { value: 2500000, unit: 'GBP stolen', context: 'Total amount defrauded from victims' },
    sources: ['Action Fraud', 'Metropolitan Police'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    isActive: true
  },
  {
    id: '3',
    title: 'Critical Infrastructure Attack',
    subhead: 'State-sponsored APT targeting power grid',
    description: 'Advanced persistent threat actors have been detected attempting to infiltrate Tokyo\'s power grid infrastructure. The attack shows hallmarks of state-sponsored activity with sophisticated techniques.',
    coordinates: { latitude: 35.6762, longitude: 139.6503 },
    threatType: 'vulnerability' as ThreatType,
    severity: 9,
    region: 'Asia Pacific',
    brands: ['TEPCO', 'Tokyo Electric'],
    topics: ['Critical Infrastructure', 'APT', 'Power Grid'],
    isQuantitative: false,
    sources: ['JPCERT/CC', 'NISC Japan'],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-22'),
    isActive: true
  },
  {
    id: '4',
    title: 'Mobile Banking Fraud',
    subhead: 'SMS phishing targeting Australian banks',
    description: 'A large-scale SMS phishing campaign is targeting customers of major Australian banks, attempting to steal mobile banking credentials through fake security alerts.',
    coordinates: { latitude: -33.8688, longitude: 151.2093 },
    threatType: 'financial_risk' as ThreatType,
    severity: 5,
    region: 'Australia',
    brands: ['Commonwealth Bank', 'ANZ', 'Westpac'],
    topics: ['Mobile Banking', 'SMS Phishing', 'Credential Theft'],
    isQuantitative: true,
    statisticalData: { value: 8500, unit: 'phishing messages', context: 'Number of malicious SMS messages sent daily' },
    sources: ['ACSC', 'Australian Banking Association'],
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-19'),
    isActive: true
  },
  {
    id: '5',
    title: 'Tech Company Data Breach',
    subhead: 'Ransomware attack on Silicon Valley startup',
    description: 'A prominent Silicon Valley technology startup has fallen victim to a ransomware attack, with attackers demanding payment in cryptocurrency for the return of encrypted data.',
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
    threatType: 'vulnerability' as ThreatType,
    severity: 7,
    region: 'North America',
    brands: ['Various Tech Startups'],
    topics: ['Ransomware', 'Data Breach', 'Technology Sector'],
    isQuantitative: true,
    statisticalData: { value: 500000, unit: 'user records', context: 'Number of user records potentially compromised' },
    sources: ['FBI', 'California Attorney General'],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-21'),
    isActive: true
  }
]

// Generate additional sample data points for demonstration
const additionalSampleData: ThreatDataPoint[] = Array.from({ length: 40 }, (_, index) => {
  const cities = [
    { name: 'Paris', lat: 48.8566, lng: 2.3522, region: 'Europe' },
    { name: 'Moscow', lat: 55.7558, lng: 37.6173, region: 'Europe' },
    { name: 'São Paulo', lat: -23.5505, lng: -46.6333, region: 'South America' },
    { name: 'New Delhi', lat: 28.6139, lng: 77.2090, region: 'Asia' },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198, region: 'Asia Pacific' },
    { name: 'Beijing', lat: 39.9042, lng: 116.4074, region: 'Asia' },
    { name: 'Berlin', lat: 52.5200, lng: 13.4050, region: 'Europe' },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708, region: 'Middle East' },
    { name: 'Rome', lat: 41.9028, lng: 12.4964, region: 'Europe' },
    { name: 'Mexico City', lat: 19.4326, lng: -99.1332, region: 'North America' },
    { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, region: 'South America' },
    { name: 'Lagos', lat: 6.5244, lng: 3.3792, region: 'Africa' },
    { name: 'Cairo', lat: 30.0444, lng: 31.2357, region: 'Africa' },
    { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, region: 'Africa' },
    { name: 'Oslo', lat: 59.9139, lng: 10.7522, region: 'Europe' },
    { name: 'Ottawa', lat: 45.4215, lng: -75.6972, region: 'North America' },
    { name: 'Melbourne', lat: -37.8136, lng: 144.9631, region: 'Australia' },
    { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, region: 'Asia Pacific' },
    { name: 'Bangkok', lat: 13.7563, lng: 100.5018, region: 'Asia' },
    { name: 'Jakarta', lat: -6.2088, lng: 106.8456, region: 'Asia Pacific' },
    { name: 'Manila', lat: 14.5995, lng: 120.9842, region: 'Asia Pacific' },
    { name: 'Seoul', lat: 37.5665, lng: 126.9780, region: 'Asia' },
    { name: 'Shanghai', lat: 31.2304, lng: 121.4737, region: 'Asia' },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946, region: 'Asia' },
    { name: 'Riyadh', lat: 24.7136, lng: 46.6753, region: 'Middle East' },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, region: 'Asia' },
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784, region: 'Europe' },
    { name: 'Tel Aviv', lat: 32.0853, lng: 34.7818, region: 'Middle East' },
    { name: 'Casablanca', lat: 33.5731, lng: -7.5898, region: 'Africa' },
    { name: 'Lima', lat: -12.0464, lng: -77.0428, region: 'South America' },
    { name: 'Bogotá', lat: 4.7110, lng: -74.0721, region: 'South America' },
    { name: 'Caracas', lat: 10.4806, lng: -66.9036, region: 'South America' },
    { name: 'Nairobi', lat: -1.2921, lng: 36.8219, region: 'Africa' },
    { name: 'Addis Ababa', lat: 9.1450, lng: 40.4897, region: 'Africa' },
    { name: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, region: 'Asia Pacific' },
    { name: 'Ho Chi Minh City', lat: 10.8231, lng: 106.6297, region: 'Asia' },
    { name: 'Dhaka', lat: 23.8103, lng: 90.4125, region: 'Asia' },
    { name: 'Karachi', lat: 24.8607, lng: 67.0011, region: 'Asia' },
    { name: 'Tehran', lat: 35.6892, lng: 51.3890, region: 'Middle East' },
    { name: 'Almaty', lat: 43.2220, lng: 76.8512, region: 'Asia' }
  ]

  const threatTypes: ThreatType[] = ['vulnerability', 'scam', 'financial_risk', 'protection']
  const city = cities[index % cities.length]
  const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)]
  const severity = Math.floor(Math.random() * 10) + 1

  return {
    id: `sample-${index + 6}`,
    title: `${threatType === 'protection' ? 'Security Enhancement' : 'Cyber Threat'} in ${city.name}`,
    subhead: `${threatType.replace('_', ' ')} detected in ${city.region}`,
    description: `A ${threatType.replace('_', ' ')} has been identified in the ${city.name} area. Security teams are monitoring the situation and implementing appropriate countermeasures.`,
    coordinates: { latitude: city.lat, longitude: city.lng },
    threatType,
    severity,
    region: city.region,
    brands: ['Generic Corp', 'Tech Solutions'],
    topics: ['Cybersecurity', 'Threat Intelligence'],
    isQuantitative: Math.random() > 0.5,
    statisticalData: Math.random() > 0.5 ? {
      value: Math.floor(Math.random() * 10000) + 100,
      unit: 'affected systems',
      context: 'Estimated impact'
    } : undefined,
    sources: ['Security Vendor', 'Government Agency'],
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
    updatedAt: new Date(),
    isActive: true
  }
})

const sampleDataPoints = [...sampleThreatData, ...additionalSampleData]

export default function Home() {
  const [searchResults, setSearchResults] = useState<ThreatDataPoint[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [searchBarOpacity, setSearchBarOpacity] = useState(1)
  const [filteredDataPoints, setFilteredDataPoints] = useState<ThreatDataPoint[]>(sampleDataPoints)

  const handleSearch = (query: string, results: ThreatDataPoint[]) => {
    setSearchResults(results)
    setHasSearched(true)
  }

  const handleResultsChange = (results: ThreatDataPoint[]) => {
    setSearchResults(results)
  }

  const handleFiltersChange = (filters: ThreatFilters) => {
    // Apply filters to the sample data points
    let filtered = sampleDataPoints

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

  // Handle zoom-based fade effects - complete fade out when zoomed in
  const handleZoomChange = (distance: number) => {
    // Complete fade out when zoomed in (distance < 8), fade in when zoomed out (distance > 8)
    const fadeThreshold = 8
    const fadeRange = 1.5 // Shorter range for more dramatic transition
    
    let opacity = 1
    if (distance <= fadeThreshold - fadeRange) {
      // Completely zoomed in - fully invisible
      opacity = 0
    } else if (distance < fadeThreshold) {
      // In transition zone - fade from 1 to 0
      opacity = (distance - (fadeThreshold - fadeRange)) / fadeRange
    }
    // When distance >= fadeThreshold, opacity stays at 1 (fully visible)
    
    setSearchBarOpacity(opacity)
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
        {/* Left - Filters Button - Smaller container */}
        <div className="flex-shrink-0 w-24 flex justify-start">
          <AnimatedControls 
            onFiltersChange={handleFiltersChange}
            showOnlyFilters={true}
          />
        </div>
        
        {/* Center - Search Bar - Much wider */}
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
        
        {/* Right - Controls Button - Smaller container */}
        <div className="flex-shrink-0 w-24 flex justify-end">
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