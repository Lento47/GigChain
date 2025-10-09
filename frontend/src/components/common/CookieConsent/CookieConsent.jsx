import React, { useState, useEffect } from 'react';
import { Cookie, Shield, Settings, X, Check } from 'lucide-react';
import { logger } from '../utils/logger';
import '../styles/components/cookie-consent.css';

const CookieConsent = ({ onAccept }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    preferences: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('gigchain_cookie_consent');
    if (!cookieConsent) {
      // Show banner after 1 second
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      // Load saved preferences
      const saved = JSON.parse(cookieConsent);
      setPreferences(saved);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      preferences: true,
      analytics: true,
      marketing: false // Still false for privacy
    };
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyEssential = {
      essential: true,
      preferences: false,
      analytics: false,
      marketing: false
    };
    savePreferences(onlyEssential);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  const savePreferences = (prefs) => {
    localStorage.setItem('gigchain_cookie_consent', JSON.stringify(prefs));
    setIsVisible(false);
    if (onAccept) {
      onAccept(prefs);
    }
    
    // Apply preferences
    applyCookiePreferences(prefs);
  };

  const applyCookiePreferences = (prefs) => {
    // Remove non-essential cookies if not consented
    if (!prefs.preferences) {
      // Remove preference cookies
      localStorage.removeItem('gigchain_theme');
      localStorage.removeItem('gigchain_language');
    }
    
    if (!prefs.analytics) {
      // Disable analytics tracking
      window.ga && window.ga('remove');
      logger.info('Analytics tracking disabled by user preference');
    } else {
      // Enable analytics
      logger.info('Analytics tracking enabled by user preference');
      logger.analytics('analytics_enabled', { timestamp: new Date().toISOString() });
    }
    
    // Marketing cookies (we don't use them, but included for completeness)
    if (!prefs.marketing) {
      logger.debug('Marketing cookies disabled (not used)');
    }
  };

  const togglePreference = (key) => {
    if (key === 'essential') return; // Can't disable essential cookies
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent-overlay">
      <div className={`cookie-consent-banner ${showDetails ? 'expanded' : ''}`}>
        <div className="cookie-header">
          <div className="cookie-title">
            <Cookie className="cookie-icon" />
            <div>
              <h3>Gestión de Cookies y Privacidad</h3>
              <p>Usamos cookies para mejorar tu experiencia en GigChain</p>
            </div>
          </div>
          <button className="close-btn" onClick={handleRejectAll} title="Rechazar todo">
            <X size={20} />
          </button>
        </div>

        <div className="cookie-content">
          {!showDetails ? (
            <div className="cookie-simple">
              <p>
                Utilizamos cookies esenciales para el funcionamiento de la plataforma y cookies 
                opcionales para mejorar tu experiencia. Puedes personalizar tus preferencias en 
                cualquier momento.
              </p>
              
              <div className="cookie-info">
                <Shield size={18} />
                <span>
                  <strong>Tu privacidad es importante.</strong> No vendemos datos ni usamos cookies de terceros para publicidad.
                </span>
              </div>
            </div>
          ) : (
            <div className="cookie-detailed">
              <div className="cookie-category">
                <div className="category-header">
                  <div className="category-info">
                    <h4>
                      <Check className="check-icon always-on" />
                      Cookies Esenciales
                    </h4>
                    <span className="category-badge required">Siempre Activas</span>
                  </div>
                </div>
                <p className="category-description">
                  Necesarias para el funcionamiento básico: autenticación de wallet, seguridad, 
                  prevención de fraude. No se pueden desactivar.
                </p>
                <div className="cookie-examples">
                  <strong>Ejemplos:</strong> gigchain_session, wallet_signature, csrf_token
                </div>
              </div>

              <div className="cookie-category">
                <div className="category-header">
                  <div className="category-info">
                    <h4>
                      <div 
                        className={`toggle-switch ${preferences.preferences ? 'active' : ''}`}
                        onClick={() => togglePreference('preferences')}
                      >
                        <div className="toggle-slider"></div>
                      </div>
                      Cookies de Preferencias
                    </h4>
                    <span className="category-badge optional">Opcional</span>
                  </div>
                </div>
                <p className="category-description">
                  Guardan tus preferencias de interfaz: tema oscuro/claro, idioma, configuración 
                  de notificaciones.
                </p>
                <div className="cookie-examples">
                  <strong>Ejemplos:</strong> gigchain_theme, gigchain_language, notification_settings
                </div>
              </div>

              <div className="cookie-category">
                <div className="category-header">
                  <div className="category-info">
                    <h4>
                      <div 
                        className={`toggle-switch ${preferences.analytics ? 'active' : ''}`}
                        onClick={() => togglePreference('analytics')}
                      >
                        <div className="toggle-slider"></div>
                      </div>
                      Cookies de Analytics
                    </h4>
                    <span className="category-badge optional">Opcional</span>
                  </div>
                </div>
                <p className="category-description">
                  Analizan cómo usas la plataforma para mejorar funcionalidades. Datos anonimizados 
                  y agregados.
                </p>
                <div className="cookie-examples">
                  <strong>Ejemplos:</strong> _ga (Google Analytics), plausible_session (Plausible)
                </div>
              </div>

              <div className="cookie-category">
                <div className="category-header">
                  <div className="category-info">
                    <h4>
                      <div 
                        className={`toggle-switch ${preferences.marketing ? 'active' : ''}`}
                        onClick={() => togglePreference('marketing')}
                      >
                        <div className="toggle-slider"></div>
                      </div>
                      Cookies de Marketing
                    </h4>
                    <span className="category-badge optional">Opcional</span>
                  </div>
                </div>
                <p className="category-description">
                  <strong>Actualmente no utilizadas.</strong> Reservado para futuras campañas de 
                  marketing (nunca de terceros).
                </p>
                <div className="cookie-examples">
                  <strong>Nota:</strong> GigChain no usa cookies de marketing actualmente.
                </div>
              </div>

              <div className="cookie-policy-link">
                <p>
                  Consulta nuestra <a href="/privacy" target="_blank">Política de Privacidad</a> para 
                  más detalles sobre cómo procesamos tus datos.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="cookie-actions">
          {!showDetails ? (
            <>
              <button className="btn-text" onClick={() => setShowDetails(true)}>
                <Settings size={18} />
                Personalizar
              </button>
              <button className="btn-secondary" onClick={handleRejectAll}>
                Rechazar Todo
              </button>
              <button className="btn-primary" onClick={handleAcceptAll}>
                <Check size={18} />
                Aceptar Todo
              </button>
            </>
          ) : (
            <>
              <button className="btn-text" onClick={() => setShowDetails(false)}>
                Volver
              </button>
              <button className="btn-secondary" onClick={handleRejectAll}>
                Solo Esenciales
              </button>
              <button className="btn-primary" onClick={handleSavePreferences}>
                <Check size={18} />
                Guardar Preferencias
              </button>
            </>
          )}
        </div>

        <div className="cookie-footer">
          <p>
            <Shield size={14} />
            Cumplimos con GDPR, CCPA y otras regulaciones de privacidad. 
            Tus datos nunca se venden a terceros.
          </p>
        </div>
      </div>
    </div>
  );
};

// Component to show cookie settings later (in footer or settings)
export const CookieSettingsButton = () => {
  const [showBanner, setShowBanner] = useState(false);

  const openCookieSettings = () => {
    // Remove consent to show banner again
    localStorage.removeItem('gigchain_cookie_consent');
    setShowBanner(true);
  };

  return (
    <>
      <button onClick={openCookieSettings} className="cookie-settings-link">
        <Cookie size={16} />
        Gestionar Cookies
      </button>
      {showBanner && (
        <CookieConsent onAccept={() => setShowBanner(false)} />
      )}
    </>
  );
};

export default CookieConsent;
