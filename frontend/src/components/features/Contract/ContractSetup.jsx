import React from 'react';
import { Zap, FileText, BookOpen, ArrowRight, Shield, Clock, TrendingUp, Users, CheckCircle } from 'lucide-react';
import './Contract.css';

export const ContractSetup = ({ onCreateContract, onShowGuide }) => {
  const features = [
    {
      icon: <Shield size={20} />,
      title: 'Protección Garantizada',
      description: 'Fondos en escrow durante el proyecto'
    },
    {
      icon: <Clock size={20} />,
      title: 'Pagos Automáticos',
      description: 'Ejecuta pagos al completar milestones'
    },
    {
      icon: <TrendingUp size={20} />,
      title: 'Gestión Eficiente',
      description: 'Administra entregables fácilmente'
    },
    {
      icon: <Users size={20} />,
      title: 'Mayor Confianza',
      description: 'Reduce disputas y aumenta la confianza'
    }
  ];

  return (
    <div className="contract-setup">
      <div className="setup-content-wrapper">
        <div className="setup-main">
          <div className="setup-header">
            <div className="setup-icon-container">
              <div className="setup-icon">
                <Zap size={40} />
              </div>
              <div className="setup-icon-glow"></div>
            </div>
            <h3 className="setup-title">Contratos Desconectados</h3>
            <p className="setup-description">
              Aún no has configurado tu primer contrato inteligente. 
              Comienza ahora y automatiza tus transacciones de forma segura.
            </p>
          </div>

          <div className="setup-actions">
            <button 
              className="setup-btn primary"
              onClick={onCreateContract}
            >
              <FileText size={20} />
              <span>Crear Primer Contrato</span>
              <ArrowRight size={16} className="btn-arrow" />
            </button>
            
            <button 
              className="setup-btn secondary"
              onClick={onShowGuide}
            >
              <BookOpen size={20} />
              <span>Guía de Inicio</span>
              <ArrowRight size={16} className="btn-arrow" />
            </button>
          </div>
        </div>

        <div className="setup-features">
          <div className="features-header">
            <CheckCircle size={24} />
            <h4>¿Qué puedes hacer con contratos inteligentes?</h4>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <div className="feature-content">
                  <h5 className="feature-title">{feature.title}</h5>
                  <p className="feature-description">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractSetup;
