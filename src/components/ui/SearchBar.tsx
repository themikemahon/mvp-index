'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QueryProcessingResponse, ThreatDataPoint } from '@/types/threat';

interface SearchBarProps {
  onSearch: (query: string, results: ThreatDataPoint[]) => void;
  onResultsChange: (results: ThreatDataPoint[]) => void;
  placeholder?: string;
  className?: string;
  opacity?: number; // For zoom-based fade effects
}

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'suggestion' | 'location' | 'brand';
}

export default function SearchBar({ 
  onSearch, 
  onResultsChange, 
  placeholder = "Ask about cyber threats, vulnerabilities, or security insights...", 
  className = "",
  opacity = 1
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close suggestions
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setShowSuggestions(false);
    }
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && showSuggestions) {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  }, [showSuggestions]);

  // Set up click outside listener
  useEffect(() => {
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSuggestions, handleClickOutside]);

  // Set up keyboard listener
  useEffect(() => {
    if (showSuggestions) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showSuggestions, handleKeyDown]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('cyber-threat-recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.warn('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Generate suggestions based on query
  useEffect(() => {
    if (query.length < 2) {
      // Show starter prompts when no query (like ChatGPT)
      const starterPrompts: SearchSuggestion[] = [
        { text: 'Show me the latest cyber threats worldwide', type: 'suggestion' },
        { text: 'What are the most dangerous vulnerabilities right now?', type: 'suggestion' },
        { text: 'Tell me about recent financial scams', type: 'suggestion' },
        { text: 'How can I protect my organization from ransomware?', type: 'suggestion' },
      ];
      
      const recentSuggestions = recentSearches.slice(0, 3).map(search => ({
        text: search,
        type: 'recent' as const
      }));
      
      setSuggestions([...starterPrompts, ...recentSuggestions]);
      return;
    }

    // Simple suggestion generation (could be enhanced with API call)
    const commonSuggestions: SearchSuggestion[] = [
      { text: 'Show me recent vulnerabilities in financial services', type: 'suggestion' },
      { text: 'What are the latest scams targeting mobile users?', type: 'suggestion' },
      { text: 'Tell me about cyber threats in my region', type: 'suggestion' },
      { text: 'How can I protect against ransomware attacks?', type: 'suggestion' },
    ];

    const locationSuggestions: SearchSuggestion[] = [
      { text: 'United States', type: 'location' },
      { text: 'Europe', type: 'location' },
      { text: 'Asia', type: 'location' },
      { text: 'China', type: 'location' },
      { text: 'Russia', type: 'location' },
    ];

    const brandSuggestions: SearchSuggestion[] = [
      { text: 'Microsoft', type: 'brand' },
      { text: 'Apple', type: 'brand' },
      { text: 'Google', type: 'brand' },
      { text: 'Amazon', type: 'brand' },
      { text: 'Meta', type: 'brand' },
    ];

    const filtered = [
      ...commonSuggestions.filter(s => s.text.toLowerCase().includes(query.toLowerCase())),
      ...locationSuggestions.filter(s => s.text.toLowerCase().includes(query.toLowerCase())),
      ...brandSuggestions.filter(s => s.text.toLowerCase().includes(query.toLowerCase())),
      ...recentSearches
        .filter(search => search.toLowerCase().includes(query.toLowerCase()) && search !== query)
        .slice(0, 3)
        .map(search => ({ text: search, type: 'recent' as const }))
    ].slice(0, 8);

    setSuggestions(filtered);
  }, [query, recentSearches]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          context: {
            currentView: { lat: 0, lng: 0, zoom: 1 } // Default view, could be passed from parent
          }
        }),
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Search service temporarily unavailable. Please try again later.');
        }
        throw new Error('Search failed. Please try again.');
      }

      const data: QueryProcessingResponse = await response.json();
      
      // Save to recent searches
      const updatedRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
      setRecentSearches(updatedRecent);
      localStorage.setItem('cyber-threat-recent-searches', JSON.stringify(updatedRecent));

      // Notify parent components
      onSearch(searchQuery, data.results);
      onResultsChange(data.results);
      
      setShowSuggestions(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    handleSearch(suggestion.text);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setError(null);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Remove the timeout-based blur handler since we're using click outside
    // The click outside handler will manage closing suggestions
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'location':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'brand':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'suggestion':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative transition-opacity duration-500 ${className}`} 
      style={{ 
        opacity,
        pointerEvents: opacity === 0 ? 'none' : 'auto'
      }}
    >  <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
                inputRef.current?.blur();
              }
            }}
            placeholder={placeholder}
            className="w-full h-16 px-7 pr-16 text-[17px] text-white/95 bg-black/50 backdrop-blur-sm border border-white/20 rounded-full focus:outline-none focus:border-white/30 placeholder-white/40 transition-all duration-200 shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:border-white/30"
            disabled={isLoading}
          />

          {/* Submit button - perfectly centered */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : query.trim() ? (
              <button
                type="submit"
                className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:bg-white/90 transition-all duration-200 shadow-lg active:scale-95"
                disabled={isLoading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            ) : (
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="absolute top-full left-0 right-0 mt-3 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-full text-red-200 text-sm shadow-lg">
            {error}
          </div>
        )}

        {/* Suggestions dropdown - ChatGPT style */}
        {showSuggestions && suggestions.length > 0 && (
          <>
            {/* Subtle backdrop overlay - make it clickable to close */}
            <div 
              className="fixed inset-0 bg-black/10 backdrop-blur-[0.5px] z-40" 
              onClick={() => setShowSuggestions(false)}
            />
            
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-3 bg-black/40 backdrop-blur-sm border border-white/20 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] z-50 overflow-hidden"
            >
            {!query && (
              <>
                <div className="px-7 py-4 border-b border-white/[0.08]">
                  <span className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.1em]">
                    {recentSearches.length > 0 ? 'Suggested Queries' : 'Get Started'}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {suggestions.filter(s => s.type === 'suggestion').map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${suggestion.text}-${index}`}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full h-16 px-7 text-left text-white/90 hover:bg-white/[0.08] active:bg-white/[0.12] transition-all duration-150 flex items-center gap-4 group"
                    >
                      <div className="text-white/30 group-hover:text-white/50 transition-colors flex-shrink-0">{getSuggestionIcon(suggestion.type)}</div>
                      <span className="flex-1 text-[17px]">{suggestion.text}</span>
                      <svg className="w-4 h-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
                {recentSearches.length > 0 && (
                  <>
                    <div className="px-7 py-4 border-t border-white/[0.08]">
                      <span className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.1em]">Recent Searches</span>
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      {suggestions.filter(s => s.type === 'recent').map((suggestion, index) => (
                        <button
                          key={`${suggestion.type}-${suggestion.text}-${index}`}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full h-14 px-7 text-left text-white/90 hover:bg-white/[0.08] active:bg-white/[0.12] transition-all duration-150 flex items-center gap-4 group"
                        >
                          <div className="text-white/30 group-hover:text-white/50 transition-colors flex-shrink-0">{getSuggestionIcon(suggestion.type)}</div>
                          <span className="flex-1 text-[17px]">{suggestion.text}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
            
            {query && (
              <div className="max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.text}-${index}`}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full h-16 px-7 text-left text-white/90 hover:bg-white/[0.08] active:bg-white/[0.12] transition-all duration-150 flex items-center gap-4 group"
                  >
                    <div className="text-white/30 group-hover:text-white/50 transition-colors flex-shrink-0">{getSuggestionIcon(suggestion.type)}</div>
                    <span className="flex-1 text-[17px]">{suggestion.text}</span>
                    <svg className="w-4 h-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
          </>
        )}
      </form>
    </div>
  );
}