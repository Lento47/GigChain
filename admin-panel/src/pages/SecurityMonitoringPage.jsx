import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../store/adminStore';
import './SecurityMonitoringPage.css';

const SecurityMonitoringPage = () => {
  const { token } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Stats
  const [stats, setStats] = useState(null);
  const [siemStatus, setSiemStatus] = useState(null);
  
  // Events
  const [events, setEvents] = useState([]);
  const [highRiskEvents, setHighRiskEvents] = useState([]);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchStats();
    fetchSiemStatus();
    fetchEvents();
    fetchHighRiskEvents();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchEvents();
      fetchHighRiskEvents();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/security/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSiemStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/security/siem-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setSiemStatus(data);
    } catch (error) {
      console.error('Error fetching SIEM status:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      let url = `${API_BASE}/api/admin/security/events?limit=100`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (severityFilter) url += `&severity=${severityFilter}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setEvents(data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchHighRiskEvents = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/security/high-risk?threshold=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setHighRiskEvents(data.events);
    } catch (error) {
      console.error('Error fetching high-risk events:', error);
    }
  };

  const sendTestAlert = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/security/test-alert`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Test alert sent to ${data.siems_notified} SIEM(s)`);
      }
    } catch (error) {
      alert('❌ Error sending test alert');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 70) return '#ef4444'; // red
    if (score >= 50) return '#f59e0b'; // orange
    if (score >= 30) return '#eab308'; // yellow
    return '#10b981'; // green
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#dc2626',
      security: '#ea580c',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    return colors[severity] || '#6b7280';
  };

  return (
    <div className="security-monitoring-page">
      <div className="page-header">
        <h1>🛡️ Security Monitoring</h1>
        <p>AI-powered anomaly detection + SIEM integration</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Security Events
        </button>
        <button
          className={`tab ${activeTab === 'high-risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('high-risk')}
        >
          High Risk ({highRiskEvents.length})
        </button>
        <button
          className={`tab ${activeTab === 'siem' ? 'active' : ''}`}
          onClick={() => setActiveTab('siem')}
        >
          SIEM Integration
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="overview-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{stats.total_events}</div>
                <div className="stat-label">Total Events</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🚨</div>
              <div className="stat-content">
                <div className="stat-value">{stats.alerts_sent}</div>
                <div className="stat-label">Alerts Sent</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-value">{stats.users_monitored}</div>
                <div className="stat-label">Users Monitored</div>
              </div>
            </div>

            <div className="stat-card high-risk">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <div className="stat-value">{stats.recent_high_risk}</div>
                <div className="stat-label">High Risk Events</div>
              </div>
            </div>
          </div>

          <div className="ai-status-card">
            <h3>🤖 AI Anomaly Detection</h3>
            <div className="ai-info">
              <div className="ai-badge active">● Active</div>
              <p>AI is actively monitoring user behavior and detecting anomalies in real-time.</p>
            </div>
            
            <div className="detection-types">
              <h4>Detection Capabilities:</h4>
              <ul>
                <li>⏰ Unusual login times (2-5 AM)</li>
                <li>🌍 Impossible travel / location changes</li>
                <li>⚡ Rapid-fire actions (velocity anomalies)</li>
                <li>💰 Unusual payment amounts (10x user average)</li>
                <li>🔓 Brute force login attempts</li>
                <li>🤖 API abuse (100+ calls/minute)</li>
                <li>🆕 New user suspicious activity</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Security Events Tab */}
      {activeTab === 'events' && (
        <div className="events-section">
          <div className="events-header">
            <h2>Security Events</h2>
            <div className="filters">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); fetchEvents(); }}
                className="filter-select"
              >
                <option value="">All Categories</option>
                <option value="authentication">Authentication</option>
                <option value="authorization">Authorization</option>
                <option value="contract">Contract</option>
                <option value="payment">Payment</option>
                <option value="wallet">Wallet</option>
                <option value="admin">Admin</option>
              </select>
              
              <select
                value={severityFilter}
                onChange={(e) => { setSeverityFilter(e.target.value); fetchEvents(); }}
                className="filter-select"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="security">Security</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
              
              <button onClick={fetchEvents} className="refresh-btn">
                🔄 Refresh
              </button>
            </div>
          </div>

          <div className="events-list">
            {events.length === 0 ? (
              <div className="no-events">No security events found</div>
            ) : (
              events.map((event) => (
                <div key={event.event_id} className="event-card">
                  <div className="event-header">
                    <div className="event-info">
                      <span
                        className="severity-badge"
                        style={{ backgroundColor: getSeverityColor(event.severity) }}
                      >
                        {event.severity}
                      </span>
                      <span className="category-badge">{event.category}</span>
                      <span className="action-text">{event.action}</span>
                    </div>
                    <div className="event-meta">
                      <span className="risk-score" style={{ color: getRiskColor(event.risk_score) }}>
                        Risk: {event.risk_score.toFixed(0)}
                      </span>
                      <span className="timestamp">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="event-details">
                    <div className="detail-item">
                      <span className="label">User:</span>
                      <span className="value">{event.user_id || event.wallet_address || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">IP:</span>
                      <span className="value">{event.ip_address || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Result:</span>
                      <span className={`value ${event.result}`}>{event.result}</span>
                    </div>
                  </div>

                  {event.details?.ai_analysis?.is_anomaly && (
                    <div className="anomaly-alert">
                      <strong>🚨 Anomaly Detected:</strong>
                      <ul>
                        {event.details.ai_analysis.reasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* High Risk Tab */}
      {activeTab === 'high-risk' && (
        <div className="high-risk-section">
          <div className="section-header">
            <h2>🚨 High Risk Events</h2>
            <button onClick={fetchHighRiskEvents} className="refresh-btn">
              🔄 Refresh
            </button>
          </div>

          <div className="high-risk-list">
            {highRiskEvents.length === 0 ? (
              <div className="no-events success">
                ✅ No high-risk events detected
              </div>
            ) : (
              highRiskEvents.map((event) => (
                <div key={event.event_id} className="high-risk-card">
                  <div className="risk-header">
                    <div className="risk-score-badge" style={{ backgroundColor: getRiskColor(event.risk_score) }}>
                      {event.risk_score.toFixed(0)}
                    </div>
                    <div className="risk-info">
                      <h3>{event.action} - {event.category}</h3>
                      <span className="risk-time">{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="risk-details">
                    <p><strong>User:</strong> {event.user_id || event.wallet_address}</p>
                    <p><strong>IP:</strong> {event.ip_address}</p>
                    <p><strong>Result:</strong> {event.result}</p>
                  </div>

                  {event.details?.ai_analysis && (
                    <div className="ai-analysis">
                      <h4>AI Analysis:</h4>
                      <div className="reasons">
                        {event.details.ai_analysis.reasons.map((reason, idx) => (
                          <div key={idx} className="reason-item">• {reason}</div>
                        ))}
                      </div>
                      {event.details.ai_analysis.recommendations && (
                        <div className="recommendations">
                          <strong>Recommendations:</strong>
                          {event.details.ai_analysis.recommendations.map((rec, idx) => (
                            <div key={idx} className="rec-item">{rec}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SIEM Integration Tab */}
      {activeTab === 'siem' && siemStatus && (
        <div className="siem-section">
          <div className="section-header">
            <h2>🔗 SIEM Integrations</h2>
            <button onClick={sendTestAlert} disabled={loading} className="test-btn">
              {loading ? 'Sending...' : '📨 Send Test Alert'}
            </button>
          </div>

          <div className="siem-overview">
            <div className="overview-stat">
              <span className="stat-label">Active Integrations:</span>
              <span className="stat-value">{siemStatus.active_integrations}/3</span>
            </div>
            <div className="overview-stat">
              <span className="stat-label">AI Anomaly Detection:</span>
              <span className="stat-value active">{siemStatus.ai_anomaly_detection}</span>
            </div>
          </div>

          <div className="siem-grid">
            {/* Splunk */}
            <div className={`siem-card ${siemStatus.siems.splunk.configured ? 'active' : 'inactive'}`}>
              <div className="siem-header">
                <h3>Splunk</h3>
                <span className={`status-badge ${siemStatus.siems.splunk.configured ? 'online' : 'offline'}`}>
                  {siemStatus.siems.splunk.configured ? '● Configured' : '○ Not Configured'}
                </span>
              </div>
              <div className="siem-details">
                <p><strong>URL:</strong> {siemStatus.siems.splunk.url}</p>
                {!siemStatus.siems.splunk.configured && (
                  <div className="config-hint">
                    <p>To configure:</p>
                    <code>SPLUNK_HEC_URL=...</code>
                    <code>SPLUNK_HEC_TOKEN=...</code>
                  </div>
                )}
              </div>
            </div>

            {/* Elasticsearch */}
            <div className={`siem-card ${siemStatus.siems.elasticsearch.configured ? 'active' : 'inactive'}`}>
              <div className="siem-header">
                <h3>Elasticsearch</h3>
                <span className={`status-badge ${siemStatus.siems.elasticsearch.configured ? 'online' : 'offline'}`}>
                  {siemStatus.siems.elasticsearch.configured ? '● Configured' : '○ Not Configured'}
                </span>
              </div>
              <div className="siem-details">
                <p><strong>URL:</strong> {siemStatus.siems.elasticsearch.url}</p>
                <p><strong>Index:</strong> {siemStatus.siems.elasticsearch.index}</p>
                {!siemStatus.siems.elasticsearch.configured && (
                  <div className="config-hint">
                    <p>To configure:</p>
                    <code>ELASTIC_URL=...</code>
                    <code>ELASTIC_API_KEY=...</code>
                  </div>
                )}
              </div>
            </div>

            {/* Datadog */}
            <div className={`siem-card ${siemStatus.siems.datadog.configured ? 'active' : 'inactive'}`}>
              <div className="siem-header">
                <h3>Datadog</h3>
                <span className={`status-badge ${siemStatus.siems.datadog.configured ? 'online' : 'offline'}`}>
                  {siemStatus.siems.datadog.configured ? '● Configured' : '○ Not Configured'}
                </span>
              </div>
              <div className="siem-details">
                <p><strong>Site:</strong> {siemStatus.siems.datadog.site}</p>
                {!siemStatus.siems.datadog.configured && (
                  <div className="config-hint">
                    <p>To configure:</p>
                    <code>DATADOG_API_KEY=...</code>
                    <code>DATADOG_SITE=datadoghq.com</code>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="integration-info">
            <h3>ℹ️ About SIEM Integration</h3>
            <p>
              GigChain automatically sends security events to all configured SIEMs.
              This enables compliance, long-term retention, and advanced analytics.
            </p>
            <ul>
              <li><strong>Splunk:</strong> Enterprise SIEM, best for compliance (SOC 2, ISO 27001)</li>
              <li><strong>Elasticsearch:</strong> Open source, powerful search, Kibana dashboards</li>
              <li><strong>Datadog:</strong> Modern monitoring, easy setup, beautiful UI</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityMonitoringPage;
