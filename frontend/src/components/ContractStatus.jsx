import React, { useState } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle, DollarSign, Calendar, Users, Shield } from 'lucide-react';
import { useContractManager } from '../hooks/useContract';

export const ContractStatus = ({ contractAddress, onAction }) => {
  const {
    contractInfo,
    isLoading,
    error,
    contractBalance,
    milestones,
    contractStatus,
    getContractSummary,
    getMilestoneStatus
  } = useContractManager(contractAddress);

  const [selectedMilestone, setSelectedMilestone] = useState(null);

  if (!contractAddress) {
    return (
      <div className="contract-status">
        <div className="no-contract">
          <FileText size={48} className="no-contract-icon" />
          <h3>No hay contrato seleccionado</h3>
          <p>Selecciona un contrato para ver su estado</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="contract-status">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando información del contrato...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contract-status">
        <div className="error-state">
          <AlertTriangle size={48} className="error-icon" />
          <h3>Error al cargar el contrato</h3>
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const summary = getContractSummary();
  if (!summary) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} className="status-icon active" />;
      case 'completed': return <CheckCircle size={16} className="status-icon completed" />;
      case 'disputed': return <AlertTriangle size={16} className="status-icon disputed" />;
      case 'pending': return <Clock size={16} className="status-icon pending" />;
      default: return <Clock size={16} className="status-icon unknown" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      case 'disputed': return 'En disputa';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="contract-status">
      <div className="contract-header">
        <div className="contract-title">
          <FileText size={20} />
          <h3>Estado del Contrato</h3>
        </div>
        <div className="contract-address">
          <span className="address-label">Dirección:</span>
          <span className="address-value">{contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}</span>
        </div>
      </div>

      <div className="contract-overview">
        <div className="overview-grid">
          <div className="overview-item">
            <div className="item-icon">
              <DollarSign size={20} />
            </div>
            <div className="item-content">
              <div className="item-label">Balance</div>
              <div className="item-value">{contractBalance} USDC</div>
            </div>
          </div>

          <div className="overview-item">
            <div className="item-icon">
              {getStatusIcon(contractStatus)}
            </div>
            <div className="item-content">
              <div className="item-label">Estado</div>
              <div className="item-value">{getStatusText(contractStatus)}</div>
            </div>
          </div>

          <div className="overview-item">
            <div className="item-icon">
              <Calendar size={20} />
            </div>
            <div className="item-content">
              <div className="item-label">Milestones</div>
              <div className="item-value">{summary.completedMilestones}/{summary.totalMilestones}</div>
            </div>
          </div>

          <div className="overview-item">
            <div className="item-icon">
              <Shield size={20} />
            </div>
            <div className="item-content">
              <div className="item-label">Disputas</div>
              <div className="item-value">{summary.hasDisputes ? 'Sí' : 'No'}</div>
            </div>
          </div>
        </div>
      </div>

      {milestones && milestones.length > 0 && (
        <div className="milestones-section">
          <h4>Milestones del Contrato</h4>
          <div className="milestones-list">
            {milestones.map((milestone, index) => {
              const status = getMilestoneStatus(index);
              const isSelected = selectedMilestone === index;
              
              return (
                <div 
                  key={index} 
                  className={`milestone-item ${status} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedMilestone(isSelected ? null : index)}
                >
                  <div className="milestone-header">
                    <div className="milestone-info">
                      <span className="milestone-number">#{index + 1}</span>
                      <span className="milestone-amount">{milestone.amount} USDC</span>
                    </div>
                    <div className="milestone-status">
                      {status === 'completed' ? (
                        <CheckCircle size={16} className="status-icon completed" />
                      ) : (
                        <Clock size={16} className="status-icon pending" />
                      )}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="milestone-details">
                      <div className="detail-item">
                        <span className="detail-label">Descripción:</span>
                        <span className="detail-value">{milestone.description}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Fecha límite:</span>
                        <span className="detail-value">{milestone.deadline}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Porcentaje:</span>
                        <span className="detail-value">{milestone.percentage}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="contract-actions">
        <button 
          className="action-btn primary"
          onClick={() => onAction && onAction('fund')}
          disabled={!summary.isFullyFunded}
        >
          <DollarSign size={16} />
          {summary.isFullyFunded ? 'Fondos Disponibles' : 'Fondear Contrato'}
        </button>
        
        <button 
          className="action-btn secondary"
          onClick={() => onAction && onAction('milestones')}
        >
          <Calendar size={16} />
          Gestionar Milestones
        </button>
        
        {summary.hasDisputes && (
          <button 
            className="action-btn warning"
            onClick={() => onAction && onAction('dispute')}
          >
            <AlertTriangle size={16} />
            Resolver Disputa
          </button>
        )}
      </div>
    </div>
  );
};

export default ContractStatus;
