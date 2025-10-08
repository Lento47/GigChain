/**
 * GigChain Mobile - Theme Context
 * Manages app theme (light/dark mode)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    success: string;
    error: string;
    warning: string;
  };
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#6366f1',
    background: '#ffffff',
    card: '#f5f5f5',
    text: '#333333',
    border: '#e0e0e0',
    notification: '#ef4444',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#8b5cf6',
    background: '#1a1a1a',
    card: '#2a2a2a',
    text: '#ffffff',
    border: '#444444',
    notification: '#ef4444',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const colorScheme = Appearance.getColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });

    return () => subscription.remove();
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value = {
    theme,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
