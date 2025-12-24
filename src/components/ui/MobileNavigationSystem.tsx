'use client';

import React, { useState, useCallback } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { HamburgerMenuSystem, MenuItem } from './HamburgerMenu';
import { TabInterface, TabItem } from './TabInterface';
import { MobileLoadingOverlay } from './MobileLoadingIndicators';
import { PullToRefresh } from './PullToRefresh';

export interface MobileNavigationProps {
  children: React.ReactNode;
  className?: string;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
  loadingMessage?: string;
}

export interface NavigationTab extends TabItem {
  showInHamburger?: boolean;
}

export interface NavigationMenuItem extends MenuItem {
  showInTabs?: boolean;
  showInHamburger?: boolean;
}

/**
 * Comprehensive mobile navigation system
 * Integrates hamburger menu, tabs, loading indicators, and pull-to-refresh
 * Requirements: 7.1, 7.2, 7.4, 7.5
 */
export function MobileNavigationSystem({
  children,
  className = '',
  onRefresh,
  isLoading = false,
  loadingMessage = 'Loading...'
}: MobileNavigationProps) {
  const { isMobile, isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState('main');

  // Default navigation items
  const defaultMenuItems: NavigationMenuItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      onClick: () => setActiveTab('main'),
      showInTabs: true
    },
    {
      id: 'search',
      label: 'Search',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      onClick: () => setActiveTab('search'),
      showInTabs: true
    },
    {
      id: 'filters',
      label: 'Filters',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
        </svg>
      ),
      onClick: () => setActiveTab('filters'),
      showInTabs: true
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      onClick: () => console.log('Settings clicked'),
      showInHamburger: true
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => console.log('Help clicked'),
      showInHamburger: true
    },
    {
      id: 'about',
      label: 'About',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => console.log('About clicked'),
      showInHamburger: true
    }
  ];

  // Convert menu items to tabs
  const navigationTabs: TabItem[] = defaultMenuItems
    .filter(item => item.showInTabs)
    .map(item => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      content: <div className="p-4">Content for {item.label}</div>
    }));

  // Filter items for hamburger menu
  const hamburgerMenuItems: MenuItem[] = defaultMenuItems
    .filter(item => item.showInHamburger)
    .map(({ showInTabs, showInHamburger, ...item }) => item);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      // Default refresh behavior - simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [onRefresh]);

  // Desktop view - return children without mobile navigation
  if (!isMobile && !isTablet) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative h-full flex flex-col ${className}`}>
      {/* Loading overlay */}
      <MobileLoadingOverlay
        isVisible={isLoading}
        message={loadingMessage}
        type="spinner"
      />

      {/* Main content with pull-to-refresh */}
      <div className="flex-1 overflow-hidden">
        <PullToRefresh
          onRefresh={handleRefresh}
          className="h-full"
        >
          {/* Tab interface for primary navigation */}
          <TabInterface
            tabs={[
              {
                id: 'main',
                label: 'Globe',
                icon: (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                content: children
              },
              ...navigationTabs.slice(1) // Skip the first tab since it's the main content
            ]}
            defaultActiveTab="main"
            onTabChange={setActiveTab}
            position="bottom"
            className="h-full"
          />
        </PullToRefresh>
      </div>

      {/* Hamburger menu for secondary navigation */}
      {hamburgerMenuItems.length > 0 && (
        <div className="absolute top-4 right-4 z-30">
          <HamburgerMenuSystem
            menuItems={hamburgerMenuItems}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing mobile navigation state
 */
export function useMobileNavigation() {
  const { isMobile, isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState('main');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const showMobileNavigation = isMobile || isTablet;

  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const switchTab = (tabId: string) => {
    setActiveTab(tabId);
    closeMenu(); // Close menu when switching tabs
  };

  const startLoading = (message?: string) => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return {
    // State
    activeTab,
    isMenuOpen,
    isLoading,
    showMobileNavigation,
    
    // Actions
    setActiveTab: switchTab,
    openMenu,
    closeMenu,
    toggleMenu,
    startLoading,
    stopLoading
  };
}

export default MobileNavigationSystem;