import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
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
      animation: {
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow': 'flow 3s linear infinite',
      },
      keyframes: {
        flow: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}
export default config