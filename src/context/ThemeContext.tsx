import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  isDay: boolean;
  overrideTheme: Theme | null;
  setOverrideTheme: (t: Theme | null) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  isDay: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, isDay }) => {
  const [overrideTheme, setOverrideTheme] = useState<Theme | null>(null);

  // Natural theme strictly follows isDay unless manually overridden
  const theme: Theme = overrideTheme !== null ? overrideTheme : (isDay ? 'light' : 'dark');

  // Enforce DOM attributes, classes, and style rules on root and body
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
      root.setAttribute('data-theme', 'light');

      body.classList.remove('dark');
      body.classList.add('light');
      body.style.colorScheme = 'light';
      body.setAttribute('data-theme', 'light');
      body.style.backgroundColor = '#f0f9ff';
      body.style.color = '#0f172a';
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      root.setAttribute('data-theme', 'dark');

      body.classList.remove('light');
      body.classList.add('dark');
      body.style.colorScheme = 'dark';
      body.setAttribute('data-theme', 'dark');
      body.style.backgroundColor = '#030712';
      body.style.color = '#f3f4f6';
    }
  }, [theme]);

  const toggleTheme = () => {
    setOverrideTheme((prev) => (prev === 'light' ? 'dark' : prev === 'dark' ? 'light' : theme === 'light' ? 'dark' : 'light'));
  };

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    isDay,
    overrideTheme,
    setOverrideTheme,
    toggleTheme
  }), [theme, isDay, overrideTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
