import React, { useState } from 'react';
import { Settings, Database, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import './SettingsPage.css';

const SettingsPage = () => {
  const { deleteTestContracts, clearAllData } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'

  const handleDeleteTestContracts = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar todos los contratos de prueba? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const result = await deleteTestContracts();
      setMessage(`✅ Eliminados ${result.deleted_contracts} contratos de prueba y ${result.deleted_activities} actividades`);
      setMessageType('success');
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('⚠️ PELIGRO: ¿Estás seguro de que quieres eliminar TODOS los datos de la base de datos? Esta acción eliminará TODOS los contratos y actividades y NO se puede deshacer.')) {
      return;
    }

    if (!window.confirm('⚠️ CONFIRMACIÓN FINAL: Esta acción eliminará PERMANENTEMENTE todos los datos. ¿Estás absolutamente seguro?')) {
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const result = await clearAllData();
      setMessage(`✅ Base de datos limpiada: ${result.cleared_contracts} contratos y ${result.cleared_activities} actividades eliminadas`);
      setMessageType('success');
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Settings size={32} /> System Settings</h1>
        <p>Configure platform settings and database management</p>
      </div>

      {/* Database Management Section */}
      <div className="settings-section">
        <div className="section-header">
          <h2><Database size={24} /> Database Management</h2>
          <p>Manage database content and cleanup operations</p>
        </div>

        <div className="settings-cards">
          {/* Delete Test Contracts Card */}
          <div className="settings-card">
            <div className="card-header">
              <Trash2 size={20} />
              <h3>Delete Test Contracts</h3>
            </div>
            <div className="card-content">
              <p>Elimina contratos de prueba que contengan palabras como "test", "Test", "prueba" o que tengan direcciones de cliente nulas.</p>
              <ul>
                <li>✓ Elimina contratos con títulos de prueba</li>
                <li>✓ Elimina contratos con client_address = 0x0000...</li>
                <li>✓ Elimina contratos creados hoy</li>
                <li>✓ Elimina actividades relacionadas</li>
              </ul>
            </div>
            <div className="card-actions">
              <button 
                className="btn btn-warning"
                onClick={handleDeleteTestContracts}
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Delete Test Contracts'}
              </button>
            </div>
          </div>

          {/* Clear All Data Card */}
          <div className="settings-card danger">
            <div className="card-header">
              <AlertTriangle size={20} />
              <h3>Clear All Database Data</h3>
            </div>
            <div className="card-content">
              <p><strong>⚠️ PELIGRO:</strong> Esta acción eliminará TODOS los datos de la base de datos.</p>
              <ul>
                <li>❌ Elimina TODOS los contratos</li>
                <li>❌ Elimina TODAS las actividades</li>
                <li>❌ NO se puede deshacer</li>
                <li>❌ Solo para desarrollo/testing</li>
              </ul>
            </div>
            <div className="card-actions">
              <button 
                className="btn btn-danger"
                onClick={handleClearAllData}
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Clear All Data'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`status-message ${messageType}`}>
            {messageType === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Other Settings Sections */}
      <div className="settings-section">
        <div className="section-header">
          <h2>Platform Configuration</h2>
          <p>Coming soon: Manage platform configuration and admin accounts</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
