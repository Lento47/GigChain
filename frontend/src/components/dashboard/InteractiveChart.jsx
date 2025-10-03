import React, { useState } from 'react';

const InteractiveChart = ({ onDataPointClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [tooltipData, setTooltipData] = useState({ value: 0, time: '', contracts: 0 });

  // Datos reales simulados para el gráfico (24 horas) - CORREGIDOS para alinearse con la curva
  const chartData = [
    { x: 0, y: 250, value: 12, time: '00:00', contracts: 5 },
    { x: 100, y: 150, value: 28, time: '04:00', contracts: 12 },
    { x: 200, y: 280, value: 8, time: '08:00', contracts: 3 },
    { x: 300, y: 180, value: 22, time: '12:00', contracts: 9 },
    { x: 400, y: 80, value: 45, time: '16:00', contracts: 18 },
    { x: 500, y: 250, value: 15, time: '20:00', contracts: 6 },
    { x: 600, y: 150, value: 32, time: '22:00', contracts: 13 },
    { x: 700, y: 50, value: 58, time: '23:00', contracts: 23 },
    { x: 800, y: 200, value: 18, time: '23:30', contracts: 7 },
    { x: 900, y: 100, value: 38, time: '23:45', contracts: 15 },
    { x: 1000, y: 150, value: 25, time: '24:00', contracts: 10 }
  ];

  // Función mejorada para calcular la posición Y en la curva de Bézier
  const calculateYOnCurve = (x) => {
    // Usar la misma curva que se define en el SVG para consistencia perfecta
    // Curva: M 0 250 C 100 150, 200 280, 300 180 C 400 80, 500 250, 600 150 C 700 50, 800 200, 900 100 L 1000 150
    
    // Normalizar x a un rango de 0-1 para cada segmento
    if (x <= 300) {
      // Primera curva de Bézier: 0-300 (P0: 250, P1: 150, P2: 280, P3: 180)
      const t = Math.max(0, Math.min(1, x / 300));
      const y = Math.pow(1-t, 3) * 250 + 3 * Math.pow(1-t, 2) * t * 150 + 3 * (1-t) * Math.pow(t, 2) * 280 + Math.pow(t, 3) * 180;
      return Math.round(y);
    } else if (x <= 600) {
      // Segunda curva de Bézier: 300-600 (P0: 180, P1: 80, P2: 250, P3: 150)
      const t = Math.max(0, Math.min(1, (x - 300) / 300));
      const y = Math.pow(1-t, 3) * 180 + 3 * Math.pow(1-t, 2) * t * 80 + 3 * (1-t) * Math.pow(t, 2) * 250 + Math.pow(t, 3) * 150;
      return Math.round(y);
    } else if (x <= 900) {
      // Tercera curva de Bézier: 600-900 (P0: 150, P1: 50, P2: 200, P3: 100)
      const t = Math.max(0, Math.min(1, (x - 600) / 300));
      const y = Math.pow(1-t, 3) * 150 + 3 * Math.pow(1-t, 2) * t * 50 + 3 * (1-t) * Math.pow(t, 2) * 200 + Math.pow(t, 3) * 100;
      return Math.round(y);
    } else {
      // Línea recta: 900-1000 (de 100 a 150)
      const t = Math.max(0, Math.min(1, (x - 900) / 100));
      const y = 100 + t * (150 - 100);
      return Math.round(y);
    }
  };

  // Función mejorada para encontrar el punto más cercano
  const findNearestDataPoint = (x) => {
    let nearestPoint = chartData[0];
    let minDistance = Math.abs(x - nearestPoint.x);
    
    for (const point of chartData) {
      const distance = Math.abs(x - point.x);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }
    
    return nearestPoint;
  };

  // Función mejorada para interpolar datos entre puntos
  const interpolateData = (x) => {
    // Manejar casos fuera del rango normal
    if (x < 0) {
      const firstPoint = chartData[0];
      return {
        x: 0,
        y: firstPoint.y,
        value: firstPoint.value,
        time: firstPoint.time,
        contracts: firstPoint.contracts
      };
    }
    
    if (x > 1000) {
      const lastPoint = chartData[chartData.length - 1];
      return {
        x: 1000,
        y: lastPoint.y,
        value: lastPoint.value,
        time: lastPoint.time,
        contracts: lastPoint.contracts
      };
    }
    
    // Si estamos muy cerca de un punto de datos, usar ese punto exacto
    const nearestPoint = findNearestDataPoint(x);
    if (Math.abs(x - nearestPoint.x) < 30) {
      return nearestPoint;
    }
    
    // Encontrar los dos puntos más cercanos para interpolación
    let beforePoint = null;
    let afterPoint = null;
    
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].x <= x) {
        beforePoint = chartData[i];
      }
      if (chartData[i].x >= x && !afterPoint) {
        afterPoint = chartData[i];
        break;
      }
    }
    
    if (!beforePoint) return chartData[0];
    if (!afterPoint) return chartData[chartData.length - 1];
    
    // Interpolar entre los dos puntos
    const t = (x - beforePoint.x) / (afterPoint.x - beforePoint.x);
    return {
      x: x,
      y: calculateYOnCurve(x),
      value: Math.round(beforePoint.value + t * (afterPoint.value - beforePoint.value)),
      time: t < 0.5 ? beforePoint.time : afterPoint.time,
      contracts: Math.round(beforePoint.contracts + t * (afterPoint.contracts - beforePoint.contracts))
    };
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Expandir el área de seguimiento para mejor respuesta
    const x = Math.max(-50, Math.min(1050, ((e.clientX - rect.left) / rect.width) * 1000));
    const y = calculateYOnCurve(x);
    const data = interpolateData(x);
    
    setMousePosition({ x, y });
    setTooltipData(data);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleChartClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const data = interpolateData(x);
    
    // Encontrar el período de tiempo más cercano
    const timeIndex = Math.floor(x / 100);
    const selectedPeriod = chartData[Math.min(timeIndex, chartData.length - 1)];
    
    if (onDataPointClick) {
      onDataPointClick({
        period: selectedPeriod.time,
        contracts: selectedPeriod.contracts,
        value: selectedPeriod.value,
        x: x,
        y: calculateYOnCurve(x)
      });
    }
  };

  // Generar la línea de gradiente que sigue la curva
  const generateGradientPath = () => {
    return "M 0 250 C 100 150, 200 280, 300 180 C 400 80, 500 250, 600 150 C 700 50, 800 200, 900 100 L 1000 150";
  };

  return (
    <div className="chart-visualization">
      <svg 
        viewBox="0 0 1000 300" 
        className="chart-svg"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleChartClick}
        style={{ cursor: 'pointer' }}
      >
        {/* Definir gradiente */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="var(--accent-color)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Eje X */}
        <line x1="0" y1="280" x2="1000" y2="280" stroke="var(--border-color)" strokeWidth="2" />
        
        {/* Línea secundaria */}
        <path 
          className="chart-line-secondary"
          d="M 0 280 C 100 220, 250 200, 450 250 C 650 280, 800 230, 1000 260"
          fill="none" 
          stroke="var(--text-secondary)" 
          strokeWidth="2" 
          strokeDasharray="5,5"
          opacity="0.5"
        />
        
        {/* Área de gradiente bajo la curva */}
        <path 
          d={`${generateGradientPath()} L 1000 280 L 0 280 Z`}
          fill="url(#chartGradient)"
          opacity={isHovered ? 0.8 : 0.4}
          className="chart-area"
        />
        
        {/* Línea principal de datos */}
        <path 
          className={`chart-line-main ${isHovered ? 'hovered' : ''}`}
          d={generateGradientPath()}
          fill="none" 
          stroke="var(--accent-color)" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Puntos de datos removidos para una visualización más limpia */}
        
        {/* Línea vertical de seguimiento */}
        {isHovered && (
          <line 
            x1={mousePosition.x} 
            y1="0" 
            x2={mousePosition.x} 
            y2="300" 
            stroke="var(--accent-color)" 
            strokeWidth="2" 
            strokeDasharray="5,5"
            opacity="0.8"
            className="mouse-tracking-line"
          />
        )}
        
        {/* Círculo de seguimiento en la curva */}
        {isHovered && (
          <circle 
            cx={mousePosition.x} 
            cy={mousePosition.y} 
            r="8" 
            fill="var(--accent-color)" 
            stroke="var(--bg-primary)"
            strokeWidth="3"
            className="hover-circle"
          />
        )}
      </svg>
      
      {/* Tooltip con datos reales - POSICIONAMIENTO MEJORADO */}
      {isHovered && (
        <div 
          className="chart-tooltip"
          style={{
            left: `${Math.max(0, Math.min(100, (mousePosition.x / 1000) * 100))}%`,
            top: '10px', // Posición fija arriba del gráfico
            transform: 'translate(-50%, 0)',
            position: 'absolute'
          }}
        >
          <div className="tooltip-content">
            <div className="tooltip-time">{tooltipData.time}</div>
            <div className="tooltip-value">{tooltipData.value} contratos</div>
            <div className="tooltip-contracts">+{tooltipData.contracts} nuevos</div>
          </div>
        </div>
      )}
    </div>
  );
};

export { InteractiveChart };
export default InteractiveChart;
