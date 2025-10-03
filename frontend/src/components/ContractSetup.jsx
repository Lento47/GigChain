import React from 'react';
import { Zap, FileText, BookOpen, ArrowRight } from 'lucide-react';

export const ContractSetup = ({ onCreateContract, onShowGuide }) => {
  return (
    <div className="contract-setup">
      <div className="setup-header">
        <div className="setup-icon">
          <Zap size={48} />
        </div>
        <h3>Contratos Desconectados</h3>
        <p>
          Aún no has configurado tu primer contrato inteligente. 
          Comienza creando tu primer contrato para automatizar tus transacciones.
        </p>
      </div>

      <div className="setup-actions">
        <button 
          className="btn-primary setup-btn"
          onClick={onCreateContract}
        >
          <FileText size={20} />
          <span>Crear Primer Contrato</span>
          <ArrowRight size={16} />
        </button>
        
        <button 
          className="btn-secondary setup-btn"
          onClick={onShowGuide}
        >
          <BookOpen size={20} />
          <span>Guía de Inicio</span>
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="setup-features">
        <div className="feature-list">
          <h4>¿Qué puedes hacer con contratos inteligentes?</h4>
          <ul>
            <li>Automatizar pagos entre freelancers y clientes</li>
            <li>Gestionar milestones y entregables</li>
            <li>Ejecutar pagos automáticamente al completar tareas</li>
            <li>Proteger fondos en escrow durante el proyecto</li>
            <li>Reducir disputas y mejorar la confianza</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ContractSetup;
