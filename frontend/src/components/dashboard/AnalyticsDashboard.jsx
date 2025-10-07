/**
 * GigChain.io - Advanced Analytics Dashboard
 * Real-time analytics and metrics visualization
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AnalyticsDashboard.css';
import { useI18n } from '../../i18n/i18nContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AnalyticsDashboard = () => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [report, setReport] = useState(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState({});
  const [ws, setWs] = useState(null);

  // Fetch dashboard overview
  const fetchOverview = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/analytics/dashboard/overview`);
      setOverview(response.data.overview);
      setRealtimeMetrics(response.data.realtime);
      setError(null);
    } catch (err) {
      console.error('Error fetching overview:', err);
      setError(t('errors.network_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Fetch period report
  const fetchReport = useCallback(async (period) => {
    try {
      const response = await axios.get(`${API_URL}/api/analytics/report/${period}`);
      setReport(response.data.report);
    } catch (err) {
      console.error('Error fetching report:', err);
    }
  }, []);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    const websocket = new WebSocket(`ws://localhost:5000/api/analytics/ws/realtime`);

    websocket.onopen = () => {
      console.log('✅ WebSocket connected to analytics');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'metrics_update') {
        setRealtimeMetrics(data.metrics);
      } else if (data.type === 'event_tracked' || data.type === 'contract_tracked') {
        // Refresh overview when new events come in
        fetchOverview();
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [fetchOverview]);

  // Initial load
  useEffect(() => {
    fetchOverview();
    fetchReport(selectedPeriod);
  }, [fetchOverview, fetchReport, selectedPeriod]);

  // Format number with commas
  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  // Format currency
  const formatCurrency = (num) => {
    if (!num) return '$0';
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format percentage
  const formatPercentage = (num) => {
    if (!num) return '0%';
    return `${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard error">
        <p>{error}</p>
        <button onClick={fetchOverview}>{t('common.retry')}</button>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>{t('analytics.dashboard')}</h1>
        <div className="period-selector">
          {['day', 'week', 'month', 'year'].map((period) => (
            <button
              key={period}
              className={`period-button ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {t(`analytics.period_${period}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <MetricCard
          title={t('analytics.contracts_created')}
          value={formatNumber(overview?.today?.contracts || 0)}
          change={overview?.this_week?.growth || 0}
          icon="📄"
        />
        <MetricCard
          title={t('analytics.total_volume')}
          value={formatCurrency(overview?.today?.volume || 0)}
          change={overview?.this_week?.growth || 0}
          icon="💰"
        />
        <MetricCard
          title={t('analytics.active_users')}
          value={formatNumber(overview?.today?.users || 0)}
          change={overview?.this_week?.growth || 0}
          icon="👥"
        />
        <MetricCard
          title={t('analytics.success_rate')}
          value={formatPercentage(overview?.today?.success_rate || 0)}
          change={0}
          icon="✅"
        />
      </div>

      {/* Detailed Report */}
      {report && (
        <div className="report-section">
          <div className="report-summary">
            <h2>{t('analytics.summary')}</h2>
            <div className="summary-grid">
              <SummaryItem
                label={t('analytics.total_contracts')}
                value={formatNumber(report.summary.total_contracts)}
              />
              <SummaryItem
                label={t('analytics.completed_contracts')}
                value={formatNumber(report.summary.completed_contracts)}
              />
              <SummaryItem
                label={t('analytics.total_revenue')}
                value={formatCurrency(report.summary.total_revenue)}
              />
              <SummaryItem
                label={t('analytics.avg_completion_time')}
                value={`${report.summary.avg_completion_time.toFixed(1)} ${t('common.days')}`}
              />
              <SummaryItem
                label={t('analytics.user_retention')}
                value={formatPercentage(report.summary.user_retention)}
              />
              <SummaryItem
                label={t('analytics.growth_rate')}
                value={formatPercentage(report.summary.growth_rate)}
                positive={report.summary.growth_rate > 0}
              />
            </div>
          </div>

          {/* Top Categories */}
          <div className="report-categories">
            <h2>{t('analytics.top_categories')}</h2>
            <div className="categories-list">
              {report.details.top_categories?.map((category, index) => (
                <div key={category.category} className="category-item">
                  <span className="category-rank">#{index + 1}</span>
                  <span className="category-name">{category.category}</span>
                  <span className="category-count">{formatNumber(category.count)} contracts</span>
                  <span className="category-volume">{formatCurrency(category.volume)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Agent Usage */}
          <div className="report-ai-usage">
            <h2>{t('analytics.ai_agent_usage')}</h2>
            <div className="ai-usage-grid">
              {Object.entries(report.details.ai_agent_usage || {}).map(([agent, count]) => (
                <div key={agent} className="ai-usage-item">
                  <span className="ai-agent-name">{agent}</span>
                  <span className="ai-agent-count">{formatNumber(count)} calls</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Metrics */}
      <div className="realtime-section">
        <h2>{t('analytics.realtime_metrics')} 🔴</h2>
        <div className="realtime-grid">
          {Object.entries(realtimeMetrics).map(([key, data]) => (
            <div key={key} className="realtime-metric">
              <span className="metric-name">{key.replace(/_/g, ' ')}</span>
              <span className="metric-value">{formatNumber(data.value)}</span>
              <span className="metric-time">
                {new Date(data.last_updated).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, icon }) => {
  const isPositive = change > 0;
  
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <h3 className="metric-title">{title}</h3>
        <p className="metric-value">{value}</p>
        {change !== 0 && (
          <p className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </p>
        )}
      </div>
    </div>
  );
};

// Summary Item Component
const SummaryItem = ({ label, value, positive }) => {
  return (
    <div className="summary-item">
      <span className="summary-label">{label}</span>
      <span className={`summary-value ${positive !== undefined ? (positive ? 'positive' : 'negative') : ''}`}>
        {value}
      </span>
    </div>
  );
};

export default AnalyticsDashboard;
