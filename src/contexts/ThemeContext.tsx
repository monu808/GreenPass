'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

function applyThemeToDocument(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  // Remove both classes first, then add the correct one
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', resolved === 'dark' ? '#0f172a' : '#059669');
  }
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system',
  storageKey = 'greenpass-theme'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey) as Theme | null;
    const initialTheme = (saved && ['light', 'dark', 'system'].includes(saved)) ? saved : defaultTheme;
    const resolved = resolveTheme(initialTheme);
    
    setThemeState(initialTheme);
    setResolvedTheme(resolved);
    applyThemeToDocument(resolved);
    setMounted(true);
  }, [defaultTheme, storageKey]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const newResolved = getSystemTheme();
        setResolvedTheme(newResolved);
        applyThemeToDocument(newResolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    const newResolved = resolveTheme(newTheme);
    
    // Update localStorage
    localStorage.setItem(storageKey, newTheme);
    
    // Update state
    setThemeState(newTheme);
    setResolvedTheme(newResolved);
    
    // Apply to DOM immediately
    applyThemeToDocument(newResolved);
  }, [storageKey]);

  const toggleTheme = useCallback(() => {
    // Use current resolvedTheme state to determine next theme
    setResolvedTheme(current => {
      const newTheme = current === 'dark' ? 'light' : 'dark';
      
      // Update localStorage
      localStorage.setItem(storageKey, newTheme);
      
      // Update theme state
      setThemeState(newTheme);
      
      // Apply to DOM immediately
      applyThemeToDocument(newTheme);
      
      return newTheme;
    });
  }, [storageKey]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ 
        theme: defaultTheme, 
        resolvedTheme: 'light', 
        setTheme: () => {}, 
        toggleTheme: () => {} 
      }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
