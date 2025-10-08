import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../store/adminStore';
import './TroubleshootPage.css';

const TroubleshootPage = () => {
  const { token } = useAdminStore();
  const [activeTab, setActiveTab] = useState('services');
  const [loading, setLoading] = useState(false);
  
  // Services status
  const [servicesStatus, setServicesStatus] = useState(null);
  
  // Logs
  const [logs, setLogs] = useState([]);
  const [logLevel, setLogLevel] = useState('ERROR');
  
  // Errors
  const [errors, setErrors] = useState([]);
  
  // Diagnostics
  const [diagnostics, setDiagnostics] = useState(null);
  
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (activeTab === 'services') {
      checkServicesStatus();
    } else if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'errors') {
      fetchErrors();
    } else if (activeTab === 'diagnostics') {
      runDiagnostics();
    }
  }, [activeTab]);

  const checkServicesStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/troubleshoot/services`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setServicesStatus(data);
      }
    } catch (error) {
      console.error('Error checking services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/troubleshoot/logs?level=${logLevel}&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/troubleshoot/errors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setErrors(data.errors);
      }
    } catch (error) {
      console.error('Error fetching errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/troubleshoot/diagnostics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDiagnostics(data.diagnostics);
      }
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'green';
      case 'warning':
        return 'orange';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <div className="troubleshoot-page">
      <div className="page-header">
        <h1>🔧 System Troubleshooting</h1>
        <p>Monitor system health and diagnose issues</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          Services Status
        </button>
        <button
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          System Logs
        </button>
        <button
          className={`tab ${activeTab === 'errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('errors')}
        >
          Recent Errors
        </button>
        <button
          className={`tab ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
        >
          Diagnostics
        </button>
      </div>

      <div className="tab-content">
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {/* Services Status Tab */}
        {activeTab === 'services' && servicesStatus && !loading && (
          <div className="services-status">
            <div className="status-header">
              <h2>Services Status</h2>
              <div className={`overall-status status-${servicesStatus.overall_status}`}>
                Overall: <strong>{servicesStatus.overall_status.toUpperCase()}</strong>
              </div>
              <button onClick={checkServicesStatus} className="refresh-btn">
                🔄 Refresh
              </button>
            </div>

            <div className="services-grid">
              {Object.entries(servicesStatus.services).map(([serviceName, service]) => (
                <div key={serviceName} className="service-card">
                  <div className="service-header">
                    <h3>{serviceName.replace(/_/g, ' ').toUpperCase()}</h3>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(service.status) }}
                    >
                      {service.status}
                    </span>
                  </div>
                  <p className="service-message">{service.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Logs Tab */}
        {activeTab === 'logs' && !loading && (
          <div className="logs-viewer">
            <div className="logs-header">
              <h2>System Logs</h2>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                className="log-level-select"
              >
                <option value="ALL">All Logs</option>
                <option value="ERROR">Errors Only</option>
                <option value="WARNING">Warnings</option>
                <option value="INFO">Info</option>
              </select>
              <button onClick={fetchLogs} className="refresh-btn">
                🔄 Refresh
              </button>
            </div>

            <div className="logs-container">
              {logs.length === 0 ? (
                <div className="no-logs">No logs found</div>
              ) : (
                <pre className="logs-content">
                  {logs.join('\n')}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Recent Errors Tab */}
        {activeTab === 'errors' && !loading && (
          <div className="errors-viewer">
            <div className="errors-header">
              <h2>Recent Errors</h2>
              <button onClick={fetchErrors} className="refresh-btn">
                🔄 Refresh
              </button>
            </div>

            <div className="errors-container">
              {errors.length === 0 ? (
                <div className="no-errors">
                  ✅ No recent errors found
                </div>
              ) : (
                <div className="errors-list">
                  {errors.map((error, index) => (
                    <div key={index} className="error-card">
                      <div className="error-header">
                        <span className="error-type">{error.type}</span>
                        <span className="error-time">{error.timestamp}</span>
                      </div>
                      <div className="error-message">{error.message}</div>
                      {error.stack && (
                        <pre className="error-stack">{error.stack}</pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagnostics Tab */}
        {activeTab === 'diagnostics' && diagnostics && !loading && (
          <div className="diagnostics-viewer">
            <div className="diagnostics-header">
              <h2>System Diagnostics</h2>
              <button onClick={runDiagnostics} className="refresh-btn">
                🔄 Run Again
              </button>
            </div>

            <div className="diagnostics-sections">
              {/* System Info */}
              <div className="diagnostic-section">
                <h3>💻 System Information</h3>
                <div className="info-grid">
                  {Object.entries(diagnostics.system).map(([key, value]) => (
                    <div key={key} className="info-item">
                      <span className="info-label">{key.replace(/_/g, ' ')}:</span>
                      <span className="info-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environment */}
              <div className="diagnostic-section">
                <h3>🌍 Environment</h3>
                <div className="info-grid">
                  {Object.entries(diagnostics.environment).map(([key, value]) => (
                    <div key={key} className="info-item">
                      <span className="info-label">{key.replace(/_/g, ' ')}:</span>
                      <span className="info-value">
                        {typeof value === 'boolean' ? (value ? '✅' : '❌') : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Database */}
              <div className="diagnostic-section">
                <h3>🗄️ Database</h3>
                <div className="info-grid">
                  {Object.entries(diagnostics.database).map(([key, value]) => (
                    <div key={key} className="info-item">
                      <span className="info-label">{key.replace(/_/g, ' ')}:</span>
                      <span className="info-value">
                        {Array.isArray(value) 
                          ? value.join(', ')
                          : typeof value === 'boolean' 
                          ? (value ? '✅' : '❌') 
                          : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security */}
              <div className="diagnostic-section">
                <h3>🔐 Security</h3>
                <div className="info-grid">
                  {Object.entries(diagnostics.security).map(([key, value]) => (
                    <div key={key} className="info-item">
                      <span className="info-label">{key.replace(/_/g, ' ')}:</span>
                      <span className="info-value">
                        {typeof value === 'boolean' ? (value ? '✅' : '❌') : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TroubleshootPage;
