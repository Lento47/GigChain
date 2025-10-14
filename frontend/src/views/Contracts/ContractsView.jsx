import React, { useState, useCallback } from 'react';
import { Plus, FileText, BarChart3 } from 'lucide-react';
import ContractsTable from './ContractsTable';
import ContractCreateModal from '../../components/features/Contract/ContractCreateModal';
import { useWallet } from '../../hooks/useWallet';
import { useNotifications } from '../../components/common/NotificationCenter/NotificationCenter';
import { API_BASE_URL } from '../../constants/api';
import { logger } from '../../utils/logger';
import './Contracts.css';

const ContractsView = () => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [userRole, setUserRole] = useState('all'); // 'all', 'freelancer', 'client'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { address } = useWallet();
  const { addNotification } = useNotifications();

  const handleCreateNewContract = useCallback(async (contractData) => {
    try {
      // Log del evento analytics
      logger.action('new_contract_clicked');
      
      // Mostrar notificación de inicio
      addNotification({
        id: Date.now(),
        type: 'info',
        title: 'Nuevo Contrato',
        message: 'Procesando contrato con IA...',
        timestamp: new Date()
      });

      // Usar datos del formulario o datos por defecto
      const requestData = contractData || {
        text: `Nuevo contrato creado desde la gestión de contratos.
               Usuario: ${address || 'Usuario conectado'}
               Fecha: ${new Date().toLocaleDateString()}
               Rol seleccionado: ${userRole}
               Tipo: Contrato personalizado`
      };

      // Determinar qué endpoint usar basado en los datos
      const endpoint = contractData && typeof contractData === 'object' && 'description' in contractData
        ? '/api/structured_contract'
        : '/api/full_flow';
        
      const dataToSend = contractData && typeof contractData === 'object' && 'description' in contractData
        ? contractData
        : requestData;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Mostrar notificación de éxito
        addNotification({
          id: Date.now() + 1,
          type: 'success',
          title: 'Contrato Creado',
          message: `Nuevo contrato ${result.contract_id || 'generado'} creado exitosamente`,
          timestamp: new Date()
        });

        logger.info('New contract created successfully:', result.contract_id);
        
        // Forzar actualización de la lista de contratos
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
      
    } catch (error) {
      logger.error('Error creating new contract:', error);
      
      // Mostrar notificación de error
      addNotification({
        id: Date.now() + 2,
        type: 'error',
        title: 'Error al Crear Contrato',
        message: 'Hubo un problema al crear el nuevo contrato. Intenta nuevamente.',
        timestamp: new Date()
      });
    }
  }, [addNotification, address, userRole]);

  const handleOpenCreateModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  return (
    <div className="contracts-view">
      {/* Action Bar */}
      <div className="action-bar">
        <div className="role-selector">
          <button 
            className={`role-btn ${userRole === 'all' ? 'active' : ''}`}
            onClick={() => setUserRole('all')}
          >
            <BarChart3 size={16} />
            <span>Todos</span>
          </button>
          <button 
            className={`role-btn ${userRole === 'freelancer' ? 'active' : ''}`}
            onClick={() => setUserRole('freelancer')}
          >
            <span className="btn-emoji">👨‍💻</span>
            <span>Freelancer</span>
          </button>
          <button 
            className={`role-btn ${userRole === 'client' ? 'active' : ''}`}
            onClick={() => setUserRole('client')}
          >
            <span className="btn-emoji">🏢</span>
            <span>Cliente</span>
          </button>
        </div>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>{userRole === 'client' ? 'Nuevo Proyecto' : userRole === 'freelancer' ? 'Nuevo Servicio' : 'Nuevo'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <ContractsTable walletAddress={address} userRole={userRole} />

      {/* Modal de Crear Contrato */}
      <ContractCreateModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onCreateContract={handleCreateNewContract}
        userRole={userRole === 'all' ? 'freelancer' : userRole}
        walletAddress={address}
      />
    </div>
  );
};

export default ContractsView;

