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
      <div className="view-header">
        <div className="header-info">
          <h1>Configuración</h1>
          <p>Personaliza tu experiencia en GigChain</p>
        </div>
        <button className="save-btn" onClick={handleSave}>
          <Save size={20} />
          Guardar Cambios
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <div className="section-header">
            <User size={24} />
            <h2>Perfil</h2>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Nombre de Usuario</h4>
              <p>Tu identificador en la plataforma</p>
            </div>
            <input 
              type="text" 
              className="setting-input"
              placeholder="usuario123"
            />
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Email</h4>
              <p>Correo electrónico para notificaciones</p>
            </div>
            <input 
              type="email" 
              className="setting-input"
              placeholder="correo@ejemplo.com"
            />
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <Bell size={24} />
            <h2>Notificaciones</h2>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Notificaciones Push</h4>
              <p>Recibe notificaciones en tiempo real</p>
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
          <div className="setting-item">
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

        <div className="settings-section">
          <div className="section-header">
            <Globe size={24} />
            <h2>Preferencias</h2>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Idioma</h4>
              <p>Selecciona tu idioma preferido</p>
            </div>
            <select 
              className="setting-select"
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value)}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Modo Oscuro</h4>
              <p>Activa el tema oscuro</p>
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

        <div className="settings-section">
          <div className="section-header">
            <Shield size={24} />
            <h2>Seguridad</h2>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Autenticación de Dos Factores</h4>
              <p>Protege tu cuenta con 2FA</p>
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
            <div className="setting-info">
              <h4>Cambiar Contraseña</h4>
              <p>Actualiza tu contraseña de seguridad</p>
            </div>
            <button className="change-password-btn">Cambiar</button>
          </div>
        </div>
      </div>
    </div>
  );
});

SettingsView.displayName = 'SettingsView';

export { SettingsView };
export default SettingsView;
