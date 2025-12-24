import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilterPanel from './FilterPanel';
import { ThreatFilters } from '@/types/threat';

// Mock the responsive hook
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: vi.fn(() => ({
    isMobile: false,
    isTablet: false,
    config: {
      layoutSettings: {
        touchTargetSize: 44
      }
    }
  }))
}));

describe('FilterPanel', () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter panel with basic sections', () => {
    render(
      <FilterPanel 
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Threat Types')).toBeInTheDocument();
    expect(screen.getByText('Severity Range')).toBeInTheDocument();
  });

  it('shows active filter count when filters are applied', async () => {
    const initialFilters: ThreatFilters = {
      threatTypes: ['vulnerability', 'scam']
    };

    render(
      <FilterPanel 
        onFiltersChange={mockOnFiltersChange}
        initialFilters={initialFilters}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('2 active')).toBeInTheDocument();
    });
  });

  it('calls onFiltersChange when threat type is selected', async () => {
    render(
      <FilterPanel 
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const vulnerabilityCheckbox = screen.getByLabelText(/Vulnerabilities/);
    fireEvent.click(vulnerabilityCheckbox);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });

  it('shows clear all button when filters are active', async () => {
    const initialFilters: ThreatFilters = {
      threatTypes: ['vulnerability']
    };

    render(
      <FilterPanel 
        onFiltersChange={mockOnFiltersChange}
        initialFilters={initialFilters}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });
  });

  it('expands and collapses sections when clicked', async () => {
    render(
      <FilterPanel 
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const regionsButton = screen.getByText('Regions');
    fireEvent.click(regionsButton);

    await waitFor(() => {
      expect(screen.getByText('North America')).toBeInTheDocument();
    });
  });
});