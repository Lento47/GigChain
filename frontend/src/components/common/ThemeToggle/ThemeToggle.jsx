import React, { useState } from 'react';
import { Palette, Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ size = 'medium', showLabel = false, variant = 'palette' }) => {
  const { theme, setTheme, cycleTheme, isDark, isWhite, isIndigo } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { id: 'white', name: 'White', icon: Sun, description: 'Clean minimal' },
    { id: 'dark', name: 'Dark', icon: Moon, description: 'Minimal industrial' },
    { id: 'indigo', name: 'Indigo', icon: Sparkles, description: 'Deep indigo' }
  ];

  const getCurrentTheme = () => themes.find(t => t.id === theme) || themes[0];

  const handleThemeSelect = (themeId) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  if (variant === 'palette') {
    return (
      <div className="theme-palette-container">
        <button
          className={`theme-palette theme-palette--${size}`}
          onClick={() => setIsOpen(!isOpen)}
          title="Cambiar tema"
          aria-label="Cambiar tema"
        >
          <div className="theme-palette__container">
            <Palette size={size === 'small' ? 16 : 20} />
            {showLabel && (
              <span className="theme-palette__label">
                {getCurrentTheme().name}
              </span>
            )}
          </div>
        </button>

        {isOpen && (
          <div className="theme-palette-dropdown">
            <div className="theme-palette-header">
              <h4>Seleccionar Tema</h4>
            </div>
            <div className="theme-palette-options">
              {themes.map((themeOption) => {
                const IconComponent = themeOption.icon;
                return (
                  <button
                    key={themeOption.id}
                    className={`theme-palette-option ${theme === themeOption.id ? 'active' : ''}`}
                    onClick={() => handleThemeSelect(themeOption.id)}
                    title={themeOption.description}
                  >
                    <IconComponent size={16} />
                    <div className="theme-palette-option-content">
                      <span className="theme-palette-option-name">{themeOption.name}</span>
                      <span className="theme-palette-option-desc">{themeOption.description}</span>
                    </div>
                    {theme === themeOption.id && (
                      <div className="theme-palette-check">✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Legacy single toggle for backward compatibility
  return (
    <button
      className={`theme-toggle theme-toggle--${size}`}
      onClick={cycleTheme}
      title={`Cambiar tema (actual: ${getCurrentTheme().name})`}
      aria-label={`Cambiar tema (actual: ${getCurrentTheme().name})`}
    >
      <div className="theme-toggle__container">
        <div className={`theme-toggle__icon theme-toggle__icon--${theme}`}>
          {isWhite && <Sun size={size === 'small' ? 16 : 20} />}
          {isDark && <Moon size={size === 'small' ? 16 : 20} />}
          {isIndigo && <Sparkles size={size === 'small' ? 16 : 20} />}
        </div>
        {showLabel && (
          <span className="theme-toggle__label">
            {getCurrentTheme().name}
          </span>
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
