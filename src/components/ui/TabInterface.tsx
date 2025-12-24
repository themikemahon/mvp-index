'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useResponsive } from '@/hooks/useResponsive';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabInterfaceProps {
  tabs: TabItem[];
  defaultActiveTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  tabBarClassName?: string;
  contentClassName?: string;
  position?: 'top' | 'bottom';
}

/**
 * Tab-based interface component for mobile multi-panel navigation
 * Requirement 7.2: Tab-based interface for multiple panels
 */
export function TabInterface({
  tabs,
  defaultActiveTab,
  onTabChange,
  className = '',
  tabBarClassName = '',
  contentClassName = '',
  position = 'bottom'
}: TabInterfaceProps) {
  const { isMobile, isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState(defaultActiveTab || tabs[0]?.id || '');
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    if (tabs.find(tab => tab.id === tabId && !tab.disabled)) {
      setActiveTab(tabId);
      onTabChange?.(tabId);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tabBarRef.current?.contains(document.activeElement)) return;

      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
          break;
        case 'ArrowRight':
          e.preventDefault();
          newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = tabs.length - 1;
          break;
      }

      if (newIndex !== currentIndex) {
        const newTab = tabs[newIndex];
        if (newTab && !newTab.disabled) {
          handleTabChange(newTab.id);
          // Focus the new tab button
          const tabButton = tabBarRef.current?.querySelector(`[data-tab-id="${newTab.id}"]`) as HTMLButtonElement;
          tabButton?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, tabs]);

  // Only show tab interface on mobile and tablet
  if (!isMobile && !isTablet) {
    return (
      <div className={className}>
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    );
  }

  const activeTabContent = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab Bar - Top */}
      {position === 'top' && (
        <div
          ref={tabBarRef}
          className={`
            flex bg-black/20 backdrop-blur-sm border-b border-white/10
            ${tabBarClassName}
          `}
          role="tablist"
          aria-label="Navigation tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={`
                flex-1 flex flex-col items-center justify-center py-3 px-2
                min-h-[44px] touch-manipulation transition-all duration-200
                focus:outline-none 
                disabled:opacity-50 disabled:cursor-not-allowed
                ${activeTab === tab.id 
                  ? 'bg-white/10 text-white border-b-2 border-blue-400' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                }
              `}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
            >
              {tab.icon && (
                <span className="w-5 h-5 mb-1 flex-shrink-0">
                  {tab.icon}
                </span>
              )}
              <span className="text-xs font-medium truncate max-w-full">
                {tab.label}
              </span>
              {tab.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className={`flex-1 overflow-hidden ${contentClassName}`}>
        {activeTabContent && (
          <div
            id={`tabpanel-${activeTabContent.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTabContent.id}`}
            className="h-full overflow-auto"
          >
            {activeTabContent.content}
          </div>
        )}
      </div>

      {/* Tab Bar - Bottom */}
      {position === 'bottom' && (
        <div
          ref={tabBarRef}
          className={`
            flex bg-black/20 backdrop-blur-sm border-t border-white/10
            safe-area-inset-bottom
            ${tabBarClassName}
          `}
          role="tablist"
          aria-label="Navigation tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={`
                relative flex-1 flex flex-col items-center justify-center py-2 px-2
                min-h-[44px] touch-manipulation transition-all duration-200
                focus:outline-none 
                disabled:opacity-50 disabled:cursor-not-allowed
                ${activeTab === tab.id 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                }
              `}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
            >
              {/* Active indicator */}
              {activeTab === tab.id && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-full" />
              )}
              
              {tab.icon && (
                <span className="w-5 h-5 mb-1 flex-shrink-0">
                  {tab.icon}
                </span>
              )}
              <span className="text-xs font-medium truncate max-w-full">
                {tab.label}
              </span>
              {tab.badge && (
                <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing tab state
 */
export function useTabInterface(tabs: TabItem[], defaultTab?: string) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const switchToTab = (tabId: string) => {
    if (tabs.find(tab => tab.id === tabId && !tab.disabled)) {
      setActiveTab(tabId);
    }
  };

  const getActiveTab = () => tabs.find(tab => tab.id === activeTab);

  const getNextTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
    return tabs[nextIndex];
  };

  const getPreviousTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
    return tabs[prevIndex];
  };

  return {
    activeTab,
    setActiveTab: switchToTab,
    getActiveTab,
    getNextTab,
    getPreviousTab
  };
}

export default TabInterface;