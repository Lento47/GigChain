/**
 * GigChain.io - Language Selector Component
 * Dropdown to switch between supported languages
 */

import React, { useState } from 'react';
import { useI18n } from '../i18n/i18nContext';
import './LanguageSelector.css';

const LanguageSelector = ({ className = '', showFullName = false }) => {
  const { language, changeLanguage, availableLanguages, getCurrentLanguage, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = getCurrentLanguage();

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className={`language-selector ${className}`}>
      <button
        className="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('common.select_language')}
      >
        <span className="language-flag">{currentLang.flag}</span>
        {showFullName && (
          <span className="language-name">{currentLang.native}</span>
        )}
        <span className="language-code">{currentLang.code.toUpperCase()}</span>
        <svg
          className={`dropdown-icon ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="language-dropdown-overlay" onClick={() => setIsOpen(false)} />
          <div className="language-dropdown">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                className={`language-option ${language === lang.code ? 'active' : ''}`}
                onClick={() => handleLanguageChange(lang.code)}
              >
                <span className="language-flag">{lang.flag}</span>
                <div className="language-info">
                  <span className="language-native">{lang.native_name || lang.native}</span>
                  <span className="language-english">{lang.name}</span>
                </div>
                {language === lang.code && (
                  <svg
                    className="check-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 8L6 11L13 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
