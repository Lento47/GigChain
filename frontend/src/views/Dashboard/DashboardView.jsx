import React, { useState, useCallback } from 'react';
import { FileText, Zap } from 'lucide-react';
import { useNotifications } from '../../components/NotificationCenter';
import InteractiveChart from './InteractiveChart';
import JobsModal from './JobsModal';
import ContractSetup from '../ContractSetup';
import { MetricSkeleton } from '../LoadingSpinner';
import { logger } from '../../utils/logger';

const DashboardView = React.memo(({ metrics, isLoading = false }) => {
  const { notifications, addNotification } = useNotifications();
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [userType, setUserType] = useState('freelancer'); // 'client' o 'freelancer'
  
  // Real data from metrics prop
  const realMetrics = metrics || {
    totalContracts: 0,
    activeContracts: 0,
    totalRevenue: 0,
    averageRating: 0,
    completedProjects: 0,
    recentActivity: []
  };

  const handleDataPointClick = useCallback((data) => {
    setSelectedPeriod(data);
    setShowJobsModal(true);
  }, []);

  const handleCloseJobsModal = useCallback(() => {
    setShowJobsModal(false);
    setSelectedPeriod(null);
  }, []);

  const handleCreateContract = useCallback(() => {
    addNotification({
      id: Date.now(),
      type: 'info',
      title: 'Crear Contrato',
      message: 'Redirigiendo al asistente de creación de contratos...',
      timestamp: new Date()
    });
    // Aquí se implementaría la navegación al asistente de contratos
    logger.action('create_first_contract_clicked');
  }, [addNotification]);

  const handleShowGuide = useCallback(() => {
    addNotification({
      id: Date.now(),
      type: 'info',
      title: 'Guía de Inicio',
      message: 'Abriendo guía de inicio...',
      timestamp: new Date()
    });
    // Aquí se implementaría la navegación a la guía
    logger.action('show_getting_started_guide');
  }, [addNotification]);

  return (
    <div className="dashboard">

      {/* Métricas de Rendimiento */}
      <section className="metrics-section">
        <div className="section-header">
          <h2 className="section-title">Métricas de Rendimiento</h2>
          <p className="section-description">Indicadores clave de tu actividad</p>
        </div>
      
        <div className="metrics-grid">
          {isLoading ? (
            <>
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </>
          ) : (
            <>
              {/* Tarjeta de Métrica 1: Contratos Activos */}
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-icon">
                    <span>📋</span>
                  </div>
                  <div className="metric-trend positive">+15.2%</div>
                </div>
                <div className="metric-content">
                  <p className="metric-label">Contratos Activos</p>
                  <p className="metric-value">{realMetrics.activeContracts || 0}</p>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: '80%' }}></div>
                  </div>
                  <p className="metric-change positive">vs ayer</p>
                </div>
              </div>
              
              {/* Tarjeta de Métrica 2: Proyectos Completados */}
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-icon">
                    <span>✅</span>
                  </div>
                  <div className="metric-trend negative">-2.1%</div>
                </div>
                <div className="metric-content">
                  <p className="metric-label">Proyectos Completados</p>
                  <p className="metric-value">{realMetrics.completedProjects || 0}</p>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: '50%' }}></div>
                  </div>
                  <p className="metric-change negative">vs ayer</p>
                </div>
              </div>

              {/* Tarjeta de Métrica 3: Ingresos Totales */}
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-icon">
                    <span>💰</span>
                  </div>
                  <div className="metric-trend positive">Óptimo</div>
                </div>
                <div className="metric-content">
                  <p className="metric-label">Ingresos Totales</p>
                  <p className="metric-value">${realMetrics.totalEarnings || 0}</p>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: '75%' }}></div>
                  </div>
                  <p className="metric-change positive">Rendimiento</p>
                </div>
              </div>

              {/* Tarjeta de Métrica 4: Tasa de Éxito */}
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-icon">
                    <span>🎯</span>
                  </div>
                  <div className="metric-trend positive">Estable</div>
                </div>
                <div className="metric-content">
                  <p className="metric-label">Tasa de Éxito</p>
                  <p className="metric-value">98.5%</p>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: '98%' }}></div>
                  </div>
                  <p className="metric-change positive">Calidad</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Gráfico Principal */}
      <section className="chart-section">
        <div className="section-header">
          <div className="section-title-group">
            <h2 className="section-title">Actividad de Contratos</h2>
            <p className="section-description">Últimas 24 horas de actividad</p>
          </div>
          <div className="user-type-selector">
            <button 
              className={`user-type-btn ${userType === 'freelancer' ? 'active' : ''}`}
              onClick={() => setUserType('freelancer')}
            >
              <span className="btn-icon">👨‍💻</span>
              <span className="btn-text">Freelancer</span>
            </button>
            <button 
              className={`user-type-btn ${userType === 'client' ? 'active' : ''}`}
              onClick={() => setUserType('client')}
            >
              <span className="btn-icon">🏢</span>
              <span className="btn-text">Cliente</span>
            </button>
          </div>
        </div>
        <div className="chart-container">
          <InteractiveChart onDataPointClick={handleDataPointClick} />
          <div className="chart-footer">
            <p className="chart-instruction">
              💡 Haz click en cualquier punto del gráfico para ver trabajos disponibles en ese período
            </p>
          </div>
        </div>
      </section>

      {/* Contract Setup */}
      <ContractSetup 
        onCreateContract={handleCreateContract}
        onShowGuide={handleShowGuide}
      />

      {/* Modal de Trabajos */}
      <JobsModal
        isOpen={showJobsModal}
        onClose={handleCloseJobsModal}
        selectedPeriod={selectedPeriod}
        userType={userType}
      />
    </div>
  );
});

DashboardView.displayName = 'DashboardView';

export { DashboardView };
export default DashboardView;
