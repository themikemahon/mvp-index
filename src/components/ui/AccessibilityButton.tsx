'use client';

import React, { useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import AccessibilitySettings from './AccessibilitySettings';
import { aria, touchTarget, focus } from '@/utils/accessibility';

interface AccessibilityButtonProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export default function AccessibilityButton({ 
  className = '',
  position = 'top-right'
}: AccessibilityButtonProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { isVoiceSupported, isListening, announceToScreenReader } = useAccessibility();

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
    announceToScreenReader('Accessibility settings opened');
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    announceToScreenReader('Accessibility settings closed');
  };

  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={handleOpenSettings}
        className={`
          fixed ${positionClasses[position]} z-50
          w-12 h-12 bg-black/50 backdrop-blur-sm border border-white/20 rounded-full
          text-white/80 hover:text-white hover:bg-black/70 transition-all duration-200
          ${focus.ring} ${touchTarget.classes.minimum}
          ${isListening ? 'voice-listening' : ''}
          ${className}
        `}
        {...aria.button('Open accessibility settings', { expanded: showSettings })}
        title="Accessibility Settings"
      >
        {/* Accessibility Icon */}
        <svg 
          className="w-6 h-6 mx-auto" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" 
          />
        </svg>
        
        {/* Voice control indicator */}
        {isVoiceSupported && isListening && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Accessibility Settings Modal */}
      <AccessibilitySettings 
        isOpen={showSettings}
        onClose={handleCloseSettings}
      />
    </>
  );
}

/**
 * Floating accessibility toolbar with quick actions
 */
export function AccessibilityToolbar({ className = '' }: { className?: string }) {
  const { 
    settings, 
    updateSettings, 
    isVoiceSupported, 
    isListening, 
    startVoiceControl, 
    stopVoiceControl,
    announceToScreenReader 
  } = useAccessibility();
  
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleVoiceControl = () => {
    if (isListening) {
      stopVoiceControl();
    } else {
      startVoiceControl();
    }
  };

  const toggleHighContrast = () => {
    const newValue = !settings.highContrast;
    updateSettings({ highContrast: newValue });
    announceToScreenReader(`High contrast ${newValue ? 'enabled' : 'disabled'}`);
  };

  const toggleReducedMotion = () => {
    const newValue = !settings.reducedMotion;
    updateSettings({ reducedMotion: newValue });
    announceToScreenReader(`Reduced motion ${newValue ? 'enabled' : 'disabled'}`);
  };

  return (
    <div 
      className={`
        fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2
        ${className}
      `}
      role="toolbar"
      aria-label="Accessibility quick actions"
    >
      {/* Expanded toolbar items */}
      {isExpanded && (
        <div className="flex flex-col space-y-2 mb-2">
          {/* Voice Control Toggle */}
          {isVoiceSupported && (
            <button
              onClick={toggleVoiceControl}
              className={`
                w-12 h-12 rounded-full backdrop-blur-sm border transition-all duration-200
                ${isListening 
                  ? 'bg-red-500/80 border-red-400 text-white animate-pulse' 
                  : 'bg-black/50 border-white/20 text-white/80 hover:text-white hover:bg-black/70'
                }
                ${focus.ring} ${touchTarget.classes.minimum}
              `}
              {...aria.button(isListening ? 'Stop voice control' : 'Start voice control')}
              title={isListening ? 'Stop Voice Control' : 'Start Voice Control'}
            >
              <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          )}

          {/* High Contrast Toggle */}
          <button
            onClick={toggleHighContrast}
            className={`
              w-12 h-12 rounded-full backdrop-blur-sm border transition-all duration-200
              ${settings.highContrast 
                ? 'bg-yellow-500/80 border-yellow-400 text-black' 
                : 'bg-black/50 border-white/20 text-white/80 hover:text-white hover:bg-black/70'
              }
              ${focus.ring} ${touchTarget.classes.minimum}
            `}
            {...aria.button('Toggle high contrast', { pressed: settings.highContrast })}
            title="Toggle High Contrast"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>

          {/* Reduced Motion Toggle */}
          <button
            onClick={toggleReducedMotion}
            className={`
              w-12 h-12 rounded-full backdrop-blur-sm border transition-all duration-200
              ${settings.reducedMotion 
                ? 'bg-green-500/80 border-green-400 text-white' 
                : 'bg-black/50 border-white/20 text-white/80 hover:text-white hover:bg-black/70'
              }
              ${focus.ring} ${touchTarget.classes.minimum}
            `}
            {...aria.button('Toggle reduced motion', { pressed: settings.reducedMotion })}
            title="Toggle Reduced Motion"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        </div>
      )}

      {/* Main toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-12 h-12 bg-black/50 backdrop-blur-sm border border-white/20 rounded-full
          text-white/80 hover:text-white hover:bg-black/70 transition-all duration-200
          ${focus.ring} ${touchTarget.classes.minimum}
        `}
        {...aria.button('Toggle accessibility toolbar', { expanded: isExpanded })}
        title="Accessibility Toolbar"
      >
        <svg 
          className={`w-6 h-6 mx-auto transition-transform duration-200 ${isExpanded ? 'rotate-45' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  );
}