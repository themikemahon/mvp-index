'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { VoiceControlManager, createDefaultVoiceCommands, VoiceCommand } from '@/utils/voiceControl';
import { useResponsive } from '@/hooks/useResponsive';

interface AccessibilitySettings {
  // Screen reader preferences
  announceChanges: boolean;
  verboseDescriptions: boolean;
  
  // Motor accessibility
  reducedMotion: boolean;
  largerTouchTargets: boolean;
  
  // Visual accessibility
  highContrast: boolean;
  increasedTextSize: boolean;
  
  // Voice control
  voiceControlEnabled: boolean;
  voiceCommandsActive: boolean;
  
  // Keyboard navigation
  keyboardNavigationEnabled: boolean;
  focusIndicatorsVisible: boolean;
}

interface AccessibilityContextType {
  // Settings
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  
  // Voice control
  voiceControl: VoiceControlManager | null;
  isVoiceSupported: boolean;
  isListening: boolean;
  startVoiceControl: () => void;
  stopVoiceControl: () => void;
  registerVoiceCommand: (command: VoiceCommand) => void;
  
  // Screen reader
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  
  // Focus management
  trapFocus: (element: HTMLElement) => () => void;
  restoreFocus: (element: HTMLElement | null) => void;
  
  // Accessibility audit
  auditPage: () => Promise<AccessibilityAuditResult[]>;
}

interface AccessibilityAuditResult {
  element: HTMLElement;
  issues: string[];
  severity: 'error' | 'warning' | 'info';
  wcagCriteria: string[];
}

const defaultSettings: AccessibilitySettings = {
  announceChanges: true,
  verboseDescriptions: false,
  reducedMotion: false,
  largerTouchTargets: true,
  highContrast: false,
  increasedTextSize: false,
  voiceControlEnabled: false,
  voiceCommandsActive: false,
  keyboardNavigationEnabled: true,
  focusIndicatorsVisible: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [voiceControl, setVoiceControl] = useState<VoiceControlManager | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [liveRegion, setLiveRegion] = useState<HTMLElement | null>(null);
  
  const { isMobile } = useResponsive();
  const isVoiceSupported = VoiceControlManager.isSupported();

  // Initialize live region for screen reader announcements
  useEffect(() => {
    const region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    region.id = 'accessibility-live-region';
    document.body.appendChild(region);
    setLiveRegion(region);

    return () => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    };
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('accessibility-settings');
    if (stored) {
      try {
        const parsedSettings = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error);
      }
    }

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    if (prefersReducedMotion || prefersHighContrast) {
      setSettings(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast,
      }));
    }
  }, []);

  // Initialize voice control
  useEffect(() => {
    if (settings.voiceControlEnabled && isVoiceSupported && !voiceControl) {
      const vc = new VoiceControlManager({
        onStart: () => setIsListening(true),
        onEnd: () => setIsListening(false),
        onError: (error) => {
          console.error('Voice control error:', error);
          announceToScreenReader(`Voice control error: ${error}`, 'assertive');
        },
        onResult: (transcript, confidence) => {
          if (confidence > 0.7) {
            announceToScreenReader(`Voice command recognized: ${transcript}`);
          }
        },
      });

      // Register default commands
      const defaultCommands = createDefaultVoiceCommands({
        onSearch: (query) => {
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.value = query;
            searchInput.focus();
            announceToScreenReader(`Search field focused with query: ${query}`);
          }
        },
        onZoomIn: () => {
          const event = new CustomEvent('voice-zoom-in');
          window.dispatchEvent(event);
          announceToScreenReader('Zooming in');
        },
        onZoomOut: () => {
          const event = new CustomEvent('voice-zoom-out');
          window.dispatchEvent(event);
          announceToScreenReader('Zooming out');
        },
        onResetView: () => {
          const event = new CustomEvent('voice-reset-view');
          window.dispatchEvent(event);
          announceToScreenReader('Globe view reset');
        },
        onOpenFilters: () => {
          const filterButton = document.querySelector('[aria-label*="filter"]') as HTMLButtonElement;
          if (filterButton) {
            filterButton.click();
            announceToScreenReader('Filters opened');
          }
        },
        onCloseModal: () => {
          const closeButton = document.querySelector('[aria-label*="Close"]') as HTMLButtonElement;
          if (closeButton) {
            closeButton.click();
            announceToScreenReader('Modal closed');
          }
        },
        onShowHelp: () => {
          announceToScreenReader('Available voice commands: zoom in, zoom out, reset view, search, open filters, close, help');
        },
        onToggleFullscreen: () => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
            announceToScreenReader('Exited fullscreen');
          } else {
            document.documentElement.requestFullscreen();
            announceToScreenReader('Entered fullscreen');
          }
        },
      });

      vc.registerCommands(defaultCommands);
      setVoiceControl(vc);
    }

    return () => {
      if (voiceControl) {
        voiceControl.destroy();
        setVoiceControl(null);
      }
    };
  }, [settings.voiceControlEnabled, isVoiceSupported]);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Increased text size
    if (settings.increasedTextSize) {
      root.style.fontSize = '120%';
    } else {
      root.style.fontSize = '';
    }
    
    // Focus indicators
    if (settings.focusIndicatorsVisible) {
      root.classList.add('show-focus-indicators');
    } else {
      root.classList.remove('show-focus-indicators');
    }
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegion || !settings.announceChanges) return;
    
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  }, [liveRegion, settings.announceChanges]);

  const startVoiceControl = useCallback(() => {
    if (voiceControl && !isListening) {
      voiceControl.startListening();
      announceToScreenReader('Voice control activated. Say "help" for available commands.');
    }
  }, [voiceControl, isListening, announceToScreenReader]);

  const stopVoiceControl = useCallback(() => {
    if (voiceControl && isListening) {
      voiceControl.stopListening();
      announceToScreenReader('Voice control deactivated.');
    }
  }, [voiceControl, isListening, announceToScreenReader]);

  const registerVoiceCommand = useCallback((command: VoiceCommand) => {
    if (voiceControl) {
      voiceControl.registerCommand(command);
    }
  }, [voiceControl]);

  const trapFocus = useCallback((element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  const restoreFocus = useCallback((element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, []);

  const auditPage = useCallback(async (): Promise<AccessibilityAuditResult[]> => {
    const results: AccessibilityAuditResult[] = [];
    
    // Find all interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]'
    );

    interactiveElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const issues: string[] = [];
      const wcagCriteria: string[] = [];

      // Check touch target size (WCAG 2.1 AA - 2.5.5)
      const rect = htmlElement.getBoundingClientRect();
      if (isMobile && (rect.width < 44 || rect.height < 44)) {
        issues.push('Touch target smaller than 44px minimum');
        wcagCriteria.push('2.5.5 Target Size');
      }

      // Check accessible name (WCAG 2.1 AA - 4.1.2)
      const hasAccessibleName = !!(
        htmlElement.getAttribute('aria-label') ||
        htmlElement.getAttribute('aria-labelledby') ||
        htmlElement.textContent?.trim()
      );
      
      if (!hasAccessibleName) {
        issues.push('Missing accessible name');
        wcagCriteria.push('4.1.2 Name, Role, Value');
      }

      // Check keyboard accessibility (WCAG 2.1 AA - 2.1.1)
      const isKeyboardAccessible = htmlElement.tabIndex >= 0 || 
        ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(htmlElement.tagName);
      
      if (!isKeyboardAccessible) {
        issues.push('Not keyboard accessible');
        wcagCriteria.push('2.1.1 Keyboard');
      }

      // Check focus indicator (WCAG 2.1 AA - 2.4.7)
      const computedStyle = window.getComputedStyle(htmlElement, ':focus');
      const hasFocusIndicator = computedStyle.outline !== 'none' || 
        computedStyle.boxShadow !== 'none';
      
      if (!hasFocusIndicator) {
        issues.push('Missing focus indicator');
        wcagCriteria.push('2.4.7 Focus Visible');
      }

      if (issues.length > 0) {
        results.push({
          element: htmlElement,
          issues,
          severity: issues.some(issue => issue.includes('accessible name')) ? 'error' : 'warning',
          wcagCriteria,
        });
      }
    });

    return results;
  }, [isMobile]);

  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    voiceControl,
    isVoiceSupported,
    isListening,
    startVoiceControl,
    stopVoiceControl,
    registerVoiceCommand,
    announceToScreenReader,
    trapFocus,
    restoreFocus,
    auditPage,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      {/* Screen reader only live region */}
      <div
        id="accessibility-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Hook for voice control in specific components
export function useVoiceControl(commands?: VoiceCommand[]) {
  const { voiceControl, registerVoiceCommand, isVoiceSupported, isListening } = useAccessibility();

  useEffect(() => {
    if (commands && voiceControl) {
      commands.forEach(command => registerVoiceCommand(command));
    }
  }, [commands, voiceControl, registerVoiceCommand]);

  return {
    isVoiceSupported,
    isListening,
    registerCommand: registerVoiceCommand,
  };
}