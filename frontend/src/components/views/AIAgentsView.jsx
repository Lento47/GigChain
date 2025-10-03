import React, { useState } from 'react';
import { Zap, Play, Pause, Settings, MessageSquare, Code, Brain, Search, Filter } from 'lucide-react';

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
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    border: '1px solid #475569',
    borderRadius: '16px',
    padding: '1.5rem',
    transition: 'all 0.3s ease'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem'
  },
  icon: {
    width: '50px',
    height: '50px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  cardName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#e2e8f0',
    margin: '0'
  },
  cardDescription: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    margin: '0.5rem 0 0 0'
  },
  status: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    marginLeft: 'auto'
  },
  statusActive: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white'
  },
  statusInactive: {
    background: 'rgba(107, 114, 128, 0.2)',
    color: '#9ca3af'
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem'
  },
  btn: {
    flex: '1',
    padding: '0.5rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  btnActive: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white'
  },
  btnInactive: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white'
  },
  btnSecondary: {
    background: 'rgba(30, 41, 59, 0.8)',
    color: '#94a3b8',
    border: '1px solid #475569'
  }
};

const AIAgentsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const agents = [
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
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'training': return 'status-training';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'training': return 'Entrenando';
      default: return 'Desconocido';
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.capabilities.some(cap => cap.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || agent.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleToggleAgent = (agent) => {
    console.log('Toggling agent:', agent);
    // Implementar lógica para activar/desactivar agente
  };

  const handleConfigureAgent = (agent) => {
    console.log('Configuring agent:', agent);
    // Implementar modal de configuración
  };

  const handleTestAgent = (agent) => {
    console.log('Testing agent:', agent);
    // Implementar chat de prueba
  };

  return (
    <div style={styles.view}>
      <h1 style={styles.title}>AI Agents</h1>
      <p style={styles.subtitle}>Gestiona tus agentes de inteligencia artificial especializados</p>

      <div style={styles.grid}>
        {filteredAgents.map(agent => {
          const IconComponent = agent.icon;
          return (
            <div key={agent.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.icon}>
                  <IconComponent size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={styles.cardName}>{agent.name}</h3>
                  <p style={styles.cardDescription}>{agent.description}</p>
                </div>
                <div style={{
                  ...styles.status,
                  ...(agent.status === 'active' ? styles.statusActive : styles.statusInactive)
                }}>
                  {getStatusText(agent.status)}
                </div>
              </div>

              <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Uso:</span>
                  <span style={{ color: '#e2e8f0' }}>{agent.usage}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Precisión:</span>
                  <span style={{ color: '#e2e8f0' }}>{agent.accuracy}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Último uso:</span>
                  <span style={{ color: '#e2e8f0' }}>{agent.lastUsed}</span>
                </div>
              </div>

              <div style={styles.actions}>
                <button 
                  style={{
                    ...styles.btn,
                    ...(agent.status === 'active' ? styles.btnActive : styles.btnInactive)
                  }}
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
                  style={styles.btnSecondary}
                  onClick={() => handleTestAgent(agent)}
                >
                  <MessageSquare size={16} />
                </button>
                
                <button 
                  style={styles.btnSecondary}
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
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
          <Zap size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: '#94a3b8' }}>No se encontraron agentes</h3>
          <p style={{ margin: '0', fontSize: '1rem' }}>Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
};

export { AIAgentsView };
export default AIAgentsView;
