/**
 * GigChain Admin Panel - Modern Dashboard Page
 */

import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';
import './DashboardPage.css';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch platform statistics
      const statsResponse = await axios.get('/api/admin/dashboard/stats');
      setStats(statsResponse.data.statistics);

      // Fetch analytics overview
      try {
        const analyticsResponse = await axios.get('/api/admin/analytics/overview');
        setAnalytics(analyticsResponse.data.analytics);
      } catch (error) {
        console.log('Analytics not available:', error);
      }

      // Fetch system alerts
      try {
        const alertsResponse = await axios.get('/api/admin/alerts?acknowledged=false');
        setAlerts(alertsResponse.data.alerts || []);
      } catch (error) {
        console.log('Alerts not available:', error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  const totalUsers = stats?.users?.total || 0;
  const activeUsers = stats?.users?.active || 0;
  const totalContracts = stats?.contracts?.total || 0;
  const monthContracts = analytics?.this_month?.contracts || 0;
  const platformVolume = analytics?.this_month?.volume || 0;
  const monthRevenue = analytics?.this_month?.revenue || 0;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>📊 Panel de Control</h1>
          <p>Vista general de la plataforma GigChain</p>
        </div>
        <button 
          onClick={handleRefresh} 
          className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
          disabled={refreshing}
        >
          <RefreshCw size={18} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* System Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-container">
          {alerts.map((alert) => (
            <div
              key={alert.alert_id}
              className={`alert-card alert-${alert.severity}`}
            >
              <AlertCircle size={20} className="alert-icon" />
              <div className="alert-content">
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Stats */}
      <div className="stats-grid">
        <MetricCard
          icon={<Users size={28} />}
          title="Usuarios Totales"
          value={totalUsers.toLocaleString()}
          subtitle={`${activeUsers} activos`}
          trend={+5.2}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        />
        
        <MetricCard
          icon={<FileText size={28} />}
          title="Contratos"
          value={totalContracts.toLocaleString()}
          subtitle={`${monthContracts} este mes`}
          trend={+12.5}
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        />
        
        <MetricCard
          icon={<DollarSign size={28} />}
          title="Volumen"
          value={`$${platformVolume.toLocaleString()}`}
          subtitle="Total procesado"
          trend={+8.3}
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        />
        
        <MetricCard
          icon={<TrendingUp size={28} />}
          title="Ingresos"
          value={`$${monthRevenue.toLocaleString()}`}
          subtitle="Este mes"
          trend={+15.7}
          gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
        />
      </div>

      {/* Charts and Details */}
      <div className="dashboard-grid">
        {/* Users Overview */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3><Users size={20} /> Estado de Usuarios</h3>
          </div>
          <div className="card-body">
            <UserStatusChart stats={stats} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3><Activity size={20} /> Actividad Reciente</h3>
          </div>
          <div className="card-body">
            <ActivityStats stats={stats} analytics={analytics} />
          </div>
        </div>

        {/* Period Comparison */}
        <div className="dashboard-card wide">
          <div className="card-header">
            <h3><TrendingUp size={20} /> Comparación de Períodos</h3>
          </div>
          <div className="card-body">
            <PeriodComparison analytics={analytics} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3>⚡ Acciones Rápidas</h3>
        <div className="quick-actions-grid">
          <QuickActionCard
            icon={<Users size={32} />}
            title="Gestionar Usuarios"
            description="Ver y administrar usuarios"
            color="#667eea"
            link="/users"
          />
          <QuickActionCard
            icon={<AlertCircle size={32} />}
            title="Resolver Disputas"
            description="Gestionar disputas pendientes"
            color="#f5576c"
            link="/disputes"
          />
          <QuickActionCard
            icon={<FileText size={32} />}
            title="Ver Contratos"
            description="Revisar contratos activos"
            color="#4facfe"
            link="/contracts"
          />
          <QuickActionCard
            icon={<Activity size={32} />}
            title="Ver Analytics"
            description="Análisis detallado"
            color="#43e97b"
            link="/analytics"
          />
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon, title, value, subtitle, trend, gradient }) => {
  const isPositive = trend >= 0;
  
  return (
    <div className="metric-card" style={{ background: gradient }}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <p className="metric-title">{title}</p>
        <h2 className="metric-value">{value}</h2>
        <div className="metric-footer">
          <span className="metric-subtitle">{subtitle}</span>
          <span className={`metric-trend ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {Math.abs(trend)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// User Status Chart
const UserStatusChart = ({ stats }) => {
  const active = stats?.users?.active || 0;
  const suspended = stats?.users?.suspended || 0;
  const banned = stats?.users?.banned || 0;
  const total = active + suspended + banned || 1;

  return (
    <div className="status-chart">
      <div className="status-item">
        <div className="status-bar">
          <div 
            className="status-fill active"
            style={{ width: `${(active / total) * 100}%` }}
          ></div>
        </div>
        <div className="status-info">
          <CheckCircle size={18} className="status-icon active" />
          <span>Activos</span>
          <strong>{active}</strong>
        </div>
      </div>

      <div className="status-item">
        <div className="status-bar">
          <div 
            className="status-fill suspended"
            style={{ width: `${(suspended / total) * 100}%` }}
          ></div>
        </div>
        <div className="status-info">
          <Clock size={18} className="status-icon suspended" />
          <span>Suspendidos</span>
          <strong>{suspended}</strong>
        </div>
      </div>

      <div className="status-item">
        <div className="status-bar">
          <div 
            className="status-fill banned"
            style={{ width: `${(banned / total) * 100}%` }}
          ></div>
        </div>
        <div className="status-info">
          <XCircle size={18} className="status-icon banned" />
          <span>Baneados</span>
          <strong>{banned}</strong>
        </div>
      </div>
    </div>
  );
};

// Activity Stats
const ActivityStats = ({ stats, analytics }) => {
  return (
    <div className="activity-list">
      <div className="activity-item">
        <Activity size={18} className="activity-icon" />
        <div>
          <p>Acciones últimas 24h</p>
          <strong>{stats?.activity?.last_24h || 0}</strong>
        </div>
      </div>
      <div className="activity-item">
        <AlertCircle size={18} className="activity-icon" />
        <div>
          <p>Moderación pendiente</p>
          <strong>{stats?.moderation?.pending || 0}</strong>
        </div>
      </div>
      <div className="activity-item">
        <FileText size={18} className="activity-icon" />
        <div>
          <p>Contratos activos</p>
          <strong>{stats?.contracts?.active || 0}</strong>
        </div>
      </div>
      <div className="activity-item">
        <Users size={18} className="activity-icon" />
        <div>
          <p>Usuarios hoy</p>
          <strong>{analytics?.today?.users || 0}</strong>
        </div>
      </div>
    </div>
  );
};

// Period Comparison
const PeriodComparison = ({ analytics }) => {
  const periods = [
    {
      name: 'Hoy',
      contracts: analytics?.today?.contracts || 0,
      volume: analytics?.today?.volume || 0,
      users: analytics?.today?.users || 0,
    },
    {
      name: 'Esta Semana',
      contracts: analytics?.this_week?.contracts || 0,
      volume: analytics?.this_week?.volume || 0,
      users: analytics?.this_week?.users || 0,
    },
    {
      name: 'Este Mes',
      contracts: analytics?.this_month?.contracts || 0,
      volume: analytics?.this_month?.volume || 0,
      users: analytics?.this_month?.users || 0,
    },
  ];

  return (
    <div className="period-comparison">
      {periods.map((period, index) => (
        <div key={index} className="period-card">
          <h4>{period.name}</h4>
          <div className="period-stats">
            <div className="period-stat">
              <FileText size={16} />
              <div>
                <span>Contratos</span>
                <strong>{period.contracts}</strong>
              </div>
            </div>
            <div className="period-stat">
              <DollarSign size={16} />
              <div>
                <span>Volumen</span>
                <strong>${period.volume.toLocaleString()}</strong>
              </div>
            </div>
            <div className="period-stat">
              <Users size={16} />
              <div>
                <span>Usuarios</span>
                <strong>{period.users}</strong>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Quick Action Card
const QuickActionCard = ({ icon, title, description, color, link }) => {
  return (
    <button
      className="quick-action-card"
      onClick={() => window.location.href = link}
      style={{ '--action-color': color }}
    >
      <div className="action-icon" style={{ color }}>
        {icon}
      </div>
      <h4>{title}</h4>
      <p>{description}</p>
    </button>
  );
};

export default DashboardPage;
