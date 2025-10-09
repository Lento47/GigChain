import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Filter, Download, RefreshCw } from 'lucide-react';
import './ChartWidget.css';

export const ChartWidget = ({ 
  title, 
  data = [], 
  type = 'line', 
  height = 300,
  showControls = true,
  onRefresh,
  onExport 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState(data);

  useEffect(() => {
    setChartData(data);
  }, [data]);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsLoading(true);
      await onRefresh();
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport(chartData);
    } else {
      // Default export functionality
      const csvContent = generateCSV(chartData);
      downloadCSV(csvContent, `${title.toLowerCase().replace(/\s+/g, '-')}.csv`);
    }
  };

  const generateCSV = (data) => {
    const headers = ['Date', 'Value'];
    const rows = data.map(item => [item.date, item.value]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getMaxValue = () => {
    return Math.max(...chartData.map(item => item.value));
  };

  const getMinValue = () => {
    return Math.min(...chartData.map(item => item.value));
  };

  const renderLineChart = () => {
    if (chartData.length === 0) return null;

    const maxValue = getMaxValue();
    const minValue = getMinValue();
    const range = maxValue - minValue || 1;

    const points = chartData.map((item, index) => {
      const x = (index / (chartData.length - 1)) * 100;
      const y = 100 - ((item.value - minValue) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="chart-container">
        <svg viewBox="0 0 100 100" className="chart-svg">
          <polyline
            points={points}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="chart-labels">
          {chartData.map((item, index) => (
            <div key={index} className="chart-label">
              <span className="label-date">{item.date}</span>
              <span className="label-value">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    if (chartData.length === 0) return null;

    const maxValue = getMaxValue();
    const range = maxValue || 1;

    return (
      <div className="chart-container">
        <div className="bar-chart">
          {chartData.map((item, index) => {
            const height = (item.value / range) * 100;
            return (
              <div key={index} className="bar-container">
                <div 
                  className="bar"
                  style={{ height: `${height}%` }}
                >
                  <span className="bar-value">{item.value}</span>
                </div>
                <span className="bar-label">{item.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar': return renderBarChart();
      case 'line': 
      default: return renderLineChart();
    }
  };

  return (
    <div className="chart-widget" style={{ height: `${height}px` }}>
      <div className="chart-header">
        <div className="chart-title">
          <BarChart3 size={20} />
          <h3>{title}</h3>
        </div>
        
        {showControls && (
          <div className="chart-controls">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="period-select"
            >
              <option value="24h">24 horas</option>
              <option value="7d">7 días</option>
              <option value="30d">30 días</option>
              <option value="90d">90 días</option>
            </select>
            
            <button 
              className="control-btn"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
            </button>
            
            <button 
              className="control-btn"
              onClick={handleExport}
            >
              <Download size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="chart-content">
        {chartData.length === 0 ? (
          <div className="no-data">
            <BarChart3 size={48} className="no-data-icon" />
            <p>No hay datos disponibles</p>
          </div>
        ) : (
          renderChart()
        )}
      </div>

      {chartData.length > 0 && (
        <div className="chart-footer">
          <div className="chart-stats">
            <div className="stat-item">
              <span className="stat-label">Máximo:</span>
              <span className="stat-value">{getMaxValue()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Mínimo:</span>
              <span className="stat-value">{getMinValue()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Promedio:</span>
              <span className="stat-value">
                {Math.round(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const RevenueChart = ({ data = [] }) => {
  return (
    <ChartWidget
      title="Ganancias por Período"
      data={data}
      type="line"
      height={350}
    />
  );
};

export const ContractsChart = ({ data = [] }) => {
  return (
    <ChartWidget
      title="Contratos por Mes"
      data={data}
      type="bar"
      height={300}
    />
  );
};

export default ChartWidget;
