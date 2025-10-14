import React from 'react';
import { X, ExternalLink, TrendingUp, Clock, DollarSign, Building2, Sparkles, Briefcase } from 'lucide-react';
import './modal.css';

const JobsModal = ({ isOpen, onClose, selectedPeriod, userType }) => {
  if (!isOpen) return null;

  // Use real contracts from selectedPeriod - NO MOCK DATA
  const contracts = selectedPeriod?.contracts || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="jobs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <Briefcase size={28} className="header-icon" />
            <div>
              <h3 className="modal-title">
                {selectedPeriod?.hour ? `Trabajos Disponibles - ${selectedPeriod.hour}` : 'Trabajos Disponibles'}
              </h3>
              <p className="modal-subtitle">
                {selectedPeriod?.hour 
                  ? `${selectedPeriod.open_contracts || 0} contratos abiertos, ${selectedPeriod.accepted_contracts || 0} aceptados`
                  : 'Encuentra tu próxima oportunidad'
                }
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {contracts.length > 0 && (
            <div className="jobs-summary">
              <div className="summary-card">
                <div className="summary-icon">
                  <Sparkles size={32} />
                </div>
                <div className="summary-content">
                  <h4>CONTRATOS DISPONIBLES</h4>
                  <div className="summary-number">
                    <TrendingUp size={24} className="trend-icon" />
                    <span>{contracts.length}</span>
                  </div>
                  <p>Oportunidades disponibles en este período</p>
                </div>
              </div>
            </div>
          )}

          <div className="jobs-grid">
            {contracts.length > 0 ? (
              contracts.map((contract) => (
                <div key={contract.id} className="job-card">
                  <div className="job-level-badge">{contract.category || 'General'}</div>
                  
                  <div className="job-header">
                    <div className="job-title-section">
                      <h4 className="job-title">{contract.title}</h4>
                      <div className="job-company">
                        <Building2 size={14} />
                        <span>Cliente: {contract.client_address?.slice(0, 6)}...{contract.client_address?.slice(-4)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="job-tags">
                    {contract.skills?.map((skill, index) => (
                      <span key={index} className="job-tag">{skill}</span>
                    ))}
                  </div>

                  <div className="job-description">
                    <p>{contract.description}</p>
                  </div>

                  <div className="job-meta-row">
                    <div className="job-meta-item">
                      <Clock size={16} />
                      <span>{contract.deadline ? new Date(contract.deadline).toLocaleDateString() : 'Sin fecha límite'}</span>
                    </div>
                    <div className="job-meta-item budget">
                      <DollarSign size={16} />
                      <span>{contract.amount} {contract.currency}</span>
                    </div>
                  </div>

                  <div className="job-footer">
                    <div className="job-type-badge">{contract.status}</div>
                    <button className="apply-btn">
                      <span>Aplicar</span>
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="jobs-empty-state">
                <div className="empty-state-icon">
                  <Briefcase size={48} />
                </div>
                <div className="empty-state-message">
                  <h3>No hay trabajos disponibles</h3>
                  <p>No se encontraron oportunidades para este período. Los nuevos contratos aparecerán aquí cuando estén disponibles.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { JobsModal };
export default JobsModal;
