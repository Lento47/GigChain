import React, { useState, useCallback } from 'react';
import { Settings, User, Bell, Shield, Globe, Moon, Sun, Save } from 'lucide-react';
import './Settings.css';

const SettingsView = React.memo(() => {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    darkMode: false,
    language: 'es',
    timezone: 'UTC-5',
    twoFactor: false
  });

  const handleToggle = useCallback((key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const handleChange = useCallback((key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleSave = useCallback(() => {
    alert('Configuración guardada exitosamente');
    console.log('Settings saved:', settings);
  }, [settings]);

  return (
    <div className="settings-view">
      {/* Action Bar */}
      <div className="action-bar">
        <div className="settings-info">
          <span className="settings-subtitle">
            Personaliza tu experiencia y ajusta tus preferencias
          </span>
        </div>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={handleSave}>
            <Save size={18} />
            <span>Guardar</span>
          </button>
        </div>
      </div>

      <div className="settings-content">
        {/* Perfil Section */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon">
              <User size={24} />
            </div>
            <div className="section-title">
              <h2>Perfil de Usuario</h2>
              <p>Administra tu información personal</p>
            </div>
          </div>
          <div className="settings-grid">
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">Nombre de Usuario</span>
                <span className="label-description">Tu identificador único en la plataforma</span>
              </label>
              <input 
                type="text" 
                className="setting-input"
                placeholder="usuario123"
                defaultValue="JohnDoe"
              />
            </div>
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">Correo Electrónico</span>
                <span className="label-description">Para notificaciones y recuperación</span>
              </label>
              <input 
                type="email" 
                className="setting-input"
                placeholder="correo@ejemplo.com"
                defaultValue="john@example.com"
              />
            </div>
          </div>
        </div>

        {/* Notificaciones Section */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon">
              <Bell size={24} />
            </div>
            <div className="section-title">
              <h2>Notificaciones</h2>
              <p>Controla cómo recibes actualizaciones</p>
            </div>
          </div>
          <div className="settings-grid">
            <div className="setting-item toggle-item">
              <div className="setting-info">
                <h4>Notificaciones Push</h4>
                <p>Recibe alertas en tiempo real en tu navegador</p>
              </div>
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={settings.notifications}
                  onChange={() => handleToggle('notifications')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-item toggle-item">
              <div className="setting-info">
                <h4>Alertas por Email</h4>
                <p>Recibe actualizaciones importantes por correo</p>
              </div>
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={settings.emailAlerts}
                  onChange={() => handleToggle('emailAlerts')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Preferencias Section */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon">
              <Globe size={24} />
            </div>
            <div className="section-title">
              <h2>Preferencias Generales</h2>
              <p>Ajusta la apariencia y el idioma</p>
            </div>
          </div>
          <div className="settings-grid">
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">Idioma</span>
                <span className="label-description">Selecciona tu idioma preferido</span>
              </label>
              <select 
                className="setting-select"
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
              >
                <option value="es">🇪🇸 Español</option>
                <option value="en">🇺🇸 English</option>
                <option value="pt">🇧🇷 Português</option>
              </select>
            </div>
            <div className="setting-item toggle-item">
              <div className="setting-info">
                <h4>Modo Oscuro</h4>
                <p>Alterna entre tema claro y oscuro</p>
              </div>
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={settings.darkMode}
                  onChange={() => handleToggle('darkMode')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Seguridad Section */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon security">
              <Shield size={24} />
            </div>
            <div className="section-title">
              <h2>Seguridad y Privacidad</h2>
              <p>Protege tu cuenta y datos</p>
            </div>
          </div>
          <div className="settings-grid">
            <div className="setting-item toggle-item">
              <div className="setting-info">
                <h4>Autenticación de Dos Factores (2FA)</h4>
                <p>Añade una capa extra de seguridad</p>
              </div>
              <label className="toggle">
                <input 
                  type="checkbox" 
                  checked={settings.twoFactor}
                  onChange={() => handleToggle('twoFactor')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <label className="setting-label">
                <span className="label-text">Contraseña</span>
                <span className="label-description">Actualiza tu contraseña regularmente</span>
              </label>
              <button className="change-password-btn">
                <Shield size={18} />
                Cambiar Contraseña
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SettingsView.displayName = 'SettingsView';

export { SettingsView };
export default SettingsView;
