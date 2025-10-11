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
    // Check localStorage first, then system preference, then default to light
    const savedTheme = localStorage.getItem('gigchain-theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('gigchain-theme', newTheme);
      return newTheme;
    });
  };

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update CSS variables based on theme
    const root = document.documentElement;
    
    if (theme === 'dark') {
      // Dark theme variables
      root.style.setProperty('--bg-primary', '#1e293b');
      root.style.setProperty('--bg-secondary', '#0f172a');
      root.style.setProperty('--bg-tertiary', '#334155');
      root.style.setProperty('--bg-dark', '#0f172a');
      root.style.setProperty('--bg-darker', '#020617');
      
      root.style.setProperty('--text-primary', '#f8fafc');
      root.style.setProperty('--text-secondary', '#cbd5e1');
      root.style.setProperty('--text-muted', '#94a3b8');
      root.style.setProperty('--text-inverse', '#0f172a');
      
      root.style.setProperty('--border-color', '#475569');
      root.style.setProperty('--border-light', '#334155');
      
      root.style.setProperty('--shadow-sm', '0 1px 2px 0 rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(0, 0, 0, 0.4)');
      root.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.5)');
      root.style.setProperty('--shadow-xl', '0 20px 25px -5px rgba(0, 0, 0, 0.6)');
    } else {
      // Light theme variables (vibrant and attractive)
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8fafc');
      root.style.setProperty('--bg-tertiary', '#f1f5f9');
      root.style.setProperty('--bg-accent', '#f0f9ff');
      root.style.setProperty('--bg-dark', '#1e293b');
      root.style.setProperty('--bg-darker', '#0f172a');
      
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-secondary', '#1e293b');
      root.style.setProperty('--text-muted', '#64748b');
      root.style.setProperty('--text-accent', '#3b82f6');
      root.style.setProperty('--text-inverse', '#ffffff');
      
      root.style.setProperty('--border-color', '#e2e8f0');
      root.style.setProperty('--border-light', '#f1f5f9');
      root.style.setProperty('--border-accent', '#3b82f6');
      
      root.style.setProperty('--shadow-sm', '0 1px 2px 0 rgba(59, 130, 246, 0.05)');
      root.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(59, 130, 246, 0.1)');
      root.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(59, 130, 246, 0.1)');
      root.style.setProperty('--shadow-xl', '0 20px 25px -5px rgba(59, 130, 246, 0.1)');
    }
  }, [theme]);

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
