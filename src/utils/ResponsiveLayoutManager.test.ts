/**
 * Tests for ResponsiveLayoutManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponsiveLayoutManager } from './ResponsiveLayoutManager';

// Mock window object for testing
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  ontouchstart: undefined,
  screen: {
    width: 1920,
    height: 1080
  },
  navigator: {
    maxTouchPoints: 0
  }
};

describe('ResponsiveLayoutManager', () => {
  let manager: ResponsiveLayoutManager;

  beforeEach(() => {
    // @ts-ignore
    global.window = mockWindow;
    // @ts-ignore
    global.navigator = mockWindow.navigator;
    // @ts-ignore
    global.document = {
      body: {} as HTMLElement,
      createElement: vi.fn(() => ({
        getContext: vi.fn(() => null)
      })) as any
    };
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
    }
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      manager = new ResponsiveLayoutManager();
      const state = manager.getState();
      const config = manager.getConfig();

      expect(state.currentViewport).toBe('desktop');
      expect(state.currentOrientation).toBe('landscape');
      expect(state.dimensions.width).toBe(1024);
      expect(state.dimensions.height).toBe(768);
      expect(config.viewport).toBe('desktop');
      expect(config.orientation).toBe('landscape');
    });

    it('should set up event listeners', () => {
      manager = new ResponsiveLayoutManager();
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        { passive: true }
      );
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'orientationchange',
        expect.any(Function),
        { passive: true }
      );
    });
  });

  describe('viewport detection', () => {
    it('should detect mobile viewport', () => {
      manager = new ResponsiveLayoutManager();
      // @ts-ignore
      mockWindow.innerWidth = 375;
      // @ts-ignore
      mockWindow.innerHeight = 667;
      
      const viewport = manager.detectViewport();
      expect(viewport).toBe('mobile');
    });

    it('should detect tablet viewport', () => {
      manager = new ResponsiveLayoutManager();
      // @ts-ignore
      mockWindow.innerWidth = 768;
      // @ts-ignore
      mockWindow.innerHeight = 1024;
      
      const viewport = manager.detectViewport();
      expect(viewport).toBe('tablet');
    });

    it('should detect desktop viewport', () => {
      manager = new ResponsiveLayoutManager();
      // @ts-ignore
      mockWindow.innerWidth = 1920;
      // @ts-ignore
      mockWindow.innerHeight = 1080;
      
      const viewport = manager.detectViewport();
      expect(viewport).toBe('desktop');
    });
  });

  describe('layout updates', () => {
    it('should update layout when viewport changes', () => {
      manager = new ResponsiveLayoutManager();
      const callback = vi.fn();
      manager.subscribe(callback);

      manager.updateLayout('mobile');

      const config = manager.getConfig();
      expect(config.viewport).toBe('mobile');
      expect(config.layoutSettings.useFullScreenModals).toBe(true);
      expect(config.layoutSettings.navigationStyle).toBe('hamburger');
      expect(callback).toHaveBeenCalled();
    });

    it('should not update if no changes detected', () => {
      manager = new ResponsiveLayoutManager();
      const callback = vi.fn();
      manager.subscribe(callback);

      // Update with same viewport
      manager.updateLayout('desktop');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('subscription management', () => {
    it('should allow subscribing and unsubscribing', () => {
      manager = new ResponsiveLayoutManager();
      const callback = vi.fn();
      const unsubscribe = manager.subscribe(callback);

      manager.updateLayout('mobile');
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      manager.updateLayout('tablet');
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('layout settings', () => {
    it('should provide correct mobile layout settings', () => {
      manager = new ResponsiveLayoutManager();
      manager.updateLayout('mobile');
      const config = manager.getConfig();

      expect(config.layoutSettings).toEqual({
        showSidebar: false,
        useFullScreenModals: true,
        enableGestures: true,
        touchTargetSize: 44,
        navigationStyle: 'hamburger'
      });
    });

    it('should provide correct tablet layout settings', () => {
      manager = new ResponsiveLayoutManager();
      manager.updateLayout('tablet');
      const config = manager.getConfig();

      expect(config.layoutSettings).toEqual({
        showSidebar: true, // !isMobile = !false = true
        useFullScreenModals: false, // isMobile = false
        enableGestures: true,
        touchTargetSize: 40,
        navigationStyle: 'tabs'
      });
    });

    it('should provide correct desktop layout settings', () => {
      manager = new ResponsiveLayoutManager();
      manager.updateLayout('desktop');
      const config = manager.getConfig();

      expect(config.layoutSettings).toEqual({
        showSidebar: true,
        useFullScreenModals: false,
        enableGestures: false,
        touchTargetSize: 32,
        navigationStyle: 'sidebar'
      });
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on destroy', () => {
      manager = new ResponsiveLayoutManager();
      manager.destroy();

      expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
        'orientationchange',
        expect.any(Function)
      );
    });
  });
});