'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown' | 'switch';
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ 
  variant = 'icon', 
  className,
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'switch') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
          resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-gray-200',
          className
        )}
        role="switch"
        aria-checked={resolvedTheme === 'dark'}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <span className="sr-only">Toggle theme</span>
        <span
          className={cn(
            "inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-lg transition-transform duration-300",
            resolvedTheme === 'dark' ? 'translate-x-7' : 'translate-x-1'
          )}
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="h-4 w-4 text-slate-700" aria-hidden="true" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
          )}
        </span>
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={cn(
            "flex items-center space-x-2 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500",
            "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700",
            className
          )}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-label="Select theme"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Sun className="h-5 w-5" aria-hidden="true" />
          )}
          {showLabel && (
            <span className="text-sm font-medium capitalize">{theme}</span>
          )}
        </button>

        {showDropdown && (
          <div 
            className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden"
            role="listbox"
            aria-label="Theme options"
          >
            <button
              onClick={() => { setTheme('light'); setShowDropdown(false); }}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors",
                "hover:bg-gray-50 dark:hover:bg-slate-700",
                theme === 'light' 
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                  : 'text-gray-700 dark:text-gray-300'
              )}
              role="option"
              aria-selected={theme === 'light'}
            >
              <Sun className="h-4 w-4" aria-hidden="true" />
              <span>Light</span>
              {theme === 'light' && <span className="ml-auto">✓</span>}
            </button>
            <button
              onClick={() => { setTheme('dark'); setShowDropdown(false); }}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors",
                "hover:bg-gray-50 dark:hover:bg-slate-700",
                theme === 'dark' 
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                  : 'text-gray-700 dark:text-gray-300'
              )}
              role="option"
              aria-selected={theme === 'dark'}
            >
              <Moon className="h-4 w-4" aria-hidden="true" />
              <span>Dark</span>
              {theme === 'dark' && <span className="ml-auto">✓</span>}
            </button>
            <button
              onClick={() => { setTheme('system'); setShowDropdown(false); }}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors",
                "hover:bg-gray-50 dark:hover:bg-slate-700",
                theme === 'system' 
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                  : 'text-gray-700 dark:text-gray-300'
              )}
              role="option"
              aria-selected={theme === 'system'}
            >
              <Monitor className="h-4 w-4" aria-hidden="true" />
              <span>System</span>
              {theme === 'system' && <span className="ml-auto">✓</span>}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default icon variant
  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500",
        "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700",
        className
      )}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
