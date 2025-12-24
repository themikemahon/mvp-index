import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Mobile-first responsive breakpoints
    screens: {
      'sm': '640px',   // Small devices (landscape phones)
      'md': '768px',   // Tablets
      'lg': '1024px',  // Laptops/desktops
      'xl': '1280px',  // Large desktops
      '2xl': '1536px', // Extra large desktops
      // Custom breakpoints for our responsive system
      'mobile': { 'max': '767px' },
      'tablet': { 'min': '768px', 'max': '1023px' },
      'desktop': { 'min': '1024px' },
      // Orientation-based breakpoints
      'portrait': { 'raw': '(orientation: portrait)' },
      'landscape': { 'raw': '(orientation: landscape)' },
      // Touch device detection
      'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
      'no-touch': { 'raw': '(hover: hover) and (pointer: fine)' },
    },
    extend: {
      colors: {
        // Threat colors (red/orange/yellow)
        threat: {
          high: '#ef4444',    // red-500
          medium: '#f97316',  // orange-500
          low: '#eab308',     // yellow-500
        },
        // Protection colors (blue/purple)
        protection: {
          strong: '#3b82f6',  // blue-500
          moderate: '#8b5cf6', // violet-500
        },
        // Digital filament colors
        filament: {
          primary: '#06b6d4',   // cyan-500
          secondary: '#8b5cf6', // violet-500
          glow: '#0ea5e9',      // sky-500
        }
      },
      spacing: {
        // Touch-friendly spacing
        'touch': '44px',      // Minimum touch target size
        'touch-sm': '40px',   // Smaller touch targets for tablets
        'touch-xs': '36px',   // Compact touch targets
        // Safe area spacing for mobile devices
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'touch': '44px',
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      minWidth: {
        'touch': '44px',
      },
      animation: {
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow': 'flow 3s linear infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        flow: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionDuration: {
        '300': '300ms', // Layout transition duration
      },
      zIndex: {
        'modal': '1000',
        'overlay': '999',
        'dropdown': '100',
        'header': '50',
      }
    },
  },
  plugins: [],
}
export default config