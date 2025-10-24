import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { 
  TrendingUp, TrendingDown, Activity, Clock, 
  BarChart3, PieChart, DollarSign, FileText,
  Award, Shield, Users, Target, Zap, Calendar,
  ArrowUpRight, ArrowDownRight, CheckCircle, AlertCircle,
  Info, Download, ExternalLink, MessageSquare, Eye,
  TrendingUp as CompareIcon
} from 'lucide-react';
import './AnalyticsWeb3.css';

// Tooltip Component
const Tooltip = ({ children, content }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="tooltip-wrapper">
      <div 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="tooltip-trigger"
      >
        {children}
      </div>
      {show && (
        <div className="tooltip-content">
          {content}
        </div>
      )}
    </div>
  );
};

const AnalyticsWeb3 = () => {
  const { address, chainId, isCorrectChain } = useWallet();
  const { sessionData, isAuthenticated } = useWalletAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeMetric, setActiveMetric] = useState('overview');
  const [usdRate] = useState(0.85); // Mock: 1 GIG = $0.85 USD

  // Mock analytics data (replace with real API calls)
  const [analyticsData] = useState({
    summary: {
      totalContracts: 45,
      activeContracts: 12,
      completedContracts: 33,
      totalEarnings: 15420.50,
      monthlyEarnings: 3420.00,
      averageContractValue: 342.68,
      successRate: 96.5,
      avgCompletionTime: '5.2 días'
    },
    trends: {
      contracts: { value: 12, change: 15.3, direction: 'up' },
      earnings: { value: 3420, change: 8.7, direction: 'up' },
      reputation: { value: 98.5, change: 2.1, direction: 'up' },
      clients: { value: 23, change: -3.2, direction: 'down' }
    },
    performanceHistory: [
      { 
        id: 1, 
        contractName: 'Smart Contract Audit', 
        client: 'TechCorp DAO',
        clientType: 'DAO',
        startDate: '2024-10-10',
        endDate: '2024-10-15',
        duration: '5 días', 
        value: 500, 
        completion: 100,
        rating: 5.0,
        feedback: 'Excelente trabajo, muy profesional',
        status: 'completed' 
      },
      { 
        id: 2, 
        contractName: 'Web3 Development Project', 
        client: 'DeFi Protocol',
        clientType: 'Exchange',
        startDate: '2024-09-28',
        endDate: '2024-10-10',
        duration: '12 días', 
        value: 1200, 
        completion: 100,
        rating: 4.8,
        feedback: 'Gran comunicación y cumplimiento',
        status: 'completed' 
      },
      { 
        id: 3, 
        contractName: 'DAO Governance System', 
        client: 'StartupXYZ',
        clientType: 'Startup',
        startDate: '2024-10-15',
        endDate: null,
        duration: 'En progreso', 
        value: 2000, 
        completion: 65,
        rating: null,
        feedback: null,
        status: 'active' 
      },
      { 
        id: 4, 
        contractName: 'DeFi Protocol Integration', 
        client: 'Web3 Agency',
        clientType: 'Agencia',
        startDate: '2024-10-18',
        endDate: null,
        duration: 'En progreso', 
        value: 750, 
        completion: 40,
        rating: null,
        feedback: null,
        status: 'active' 
      },
      { 
        id: 5, 
        contractName: 'NFT Marketplace Backend', 
        client: 'TechCorp DAO',
        clientType: 'DAO',
        startDate: '2024-10-05',
        endDate: '2024-10-13',
        duration: '8 días', 
        value: 900, 
        completion: 100,
        rating: 4.9,
        feedback: 'Muy satisfechos con el resultado',
        status: 'completed' 
      }
    ],
    topClients: [
      { name: 'TechCorp DAO', sector: 'DAO', contracts: 8, value: 4500, satisfaction: 98, lastContract: '2024-10-13' },
      { name: 'DeFi Protocol', sector: 'Exchange', contracts: 5, value: 3200, satisfaction: 95, lastContract: '2024-10-10' },
      { name: 'StartupXYZ', sector: 'Startup', contracts: 4, value: 2100, satisfaction: 97, lastContract: '2024-10-15' },
      { name: 'Web3 Agency', sector: 'Agencia', contracts: 3, value: 1800, satisfaction: 93, lastContract: '2024-10-18' }
    ],
    skillMetrics: [
      { skill: 'Solidity', contracts: 25, earnings: 8500, rating: 4.9, platformAvg: 4.2, trend: '+0.3' },
      { skill: 'Web3 Development', contracts: 18, earnings: 5200, rating: 4.8, platformAvg: 4.1, trend: '+0.2' },
      { skill: 'Smart Contract Audit', contracts: 12, earnings: 4800, rating: 5.0, platformAvg: 4.5, trend: '+0.1' },
      { skill: 'DeFi', contracts: 10, earnings: 3900, rating: 4.7, platformAvg: 4.0, trend: '+0.4' }
    ],
    monthlyData: [
      { month: 'Ago', contracts: 8, earnings: 2800, success: 95 },
      { month: 'Sep', contracts: 10, earnings: 3200, success: 94 },
      { month: 'Oct', contracts: 12, earnings: 3800, success: 96 },
      { month: 'Nov', contracts: 15, earnings: 4200, success: 97 }
    ]
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(value);
  };

  const formatUSD = (gigValue) => {
    const usd = gigValue * usdRate;
    return `$${usd.toFixed(2)} USD`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'En progreso';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getPeriodLabel = (period) => {
    const labels = {
      '7d': 'Últimos 7 días',
      '30d': 'Últimos 30 días',
      '90d': 'Últimos 90 días',
      '1y': 'Último año'
    };
    return labels[period] || labels['30d'];
  };

  const getPeriodDateRange = (period) => {
    const end = new Date();
    const start = new Date();
    
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    start.setDate(end.getDate() - (days[period] || 30));
    
    const formatShort = (date) => {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short'
      });
    };
    
    return `Del ${formatShort(start)} al ${formatShort(end)}`;
  };

  const exportData = (type) => {
    console.log(`Exportando datos tipo: ${type}`);
    // TODO: Implement CSV/PDF export
    alert(`Función de exportar ${type} - Próximamente disponible`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: { label: 'Completado', class: 'status-success' },
      active: { label: 'En Progreso', class: 'status-active' },
      pending: { label: 'Pendiente', class: 'status-pending' }
    };
    return badges[status] || badges.active;
  };

  const getCompletionColor = (completion) => {
    if (completion === 100) return '#00ff88';
    if (completion >= 70) return '#00d4ff';
    if (completion >= 40) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <div className="analytics-web3-container">
      {/* Hero Header */}
      <div className="analytics-hero">
        <div className="hero-left">
          <div className="hero-icon">
            <BarChart3 size={48} />
          </div>
          <div className="hero-info">
            <div className="title-section">
              <h1 className="analytics-title">Analíticas</h1>
              <div className="title-accent"></div>
            </div>
            <p className="analytics-subtitle">Métricas y reportes detallados de tu actividad</p>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-actions">
            <div className="period-selector-enhanced">
              <div className="period-info">
                <Calendar size={16} />
                <select 
                  value={selectedPeriod} 
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="period-select"
                >
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                  <option value="90d">Últimos 90 días</option>
                  <option value="1y">Último año</option>
                </select>
              </div>
              <div className="period-date-range">
                <Calendar size={12} />
                <span>{getPeriodDateRange(selectedPeriod)}</span>
              </div>
              <div className="filter-indicator">
                <Info size={14} />
                <span>Aplicado a todas las métricas</span>
              </div>
            </div>
            <button className="export-btn" onClick={() => exportData('CSV')}>
              <Download size={16} />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="key-metrics-grid">
        {/* Total Earnings Card */}
        <div className="metric-card glass-card card-accent-green">
          <div className="card-accent-border"></div>
          <div className="metric-header">
            <div className="metric-icon green">
              <DollarSign size={24} />
            </div>
            <Tooltip content={`Incremento de ${analyticsData.trends.earnings.change}% vs ${getPeriodLabel(selectedPeriod).toLowerCase()} anterior. Tendencia positiva en ganancias.`}>
              <div className="metric-trend positive">
                <TrendingUp size={16} />
                <span>+{analyticsData.trends.earnings.change}%</span>
                <span className="trend-context">vs anterior</span>
              </div>
            </Tooltip>
          </div>
          <div className="metric-content">
            <div className="metric-label-wrapper">
              <h3 className="metric-label">Ganancias Totales</h3>
              <Tooltip content={`Total de tokens GIG ganados en ${getPeriodLabel(selectedPeriod).toLowerCase()}. Incluye todos los contratos completados y pagos recibidos.`}>
                <Info size={14} className="info-icon" />
              </Tooltip>
            </div>
            <div className="metric-value crypto-price">
              {formatCurrency(analyticsData.summary.totalEarnings)}
              <span className="metric-value-usd">
                ≈ {formatUSD(analyticsData.summary.totalEarnings)}
              </span>
            </div>
            <div className="metric-unit">GIG Tokens</div>
            <div className="metric-meta">
              +{formatCurrency(analyticsData.summary.monthlyEarnings)} este mes
            </div>
          </div>
        </div>

        {/* Active Contracts Card */}
        <div className="metric-card glass-card card-accent-cyan">
          <div className="card-accent-border"></div>
          <div className="metric-header">
            <div className="metric-icon cyan">
              <FileText size={24} />
            </div>
            <Tooltip content={`${analyticsData.trends.contracts.change}% más contratos activos que el período anterior. Crecimiento sostenido en demanda.`}>
              <div className="metric-trend positive">
                <TrendingUp size={16} />
                <span>+{analyticsData.trends.contracts.change}%</span>
                <span className="trend-context">vs anterior</span>
              </div>
            </Tooltip>
          </div>
          <div className="metric-content">
            <div className="metric-label-wrapper">
              <h3 className="metric-label">Contratos Activos</h3>
              <Tooltip content="Contratos actualmente en progreso. Incluye todos los proyectos confirmados y en ejecución.">
                <Info size={14} className="info-icon" />
              </Tooltip>
            </div>
            <div className="metric-value" style={{ color: '#00d4ff', textShadow: '0 0 30px rgba(0, 212, 255, 0.6)' }}>
              {analyticsData.summary.activeContracts}
            </div>
            <div className="metric-unit">En progreso</div>
            <div className="metric-meta">
              {analyticsData.summary.completedContracts} completados | {analyticsData.summary.totalContracts} totales
            </div>
          </div>
        </div>

        {/* Success Rate Card */}
        <div className="metric-card glass-card card-accent-purple">
          <div className="card-accent-border"></div>
          <div className="metric-header">
            <div className="metric-icon purple">
              <Target size={24} />
            </div>
            <Tooltip content={`Mejora de ${analyticsData.trends.reputation.change}% en tasa de éxito vs período anterior. Refleja calidad consistente.`}>
              <div className="metric-trend positive">
                <TrendingUp size={16} />
                <span>+{analyticsData.trends.reputation.change}%</span>
                <span className="trend-context">vs anterior</span>
              </div>
            </Tooltip>
          </div>
          <div className="metric-content">
            <div className="metric-label-wrapper">
              <h3 className="metric-label">Tasa de Éxito</h3>
              <Tooltip content="Porcentaje de contratos completados exitosamente sin cancelaciones ni disputas. Basado en feedback de clientes y cumplimiento de términos.">
                <Info size={14} className="info-icon" />
              </Tooltip>
            </div>
            <div className="metric-value" style={{ color: '#8b5cf6', textShadow: '0 0 30px rgba(139, 92, 246, 0.6)' }}>
              {analyticsData.summary.successRate}%
            </div>
            <div className="metric-unit">Contratos exitosos</div>
            <Tooltip content="Tiempo medio desde inicio hasta finalización de contratos. Indica eficiencia en ejecución.">
              <div className="metric-meta">
                <Clock size={14} />
                <span>Tiempo promedio: {analyticsData.summary.avgCompletionTime}</span>
              </div>
            </Tooltip>
          </div>
        </div>

        {/* Average Contract Value Card */}
        <div className="metric-card glass-card card-accent-yellow">
          <div className="card-accent-border"></div>
          <div className="metric-header">
            <div className="metric-icon yellow">
              <Activity size={24} />
            </div>
            <Tooltip content="Incremento de 12.4% en valor promedio de contratos vs período anterior. Indica mayor demanda en proyectos de alto valor.">
              <div className="metric-trend positive">
                <TrendingUp size={16} />
                <span>+12.4%</span>
                <span className="trend-context">vs anterior</span>
              </div>
            </Tooltip>
          </div>
          <div className="metric-content">
            <div className="metric-label-wrapper">
              <h3 className="metric-label">Valor Promedio</h3>
              <Tooltip content={`Valor medio por contrato en ${getPeriodLabel(selectedPeriod).toLowerCase()}. Total de ${analyticsData.summary.totalContracts} contratos analizados.`}>
                <Info size={14} className="info-icon" />
              </Tooltip>
            </div>
            <div className="metric-value" style={{ color: '#fbbf24', textShadow: '0 0 30px rgba(251, 191, 36, 0.6)' }}>
              {formatCurrency(analyticsData.summary.averageContractValue)}
              <span className="metric-value-usd">
                ≈ {formatUSD(analyticsData.summary.averageContractValue)}
              </span>
            </div>
            <div className="metric-unit">GIG por contrato</div>
            <div className="metric-meta">
              {analyticsData.summary.totalContracts} contratos en {getPeriodLabel(selectedPeriod).toLowerCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="analytics-two-column">
        {/* Left Column - Activity & Performance */}
        <div className="analytics-left">
          {/* Performance History */}
          <div className="performance-history-section glass-card">
            <div className="section-header">
              <h2>📊 Historial de Performance</h2>
              <button className="view-all-btn">Ver todo</button>
            </div>
            <div className="performance-list">
              {analyticsData.performanceHistory.map((contract) => {
                const statusBadge = getStatusBadge(contract.status);
                const completionColor = getCompletionColor(contract.completion);
                
                return (
                  <div key={contract.id} className="performance-item">
                    <div className="performance-main">
                      <div className="performance-info">
                        <h4 className="performance-title">{contract.contractName}</h4>
                        <div className="performance-meta">
                          <span className="client-name">
                            <Users size={14} />
                            {contract.client}
                          </span>
                          <span className="duration">
                            <Clock size={14} />
                            {contract.duration}
                          </span>
                        </div>
                      </div>
                      <div className="performance-stats">
                        <div className="performance-value">
                          {formatCurrency(contract.value)} GIG
                        </div>
                        {contract.rating && (
                          <div className="performance-rating">
                            ⭐ {contract.rating}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="performance-progress">
                      <div className="progress-bar-wrapper">
                        <div className="progress-bar-track">
                          <div 
                            className="progress-bar-fill" 
                            style={{ 
                              width: `${contract.completion}%`,
                              background: completionColor,
                              boxShadow: `0 0 12px ${completionColor}80`
                            }}
                          ></div>
                        </div>
                        <span className="progress-percentage" style={{ color: completionColor }}>
                          {contract.completion}%
                        </span>
                      </div>
                      <span className={`status-badge ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skill Metrics */}
          <div className="skills-section glass-card">
            <div className="section-header">
              <h2>💡 Métricas por Skill</h2>
            </div>
            <div className="skills-grid">
              {analyticsData.skillMetrics.map((skill, idx) => (
                <div key={idx} className="skill-item">
                  <div className="skill-header">
                    <h4>{skill.skill}</h4>
                    <Tooltip content={`Tu rating: ${skill.rating}. Promedio plataforma: ${skill.platformAvg}. Estás ${(skill.rating - skill.platformAvg).toFixed(1)} puntos por encima del promedio.`}>
                      <div className="skill-rating">
                        ⭐ {skill.rating}
                        <span className="rating-trend">{skill.trend}</span>
                      </div>
                    </Tooltip>
                  </div>
                  <div className="skill-benchmark">
                    <span className="benchmark-label">vs promedio:</span>
                    <span className="benchmark-value">{skill.platformAvg}</span>
                  </div>
                  <div className="skill-stats">
                    <div className="skill-stat">
                      <span className="stat-label">Contratos</span>
                      <span className="stat-value">{skill.contracts}</span>
                    </div>
                    <div className="skill-stat">
                      <span className="stat-label">Earnings</span>
                      <span className="stat-value">{formatCurrency(skill.earnings)} GIG</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Clients & Insights */}
        <div className="analytics-right">
          {/* Top Clients */}
          <div className="clients-section glass-card sticky-panel">
            <div className="section-header">
              <h2>🏆 Top Clientes</h2>
            </div>
            <div className="clients-list">
              {analyticsData.topClients.map((client, idx) => (
                <div key={idx} className="client-item">
                  <div className="client-rank">#{idx + 1}</div>
                  <div className="client-info">
                    <div className="client-header">
                      <h4>{client.name}</h4>
                      <span className="client-sector">{client.sector}</span>
                    </div>
                    <div className="client-stats">
                      <span className="client-stat">
                        <FileText size={14} />
                        {client.contracts} contratos
                      </span>
                      <span className="client-stat">
                        <DollarSign size={14} />
                        {formatCurrency(client.value)} GIG
                      </span>
                      <span className="client-stat">
                        <Clock size={14} />
                        Último: {formatDate(client.lastContract)}
                      </span>
                    </div>
                  </div>
                  <div className="client-right">
                    <Tooltip content={`Satisfacción: ${client.satisfaction}%. Promedio de ratings (1-5 ⭐) en todos los contratos completados. Basado en feedback post-entrega.`}>
                      <div className="client-satisfaction">
                        <div className="satisfaction-score">{client.satisfaction}%</div>
                        <div className="satisfaction-label">
                          Satisfacción <Info size={10} />
                        </div>
                      </div>
                    </Tooltip>
                    <div className="client-actions">
                      <button className="action-btn-sm" title="Ver historial de contratos" onClick={() => alert(`Ver historial con ${client.name}`)}>
                        <Eye size={14} />
                      </button>
                      <button className="action-btn-sm" title="Contactar cliente" onClick={() => alert(`Contactar ${client.name}`)}>
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Chart Placeholder */}
          <div className="chart-section glass-card">
            <div className="section-header">
              <h2>📊 Performance Mensual</h2>
            </div>
            <div className="chart-placeholder">
              <div className="chart-bars">
                {analyticsData.monthlyData.map((data, idx) => (
                  <div key={idx} className="chart-bar-wrapper">
                    <div className="chart-value-label">
                      {formatCurrency(data.earnings)}
                    </div>
                    <Tooltip content={`${data.month}: ${formatCurrency(data.earnings)} GIG (${formatUSD(data.earnings)}) • ${data.contracts} contratos • ${data.success}% éxito`}>
                      <div 
                        className="chart-bar" 
                        style={{ 
                          height: `${(data.earnings / 5000) * 100}%`,
                          background: 'linear-gradient(180deg, #00ff88, #00d4ff)'
                        }}
                      ></div>
                    </Tooltip>
                    <div className="chart-label">{data.month}</div>
                    <div className="chart-contracts-count">{data.contracts} contratos</div>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#00ff88' }}></div>
                  <span>Earnings (GIG)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsWeb3;

