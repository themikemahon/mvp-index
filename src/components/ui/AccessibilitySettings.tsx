'use client';

import React, { useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { aria, touchTarget, focus } from '@/utils/accessibility';

interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function AccessibilitySettings({ 
  isOpen, 
  onClose, 
  className = '' 
}: AccessibilitySettingsProps) {
  const { 
    settings, 
    updateSettings, 
    isVoiceSupported, 
    isListening,
    startVoiceControl,
    stopVoiceControl,
    auditPage,
    announceToScreenReader 
  } = useAccessibility();
  
  const [auditResults, setAuditResults] = useState<any[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    updateSettings({ [key]: value });
    announceToScreenReader(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value ? 'enabled' : 'disabled'}`);
  };

  const handleVoiceControlToggle = () => {
    if (isListening) {
      stopVoiceControl();
    } else {
      startVoiceControl();
    }
  };

  const runAccessibilityAudit = async () => {
    setIsAuditing(true);
    announceToScreenReader('Running accessibility audit...');
    
    try {
      const results = await auditPage();
      setAuditResults(results);
      announceToScreenReader(`Accessibility audit complete. Found ${results.length} issues.`);
    } catch (error) {
      console.error('Audit failed:', error);
      announceToScreenReader('Accessibility audit failed.');
    } finally {
      setIsAuditing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        className={`
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-full max-w-2xl max-h-[90vh] overflow-y-auto
          bg-gray-900 border border-white/20 rounded-2xl shadow-2xl
          z-[1001] ${className}
        `}
        {...aria.modal('Accessibility Settings')}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">
            Accessibility Settings
          </h2>
          <button
            onClick={onClose}
            className={`
              p-2 text-white/60 hover:text-white transition-colors rounded-lg
              ${focus.ring} ${touchTarget.classes.minimum}
            `}
            {...aria.button('Close accessibility settings')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Screen Reader Settings */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4">
              Screen Reader
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-white/80">Announce changes</span>
                <input
                  type="checkbox"
                  checked={settings.announceChanges}
                  onChange={(e) => handleSettingChange('announceChanges', e.target.checked)}
                  className={`
                    w-5 h-5 rounded border-white/20 bg-black/20 text-blue-500
                    ${touchTarget.classes.compact}
                  `}
                  aria-describedby="announce-changes-desc"
                />
              </label>
              <p id="announce-changes-desc" className="text-sm text-white/60">
                Announce important changes and updates to screen readers
              </p>

              <label className="flex items-center justify-between">
                <span className="text-white/80">Verbose descriptions</span>
                <input
                  type="checkbox"
                  checked={settings.verboseDescriptions}
                  onChange={(e) => handleSettingChange('verboseDescriptions', e.target.checked)}
                  className={`
                    w-5 h-5 rounded border-white/20 bg-black/20 text-blue-500
                    ${touchTarget.classes.compact}
                  `}
                  aria-describedby="verbose-desc"
                />
              </label>
              <p id="verbose-desc" className="text-sm text-white/60">
                Provide detailed descriptions of visual elements
              </p>
            </div>
          </section>

          {/* Motor Accessibility */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4">
              Motor Accessibility
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-white/80">Reduced motion</span>
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => handleSettingChange('reducedMotion', e.target.checked)}
                  className={`
                    w-5 h-5 rounded border-white/20 bg-black/20 text-blue-500
                    ${touchTarget.classes.compact}
                  `}
                  aria-describedby="reduced-motion-desc"
                />
              </label>
              <p id="reduced-motion-desc" className="text-sm text-white/60">
                Reduce animations and transitions
              </p>

              <label className="flex items-center justify-between">
                <span className="text-white/80">Larger touch targets</span>
                <input
                  type="checkbox"
                  checked={settings.largerTouchTargets}
                  onChange={(e) => handleSettingChange('largerTouchTargets', e.target.checked)}
                  className={`
                    w-5 h-5 rounded border-white/20 bg-black/20 text-blue-500
                    ${touchTarget.classes.compact}
                  `}
                  aria-describedby="touch-targets-desc"
                />
              </label>
              <p id="touch-targets-desc" className="text-sm text-white/60">
                Increase touch target sizes for easier interaction
              </p>
            </div>
          </section>

          {/* Visual Accessibility */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4">
              Visual Accessibility
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-white/80">High contrast</span>
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                  className={`
                    w-5 h-5 rounded border-white/20 bg-black/20 text-blue-500
                    ${touchTarget.classes.compact}
                  `}
                  aria-describedby="high-contrast-desc"
                />
              </label>
              <p id="high-contrast-desc" className="text-sm text-white/60">
                Increase color contrast for better visibility
              </p>

              <label className="flex items-center justify-between">
                <span className="text-white/80">Increased text size</span>
                <input
                  type="checkbox"
                  checked={settings.increasedTextSize}
                  onChange={(e) => handleSettingChange('increasedTextSize', e.target.checked)}
                  className={`
                    w-5 h-5 rounded border-white/20 bg-black/20 text-blue-500
                    ${touchTarget.classes.compact}
                  `}
                  aria-describedby="text-size-desc"
                />
              </label>
              <p id="text-size-desc" className="text-sm text-white/60">
                Increase text size for better readability
              </p>
            </div>
          </section>

          {/* Voice Control */}
          {isVoiceSupported && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-4">
                Voice Control
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-white/80">Enable voice control</span>
                  <input
                    type="checkbox"
                    checked={settings.voiceControlEnabled}
                    onChange={(e) => handleSettingChange('voiceControlEnabled', e.target.checked)}
                    className={`
                      w-5 h-5 rounded border-white/20 bg-black/20 text-blue-500
                      ${touchTarget.classes.compact}
                    `}
                    aria-describedby="voice-control-desc"
                  />
                </label>
                <p id="voice-control-desc" className="text-sm text-white/60">
                  Control the app using voice commands
                </p>

                {settings.voiceControlEnabled && (
                  <div className="pl-4 border-l-2 border-blue-500/30">
                    <button
                      onClick={handleVoiceControlToggle}
                      className={`
                        px-4 py-2 rounded-lg font-medium transition-colors
                        ${isListening 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }
                        ${focus.ring} ${touchTarget.classes.minimum}
                      `}
                      {...aria.button(isListening ? 'Stop voice control' : 'Start voice control')}
                    >
                      {isListening ? (
                        <>
                          <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                          Stop Listening
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          Start Listening
                        </>
                      )}
                    </button>
                    
                    <div className="mt-3 text-sm text-white/60">
                      <p className="font-medium mb-2">Available commands:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• "zoom in" / "zoom out"</li>
                        <li>• "reset view"</li>
                        <li>• "search for [query]"</li>
                        <li>• "open filters"</li>
                        <li>• "close" / "go back"</li>
                        <li>• "help"</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Keyboard Navigation */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4">
              Keyboard Navigation
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-white/80">Keyboard navigation</span>
                <input
                  type="checkbox"
                  checked={settings.keyboardNavigationEnabled}
                  onChange={(e) => handleSettingChange('keyboardNavigationEnabled', e.target.checked)}
                  className={`
                    w-5 h-5 rounded border-white/20 bg-black/20 text-blue-500
                    ${touchTarget.classes.compact}
                  `}
                  aria-describedby="keyboard-nav-desc"
                />
              </label>
              <p id="keyboard-nav-desc" className="text-sm text-white/60">
                Enable keyboard navigation throughout the app
              </p>

              <label className="flex items-center justify-between">
                <span className="text-white/80">Visible focus indicators</span>
                <input
                  type="checkbox"
                  checked={settings.focusIndicatorsVisible}
                  onChange={(e) => handleSettingChange('focusIndicatorsVisible', e.target.checked)}
                  className={`
                    w-5 h-5 rounded border-white/20 bg-black/20 text-blue-500
                    ${touchTarget.classes.compact}
                  `}
                  aria-describedby="focus-indicators-desc"
                />
              </label>
              <p id="focus-indicators-desc" className="text-sm text-white/60">
                Show clear focus indicators when navigating with keyboard
              </p>
            </div>
          </section>

          {/* Accessibility Audit */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-4">
              Accessibility Audit
            </h3>
            <div className="space-y-4">
              <button
                onClick={runAccessibilityAudit}
                disabled={isAuditing}
                className={`
                  px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600
                  text-white font-medium rounded-lg transition-colors
                  ${focus.ring} ${touchTarget.classes.minimum}
                `}
                {...aria.button('Run accessibility audit')}
              >
                {isAuditing ? (
                  <>
                    <div className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Running Audit...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run Audit
                  </>
                )}
              </button>
              
              {auditResults.length > 0 && (
                <div className="mt-4 p-4 bg-black/20 rounded-lg">
                  <h4 className="font-medium text-white mb-2">
                    Audit Results ({auditResults.length} issues found)
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {auditResults.map((result, index) => (
                      <div key={index} className="text-sm">
                        <div className={`
                          font-medium
                          ${result.severity === 'error' ? 'text-red-400' : 
                            result.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'}
                        `}>
                          {result.element.tagName.toLowerCase()}
                          {result.element.className && ` .${result.element.className.split(' ')[0]}`}
                        </div>
                        <ul className="text-white/60 ml-4">
                          {result.issues.map((issue: string, issueIndex: number) => (
                            <li key={issueIndex}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex justify-between items-center">
            <p className="text-sm text-white/60">
              Settings are saved automatically
            </p>
            <button
              onClick={onClose}
              className={`
                px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                transition-colors ${focus.ring} ${touchTarget.classes.minimum}
              `}
              {...aria.button('Close settings')}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}