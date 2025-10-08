/**
 * GigChain Admin Panel - Dashboard Page
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Activity,
} from 'lucide-react';
import './DashboardPage.css';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const analyticsResponse = await axios.get('/api/admin/analytics/overview');
      setAnalytics(analyticsResponse.data.analytics);

      // Fetch system alerts
      const alertsResponse = await axios.get('/api/admin/alerts?acknowledged=false');
      setAlerts(alertsResponse.data.alerts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Platform overview and key metrics</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          {alerts.map((alert) => (
            <div
              key={alert.alert_id}
              className={`alert alert-${alert.severity}`}
            >
              <AlertCircle size={20} />
              <div className="alert-content">
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          icon={<Users />}
          title="Total Users"
          value={stats?.users?.total || 0}
          subtitle={`${stats?.users?.active || 0} active`}
          color="#6366f1"
        />
        <StatCard
          icon={<FileText />}
          title="Total Contracts"
          value={analytics?.this_month?.contracts || 0}
          subtitle="This month"
          color="#10b981"
        />
        <StatCard
          icon={<DollarSign />}
          title="Platform Volume"
          value={`$${(analytics?.this_month?.volume || 0).toLocaleString()}`}
          subtitle="This month"
          color="#f59e0b"
        />
        <StatCard
          icon={<TrendingUp />}
          title="Revenue"
          value={`$${(analytics?.this_month?.revenue || 0).toLocaleString()}`}
          subtitle="This month"
          color="#8b5cf6"
        />
      </div>

      {/* Detailed Stats */}
      <div className="details-grid">
        {/* Users Breakdown */}
        <div className="detail-card">
          <h3>
            <Users size={20} />
            Users Breakdown
          </h3>
          <div className="stat-list">
            <div className="stat-item">
              <span>Active</span>
              <strong style={{ color: '#10b981' }}>
                {stats?.users?.active || 0}
              </strong>
            </div>
            <div className="stat-item">
              <span>Suspended</span>
              <strong style={{ color: '#f59e0b' }}>
                {stats?.users?.suspended || 0}
              </strong>
            </div>
            <div className="stat-item">
              <span>Banned</span>
              <strong style={{ color: '#ef4444' }}>
                {stats?.users?.banned || 0}
              </strong>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="detail-card">
          <h3>
            <Activity size={20} />
            Recent Activity
          </h3>
          <div className="stat-list">
            <div className="stat-item">
              <span>Last 24 hours</span>
              <strong>{stats?.activity?.last_24h || 0} actions</strong>
            </div>
            <div className="stat-item">
              <span>Pending moderation</span>
              <strong>{stats?.moderation?.pending || 0}</strong>
            </div>
          </div>
        </div>

        {/* Week Stats */}
        <div className="detail-card">
          <h3>
            <TrendingUp size={20} />
            This Week
          </h3>
          <div className="stat-list">
            <div className="stat-item">
              <span>Contracts</span>
              <strong>{analytics?.this_week?.contracts || 0}</strong>
            </div>
            <div className="stat-item">
              <span>Volume</span>
              <strong>${(analytics?.this_week?.volume || 0).toLocaleString()}</strong>
            </div>
            <div className="stat-item">
              <span>Growth</span>
              <strong className={analytics?.this_week?.growth >= 0 ? 'positive' : 'negative'}>
                {analytics?.this_week?.growth >= 0 ? '+' : ''}
                {(analytics?.this_week?.growth || 0).toFixed(1)}%
              </strong>
            </div>
          </div>
        </div>

        {/* Today Stats */}
        <div className="detail-card">
          <h3>
            <Activity size={20} />
            Today
          </h3>
          <div className="stat-list">
            <div className="stat-item">
              <span>Contracts</span>
              <strong>{analytics?.today?.contracts || 0}</strong>
            </div>
            <div className="stat-item">
              <span>Volume</span>
              <strong>${(analytics?.today?.volume || 0).toLocaleString()}</strong>
            </div>
            <div className="stat-item">
              <span>Active Users</span>
              <strong>{analytics?.today?.users || 0}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-button" onClick={() => window.location.href = '/users'}>
            <Users size={24} />
            <span>Manage Users</span>
          </button>
          <button className="action-button" onClick={() => window.location.href = '/disputes'}>
            <AlertCircle size={24} />
            <span>View Disputes</span>
          </button>
          <button className="action-button" onClick={() => window.location.href = '/analytics'}>
            <TrendingUp size={24} />
            <span>Analytics</span>
          </button>
          <button className="action-button" onClick={() => window.location.href = '/activity'}>
            <Activity size={24} />
            <span>Activity Log</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, subtitle, color }) => {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-icon" style={{ color }}>
        {icon}
      </div>
      <div className="stat-content">
        <h4>{title}</h4>
        <p className="stat-value">{value}</p>
        <p className="stat-subtitle">{subtitle}</p>
      </div>
    </div>
  );
};

export default DashboardPage;
