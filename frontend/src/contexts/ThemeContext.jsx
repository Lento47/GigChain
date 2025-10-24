import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference, then default to white
    const savedTheme = localStorage.getItem('gigchain-theme');
    if (savedTheme && ['dark', 'white', 'indigo'].includes(savedTheme)) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'white';
  });

  const setThemeValue = (newTheme) => {
    if (['dark', 'white', 'indigo'].includes(newTheme)) {
      setTheme(newTheme);
      localStorage.setItem('gigchain-theme', newTheme);
    }
  };

  const cycleTheme = () => {
    const themes = ['white', 'dark', 'indigo'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setThemeValue(themes[nextIndex]);
  };

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update CSS variables based on theme
    const root = document.documentElement;
    
    if (theme === 'dark') {
      // Dark theme - Minimal industrial with neon accents
      root.style.setProperty('--theme-bg-primary', '#0C1221');
      root.style.setProperty('--theme-bg-secondary', '#0A0F1C');
      root.style.setProperty('--theme-bg-tertiary', '#1a2332');
      root.style.setProperty('--theme-text-primary', '#ffffff');
      root.style.setProperty('--theme-text-secondary', '#9ca3af');
      root.style.setProperty('--theme-text-muted', '#6b7280');
      root.style.setProperty('--theme-border', '#1a2332');
      root.style.setProperty('--theme-accent', '#00D4FF');
      root.style.setProperty('--theme-accent-secondary', '#8B5CF6');
      root.style.setProperty('--theme-card-bg', '#0A0F1C');
      root.style.setProperty('--theme-card-border', '#1a2332');
      root.style.setProperty('--theme-hover', '#1a2332');
    } else if (theme === 'indigo') {
      // Indigo theme - Deep indigo with violet accents
      root.style.setProperty('--theme-bg-primary', '#1e1b4b');
      root.style.setProperty('--theme-bg-secondary', '#312e81');
      root.style.setProperty('--theme-bg-tertiary', '#4338ca');
      root.style.setProperty('--theme-text-primary', '#ffffff');
      root.style.setProperty('--theme-text-secondary', '#c7d2fe');
      root.style.setProperty('--theme-text-muted', '#a5b4fc');
      root.style.setProperty('--theme-border', '#4338ca');
      root.style.setProperty('--theme-accent', '#00D4FF');
      root.style.setProperty('--theme-accent-secondary', '#8B5CF6');
      root.style.setProperty('--theme-card-bg', '#312e81');
      root.style.setProperty('--theme-card-border', '#4338ca');
      root.style.setProperty('--theme-hover', '#4338ca');
    } else {
      // White theme - Clean minimal with neon accents
      root.style.setProperty('--theme-bg-primary', '#ffffff');
      root.style.setProperty('--theme-bg-secondary', '#f8fafc');
      root.style.setProperty('--theme-bg-tertiary', '#e2e8f0');
      root.style.setProperty('--theme-text-primary', '#1a1a1a');
      root.style.setProperty('--theme-text-secondary', '#6c757d');
      root.style.setProperty('--theme-text-muted', '#adb5bd');
      root.style.setProperty('--theme-border', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--theme-accent', '#00D4FF');
      root.style.setProperty('--theme-accent-secondary', '#8B5CF6');
      root.style.setProperty('--theme-card-bg', '#ffffff');
      root.style.setProperty('--theme-card-border', '#dee2e6');
      root.style.setProperty('--theme-hover', '#f1f3f5');
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: setThemeValue,
    cycleTheme,
    isDark: theme === 'dark',
    isWhite: theme === 'white',
    isIndigo: theme === 'indigo',
    isLight: theme === 'white' // For backward compatibility
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
