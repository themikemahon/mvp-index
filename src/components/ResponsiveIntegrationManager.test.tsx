import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ResponsiveIntegrationManager, useResponsiveIntegration } from './ResponsiveIntegrationManager';

// Mock the responsive layout manager
vi.mock('@/utils/ResponsiveLayoutManager', () => ({
  getResponsiveLayoutManager: vi.fn(() => ({
    forceUpdate: vi.fn(),
    optimizeForDevice: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    getConfig: vi.fn(() => ({
      viewport: 'mobile',
      orientation: 'portrait',
      deviceCapabilities: { tier: 'medium' },
      layoutSettings: { enableGestures: true, touchTargetSize: 44 }
    })),
    getState: vi.fn(() => ({
      currentViewport: 'mobile',
      currentOrientation: 'portrait',
      dimensions: { width: 375, height: 667, pixelRatio: 2 }
    }))
  }))
}));

// Mock the responsive hooks
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: vi.fn(() => ({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    config: {
      viewport: 'mobile',
      orientation: 'portrait',
      deviceCapabilities: { tier: 'medium' },
      layoutSettings: { enableGestures: true, touchTargetSize: 44 }
    }
  })),
  useLayoutSettings: vi.fn(() => ({
    enableGestures: true,
    touchTargetSize: 44,
    useFullScreenModals: true,
    navigationStyle: 'hamburger'
  })),
  useDeviceCapabilities: vi.fn(() => ({
    tier: 'medium',
    hasVoiceSupport: true,
    networkSpeed: 'fast'
  }))
}));

// Test component that uses the integration hook
function TestComponent() {
  const integration = useResponsiveIntegration();
  
  return (
    <div data-testid="test-component">
      <div data-testid="is-mobile">{integration.isMobile.toString()}</div>
      <div data-testid="should-use-mobile-renderer">{integration.shouldUseMobileRenderer.toString()}</div>
      <div data-testid="touch-target-size">{integration.touchTargetSize}</div>
      <div data-testid="navigation-style">{integration.navigationStyle}</div>
    </div>
  );
}

describe('ResponsiveIntegrationManager', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.className = '';
    document.documentElement.style.cssText = '';
  });

  afterEach(() => {
    // Clean up
    document.body.className = '';
    document.documentElement.style.cssText = '';
  });

  it('should render children correctly', () => {
    render(
      <ResponsiveIntegrationManager>
        <div data-testid="child">Test Child</div>
      </ResponsiveIntegrationManager>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should apply responsive CSS classes to container', async () => {
    const { container } = render(
      <ResponsiveIntegrationManager>
        <div>Test</div>
      </ResponsiveIntegrationManager>
    );

    const manager = container.querySelector('.responsive-integration-manager');
    expect(manager).toBeInTheDocument();
    
    // In test environment, it should have responsive classes immediately
    // since the mocked hooks return client-side values
    expect(manager).toHaveClass('mobile');
    expect(manager).toHaveClass('portrait');
    expect(manager).toHaveClass('medium-tier');
  });

  it('should set CSS custom properties', async () => {
    render(
      <ResponsiveIntegrationManager>
        <div>Test</div>
      </ResponsiveIntegrationManager>
    );

    // Wait for effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Check that CSS custom properties are set
    const style = document.documentElement.style;
    expect(style.getPropertyValue('--touch-target-size')).toBe('44px');
    expect(style.getPropertyValue('--viewport-width')).toBe('mobile');
    expect(style.getPropertyValue('--device-tier')).toBe('medium');
  });

  it('should apply responsive classes to body', async () => {
    render(
      <ResponsiveIntegrationManager>
        <div>Test</div>
      </ResponsiveIntegrationManager>
    );

    // Wait for effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(document.body).toHaveClass('viewport-mobile');
    expect(document.body).toHaveClass('orientation-portrait');
    expect(document.body).toHaveClass('device-medium');
    expect(document.body).toHaveClass('touch-enabled');
  });

  it('should call layout change callback', async () => {
    const onLayoutChange = vi.fn();
    
    render(
      <ResponsiveIntegrationManager onLayoutChange={onLayoutChange}>
        <div>Test</div>
      </ResponsiveIntegrationManager>
    );

    // Wait for effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(onLayoutChange).toHaveBeenCalledWith(true, false);
  });

  it('should call performance change callback', async () => {
    const onPerformanceChange = vi.fn();
    
    render(
      <ResponsiveIntegrationManager onPerformanceChange={onPerformanceChange}>
        <div>Test</div>
      </ResponsiveIntegrationManager>
    );

    // Wait for effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(onPerformanceChange).toHaveBeenCalledWith('medium');
  });
});

describe('useResponsiveIntegration', () => {
  it('should provide correct integration state for mobile', () => {
    render(
      <ResponsiveIntegrationManager>
        <TestComponent />
      </ResponsiveIntegrationManager>
    );

    expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
    expect(screen.getByTestId('should-use-mobile-renderer')).toHaveTextContent('true');
    expect(screen.getByTestId('touch-target-size')).toHaveTextContent('44');
    expect(screen.getByTestId('navigation-style')).toHaveTextContent('hamburger');
  });

  it('should determine mobile renderer usage correctly', () => {
    // Test with medium tier device on mobile
    render(
      <ResponsiveIntegrationManager>
        <TestComponent />
      </ResponsiveIntegrationManager>
    );

    // Should use mobile renderer for mobile viewport
    expect(screen.getByTestId('should-use-mobile-renderer')).toHaveTextContent('true');
  });
});