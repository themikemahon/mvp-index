import { useState, useEffect, useCallback, useMemo } from 'react';
import { ThreatFilters, ThreatDataPoint } from '@/types/threat';

interface UseFiltersOptions {
  persistKey?: string;
  onFiltersChange?: (filters: ThreatFilters, filteredData: ThreatDataPoint[]) => void;
}

export function useFilters(
  allData: ThreatDataPoint[] = [],
  options: UseFiltersOptions = {}
) {
  const { persistKey = 'cyber-threat-filters', onFiltersChange } = options;
  
  const [filters, setFilters] = useState<ThreatFilters>({});

  // Load persisted filters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(persistKey);
        if (stored) {
          const parsedFilters = JSON.parse(stored);
          setFilters(parsedFilters);
        }
      } catch (error) {
        console.warn('Failed to load persisted filters:', error);
      }
    }
  }, [persistKey]);

  // Memoize the filtering logic to prevent unnecessary recalculations
  const filteredData = useMemo(() => {
    if (!allData.length) return allData;

    // If no filters are active, return all data
    const hasActiveFilters = !!(
      filters.threatTypes?.length ||
      filters.regions?.length ||
      filters.brands?.length ||
      filters.topics?.length ||
      filters.severityMin !== undefined ||
      filters.severityMax !== undefined ||
      filters.isActive !== undefined
    );

    if (!hasActiveFilters) return allData;

    return allData.filter(item => {
      // Filter by threat types
      if (filters.threatTypes?.length && !filters.threatTypes.includes(item.threatType)) {
        return false;
      }

      // Filter by regions
      if (filters.regions?.length && (!item.region || !filters.regions.includes(item.region))) {
        return false;
      }

      // Filter by brands (item must have at least one matching brand)
      if (filters.brands?.length && (!item.brands?.length || !item.brands.some(brand => filters.brands!.includes(brand)))) {
        return false;
      }

      // Filter by topics (item must have at least one matching topic)
      if (filters.topics?.length && (!item.topics?.length || !item.topics.some(topic => filters.topics!.includes(topic)))) {
        return false;
      }

      // Filter by severity range
      if (filters.severityMin !== undefined && item.severity < filters.severityMin) {
        return false;
      }

      if (filters.severityMax !== undefined && item.severity > filters.severityMax) {
        return false;
      }

      // Filter by active status
      if (filters.isActive !== undefined && item.isActive !== filters.isActive) {
        return false;
      }

      return true;
    });
  }, [allData, filters]);

  // Notify parent when filters or filtered data change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters, filteredData);
    }
  }, [filters, filteredData, onFiltersChange]);

  // Update filters and persist to localStorage
  const updateFilters = useCallback((newFilters: ThreatFilters) => {
    setFilters(newFilters);
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(persistKey, JSON.stringify(newFilters));
      } catch (error) {
        console.warn('Failed to persist filters:', error);
      }
    }
  }, [persistKey]);

  // Reset filters
  const resetFilters = useCallback(() => {
    const emptyFilters: ThreatFilters = {};
    setFilters(emptyFilters);
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(persistKey);
      } catch (error) {
        console.warn('Failed to clear persisted filters:', error);
      }
    }
  }, [persistKey]);

  // Memoize computed values to prevent unnecessary recalculations
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.threatTypes?.length ||
      filters.regions?.length ||
      filters.brands?.length ||
      filters.topics?.length ||
      filters.severityMin !== undefined ||
      filters.severityMax !== undefined ||
      filters.isActive !== undefined
    );
  }, [filters]);

  const filterSummary = useMemo(() => {
    const summary: string[] = [];
    
    if (filters.threatTypes?.length) {
      summary.push(`${filters.threatTypes.length} threat type${filters.threatTypes.length > 1 ? 's' : ''}`);
    }
    
    if (filters.regions?.length) {
      summary.push(`${filters.regions.length} region${filters.regions.length > 1 ? 's' : ''}`);
    }
    
    if (filters.brands?.length) {
      summary.push(`${filters.brands.length} brand${filters.brands.length > 1 ? 's' : ''}`);
    }
    
    if (filters.topics?.length) {
      summary.push(`${filters.topics.length} topic${filters.topics.length > 1 ? 's' : ''}`);
    }
    
    if (filters.severityMin !== undefined || filters.severityMax !== undefined) {
      const min = filters.severityMin || 1;
      const max = filters.severityMax || 10;
      summary.push(`severity ${min}-${max}`);
    }
    
    return summary;
  }, [filters]);

  // Memoize available options to prevent recalculation on every render
  const availableOptions = useMemo(() => {
    const regions = new Set<string>();
    const brands = new Set<string>();
    const topics = new Set<string>();
    
    allData.forEach(item => {
      if (item.region) regions.add(item.region);
      if (item.brands) item.brands.forEach(brand => brands.add(brand));
      if (item.topics) item.topics.forEach(topic => topics.add(topic));
    });
    
    return {
      regions: Array.from(regions).sort(),
      brands: Array.from(brands).sort(),
      topics: Array.from(topics).sort()
    };
  }, [allData]);

  return {
    filters,
    filteredData,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    filterSummary,
    availableOptions,
    totalCount: allData.length,
    filteredCount: filteredData.length
  };
}