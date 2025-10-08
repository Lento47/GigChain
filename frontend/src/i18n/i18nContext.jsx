/**
 * GigChain.io - Internationalization Context
 * Provides translation capabilities throughout the React app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const I18nContext = createContext();

// Supported languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  es: { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  pt: { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  fr: { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  de: { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  zh: { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  ja: { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  ko: { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' }
};

// Default translations (fallback)
const DEFAULT_TRANSLATIONS = {
  common: {
    success: 'Success',
    error: 'Error',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create'
  }
};

export const I18nProvider = ({ children, apiUrl = 'http://localhost:5000' }) => {
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState(DEFAULT_TRANSLATIONS);
  const [loading, setLoading] = useState(true);
  const [availableLanguages, setAvailableLanguages] = useState(Object.values(LANGUAGES));

  // Detect browser language on mount
  useEffect(() => {
    const detectLanguage = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/i18n/detect`);
        const detectedLang = response.data.detected_language;
        
        // Check if detected language is supported
        if (LANGUAGES[detectedLang]) {
          setLanguage(detectedLang);
        }
      } catch (error) {
        console.warn('Failed to detect language, using default (en):', error);
      }
    };

    // Check localStorage first
    const savedLanguage = localStorage.getItem('gigchain_language');
    if (savedLanguage && LANGUAGES[savedLanguage]) {
      setLanguage(savedLanguage);
    } else {
      detectLanguage();
    }
  }, [apiUrl]);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/api/i18n/translations/${language}`);
        setTranslations(response.data.translations);
        
        // Save to localStorage
        localStorage.setItem('gigchain_language', language);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Use default translations on error
        setTranslations(DEFAULT_TRANSLATIONS);
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [language, apiUrl]);

  // Load available languages
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/i18n/languages`);
        setAvailableLanguages(response.data);
      } catch (error) {
        console.warn('Failed to load available languages:', error);
      }
    };

    loadLanguages();
  }, [apiUrl]);

  // Translate function
  const t = useCallback((key, variables = {}) => {
    // Navigate through nested keys
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Return key if translation not found
        console.warn(`Translation not found: ${key}`);
        return key;
      }
    }

    // If value is not a string, return the key
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }

    // Interpolate variables
    let result = value;
    Object.keys(variables).forEach(varKey => {
      result = result.replace(`{${varKey}}`, variables[varKey]);
    });

    return result;
  }, [translations]);

  // Change language function
  const changeLanguage = useCallback((newLanguage) => {
    if (LANGUAGES[newLanguage]) {
      setLanguage(newLanguage);
    } else {
      console.error(`Unsupported language: ${newLanguage}`);
    }
  }, []);

  // Get current language info
  const getCurrentLanguage = useCallback(() => {
    return LANGUAGES[language] || LANGUAGES.en;
  }, [language]);

  const value = {
    language,
    changeLanguage,
    t,
    translations,
    loading,
    availableLanguages,
    getCurrentLanguage,
    languages: LANGUAGES
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// Custom hook to use i18n
export const useI18n = () => {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  
  return context;
};

// HOC for class components
export const withI18n = (Component) => {
  return (props) => {
    const i18n = useI18n();
    return <Component {...props} i18n={i18n} />;
  };
};
