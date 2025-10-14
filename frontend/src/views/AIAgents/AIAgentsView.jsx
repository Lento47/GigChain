import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Zap, Play, Pause, Settings, MessageSquare, Code, Brain, Search, Filter, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/api';
import { logger } from '../../utils/logger';
import useDebounce from '../../hooks/useDebounce';
import './AIAgents.css';

const AIAgentsView = React.memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [agents, setAgents] = useState([
    {
      id: 1,
      name: 'Negotiation Agent',
      description: 'Agente especializado en negociación de contratos y precios',
      status: 'active',
      category: 'negotiation',
      capabilities: ['Análisis de precios', 'Generación de contraofertas', 'Optimización de términos'],
      usage: '15 contratos procesados',
      accuracy: '94%',
      lastUsed: 'Hace 2 horas',
      icon: MessageSquare
    },
    {
      id: 2,
      name: 'Contract Generator',
      description: 'Genera contratos inteligentes basados en plantillas y contexto',
      status: 'active',
      category: 'generation',
      capabilities: ['Generación de contratos', 'Validación legal', 'Personalización'],
      usage: '8 contratos generados',
      accuracy: '91%',
      lastUsed: 'Hace 1 día',
      icon: Code
    },
    {
      id: 3,
      name: 'Dispute Resolver',
      description: 'Resuelve disputas y conflictos en contratos de manera automática',
      status: 'inactive',
      category: 'resolution',
      capabilities: ['Análisis de disputas', 'Mediación automática', 'Resolución de conflictos'],
      usage: '3 disputas resueltas',
      accuracy: '87%',
      lastUsed: 'Hace 3 días',
      icon: Brain
    },
    {
      id: 4,
      name: 'Price Optimizer',
      description: 'Optimiza precios basándose en datos de mercado y competencia',
      status: 'training',
      category: 'optimization',
      capabilities: ['Análisis de mercado', 'Optimización de precios', 'Predicción de tendencias'],
      usage: 'En entrenamiento',
      accuracy: '85%',
      lastUsed: 'Nunca',
      icon: Zap
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState(null);

  // Memoize fetchAgentsStatus to prevent recreation
  const fetchAgentsStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/agents/status`);
      // Update agents with backend data if available
      logger.debug('Agents status fetched successfully', response.data);
    } catch (error) {
      logger.error('Error fetching agents status:', error);
    }
  }, []);

  // Fetch agents from backend on mount
  useEffect(() => {
    fetchAgentsStatus();
  }, [fetchAgentsStatus]);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Memoize helper functions
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'training': return 'status-training';
      default: return '';
    }
  }, []);

  const getStatusText = useCallback((status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'training': return 'Entrenando';
      default: return 'Desconocido';
    }
  }, []);

  // Memoize filtered agents to only recalculate when dependencies change
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           agent.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           agent.capabilities.some(cap => cap.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      const matchesStatus = selectedStatus === 'all' || agent.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [agents, debouncedSearchTerm, selectedStatus]);

  const handleToggleAgent = useCallback(async (agent) => {
    if (agent.status === 'training') {
      showNotification('No se puede modificar un agente en entrenamiento', 'error');
      return;
    }

    setLoading(true);
    try {
      const newStatus = agent.status === 'active' ? false : true;
      const response = await axios.post(
        `${API_BASE_URL}/api/agents/${agent.id}/toggle?enabled=${newStatus}`
      );

      if (response.data.success) {
        // Update local state
        setAgents(prevAgents => 
          prevAgents.map(a => 
            a.id === agent.id 
              ? { ...a, status: newStatus ? 'active' : 'inactive' }
              : a
          )
        );
        showNotification(response.data.message, 'success');
      }
    } catch (error) {
      console.error('Error toggling agent:', error);
      showNotification(
        error.response?.data?.detail || 'Error al cambiar estado del agente',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const handleConfigureAgent = useCallback(async (agent) => {
    // Open configuration modal
    const temperature = prompt('Ingrese la temperatura (0.0 - 1.0):', '0.1');
    if (temperature === null) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/agents/${agent.id}/configure`,
        {
          temperature: parseFloat(temperature),
          model: 'gpt-4o-mini'
        }
      );

      if (response.data.success) {
        showNotification(response.data.message, 'success');
      }
    } catch (error) {
      console.error('Error configuring agent:', error);
      showNotification(
        error.response?.data?.detail || 'Error al configurar agente',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const handleTestAgent = useCallback(async (agent) => {
    setSelectedAgent(agent);
    setTestModalOpen(true);
    setTestInput('Cliente ofrece $1000 por proyecto en 10 días');
    setTestResult(null);
  }, []);

  const runAgentTest = useCallback(async () => {
    if (!testInput.trim()) {
      showNotification('Por favor ingrese un texto de prueba', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/agents/${selectedAgent.id}/test`,
        {
          text: testInput
        }
      );

      if (response.data.success) {
        setTestResult(response.data.test_result);
        showNotification('Test completado exitosamente', 'success');
      }
    } catch (error) {
      console.error('Error testing agent:', error);
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.fallback_response ||
                      'Error al probar agente';
      showNotification(errorMsg, 'error');
      setTestResult({ error: errorMsg });
    } finally {
      setLoading(false);
    }
  }, [selectedAgent, testInput, showNotification]);

  return (
    <div className="ai-agents-view">
      {notification && (
        <div className={`agent-notification ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {notification.message}
        </div>
      )}

      {/* Action Bar */}
      <div className="action-bar">
        <div className="agents-filters">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar agentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-container">
            <Filter size={18} className="filter-icon" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="training">Entrenando</option>
            </select>
          </div>
        </div>
      </div>

      <div className="agents-grid">
        {filteredAgents.map(agent => {
          const IconComponent = agent.icon;
          return (
            <div key={agent.id} className="agent-card">
              <div className="agent-header">
                <div className="agent-icon">
                  <IconComponent size={24} />
                </div>
                <div className="agent-info">
                  <h3 className="agent-name">{agent.name}</h3>
                  <p className="agent-description">{agent.description}</p>
                </div>
                <div className={`agent-status status-${agent.status}`}>
                  {getStatusText(agent.status)}
                </div>
              </div>

              <div className="agent-metrics">
                <div className="metric-item">
                  <span className="metric-label">Uso</span>
                  <span className="metric-value">{agent.usage}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Precisión</span>
                  <span className="metric-value">{agent.accuracy}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Último uso</span>
                  <span className="metric-value">{agent.lastUsed}</span>
                </div>
              </div>

              <div className="agent-actions">
                <button 
                  className={`toggle-btn ${agent.status === 'active' ? 'active' : ''}`}
                  onClick={() => handleToggleAgent(agent)}
                  disabled={agent.status === 'training'}
                >
                  {agent.status === 'active' ? (
                    <>
                      <Pause size={16} />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Activar
                    </>
                  )}
                </button>
                
                <button 
                  className="test-btn"
                  onClick={() => handleTestAgent(agent)}
                >
                  <MessageSquare size={16} />
                </button>
                
                <button 
                  className="config-btn"
                  onClick={() => handleConfigureAgent(agent)}
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="no-agents">
          <Zap size={48} className="no-agents-icon" />
          <h3>No se encontraron agentes</h3>
          <p>Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}

      {/* Test Modal */}
      {testModalOpen && (
        <div className="agent-test-modal-overlay">
          <div className="agent-test-modal">
            <h3 className="modal-header">
              Probar {selectedAgent?.name}
            </h3>
            
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Ingrese texto de prueba..."
              className="modal-textarea"
            />

            {testResult && (
              <div className="modal-result">
                <h4>Resultado:</h4>
                <pre>{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            )}

            <div className="modal-actions">
              <button
                onClick={runAgentTest}
                disabled={loading}
                className="modal-btn-primary"
              >
                {loading ? 'Probando...' : 'Probar Agent'}
              </button>
              <button
                onClick={() => {
                  setTestModalOpen(false);
                  setSelectedAgent(null);
                  setTestResult(null);
                }}
                className="modal-btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AIAgentsView.displayName = 'AIAgentsView';

export { AIAgentsView };
export default AIAgentsView;
