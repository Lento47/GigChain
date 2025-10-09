import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import './StatsWidget.css';

export const StatsWidget = ({ title, value, change, changeType, icon: Icon, color = 'blue', trend = 'neutral' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} className="trend-icon up" />;
      case 'down': return <TrendingDown size={16} className="trend-icon down" />;
      default: return null;
    }
  };

  const getChangeColor = () => {
    if (changeType === 'positive') return '#10b981';
    if (changeType === 'negative') return '#ef4444';
    return '#6b7280';
  };

  return (
    <div className={`stats-widget ${color} ${isVisible ? 'visible' : ''}`}>
      <div className="widget-header">
        <div className="widget-icon">
          <Icon size={20} />
        </div>
        <div className="widget-trend">
          {getTrendIcon()}
        </div>
      </div>
      
      <div className="widget-content">
        <div className="widget-title">{title}</div>
        <div className="widget-value">{value}</div>
        {change && (
          <div 
            className="widget-change"
            style={{ color: getChangeColor() }}
          >
            {changeType === 'positive' && '+'}
            {change}
            {changeType === 'positive' && '%'}
            {changeType === 'negative' && '%'}
          </div>
        )}
      </div>
    </div>
  );
};

export const StatsGrid = ({ stats = [] }) => {
  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <StatsWidget
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          changeType={stat.changeType}
          icon={stat.icon}
          color={stat.color}
          trend={stat.trend}
        />
      ))}
    </div>
  );
};

export const RealTimeStats = ({ metrics }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Only show real data, no fake percentages or changes
  const stats = [
    {
      title: 'Contratos Totales',
      value: metrics.totalContracts || 0,
      icon: BarChart3,
      color: 'blue'
    },
    {
      title: 'Contratos Activos',
      value: metrics.activeContracts || 0,
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Ingresos Totales',
      value: `$${(metrics.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'purple'
    },
    {
      title: 'Pagos Pendientes',
      value: metrics.pendingPayments || 0,
      icon: Clock,
      color: 'orange'
    }
  ];

  return (
    <div className="real-time-stats">
      <div className="stats-header">
        <h3>Estadísticas de la Plataforma</h3>
        <div className="last-update">
          <Clock size={14} />
          <span>Actualizado: {currentTime.toLocaleTimeString()}</span>
        </div>
      </div>
      <StatsGrid stats={stats} />
    </div>
  );
};

export default StatsWidget;
