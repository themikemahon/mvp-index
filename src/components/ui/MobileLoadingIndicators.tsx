'use client';

import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'white' | 'blue' | 'gray';
  className?: string;
}

export interface LoadingDotsProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'white' | 'blue' | 'gray';
  className?: string;
}

export interface LoadingBarProps {
  progress?: number; // 0-100
  indeterminate?: boolean;
  color?: 'white' | 'blue' | 'gray';
  className?: string;
}

export interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  type?: 'spinner' | 'dots' | 'bar';
  className?: string;
}

/**
 * Mobile-optimized loading spinner
 * Requirement 7.4: Mobile-appropriate loading indicators
 */
export function MobileLoadingSpinner({ 
  size = 'medium', 
  color = 'white', 
  className = '' 
}: LoadingSpinnerProps) {
  const { isMobile } = useResponsive();

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: isMobile ? 'w-8 h-8' : 'w-6 h-6',
    large: isMobile ? 'w-12 h-12' : 'w-8 h-8'
  };

  const colorClasses = {
    white: 'border-white/30 border-t-white',
    blue: 'border-blue-400/30 border-t-blue-400',
    gray: 'border-gray-400/30 border-t-gray-400'
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} border-2 border-solid rounded-full animate-spin
        ${colorClasses[color]} ${className}
      `}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Mobile-optimized loading dots animation
 */
export function MobileLoadingDots({ 
  size = 'medium', 
  color = 'white', 
  className = '' 
}: LoadingDotsProps) {
  const { isMobile } = useResponsive();

  const sizeClasses = {
    small: 'w-1 h-1',
    medium: isMobile ? 'w-2 h-2' : 'w-1.5 h-1.5',
    large: isMobile ? 'w-3 h-3' : 'w-2 h-2'
  };

  const colorClasses = {
    white: 'bg-white',
    blue: 'bg-blue-400',
    gray: 'bg-gray-400'
  };

  return (
    <div className={`flex space-x-1 ${className}`} role="status" aria-label="Loading">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`
            ${sizeClasses[size]} ${colorClasses[color]} rounded-full
            animate-pulse
          `}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Mobile-optimized loading progress bar
 */
export function MobileLoadingBar({ 
  progress = 0, 
  indeterminate = false, 
  color = 'blue', 
  className = '' 
}: LoadingBarProps) {
  const { isMobile } = useResponsive();

  const colorClasses = {
    white: 'bg-white',
    blue: 'bg-blue-400',
    gray: 'bg-gray-400'
  };

  const backgroundColorClasses = {
    white: 'bg-white/20',
    blue: 'bg-blue-400/20',
    gray: 'bg-gray-400/20'
  };

  const height = isMobile ? 'h-1' : 'h-0.5';

  return (
    <div
      className={`w-full ${height} ${backgroundColorClasses[color]} rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={indeterminate ? 'Loading' : `Loading ${progress}%`}
    >
      <div
        className={`
          ${height} ${colorClasses[color]} rounded-full transition-all duration-300 ease-out
          ${indeterminate ? 'animate-pulse' : ''}
        `}
        style={{
          width: indeterminate ? '100%' : `${Math.max(0, Math.min(100, progress))}%`,
          animation: indeterminate ? 'loading-bar 2s ease-in-out infinite' : undefined
        }}
      />
      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

/**
 * Full-screen mobile loading overlay
 */
export function MobileLoadingOverlay({
  isVisible,
  message = 'Loading...',
  progress,
  type = 'spinner',
  className = ''
}: LoadingOverlayProps) {
  const { isMobile } = useResponsive();

  if (!isVisible) return null;

  const renderLoadingIndicator = () => {
    switch (type) {
      case 'dots':
        return <MobileLoadingDots size="large" />;
      case 'bar':
        return (
          <div className="w-48">
            <MobileLoadingBar 
              progress={progress} 
              indeterminate={progress === undefined} 
            />
          </div>
        );
      default:
        return <MobileLoadingSpinner size="large" />;
    }
  };

  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-black/80 backdrop-blur-sm ${className}
      `}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center space-y-4 p-8">
        {renderLoadingIndicator()}
        
        <div className="text-center">
          <p className="text-white font-medium text-lg mb-2">{message}</p>
          {progress !== undefined && (
            <p className="text-white/70 text-sm">{Math.round(progress)}%</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline loading indicator for mobile content areas
 */
export interface InlineLoadingProps {
  message?: string;
  type?: 'spinner' | 'dots';
  size?: 'small' | 'medium';
  className?: string;
}

export function MobileInlineLoading({
  message = 'Loading...',
  type = 'spinner',
  size = 'medium',
  className = ''
}: InlineLoadingProps) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        {type === 'dots' ? (
          <MobileLoadingDots size={size} />
        ) : (
          <MobileLoadingSpinner size={size} />
        )}
        <p className="text-white/70 text-sm">{message}</p>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for mobile content placeholders
 */
export interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export function MobileLoadingSkeleton({ lines = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`
            h-4 bg-white/10 rounded
            ${index === lines - 1 ? 'w-3/4' : 'w-full'}
          `}
        />
      ))}
    </div>
  );
}

/**
 * Button loading state for mobile touch targets
 */
export interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  loadingText?: string;
}

export function MobileLoadingButton({
  isLoading,
  children,
  onClick,
  disabled = false,
  className = '',
  loadingText = 'Loading...'
}: LoadingButtonProps) {
  const { isMobile } = useResponsive();

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        relative flex items-center justify-center
        ${isMobile ? 'min-h-[44px] px-6 py-3' : 'min-h-[36px] px-4 py-2'}
        bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600
        text-white font-medium rounded-lg
        focus:outline-none
        transition-all duration-200 touch-manipulation
        ${className}
      `}
    >
      {isLoading && (
        <MobileLoadingSpinner 
          size="small" 
          className="mr-2" 
        />
      )}
      <span className={isLoading ? 'opacity-70' : ''}>
        {isLoading ? loadingText : children}
      </span>
    </button>
  );
}

export default {
  MobileLoadingSpinner,
  MobileLoadingDots,
  MobileLoadingBar,
  MobileLoadingOverlay,
  MobileInlineLoading,
  MobileLoadingSkeleton,
  MobileLoadingButton
};