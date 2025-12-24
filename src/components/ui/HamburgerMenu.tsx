'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useResponsive } from '@/hooks/useResponsive';

export interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface HamburgerMenuContentProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  className?: string;
}

/**
 * Hamburger menu button component for mobile navigation
 * Requirement 7.1: Mobile hamburger menu for secondary navigation
 */
export function HamburgerMenuButton({ isOpen, onToggle, className = '' }: HamburgerMenuProps) {
  const { isMobile } = useResponsive();

  // Only show on mobile viewports
  if (!isMobile) {
    return null;
  }

  return (
    <button
      onClick={onToggle}
      className={`
        relative w-11 h-11 flex flex-col justify-center items-center
        bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg
        hover:bg-black/30 active:bg-black/40 transition-all duration-200
        focus:outline-none
        ${className}
      `}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      {/* Hamburger lines with animation */}
      <div className="w-5 h-4 relative flex flex-col justify-between">
        <span
          className={`
            block h-0.5 w-full bg-white transition-all duration-300 origin-center
            ${isOpen ? 'rotate-45 translate-y-1.5' : 'rotate-0 translate-y-0'}
          `}
        />
        <span
          className={`
            block h-0.5 w-full bg-white transition-all duration-300
            ${isOpen ? 'opacity-0' : 'opacity-100'}
          `}
        />
        <span
          className={`
            block h-0.5 w-full bg-white transition-all duration-300 origin-center
            ${isOpen ? '-rotate-45 -translate-y-1.5' : 'rotate-0 translate-y-0'}
          `}
        />
      </div>
    </button>
  );
}

/**
 * Hamburger menu content overlay for mobile navigation
 */
export function HamburgerMenuContent({ 
  isOpen, 
  onClose, 
  menuItems, 
  className = '' 
}: HamburgerMenuContentProps) {
  const { isMobile } = useResponsive();
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle escape key and outside clicks
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  if (!isMobile || !isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div
        ref={menuRef}
        className={`
          fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50
          bg-black/90 backdrop-blur-md border-r border-white/10
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    item.onClick();
                    onClose();
                  }}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center px-6 py-4 text-left
                    hover:bg-white/5 active:bg-white/10 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none
                    min-h-[44px] touch-manipulation
                  `}
                >
                  {item.icon && (
                    <span className="mr-3 flex-shrink-0 w-5 h-5 text-white/70">
                      {item.icon}
                    </span>
                  )}
                  <span className="text-white font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="text-xs text-gray-400 text-center">
            MVP Index • Gen Digital Threat Labs
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Complete hamburger menu system combining button and content
 */
export interface HamburgerMenuSystemProps {
  menuItems: MenuItem[];
  className?: string;
  buttonClassName?: string;
  contentClassName?: string;
}

export function HamburgerMenuSystem({ 
  menuItems, 
  className = '',
  buttonClassName = '',
  contentClassName = ''
}: HamburgerMenuSystemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen(!isOpen);
  const handleClose = () => setIsOpen(false);

  return (
    <div className={className}>
      <HamburgerMenuButton 
        isOpen={isOpen} 
        onToggle={handleToggle}
        className={buttonClassName}
      />
      <HamburgerMenuContent
        isOpen={isOpen}
        onClose={handleClose}
        menuItems={menuItems}
        className={contentClassName}
      />
    </div>
  );
}

export default HamburgerMenuSystem;