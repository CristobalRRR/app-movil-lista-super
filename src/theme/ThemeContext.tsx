import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSetting, setSetting } from '../db/queries';

export type ThemeName = 'dark' | 'light';

export type ThemeColors = {
  background: string;
  text: string;
  mutedText: string;
};

const PALETTES: Record<ThemeName, ThemeColors> = {
  dark: { background: '#1e1e1e', text: '#ffffff', mutedText: '#cccccc' },
  light: { background: '#f2f2f2', text: '#111111', mutedText: '#444444' },
};

type ThemeContextValue = {
  theme: ThemeName;
  colors: ThemeColors;
  setTheme: (t: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  colors: PALETTES.dark,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark');

  useEffect(() => {
    getSetting('theme').then((saved) => {
      if (saved === 'light' || saved === 'dark') setThemeState(saved);
    });
  }, []);

  function setTheme(t: ThemeName) {
    setThemeState(t);
    setSetting('theme', t);
  }

  return (
    <ThemeContext.Provider value={{ theme, colors: PALETTES[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}