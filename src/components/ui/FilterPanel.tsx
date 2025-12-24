'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThreatFilters, ThreatType } from '@/types/threat';
import { useResponsive } from '@/hooks/useResponsive';

interface FilterPanelProps {
  onFiltersChange: (filters: ThreatFilters) => void;
  initialFilters?: ThreatFilters;
  availableOptions?: {
    regions: string[];
    brands: string[];
    topics: string[];
  };
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface FilterSection {
  title: string;
  key: keyof ThreatFilters;
  options: string[];
  multiSelect: boolean;
}

// Debounce hook for performance
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function FilterPanel({
  onFiltersChange,
  initialFilters = {},
  availableOptions = { regions: [], brands: [], topics: [] },
  className = "",
  isOpen = true,
  onClose
}: FilterPanelProps) {
  const { isMobile, isTablet, config } = useResponsive();
  const [filters, setFilters] = useState<ThreatFilters>(initialFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showFilterSummary, setShowFilterSummary] = useState(false);

  // Debounce filter changes to prevent excessive re-renders
  const debouncedFilters = useDebounce(filters, 150);

  // Memoize default options to prevent recreation on every render
  const defaultOptions = useMemo(() => ({
    regions: [
      'North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania',
      'United States', 'Canada', 'Mexico', 'Brazil', 'United Kingdom', 'Germany',
      'France', 'China', 'Japan', 'India', 'Russia', 'Australia'
    ],
    brands: [
      'Norton', 'LifeLock', 'Avast', 'MoneyLion', 'Gen'
    ],
    topics: [
      'Malware', 'Phishing', 'Ransomware', 'Data Breach', 'Identity Theft',
      'Financial Fraud', 'Social Engineering', 'Zero-day', 'DDoS', 'Cryptojacking',
      'Supply Chain', 'IoT Security', 'Cloud Security', 'Mobile Security',
      'AI/ML Security', 'Blockchain', 'Privacy', 'Compliance'
    ]
  }), []);

  const threatTypes: { value: ThreatType; label: string; color: string }[] = useMemo(() => [
    { value: 'vulnerability', label: 'Vulnerabilities', color: 'text-red-400 border-red-500/30' },
    { value: 'scam', label: 'Scams', color: 'text-orange-400 border-orange-500/30' },
    { value: 'financial_risk', label: 'Financial Risks', color: 'text-yellow-400 border-yellow-500/30' },
    { value: 'protection', label: 'Protection', color: 'text-blue-400 border-blue-500/30' }
  ], []);

  const filterSections: FilterSection[] = useMemo(() => [
    {
      title: 'Regions',
      key: 'regions',
      options: availableOptions.regions.length > 0 ? availableOptions.regions : defaultOptions.regions,
      multiSelect: true
    },
    {
      title: 'Brands',
      key: 'brands',
      options: availableOptions.brands.length > 0 ? availableOptions.brands : defaultOptions.brands,
      multiSelect: true
    },
    {
      title: 'Topics',
      key: 'topics',
      options: availableOptions.topics.length > 0 ? availableOptions.topics : defaultOptions.topics,
      multiSelect: true
    }
  ], [availableOptions, defaultOptions]);

  // Update filters when debounced filters change
  useEffect(() => {
    onFiltersChange(debouncedFilters);
  }, [debouncedFilters, onFiltersChange]);

  const handleThreatTypeChange = useCallback((threatType: ThreatType, checked: boolean) => {
    setFilters(prev => {
      const currentTypes = prev.threatTypes || [];
      const newTypes = checked
        ? [...currentTypes, threatType]
        : currentTypes.filter(t => t !== threatType);
      
      return {
        ...prev,
        threatTypes: newTypes.length > 0 ? newTypes : undefined
      };
    });
  }, []);

  const handleMultiSelectChange = useCallback((key: keyof ThreatFilters, value: string, checked: boolean) => {
    setFilters(prev => {
      const currentValues = (prev[key] as string[]) || [];
      const newValues = checked
        ? [...currentValues, value]
        : currentValues.filter(v => v !== value);
      
      return {
        ...prev,
        [key]: newValues.length > 0 ? newValues : undefined
      };
    });
  }, []);

  const handleSeverityChange = useCallback((type: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      [`severity${type === 'min' ? 'Min' : 'Max'}`]: value
    }));
  }, []);

  const toggleSection = useCallback((sectionKey: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.threatTypes?.length) count += filters.threatTypes.length;
    if (filters.regions?.length) count += filters.regions.length;
    if (filters.brands?.length) count += filters.brands.length;
    if (filters.topics?.length) count += filters.topics.length;
    if (filters.severityMin !== undefined) count += 1;
    if (filters.severityMax !== undefined) count += 1;
    return count;
  }, [filters]);

  const activeCount = useMemo(() => getActiveFilterCount(), [getActiveFilterCount]);

  // Handle escape key for mobile modal
  useEffect(() => {
    if (isMobile && isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && onClose) {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobile, isOpen, onClose]);

  // Prevent body scroll when mobile modal is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMobile, isOpen]);

  // Clear all filters with confirmation on mobile
  const handleClearAll = useCallback(() => {
    if (isMobile && activeCount > 3) {
      // Show confirmation for mobile when many filters are active
      if (window.confirm('Clear all filters?')) {
        resetFilters();
      }
    } else {
      resetFilters();
    }
  }, [isMobile, activeCount, resetFilters]);

  // Toggle filter summary on mobile
  const toggleFilterSummary = useCallback(() => {
    setShowFilterSummary(prev => !prev);
  }, []);

  // Get touch target size based on device
  const touchTargetSize = config.layoutSettings.touchTargetSize;
  const minTouchSize = Math.max(touchTargetSize, 44); // Ensure minimum 44px

  // Render filter summary for mobile
  const renderFilterSummary = () => {
    if (!isMobile || activeCount === 0) return null;

    const summaryItems = [];
    
    if (filters.threatTypes?.length) {
      summaryItems.push(`${filters.threatTypes.length} threat type${filters.threatTypes.length > 1 ? 's' : ''}`);
    }
    if (filters.regions?.length) {
      summaryItems.push(`${filters.regions.length} region${filters.regions.length > 1 ? 's' : ''}`);
    }
    if (filters.brands?.length) {
      summaryItems.push(`${filters.brands.length} brand${filters.brands.length > 1 ? 's' : ''}`);
    }
    if (filters.topics?.length) {
      summaryItems.push(`${filters.topics.length} topic${filters.topics.length > 1 ? 's' : ''}`);
    }
    if (filters.severityMin !== undefined || filters.severityMax !== undefined) {
      summaryItems.push('severity range');
    }

    return (
      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-blue-400 text-sm font-medium">Active Filters</span>
          <button
            onClick={toggleFilterSummary}
            className="text-blue-400 text-xs"
            style={{ minHeight: `${minTouchSize}px`, minWidth: `${minTouchSize}px` }}
          >
            {showFilterSummary ? 'Hide' : 'Show'} Details
          </button>
        </div>
        
        {showFilterSummary ? (
          <div className="space-y-1">
            {summaryItems.map((item, index) => (
              <div key={index} className="text-white/80 text-xs">• {item}</div>
            ))}
          </div>
        ) : (
          <div className="text-white/60 text-xs">
            {summaryItems.join(', ')}
          </div>
        )}
      </div>
    );
  };

  // Mobile full-screen modal
  if (isMobile) {
    return (
      <>
        {/* Mobile Modal Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
            <div className="flex flex-col h-full bg-black/90">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <h2 className="text-white font-semibold text-lg">Filters</h2>
                  {activeCount > 0 && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30">
                      {activeCount}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {activeCount > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors border border-red-500/30 rounded-lg"
                      style={{ minHeight: `${minTouchSize}px` }}
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 text-white/60 hover:text-white transition-colors"
                    style={{ minHeight: `${minTouchSize}px`, minWidth: `${minTouchSize}px` }}
                    aria-label="Close filters"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mobile Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {renderFilterSummary()}

                {/* Threat Types */}
                <div>
                  <h3 className="text-white font-medium mb-4 text-lg">Threat Types</h3>
                  <div className="space-y-3">
                    {threatTypes.map(({ value, label, color }) => (
                      <label key={value} className="flex items-center gap-4 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <input
                          type="checkbox"
                          checked={filters.threatTypes?.includes(value) || false}
                          onChange={(e) => handleThreatTypeChange(value, e.target.checked)}
                          className="w-5 h-5 rounded border-white/20 bg-black/20 text-blue-500"
                          style={{ minHeight: `${Math.max(minTouchSize * 0.4, 20)}px`, minWidth: `${Math.max(minTouchSize * 0.4, 20)}px` }}
                        />
                        <span className={`text-base px-3 py-2 rounded border ${color} flex-1`}>
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Severity Range */}
                <div>
                  <h3 className="text-white font-medium mb-4 text-lg">Severity Range</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-base text-white/80 mb-2">Minimum Severity</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={filters.severityMin || 1}
                        onChange={(e) => handleSeverityChange('min', parseInt(e.target.value))}
                        className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        style={{ minHeight: `${minTouchSize}px` }}
                      />
                      <div className="flex justify-between text-sm text-white/60 mt-2">
                        <span>1</span>
                        <span className="text-white font-medium">{filters.severityMin || 1}</span>
                        <span>10</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-base text-white/80 mb-2">Maximum Severity</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={filters.severityMax || 10}
                        onChange={(e) => handleSeverityChange('max', parseInt(e.target.value))}
                        className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        style={{ minHeight: `${minTouchSize}px` }}
                      />
                      <div className="flex justify-between text-sm text-white/60 mt-2">
                        <span>1</span>
                        <span className="text-white font-medium">{filters.severityMax || 10}</span>
                        <span>10</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Multi-select sections */}
                {filterSections.map((section) => (
                  <div key={section.key}>
                    <button
                      className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-white/5 transition-colors"
                      onClick={() => toggleSection(section.key)}
                      style={{ minHeight: `${minTouchSize}px` }}
                    >
                      <h3 className="text-white font-medium text-lg">{section.title}</h3>
                      <div className="flex items-center gap-2">
                        {(filters[section.key] as string[])?.length > 0 && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                            {(filters[section.key] as string[]).length}
                          </span>
                        )}
                        <svg 
                          className={`w-5 h-5 text-white/60 transition-transform duration-200 ${
                            expandedSections.has(section.key) ? 'rotate-180' : ''
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ${
                      expandedSections.has(section.key) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="pt-2 pb-4 space-y-2 max-h-80 overflow-y-auto">
                        {section.options.map((option) => (
                          <label key={option} className="flex items-center gap-4 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <input
                              type="checkbox"
                              checked={(filters[section.key] as string[])?.includes(option) || false}
                              onChange={(e) => handleMultiSelectChange(section.key, option, e.target.checked)}
                              className="w-5 h-5 rounded border-white/20 bg-black/20 text-blue-500"
                              style={{ minHeight: `${Math.max(minTouchSize * 0.4, 20)}px`, minWidth: `${Math.max(minTouchSize * 0.4, 20)}px` }}
                            />
                            <span className="text-base text-white/80 flex-1">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Footer */}
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  style={{ minHeight: `${minTouchSize}px` }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Tablet and Desktop Layout
  return (
    <div className={`${className}`}>
      <div className={`bg-black/50 backdrop-blur-sm border border-white/20 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] ${
        isTablet ? 'w-96' : 'w-80'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-white font-medium text-base">Filters</h3>
            {activeCount > 0 && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                {activeCount} active
              </span>
            )}
          </div>
          {activeCount > 0 && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-xs text-white/60 hover:text-white transition-colors rounded border border-white/20 hover:border-white/40"
              style={{ minHeight: `${Math.max(minTouchSize * 0.8, 32)}px` }}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Filter Content */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Threat Types */}
          <div>
            <h4 className="text-white/80 font-medium mb-3 text-base">Threat Types</h4>
            <div className="space-y-2">
              {threatTypes.map(({ value, label, color }) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer p-1 rounded hover:bg-white/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.threatTypes?.includes(value) || false}
                    onChange={(e) => handleThreatTypeChange(value, e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/20 text-blue-500"
                  />
                  <span className={`text-sm px-2 py-1 rounded border ${color}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Severity Range */}
          <div>
            <h4 className="text-white/80 font-medium mb-3 text-base">Severity Range</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-white/60 mb-1">Minimum Severity</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={filters.severityMin || 1}
                  onChange={(e) => handleSeverityChange('min', parseInt(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>1</span>
                  <span className="text-white/80">{filters.severityMin || 1}</span>
                  <span>10</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Maximum Severity</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={filters.severityMax || 10}
                  onChange={(e) => handleSeverityChange('max', parseInt(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>1</span>
                  <span className="text-white/80">{filters.severityMax || 10}</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-select sections with enhanced touch targets for tablet */}
          {filterSections.map((section) => (
            <div key={section.key}>
              <button 
                className="flex items-center justify-between w-full cursor-pointer mb-3 p-2 rounded hover:bg-white/5 transition-colors"
                onClick={() => toggleSection(section.key)}
                style={{ minHeight: `${isTablet ? Math.max(minTouchSize * 0.9, 40) : 'auto'}px` }}
              >
                <h4 className="text-white/80 font-medium text-base">{section.title}</h4>
                <div className="flex items-center gap-2">
                  {(filters[section.key] as string[])?.length > 0 && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                      {(filters[section.key] as string[]).length}
                    </span>
                  )}
                  <svg 
                    className={`w-4 h-4 text-white/60 transition-transform duration-200 ${
                      expandedSections.has(section.key) ? 'rotate-180' : ''
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${
                expandedSections.has(section.key) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="space-y-2 max-h-32 overflow-y-auto pb-2">
                  {section.options.map((option) => (
                    <label key={option} className="flex items-center gap-3 cursor-pointer p-1 rounded hover:bg-white/5 transition-colors">
                      <input
                        type="checkbox"
                        checked={(filters[section.key] as string[])?.includes(option) || false}
                        onChange={(e) => handleMultiSelectChange(section.key, option, e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-black/20 text-blue-500"
                      />
                      <span className="text-sm text-white/80">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}