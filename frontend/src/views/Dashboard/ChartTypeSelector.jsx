import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import './ChartTypeSelector.css';

const ChartTypeSelector = ({ chartType, onChartTypeChange }) => {
  return (
    <div className="chart-type-selector">
      <div className="selector-label">Visualización:</div>
      <div className="chart-type-buttons">
        <button
          className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
          onClick={() => onChartTypeChange('line')}
          title="Gráfico de líneas"
        >
          <TrendingUp size={18} />
          <span>Líneas</span>
        </button>
        <button
          className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
          onClick={() => onChartTypeChange('bar')}
          title="Gráfico de barras"
        >
          <BarChart3 size={18} />
          <span>Barras</span>
        </button>
      </div>
    </div>
  );
};

export default ChartTypeSelector;
