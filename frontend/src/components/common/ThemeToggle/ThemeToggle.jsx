import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ size = 'medium', showLabel = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      className={`theme-toggle theme-toggle--${size}`}
      onClick={toggleTheme}
      title={`Cambiar a tema ${isDark ? 'claro' : 'oscuro'}`}
      aria-label={`Cambiar a tema ${isDark ? 'claro' : 'oscuro'}`}
    >
      <div className="theme-toggle__container">
        <div className={`theme-toggle__icon theme-toggle__icon--${theme}`}>
          {isDark ? <Sun size={size === 'small' ? 16 : 20} /> : <Moon size={size === 'small' ? 16 : 20} />}
        </div>
        {showLabel && (
          <span className="theme-toggle__label">
            {isDark ? 'Modo Claro' : 'Modo Oscuro'}
          </span>
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
