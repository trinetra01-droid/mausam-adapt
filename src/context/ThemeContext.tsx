import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  isDay: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  isDay: true,
  toggleTheme: () => {}
});

export interface ThemeProviderProps {
  children: React.ReactNode;
  isDay: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, isDay }) => {
  // Respect daytime naturally: Daytime = light liquid glass, Nighttime = dark sleek glass
  // Allows optional user toggle stored in localStorage
  const [overrideTheme, setOverrideTheme] = useState<Theme | null>(() => {
    try {
      const saved = localStorage.getItem('mausam_theme_preference');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (_) {}
    return null;
  });

  const activeTheme: Theme = overrideTheme || (isDay ? 'light' : 'dark');

  const toggleTheme = () => {
    const next = activeTheme === 'light' ? 'dark' : 'light';
    setOverrideTheme(next);
    try {
      localStorage.setItem('mausam_theme_preference', next);
    } catch (_) {}
  };

  useEffect(() => {
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [activeTheme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme: activeTheme,
    isDay,
    toggleTheme
  }), [activeTheme, isDay]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
