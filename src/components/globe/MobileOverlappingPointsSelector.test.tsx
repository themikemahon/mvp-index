import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileOverlappingPointsSelector } from './MobileOverlappingPointsSelector'
import { ThreatDataPoint } from '@/types/threat'

// Mock the useResponsive hook
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: true,
    isTablet: false,
    config: {
      viewport: 'mobile',
      orientation: 'portrait',
      deviceCapabilities: { tier: 'medium' },
      performanceSettings: {},
      layoutSettings: { useFullScreenModals: true }
    }
  })
}))

const mockThreats: ThreatDataPoint[] = [
  {
    id: '1',
    title: 'High Severity Threat',
    subhead: 'Critical vulnerability',
    description: 'Test description',
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    threatType: 'vulnerability',
    severity: 9,
    region: 'North America',
    brands: ['TestBrand'],
    topics: ['security'],
    isQuantitative: false,
    sources: ['https://example.com'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true
  },
  {
    id: '2',
    title: 'Medium Severity Threat',
    subhead: 'Scam alert',
    description: 'Test description 2',
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    threatType: 'scam',
    severity: 5,
    region: 'North America',
    brands: ['TestBrand2'],
    topics: ['fraud'],
    isQuantitative: true,
    sources: ['https://example2.com'],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    isActive: true
  }
]

describe('MobileOverlappingPointsSelector', () => {
  const mockOnSelect = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders mobile selector with full-screen modal', () => {
    render(
      <MobileOverlappingPointsSelector
        dataPoints={mockThreats}
        isVisible={true}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Multiple Threats')).toBeInTheDocument()
    expect(screen.getByText('2 threats found at this location')).toBeInTheDocument()
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('displays threats sorted by severity (highest first)', () => {
    render(
      <MobileOverlappingPointsSelector
        dataPoints={mockThreats}
        isVisible={true}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    )

    const threatElements = screen.getAllByRole('button').filter(btn => 
      btn.textContent?.includes('Threat')
    )
    
    // First threat should be the high severity one (9)
    expect(threatElements[0]).toHaveTextContent('High Severity Threat')
    expect(threatElements[0]).toHaveTextContent('9')
    
    // Second threat should be the medium severity one (5)
    expect(threatElements[1]).toHaveTextContent('Medium Severity Threat')
    expect(threatElements[1]).toHaveTextContent('5')
  })

  it('calls onSelect when threat is clicked', () => {
    render(
      <MobileOverlappingPointsSelector
        dataPoints={mockThreats}
        isVisible={true}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    )

    fireEvent.click(screen.getByText('High Severity Threat'))
    expect(mockOnSelect).toHaveBeenCalledWith(mockThreats[0])
  })

  it('calls onClose when back button is clicked', () => {
    render(
      <MobileOverlappingPointsSelector
        dataPoints={mockThreats}
        isVisible={true}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    )

    fireEvent.click(screen.getByText('Back'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows enhanced metadata for mobile', () => {
    render(
      <MobileOverlappingPointsSelector
        dataPoints={mockThreats}
        isVisible={true}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('vulnerability')).toBeInTheDocument()
    expect(screen.getAllByText('📍 North America')).toHaveLength(2) // Both threats have same region
    expect(screen.getByText('🏢 TestBrand')).toBeInTheDocument()
    expect(screen.getAllByText('🏷️ 1 topic')).toHaveLength(2) // Both threats have 1 topic
    expect(screen.getByText('📊 Has data')).toBeInTheDocument()
  })

  it('shows swipe hint for mobile', () => {
    render(
      <MobileOverlappingPointsSelector
        dataPoints={mockThreats}
        isVisible={true}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Swipe down to close')).toBeInTheDocument()
  })

  it('automatically selects single threat', () => {
    render(
      <MobileOverlappingPointsSelector
        dataPoints={[mockThreats[0]]}
        isVisible={true}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    )

    expect(mockOnSelect).toHaveBeenCalledWith(mockThreats[0])
  })
})