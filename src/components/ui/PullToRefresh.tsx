'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useResponsive } from '@/hooks/useResponsive';

export interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  maxPullDistance?: number;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
  disabled?: boolean;
}

export interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
}

/**
 * Pull-to-refresh component for mobile interfaces
 * Requirement 7.5: Pull-to-refresh functionality for updating threat data
 */
export function PullToRefresh({
  onRefresh,
  children,
  className = '',
  threshold = 80,
  maxPullDistance = 120,
  refreshingText = 'Refreshing...',
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh',
  disabled = false
}: PullToRefreshProps) {
  const { isMobile, isTablet } = useResponsive();
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false
  });

  // Only enable on mobile and tablet
  const isEnabled = (isMobile || isTablet) && !disabled;

  // Check if container is at top
  const isAtTop = useCallback(() => {
    if (!containerRef.current) return false;
    return containerRef.current.scrollTop <= 0;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isEnabled || !isAtTop() || state.isRefreshing) return;

    startYRef.current = e.touches[0].clientY;
    currentYRef.current = startYRef.current;
    isDraggingRef.current = false;
  }, [isEnabled, isAtTop, state.isRefreshing]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isEnabled || state.isRefreshing) return;

    currentYRef.current = e.touches[0].clientY;
    const deltaY = currentYRef.current - startYRef.current;

    // Only handle downward pulls when at top
    if (deltaY > 0 && isAtTop()) {
      isDraggingRef.current = true;
      
      // Prevent default scrolling
      e.preventDefault();

      // Calculate pull distance with resistance
      const resistance = 0.5;
      const pullDistance = Math.min(deltaY * resistance, maxPullDistance);
      const canRefresh = pullDistance >= threshold;

      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance,
        canRefresh
      }));
    }
  }, [isEnabled, isAtTop, state.isRefreshing, threshold, maxPullDistance]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!isEnabled || !isDraggingRef.current) return;

    isDraggingRef.current = false;

    if (state.canRefresh && !state.isRefreshing) {
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false
      }));

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        canRefresh: false
      }));
    }
  }, [isEnabled, state.canRefresh, state.isRefreshing, onRefresh]);

  // Add touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isEnabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isEnabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate indicator opacity and rotation
  const indicatorOpacity = Math.min(state.pullDistance / threshold, 1);
  const indicatorRotation = (state.pullDistance / threshold) * 180;

  // Get status text
  const getStatusText = () => {
    if (state.isRefreshing) return refreshingText;
    if (state.canRefresh) return releaseText;
    return pullText;
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{
        transform: state.isPulling || state.isRefreshing 
          ? `translateY(${Math.min(state.pullDistance, 60)}px)` 
          : 'translateY(0)',
        transition: state.isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull-to-refresh indicator */}
      {isEnabled && (state.isPulling || state.isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center z-10"
          style={{
            height: '60px',
            transform: 'translateY(-60px)',
            opacity: indicatorOpacity
          }}
        >
          <div className="flex items-center space-x-2 text-white/70">
            {/* Refresh icon */}
            <div
              className={`w-5 h-5 transition-transform duration-200 ${
                state.isRefreshing ? 'animate-spin' : ''
              }`}
              style={{
                transform: state.isRefreshing 
                  ? 'rotate(0deg)' 
                  : `rotate(${indicatorRotation}deg)`
              }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            
            {/* Status text */}
            <span className="text-sm font-medium">
              {getStatusText()}
            </span>
          </div>

          {/* Progress indicator */}
          <div className="w-8 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-200"
              style={{
                width: `${Math.min((state.pullDistance / threshold) * 100, 100)}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className={state.isRefreshing ? 'pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  );
}

/**
 * Hook for managing pull-to-refresh state
 */
export function usePullToRefresh(refreshFn: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshFn();
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Refresh failed:', error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshFn, isRefreshing]);

  return {
    isRefreshing,
    lastRefreshTime,
    refresh
  };
}

/**
 * Simple pull-to-refresh wrapper for lists
 */
export interface PullToRefreshListProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function PullToRefreshList({
  onRefresh,
  children,
  className = '',
  emptyMessage = 'No items to display',
  isEmpty = false
}: PullToRefreshListProps) {
  const { refresh, isRefreshing } = usePullToRefresh(onRefresh);

  return (
    <PullToRefresh
      onRefresh={refresh}
      className={`h-full ${className}`}
      disabled={isRefreshing}
    >
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <div className="text-white/50 text-center">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-medium mb-2">{emptyMessage}</p>
            <p className="text-sm">Pull down to refresh</p>
          </div>
        </div>
      ) : (
        children
      )}
    </PullToRefresh>
  );
}

export default PullToRefresh;