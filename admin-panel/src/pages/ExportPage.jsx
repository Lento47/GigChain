import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../store/adminStore';
import './ExportPage.css';

const ExportPage = () => {
  const { token } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Export settings
  const [exportType, setExportType] = useState('kpis');
  const [timeRange, setTimeRange] = useState('7d');
  const [format, setFormat] = useState('json');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Database info
  const [databaseInfo, setDatabaseInfo] = useState(null);
  
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const fetchDatabaseInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/export/database-info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDatabaseInfo(data.databases);
      }
    } catch (error) {
      console.error('Error fetching database info:', error);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      // Build URL with parameters
      let url = `${API_BASE}/api/admin/export/${exportType}?time_range=${timeRange}&format=${format}`;
      
      // Add custom dates if needed
      if (timeRange === 'custom') {
        if (!customStartDate || !customEndDate) {
          setMessage({ type: 'error', text: 'Please specify start and end dates for custom range' });
          setLoading(false);
          return;
        }
        url += `&start_date=${customStartDate}&end_date=${customEndDate}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (format === 'csv') {
        // Download CSV file
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${exportType}_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        
        setMessage({ type: 'success', text: 'Data exported successfully as CSV!' });
      } else {
        // JSON format
        const data = await response.json();
        
        if (data.success) {
          // Download JSON file
          const jsonString = JSON.stringify(data.data, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `${exportType}_${timeRange}_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(downloadUrl);
          
          setMessage({ type: 'success', text: 'Data exported successfully as JSON!' });
        } else {
          setMessage({ type: 'error', text: data.error || 'Export failed' });
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/admin/export/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Backup created successfully! ${Object.keys(data.backups).length} databases backed up.` 
        });
      } else {
        setMessage({ type: 'error', text: data.detail || 'Backup failed' });
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeLabel = (range) => {
    const labels = {
      '24h': 'Last 24 Hours',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      'this_month': 'This Month',
      'last_month': 'Last Month',
      'this_year': 'This Year',
      'all_time': 'All Time',
      'custom': 'Custom Range'
    };
    return labels[range] || range;
  };

  return (
    <div className="export-page">
      <div className="page-header">
        <h1>📊 Data Export & Backup</h1>
        <p>Export KPIs, users, contracts and create database backups</p>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="export-grid">
        {/* Export Configuration */}
        <div className="export-card">
          <h2>📥 Export Data</h2>
          
          <div className="form-group">
            <label>Export Type</label>
            <select 
              value={exportType} 
              onChange={(e) => setExportType(e.target.value)}
              className="select-input"
            >
              <option value="kpis">📊 KPIs & Metrics</option>
              <option value="users">👥 Users List</option>
              <option value="contracts">📄 Contracts</option>
            </select>
          </div>

          <div className="form-group">
            <label>Time Range</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="select-input"
            >
              <option value="24h">⏰ Last 24 Hours</option>
              <option value="7d">📅 Last 7 Days</option>
              <option value="30d">📆 Last 30 Days</option>
              <option value="90d">📆 Last 90 Days</option>
              <option value="this_month">📅 This Month</option>
              <option value="last_month">📅 Last Month</option>
              <option value="this_year">📆 This Year</option>
              <option value="all_time">🌐 All Time</option>
              <option value="custom">🎯 Custom Range</option>
            </select>
          </div>

          {timeRange === 'custom' && (
            <div className="custom-dates">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="datetime-local"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="date-input"
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="datetime-local"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Export Format</label>
            <div className="format-buttons">
              <button
                className={`format-btn ${format === 'json' ? 'active' : ''}`}
                onClick={() => setFormat('json')}
              >
                JSON
              </button>
              <button
                className={`format-btn ${format === 'csv' ? 'active' : ''}`}
                onClick={() => setFormat('csv')}
              >
                CSV
              </button>
            </div>
          </div>

          <div className="export-summary">
            <h4>Export Summary</h4>
            <ul>
              <li><strong>Type:</strong> {exportType.toUpperCase()}</li>
              <li><strong>Period:</strong> {getTimeRangeLabel(timeRange)}</li>
              <li><strong>Format:</strong> {format.toUpperCase()}</li>
              {timeRange === 'custom' && (
                <>
                  <li><strong>Start:</strong> {customStartDate || 'Not set'}</li>
                  <li><strong>End:</strong> {customEndDate || 'Not set'}</li>
                </>
              )}
            </ul>
          </div>

          <button
            onClick={handleExport}
            disabled={loading}
            className="export-btn primary"
          >
            {loading ? '⏳ Exporting...' : '📥 Export Data'}
          </button>
        </div>

        {/* Database Information */}
        <div className="database-card">
          <h2>🗄️ Database Information</h2>
          
          <div className="info-section">
            <p className="info-description">
              GigChain stores all data in SQLite databases on your server. 
              Here's where your data lives:
            </p>

            {databaseInfo && (
              <div className="databases-list">
                {Object.entries(databaseInfo).map(([name, db]) => (
                  <div key={name} className="database-item">
                    <div className="db-header">
                      <h3>{name.charAt(0).toUpperCase() + name.slice(1)} Database</h3>
                      <span className={`db-status ${db.exists ? 'online' : 'offline'}`}>
                        {db.exists ? '● Online' : '○ Offline'}
                      </span>
                    </div>
                    
                    <div className="db-details">
                      <div className="db-detail">
                        <span className="label">📁 Path:</span>
                        <code className="path">{db.path}</code>
                      </div>
                      <div className="db-detail">
                        <span className="label">💾 Size:</span>
                        <span className="value">{db.size_mb} MB</span>
                      </div>
                      <div className="db-detail">
                        <span className="label">📝 Purpose:</span>
                        <span className="description">{db.description}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="backup-section">
            <h3>💾 Create Backup</h3>
            <p>
              Create a complete backup of all databases. 
              Backups are saved to <code>/workspace/backups/</code>
            </p>
            <button
              onClick={handleBackup}
              disabled={loading}
              className="backup-btn"
            >
              {loading ? '⏳ Creating Backup...' : '💾 Create Backup Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Export Buttons */}
      <div className="quick-exports">
        <h2>⚡ Quick Exports</h2>
        <div className="quick-buttons">
          <button
            onClick={() => {
              setExportType('kpis');
              setTimeRange('24h');
              setFormat('json');
              setTimeout(() => handleExport(), 100);
            }}
            className="quick-btn"
            disabled={loading}
          >
            📊 Last 24h KPIs (JSON)
          </button>
          <button
            onClick={() => {
              setExportType('kpis');
              setTimeRange('7d');
              setFormat('csv');
              setTimeout(() => handleExport(), 100);
            }}
            className="quick-btn"
            disabled={loading}
          >
            📊 Last 7d KPIs (CSV)
          </button>
          <button
            onClick={() => {
              setExportType('users');
              setTimeRange('all_time');
              setFormat('csv');
              setTimeout(() => handleExport(), 100);
            }}
            className="quick-btn"
            disabled={loading}
          >
            👥 All Users (CSV)
          </button>
          <button
            onClick={() => {
              setExportType('contracts');
              setTimeRange('30d');
              setFormat('json');
              setTimeout(() => handleExport(), 100);
            }}
            className="quick-btn"
            disabled={loading}
          >
            📄 Last 30d Contracts (JSON)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
