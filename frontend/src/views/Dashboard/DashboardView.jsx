import React, { useState, useCallback } from 'react';
import { FileText, Zap, CheckCircle, TrendingUp } from 'lucide-react';
import { useNotifications } from '../../components/common/NotificationCenter/NotificationCenter';
import { useWallet } from '../../hooks/useWallet';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { API_BASE_URL } from '../../constants/api';
import InteractiveChart from './InteractiveChart';
import ChartTypeSelector from './ChartTypeSelector';
import JobsModal from './JobsModal';
import ContractSetup from '../../components/features/Contract/ContractSetup';
import ContractCreateModal from '../../components/features/Contract/ContractCreateModal';
import { MetricSkeleton } from '../../components/common/LoadingSpinner/LoadingSpinner';
import { logger } from '../../utils/logger';
import './dashboard.css';

const DashboardView = React.memo(() => {
  const { notifications, addNotification } = useNotifications();
  const { address } = useWallet();
  const { metrics, isLoading, isRefreshing, lastUpdate } = useDashboardMetrics(address);
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [userType, setUserType] = useState('freelancer'); // 'client' o 'freelancer'
  const [chartType, setChartType] = useState('line'); // 'line' o 'bar'
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleDataPointClick = useCallback(async (data) => {
    console.log('Chart clicked:', data);
    
    // If there are no contracts for this hour, show empty modal
    if (!data.open_contracts || data.open_contracts === 0) {
      setSelectedPeriod({
        ...data,
        contracts: [] // No contracts for this hour
      });
      setShowJobsModal(true);
      return;
    }
    
    // Fetch contracts for the selected time period
    try {
      // Only fetch contracts if there are actually contracts for this hour
      const response = await fetch(
        `${API_BASE_URL}/api/contracts?status=open&limit=10`
      );
      
      if (response.ok) {
        const contractsData = await response.json();
        const contracts = contractsData.value || contractsData; // Handle different response formats
        
        // Show modal with contracts for this period
        setSelectedPeriod({
          ...data,
          contracts: contracts.slice(0, Math.min(contracts.length, data.open_contracts)) // Show only the number of contracts that were actually created in this hour
        });
        setShowJobsModal(true);
        
        console.log(`Contracts for ${data.hour}:`, contracts.slice(0, data.open_contracts));
      }
    } catch (error) {
      console.error('Error fetching contracts for period:', error);
      // Still show modal with basic data
      setSelectedPeriod({
        ...data,
        contracts: [] // Show empty on error
      });
      setShowJobsModal(true);
    }
  }, []);

  const handleCloseJobsModal = useCallback(() => {
    setShowJobsModal(false);
    setSelectedPeriod(null);
  }, []);

  const handleChartTypeChange = useCallback((newChartType) => {
    setChartType(newChartType);
  }, []);

  const handleCreateContract = useCallback(async (contractData) => {
    try {
      // Log del evento analytics correcto
      logger.action('create_first_contract_clicked');
      
      // Mostrar notificación de inicio
      addNotification({
        id: Date.now(),
        type: 'info',
        title: 'Crear Contrato',
        message: 'Creando contrato con IA...',
        timestamp: new Date()
      });

      // Usar los datos del formulario o datos por defecto
      const requestData = contractData || {
        text: `Contrato de desarrollo web iniciado desde el dashboard. 
               Usuario: ${address || 'Usuario conectado'}
               Fecha: ${new Date().toLocaleDateString()}
               Tipo: Contrato inteligente básico`
      };

      // Determinar qué endpoint usar basado en los datos
      const endpoint = contractData && typeof contractData === 'object' && 'description' in contractData
        ? '/api/structured_contract'
        : '/api/full_flow';
        
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Mostrar notificación de éxito
        addNotification({
          id: Date.now() + 1,
          type: 'success',
          title: 'Contrato Creado',
          message: `Contrato ${result.contract_id} creado exitosamente`,
          timestamp: new Date()
        });

        logger.info('Contract created successfully:', result.contract_id);
        
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
      
    } catch (error) {
      logger.error('Error creating contract:', error);
      
      // Mostrar notificación de error
      addNotification({
        id: Date.now() + 2,
        type: 'error',
        title: 'Error al Crear Contrato',
        message: 'Hubo un problema al crear el contrato. Intenta nuevamente.',
        timestamp: new Date()
      });
    }
  }, [addNotification, address]);

  const handleOpenCreateModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

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
      {/* Action Bar */}
      <div className="action-bar">
        <div className="action-bar-content">
          {isRefreshing && (
            <div className="refresh-status">
              <span className="refresh-indicator" title="Actualizando datos...">
                🔄
              </span>
              <span className="refresh-text">Actualizando...</span>
            </div>
          )}
          {lastUpdate && !isRefreshing && (
            <div className="status-item">
              <span className="status-icon">🕐</span>
              <span className="status-text">
                Actualizado: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
        <div className="action-buttons">
          <button 
            className="action-btn primary"
            onClick={handleOpenCreateModal}
          >
            <FileText size={18} />
            <span>Nuevo Contrato</span>
          </button>
          <button 
            className="action-btn secondary"
            onClick={handleShowGuide}
          >
            <Zap size={18} />
            <span>Guía</span>
          </button>
        </div>
      </div>

      {/* Métricas de Rendimiento */}
      <section className="metrics-section">
        <div className="section-header">
          <div className="section-title-group">
            <h2 className="section-title">Métricas de Rendimiento</h2>
            <p className="section-description">
              Indicadores clave de tu actividad en tiempo real
            </p>
          </div>
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
              <div className="metric-card active-contracts">
                <div className="metric-header">
                  <div className="metric-icon">
                    <FileText size={24} />
                  </div>
                  <div className={`metric-trend ${metrics.activeContracts > 0 ? 'positive' : 'neutral'}`}>
                    {metrics.activeContracts > 0 ? 'Activo' : 'Sin actividad'}
                  </div>
                </div>
                <div className="metric-content">
                  <p className="metric-label">Contratos Activos</p>
                  <p className="metric-value">{metrics.activeContracts || 0}</p>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar active" 
                      style={{ 
                        width: metrics.totalContracts > 0 
                          ? `${Math.round((metrics.activeContracts / metrics.totalContracts) * 100)}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                  <p className="metric-change">
                    {metrics.totalContracts > 0 
                      ? `${Math.round((metrics.activeContracts / metrics.totalContracts) * 100)}% del total`
                      : 'Sin datos disponibles'
                    }
                  </p>
                </div>
              </div>
              
              {/* Tarjeta de Métrica 2: Proyectos Completados */}
              <div className="metric-card completed-projects">
                <div className="metric-header">
                  <div className="metric-icon">
                    <CheckCircle size={24} />
                  </div>
                  <div className={`metric-trend ${metrics.completedProjects > 0 ? 'positive' : 'neutral'}`}>
                    {metrics.completedProjects > 0 ? 'Completados' : 'Sin completar'}
                  </div>
                </div>
                <div className="metric-content">
                  <p className="metric-label">Proyectos Completados</p>
                  <p className="metric-value">{metrics.completedProjects || 0}</p>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar completed" 
                      style={{ 
                        width: metrics.totalContracts > 0 
                          ? `${Math.round((metrics.completedProjects / metrics.totalContracts) * 100)}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                  <p className="metric-change">
                    {metrics.totalContracts > 0 
                      ? `${Math.round((metrics.completedProjects / metrics.totalContracts) * 100)}% completado`
                      : 'Sin datos disponibles'
                    }
                  </p>
                </div>
              </div>

              {/* Tarjeta de Métrica 3: Ingresos Totales */}
              <div className="metric-card total-earnings">
                <div className="metric-header">
                  <div className="metric-icon">
                    <TrendingUp size={24} />
                  </div>
                  <div className={`metric-trend ${metrics.totalEarnings > 0 ? 'positive' : 'neutral'}`}>
                    {metrics.totalEarnings > 0 ? 'Ingresos' : 'Sin ingresos'}
                  </div>
                </div>
                <div className="metric-content">
                  <p className="metric-label">Ingresos Totales</p>
                  <p className="metric-value">${metrics.totalEarnings || 0}</p>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar earnings" 
                      style={{ 
                        width: metrics.totalEarnings > 0 
                          ? `${Math.min(100, Math.round((metrics.totalEarnings / 10000) * 100))}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                  <p className="metric-change">
                    {metrics.completedProjects > 0 
                      ? `${metrics.completedProjects} proyectos completados`
                      : 'Sin proyectos completados'
                    }
                  </p>
                </div>
              </div>

              {/* Tarjeta de Métrica 4: Tasa de Éxito */}
              <div className="metric-card success-rate">
                <div className="metric-header">
                  <div className="metric-icon">
                    <Zap size={24} />
                  </div>
                  <div className={`metric-trend ${metrics.totalContracts > 0 ? 'positive' : 'neutral'}`}>
                    {metrics.totalContracts > 0 ? 'Calculado' : 'Sin datos'}
                  </div>
                </div>
                <div className="metric-content">
                  <p className="metric-label">Tasa de Éxito</p>
                  <p className="metric-value">
                    {metrics.totalContracts > 0 
                      ? `${Math.round((metrics.completedProjects / metrics.totalContracts) * 100)}%`
                      : '0%'
                    }
                  </p>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar success" 
                      style={{ 
                        width: metrics.totalContracts > 0 
                          ? `${Math.round((metrics.completedProjects / metrics.totalContracts) * 100)}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                  <p className="metric-change">
                    {metrics.totalContracts > 0 
                      ? `${metrics.completedProjects}/${metrics.totalContracts} completados`
                      : 'Sin contratos disponibles'
                    }
                  </p>
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
          <ChartTypeSelector 
            chartType={chartType}
            onChartTypeChange={handleChartTypeChange}
          />
          <InteractiveChart 
            onDataPointClick={handleDataPointClick} 
            activityData={metrics.activityByHour}
            chartType={chartType}
          />
          <div className="chart-footer">
            <p className="chart-instruction">
              💡 Haz click en cualquier punto del gráfico para ver trabajos disponibles en ese período
            </p>
          </div>
        </div>
      </section>

      {/* Contract Setup */}
      <section className="contract-setup-section">
        <ContractSetup 
          onCreateContract={handleOpenCreateModal}
          onShowGuide={handleShowGuide}
        />
      </section>

      {/* Modal de Trabajos */}
      <JobsModal
        isOpen={showJobsModal}
        onClose={handleCloseJobsModal}
        selectedPeriod={selectedPeriod}
        userType={userType}
      />

      {/* Modal de Crear Contrato */}
      <ContractCreateModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onCreateContract={handleCreateContract}
        userRole={userType}
      />
    </div>
  );
});

DashboardView.displayName = 'DashboardView';

export { DashboardView };
export default DashboardView;
