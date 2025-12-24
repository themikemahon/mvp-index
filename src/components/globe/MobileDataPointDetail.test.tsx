import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileDataPointDetail } from './MobileDataPointDetail'
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

const mockThreat: ThreatDataPoint = {
  id: '1',
  title: 'Test Threat',
  subhead: 'Test subhead',
  description: 'Test description',
  coordinates: { latitude: 40.7128, longitude: -74.0060 },
  threatType: 'vulnerability',
  severity: 8,
  region: 'North America',
  brands: ['TestBrand'],
  topics: ['security'],
  isQuantitative: false,
  sources: ['https://example.com'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isActive: true
}

const relatedThreats: ThreatDataPoint[] = [
  {
    ...mockThreat,
    id: '2',
    title: 'Related Threat',
    severity: 6
  }
]

describe('MobileDataPointDetail', () => {
  const mockOnClose = vi.fn()
  const mockOnNavigateToThreat = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders mobile threat detail with full-screen modal', () => {
    render(
      <MobileDataPointDetail
        dataPoint={mockThreat}
        isVisible={true}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Test Threat')).toBeInTheDocument()
    expect(screen.getByText('Test subhead')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('shows related threats navigation when provided', () => {
    render(
      <MobileDataPointDetail
        dataPoint={mockThreat}
        relatedThreats={relatedThreats}
        isVisible={true}
        onClose={mockOnClose}
        onNavigateToThreat={mockOnNavigateToThreat}
      />
    )

    expect(screen.getByText('Related Threats')).toBeInTheDocument()
    expect(screen.getByText('Related Threat')).toBeInTheDocument()
    expect(screen.getByText('1 of 2')).toBeInTheDocument()
  })

  it('calls onClose when back button is clicked', () => {
    render(
      <MobileDataPointDetail
        dataPoint={mockThreat}
        isVisible={true}
        onClose={mockOnClose}
      />
    )

    fireEvent.click(screen.getByText('Back'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('navigates to related threat when clicked', () => {
    render(
      <MobileDataPointDetail
        dataPoint={mockThreat}
        relatedThreats={relatedThreats}
        isVisible={true}
        onClose={mockOnClose}
        onNavigateToThreat={mockOnNavigateToThreat}
      />
    )

    fireEvent.click(screen.getByText('Related Threat'))
    expect(mockOnNavigateToThreat).toHaveBeenCalledWith(relatedThreats[0])
  })

  it('displays single-column layout with proper sections', () => {
    render(
      <MobileDataPointDetail
        dataPoint={mockThreat}
        isVisible={true}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Related Brands')).toBeInTheDocument()
    expect(screen.getByText('Topics')).toBeInTheDocument()
    expect(screen.getByText('Sources')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
  })

  it('shows swipe hints for mobile navigation', () => {
    render(
      <MobileDataPointDetail
        dataPoint={mockThreat}
        relatedThreats={relatedThreats}
        isVisible={true}
        onClose={mockOnClose}
      />
    )

    expect(screen.getAllByText('Swipe to navigate')).toHaveLength(2)
    expect(screen.getByText('Swipe down to close')).toBeInTheDocument()
  })
})