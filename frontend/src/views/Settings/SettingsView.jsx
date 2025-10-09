import React, { useState } from 'react';
import { Settings, Globe, Bell, Shield, Wifi, Lock } from 'lucide-react';

// Inline styles
const styles = {
  view: {
    padding: '2rem',
    background: '#f8fafc',
    minHeight: '100vh'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 0.5rem 0'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#94a3b8',
    margin: '0 0 2rem 0'
  },
  content: {
    display: 'flex',
    gap: '2rem',
    background: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '20px',
    padding: '2rem',
    border: '1px solid #334155'
  },
  tabs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    minWidth: '250px'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid #475569',
    borderRadius: '12px',
    color: '#94a3b8',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  tabActive: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    borderColor: '#6366f1',
    color: 'white'
  },
  panel: {
    flex: 1,
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '2rem'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#e2e8f0',
    margin: '0 0 2rem 0',
    fontWeight: '600'
  },
  formGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    color: '#e2e8f0',
    fontWeight: '600',
    marginBottom: '0.75rem'
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '2px solid #475569',
    borderRadius: '10px',
    color: '#e2e8f0',
    fontSize: '1rem',
    transition: 'all 0.3s ease'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    padding: '1rem',
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid #475569',
    borderRadius: '10px',
    transition: 'all 0.3s ease'
  }
};

const SettingsView = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'network', label: 'Red', icon: Wifi },
    { id: 'privacy', label: 'Privacidad', icon: Lock }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div>
            <h3 style={styles.sectionTitle}>Configuración General</h3>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="language">Idioma:</label>
              <select style={styles.input} id="language" name="language">
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="currency">Moneda:</label>
              <select style={styles.input} id="currency" name="currency">
                <option value="USDC">USDC</option>
                <option value="MATIC">MATIC</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="theme">Tema:</label>
              <select style={styles.input} id="theme" name="theme">
                <option value="dark">Oscuro</option>
                <option value="light">Claro</option>
              </select>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div>
            <h3 style={styles.sectionTitle}>Notificaciones</h3>
            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" defaultChecked />
                <span>Notificaciones por Email</span>
              </label>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" />
                <span>Notificaciones Push</span>
              </label>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" defaultChecked />
                <span>Actualizaciones de Contratos</span>
              </label>
            </div>
          </div>
        );
      case 'security':
        return (
          <div>
            <h3 style={styles.sectionTitle}>Seguridad</h3>
            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" />
                <span>Autenticación de Dos Factores (2FA)</span>
              </label>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="sessionTimeout">Tiempo de Sesión:</label>
              <select style={styles.input} id="sessionTimeout" name="sessionTimeout">
                <option value="15min">15 minutos</option>
                <option value="30min">30 minutos</option>
                <option value="1hour">1 hora</option>
              </select>
            </div>
          </div>
        );
      case 'network':
        return (
          <div>
            <h3 style={styles.sectionTitle}>Configuración de Red</h3>
            <div style={styles.formGroup}>
              <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
                Red Actual: <strong style={{ color: '#e2e8f0' }}>Mumbai Testnet</strong>
              </p>
              <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
                Redes Soportadas: Polygon Mainnet, Mumbai Testnet
              </p>
              <button style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Cambiar Red
              </button>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div>
            <h3 style={styles.sectionTitle}>Privacidad</h3>
            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" defaultChecked />
                <span>Compartir datos anónimos para mejoras</span>
              </label>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" />
                <span>Recibir comunicaciones de marketing</span>
              </label>
            </div>
            <div style={styles.formGroup}>
              <button style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#94a3b8',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Solicitar mis datos
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.view}>
      <h1 style={styles.title}>Configuración</h1>
      <p style={styles.subtitle}>Personaliza tu experiencia en GigChain</p>

      <div style={styles.content}>
        <div style={styles.tabs}>
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <div
                key={tab.id}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.id ? styles.tabActive : {})
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={18} />
                {tab.label}
              </div>
            );
          })}
        </div>

        <div style={styles.panel}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export { SettingsView };
export default SettingsView;