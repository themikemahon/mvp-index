'use client';

import React from 'react';
import { ThreatDataPoint } from '@/types/threat';

interface SearchResultsProps {
  results: ThreatDataPoint[];
  query: string;
  onResultClick: (threat: ThreatDataPoint) => void;
  onNavigateToThreat: (threat: ThreatDataPoint) => void;
  className?: string;
}

export default function SearchResults({ 
  results, 
  query, 
  onResultClick, 
  onNavigateToThreat,
  className = "" 
}: SearchResultsProps) {
  if (!query) {
    return null;
  }

  const getThreatTypeColor = (threatType: string) => {
    switch (threatType) {
      case 'vulnerability':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'scam':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'financial_risk':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'protection':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'text-red-400';
    if (severity >= 6) return 'text-orange-400';
    if (severity >= 4) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatThreatType = (threatType: string) => {
    return threatType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (results.length === 0) {
    return (
      <div className={`bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-6 ${className}`}>
        <div className="text-center text-white/60">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium mb-2">No threats found</h3>
          <p className="text-sm">
            No threats match your search for &quot;{query}&quot;. Try different keywords or check your spelling.
          </p>
          <div className="mt-4 text-xs text-white/40">
            <p>Suggestions:</p>
            <ul className="mt-2 space-y-1">
              <li>• Try broader terms like &quot;vulnerabilities&quot; or &quot;scams&quot;</li>
              <li>• Search by location like &quot;United States&quot; or &quot;Europe&quot;</li>
              <li>• Look for specific brands like &quot;Microsoft&quot; or &quot;Apple&quot;</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg ${className}`}>
      <div className="p-4 border-b border-white/10">
        <h3 className="text-white font-medium">
          Search Results for &quot;{query}&quot;
        </h3>
        <p className="text-white/60 text-sm mt-1">
          Found {results.length} threat{results.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {results.map((threat, index) => (
          <div
            key={threat.id}
            className="p-4 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors cursor-pointer"
            onClick={() => onResultClick(threat)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getThreatTypeColor(threat.threatType)}`}>
                    {formatThreatType(threat.threatType)}
                  </span>
                  <span className={`text-sm font-medium ${getSeverityColor(threat.severity)}`}>
                    Severity: {threat.severity}/10
                  </span>
                </div>

                <h4 className="text-white font-medium mb-1 truncate">
                  {threat.title}
                </h4>
                
                {threat.subhead && (
                  <p className="text-white/80 text-sm mb-2 truncate">
                    {threat.subhead}
                  </p>
                )}

                <p className="text-white/60 text-sm mb-3">
                  {truncateText(threat.description, 120)}
                </p>

                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span>📍 {threat.region || 'Global'}</span>
                  <span>🕒 {new Date(threat.createdAt).toLocaleDateString()}</span>
                  {threat.brands && threat.brands.length > 0 && (
                    <span>🏢 {threat.brands.slice(0, 2).join(', ')}{threat.brands.length > 2 ? '...' : ''}</span>
                  )}
                </div>

                {threat.topics && threat.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {threat.topics.slice(0, 3).map((topic, topicIndex) => (
                      <span
                        key={topicIndex}
                        className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded"
                      >
                        {topic}
                      </span>
                    ))}
                    {threat.topics.length > 3 && (
                      <span className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded">
                        +{threat.topics.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToThreat(threat);
                }}
                className="flex-shrink-0 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded border border-blue-500/30 transition-colors"
                title="Navigate to threat location"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {results.length >= 1000 && (
        <div className="p-4 border-t border-white/10 text-center text-white/60 text-sm">
          Showing first 1000 results. Refine your search for more specific results.
        </div>
      )}
    </div>
  );
}