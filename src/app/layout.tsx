import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AccessibilityProvider } from '@/contexts/AccessibilityContext'
import { ResponsiveIntegrationManager } from '@/components/ResponsiveIntegrationManager'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MVP Index',
  description: 'Interactive data visualization of global cyber threat intelligence',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full m-0 p-0 overflow-hidden`}>
        {/* Skip link for keyboard navigation */}
        <a 
          href="#main-content" 
          className="skip-link"
          tabIndex={1}
        >
          Skip to main content
        </a>
        
        <AccessibilityProvider>
          <ResponsiveIntegrationManager>
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
          </ResponsiveIntegrationManager>
        </AccessibilityProvider>
      </body>
    </html>
  )
}