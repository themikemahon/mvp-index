import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilterPanel from './FilterPanel';
import { ThreatFilters } from '@/types/threat';

// Mock the responsive hook for mobile
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: vi.fn(() => ({
    isMobile: true,
    isTablet: false,
    config: {
      layoutSettings: {
        touchTargetSize: 48
      }
    }
  }))
}));

describe('FilterPanel Mobile Behavior', () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders as full-screen modal on mobile when open', () => {
    render(
      <FilterPanel 
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Should have modal overlay
    const modal = document.querySelector('.fixed.inset-0');
    expect(modal).toBeInTheDocument();
    
    // Should have close button
    const closeButton = screen.getByLabelText('Close filters');
    expect(closeButton).toBeInTheDocument();
  });

  it('does not render when closed on mobile', () => {
    render(
      <FilterPanel 
        onFiltersChange={mockOnFiltersChange}
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    // Should not have modal overlay
    const modal = document.querySelector('.fixed.inset-0');
    expect(modal).not.toBeInTheDocument();
  });

  it('shows filter summary on mobile when filters are active', async () => {
    const initialFilters: ThreatFilters = {
      threatTypes: ['vulnerability', 'scam'],
      regions: ['North America']
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
      expect(screen.getByText('Active Filters')).toBeInTheDocument();
    });
  });

  it('has larger touch targets on mobile', () => {
    render(
      <FilterPanel 
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Check that checkboxes have appropriate size
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      const styles = window.getComputedStyle(checkbox);
      // Should have minimum touch-friendly size
      expect(parseInt(styles.minHeight) >= 20 || parseInt(styles.height) >= 20).toBe(true);
    });
  });

  it('calls onClose when close button is clicked', async () => {
    render(
      <FilterPanel 
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Find and click close button
    const closeButton = screen.getByLabelText('Close filters');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows collapsible sections with smooth animations', async () => {
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
      // Should show region options
      expect(screen.getByText('North America')).toBeInTheDocument();
    });

    // Check for transition classes
    const expandedSection = document.querySelector('.transition-all');
    expect(expandedSection).toBeInTheDocument();
  });
});