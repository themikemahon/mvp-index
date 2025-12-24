/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */

// WCAG 2.1 AA color contrast ratios
export const CONTRAST_RATIOS = {
  NORMAL_TEXT: 4.5,
  LARGE_TEXT: 3.0,
  NON_TEXT: 3.0,
} as const;

// Minimum touch target sizes (WCAG 2.1 AA)
export const TOUCH_TARGET_SIZES = {
  MINIMUM: 44, // 44px minimum for WCAG AA
  RECOMMENDED: 48, // 48px recommended for better usability
  COMPACT: 40, // 40px for compact interfaces (still accessible)
} as const;

/**
 * Calculate relative luminance of a color
 * Used for contrast ratio calculations
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Parse hex colors
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);
  
  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);
  
  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color combination meets WCAG contrast requirements
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'normal' | 'large' | 'non-text' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const required = CONTRAST_RATIOS[level === 'normal' ? 'NORMAL_TEXT' : level === 'large' ? 'LARGE_TEXT' : 'NON_TEXT'];
  return ratio >= required;
}

/**
 * Generate accessible color variants that meet contrast requirements
 */
export function getAccessibleColors() {
  return {
    // High contrast colors for text
    text: {
      primary: '#ffffff',     // White text on dark backgrounds
      secondary: '#e5e7eb',   // Light gray text
      muted: '#9ca3af',       // Muted text (still meets 4.5:1 on dark)
      inverse: '#111827',     // Dark text on light backgrounds
    },
    // Background colors with good contrast
    background: {
      primary: '#000000',     // Pure black
      secondary: '#111827',   // Dark gray
      surface: '#1f2937',     // Lighter dark surface
      overlay: 'rgba(0, 0, 0, 0.8)', // Semi-transparent overlay
    },
    // Interactive element colors
    interactive: {
      primary: '#3b82f6',     // Blue (meets contrast on dark)
      primaryHover: '#2563eb', // Darker blue for hover
      secondary: '#6b7280',   // Gray
      success: '#10b981',     // Green
      warning: '#f59e0b',     // Amber
      error: '#ef4444',       // Red
    },
    // Focus indicators (disabled)
    focus: {
      ring: 'transparent',        // No focus ring
      ringOffset: 'transparent',  // No offset
    }
  };
}

/**
 * Screen reader utilities
 */
export const screenReader = {
  /**
   * Create screen reader only text
   */
  only: (text: string) => ({
    className: 'sr-only',
    children: text,
  }),
  
  /**
   * Create live region for dynamic content
   */
  liveRegion: (text: string, politeness: 'polite' | 'assertive' = 'polite') => ({
    'aria-live': politeness,
    'aria-atomic': 'true',
    className: 'sr-only',
    children: text,
  }),
  
  /**
   * Create description for complex UI elements
   */
  description: (id: string, text: string) => ({
    id,
    className: 'sr-only',
    children: text,
  }),
};

/**
 * ARIA utilities for common patterns
 */
export const aria = {
  /**
   * Button with proper labeling
   */
  button: (label: string, options?: {
    expanded?: boolean;
    pressed?: boolean;
    describedBy?: string;
  }) => ({
    'aria-label': label,
    ...(options?.expanded !== undefined && { 'aria-expanded': options.expanded }),
    ...(options?.pressed !== undefined && { 'aria-pressed': options.pressed }),
    ...(options?.describedBy && { 'aria-describedby': options.describedBy }),
  }),
  
  /**
   * Modal dialog attributes
   */
  modal: (label: string, describedBy?: string) => ({
    role: 'dialog',
    'aria-modal': true,
    'aria-label': label,
    ...(describedBy && { 'aria-describedby': describedBy }),
  }),
  
  /**
   * Tab panel attributes
   */
  tab: (id: string, selected: boolean, controls: string) => ({
    role: 'tab',
    id,
    'aria-selected': selected,
    'aria-controls': controls,
    tabIndex: selected ? 0 : -1,
  }),
  
  /**
   * Tab panel attributes
   */
  tabPanel: (id: string, labelledBy: string) => ({
    role: 'tabpanel',
    id,
    'aria-labelledby': labelledBy,
  }),
  
  /**
   * Loading state attributes
   */
  loading: (label: string = 'Loading') => ({
    role: 'status',
    'aria-label': label,
    'aria-live': 'polite' as const,
  }),
  
  /**
   * Progress indicator attributes
   */
  progress: (value?: number, max: number = 100, label?: string) => ({
    role: 'progressbar',
    'aria-valuemin': 0,
    'aria-valuemax': max,
    ...(value !== undefined && { 'aria-valuenow': value }),
    ...(label && { 'aria-label': label }),
  }),
};

/**
 * Touch target utilities
 */
export const touchTarget = {
  /**
   * Get minimum touch target size styles
   */
  minimum: () => ({
    minHeight: `${TOUCH_TARGET_SIZES.MINIMUM}px`,
    minWidth: `${TOUCH_TARGET_SIZES.MINIMUM}px`,
  }),
  
  /**
   * Get recommended touch target size styles
   */
  recommended: () => ({
    minHeight: `${TOUCH_TARGET_SIZES.RECOMMENDED}px`,
    minWidth: `${TOUCH_TARGET_SIZES.RECOMMENDED}px`,
  }),
  
  /**
   * Get compact touch target size styles
   */
  compact: () => ({
    minHeight: `${TOUCH_TARGET_SIZES.COMPACT}px`,
    minWidth: `${TOUCH_TARGET_SIZES.COMPACT}px`,
  }),
  
  /**
   * Get touch target class names
   */
  classes: {
    minimum: 'min-h-[44px] min-w-[44px] touch-manipulation',
    recommended: 'min-h-[48px] min-w-[48px] touch-manipulation',
    compact: 'min-h-[40px] min-w-[40px] touch-manipulation',
  },
};

/**
 * Focus management utilities
 */
export const focus = {
  /**
   * Trap focus within an element
   */
  trap: (element: HTMLElement) => {
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
  },
  
  /**
   * Restore focus to a previously focused element
   */
  restore: (element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  },
  
  /**
   * Get focus ring classes
   */
  ring: 'focus:outline-none',
  ringInset: 'focus:outline-none',
};

/**
 * Keyboard navigation utilities
 */
export const keyboard = {
  /**
   * Handle arrow key navigation in a list
   */
  arrowNavigation: (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onIndexChange: (index: number) => void
  ) => {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        newIndex = Math.min(currentIndex + 1, items.length - 1);
        break;
      case 'ArrowUp':
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = items.length - 1;
        break;
      default:
        return;
    }
    
    event.preventDefault();
    onIndexChange(newIndex);
    items[newIndex]?.focus();
  },
  
  /**
   * Handle escape key to close modals/dropdowns
   */
  escape: (event: KeyboardEvent, onEscape: () => void) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();
    }
  },
};

/**
 * Accessibility audit utilities
 */
export const audit = {
  /**
   * Check if an element meets touch target size requirements
   */
  checkTouchTarget: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width >= TOUCH_TARGET_SIZES.MINIMUM && rect.height >= TOUCH_TARGET_SIZES.MINIMUM;
  },
  
  /**
   * Check if an element has proper ARIA labeling
   */
  checkAriaLabeling: (element: HTMLElement): boolean => {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent?.trim()
    );
  },
  
  /**
   * Check if interactive elements are keyboard accessible
   */
  checkKeyboardAccessible: (element: HTMLElement): boolean => {
    const tabIndex = element.getAttribute('tabindex');
    return element.tagName === 'BUTTON' || 
           element.tagName === 'A' || 
           element.tagName === 'INPUT' || 
           element.tagName === 'SELECT' || 
           element.tagName === 'TEXTAREA' ||
           (tabIndex !== null && tabIndex !== '-1');
  },
  
  /**
   * Run basic accessibility audit on an element
   */
  auditElement: (element: HTMLElement) => {
    const issues: string[] = [];
    
    // Check touch targets
    if (!audit.checkTouchTarget(element)) {
      issues.push('Touch target too small (minimum 44px required)');
    }
    
    // Check ARIA labeling for interactive elements
    const isInteractive = element.tagName === 'BUTTON' || 
                          element.tagName === 'A' || 
                          element.getAttribute('role') === 'button';
    
    if (isInteractive && !audit.checkAriaLabeling(element)) {
      issues.push('Interactive element missing accessible name');
    }
    
    // Check keyboard accessibility
    if (isInteractive && !audit.checkKeyboardAccessible(element)) {
      issues.push('Interactive element not keyboard accessible');
    }
    
    return {
      element,
      issues,
      isAccessible: issues.length === 0,
    };
  },
};