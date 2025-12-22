'use client';

import React, { useState } from 'react';
import { ThreatFilters } from '@/types/threat';
import FilterPanel from './FilterPanel';

interface AnimatedControlsProps {
  onFiltersChange: (filters: ThreatFilters) => void;
  onControlsToggle?: () => void;
  showOnlyFilters?: boolean;
  showOnlyControls?: boolean;
  className?: string;
}

interface AnimatedButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  icon, 
  label, 
  onClick, 
  isActive = false,
  className = "" 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative group overflow-hidden
        bg-black/50 backdrop-blur-sm border border-white/20 
        rounded-full flex items-center
        text-white/70 hover:text-white hover:border-white/30 
        shadow-[0_0_15px_rgba(0,0,0,0.3)]
        ${className}
      `}
      style={{
        width: isHovered ? 'auto' : '48px',
        height: '48px',
        minWidth: '48px',
        paddingRight: isHovered ? '24px' : '0px',
        transition: 'width 0.25s ease-out, padding-right 0.25s ease-out'
      }}
    >
      {/* Icon container - always visible */}
      <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
        {icon}
      </div>
      
      {/* Text label - slides in smoothly */}
      <div 
        className="whitespace-nowrap text-sm font-medium overflow-hidden"
        style={{
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateX(0)' : 'translateX(8px)',
          width: isHovered ? 'auto' : '0px',
          marginLeft: isHovered ? '4px' : '0px',
          transition: 'opacity 0.2s ease-out, transform 0.2s ease-out, width 0.25s ease-out, margin-left 0.25s ease-out',
          transitionDelay: isHovered ? '0.05s' : '0s'
        }}
      >
        {label}
      </div>
    </button>
  );
};

export default function AnimatedControls({ 
  onFiltersChange, 
  onControlsToggle,
  showOnlyFilters = false,
  showOnlyControls = false,
  className = "" 
}: AnimatedControlsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const handleFiltersClick = () => {
    setShowFilters(!showFilters);
  };

  const handleControlsClick = () => {
    setShowControls(!showControls);
    onControlsToggle?.();
  };

  // If showing only filters
  if (showOnlyFilters) {
    return (
      <div className={`relative ${className}`}>
        <AnimatedButton
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          }
          label="Filters"
          onClick={handleFiltersClick}
          isActive={showFilters}
        />
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="absolute top-16 left-0">
            <FilterPanel 
              onFiltersChange={onFiltersChange}
              className="w-80"
            />
          </div>
        )}
      </div>
    );
  }

  // If showing only controls
  if (showOnlyControls) {
    return (
      <div className={`relative ${className}`}>
        <AnimatedButton
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"/>
            </svg>
          }
          label="Controls"
          onClick={handleControlsClick}
          isActive={showControls}
        />
        
        {/* Controls Panel */}
        {showControls && (
          <div className="absolute top-16 right-0 bg-black/50 backdrop-blur-sm rounded-3xl p-6 border border-white/20 w-80 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
            <h3 className="text-white font-medium mb-4 text-lg">Navigation Controls</h3>
            <div className="space-y-3 text-base text-gray-300">
              <div>• <strong>Zoom:</strong> Mouse wheel or pinch</div>
              <div>• <strong>Rotate:</strong> Click and drag</div>
              <div>• <strong>Pan:</strong> Right-click and drag</div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="text-base text-gray-400">
                Zoom in/out to transition between heat map and pixel visualization
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default: show both (legacy behavior)
  return (
    <div className={`${className}`}>
      {/* Left side - Filters */}
      <div className="absolute top-6 left-6 z-10">
        <div className="relative">
          <AnimatedButton
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            }
            label="Filters"
            onClick={handleFiltersClick}
            isActive={showFilters}
          />
          
          {/* Filters Panel */}
          {showFilters && (
            <div className="absolute top-16 left-0">
              <FilterPanel 
                onFiltersChange={onFiltersChange}
                className="w-80"
              />
            </div>
          )}
        </div>
      </div>

      {/* Right side - Controls */}
      <div className="absolute top-6 right-6 z-10">
        <div className="relative">
          <AnimatedButton
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"/>
              </svg>
            }
            label="Controls"
            onClick={handleControlsClick}
            isActive={showControls}
          />
          
          {/* Controls Panel */}
          {showControls && (
            <div className="absolute top-16 right-0 bg-black/50 backdrop-blur-sm rounded-3xl p-6 border border-white/20 w-80 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
              <h3 className="text-white font-medium mb-4 text-lg">Navigation Controls</h3>
              <div className="space-y-3 text-base text-gray-300">
                <div>• <strong>Zoom:</strong> Mouse wheel or pinch</div>
                <div>• <strong>Rotate:</strong> Click and drag</div>
                <div>• <strong>Pan:</strong> Right-click and drag</div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="text-base text-gray-400">
                  Zoom in/out to transition between heat map and pixel visualization
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}