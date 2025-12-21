'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThreatFilters, ThreatType } from '@/types/threat';

interface FilterPanelProps {
  onFiltersChange: (filters: ThreatFilters) => void;
  initialFilters?: ThreatFilters;
  availableOptions?: {
    regions: string[];
    brands: string[];
    topics: string[];
  };
  className?: string;
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
  className = ""
}: FilterPanelProps) {
  const [filters, setFilters] = useState<ThreatFilters>(initialFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

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
      'Microsoft', 'Apple', 'Google', 'Amazon', 'Meta', 'Tesla', 'Netflix',
      'Adobe', 'Salesforce', 'Oracle', 'IBM', 'Intel', 'NVIDIA', 'Cisco',
      'PayPal', 'Visa', 'Mastercard', 'JPMorgan', 'Bank of America'
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

  return (
    <div className={`${className}`}>
      {/* Expanded Filter Panel */}
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] w-80">
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
              className="px-2 py-1 text-xs text-white/60 hover:text-white transition-colors"
            >
              Clear
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
                <label key={value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.threatTypes?.includes(value) || false}
                    onChange={(e) => handleThreatTypeChange(value, e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/20 text-blue-500 focus:ring-blue-500/50"
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

          {/* Multi-select sections */}
          {filterSections.map((section) => (
            <div key={section.key}>
              <div 
                className="flex items-center justify-between cursor-pointer mb-3"
                onClick={() => toggleSection(section.key)}
              >
                <h4 className="text-white/80 font-medium text-base">{section.title}</h4>
                <svg 
                  className={`w-4 h-4 text-white/60 transition-transform ${
                    expandedSections.has(section.key) ? 'rotate-180' : ''
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {expandedSections.has(section.key) && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {section.options.map((option) => (
                    <label key={option} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(filters[section.key] as string[])?.includes(option) || false}
                        onChange={(e) => handleMultiSelectChange(section.key, option, e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-black/20 text-blue-500 focus:ring-blue-500/50"
                      />
                      <span className="text-sm text-white/80">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}