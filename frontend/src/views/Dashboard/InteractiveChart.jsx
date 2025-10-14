import React, { useState, useMemo, useCallback } from 'react';

const InteractiveChart = ({ onDataPointClick, activityData = [], chartType = 'line' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [tooltipData, setTooltipData] = useState({ value: 0, time: '', contracts: 0 });

  // Convert backend activity data to chart format
  const chartData = useMemo(() => {
    if (!activityData || activityData.length === 0) {
      // Return empty data for proper loading state - NO MOCK DATA
      return [];
    }

    // Convert backend data (24 hours) to chart points
    const maxOpenContracts = Math.max(...activityData.map(d => d.open_contracts || 0), 1);
    
    return activityData.map((activity, index) => {
      const openContracts = activity.open_contracts || 0;
      const acceptedContracts = activity.accepted_contracts || 0;
      
      // Map open contracts count to Y position (inverted: more contracts = lower Y)
      const yPosition = 280 - (openContracts / maxOpenContracts) * 230;
      
      return {
        x: (index / (activityData.length - 1)) * 1000,
        y: Math.max(50, Math.min(280, yPosition)),
        value: activity.value || openContracts * 5,
        time: activity.hour,
        openContracts: openContracts,
        acceptedContracts: acceptedContracts,
        contracts: activity.contracts // Total activity
      };
    });
  }, [activityData]);

  // Simplified and stable interpolation function
  const interpolateData = useCallback((x) => {
    const clampedX = Math.max(0, Math.min(1000, x));
    
    // Find the closest data point
    let closestPoint = chartData[0];
    let minDistance = Math.abs(clampedX - closestPoint.x);
    
    for (const point of chartData) {
      const distance = Math.abs(clampedX - point.x);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
    
    return {
      ...closestPoint,
      x: clampedX,
      openContracts: closestPoint.openContracts || 0,
      acceptedContracts: closestPoint.acceptedContracts || 0
    };
  }, [chartData]);

  // Stable mouse move handler
  const handleMouseMove = useCallback((e) => {
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width;
      const x = Math.max(0, Math.min(1000, relativeX * 1000));
      
      // Find closest point for Y position
      const data = interpolateData(x);
      
      setMousePosition({ 
        x: x, 
        y: data.y
      });
      setTooltipData(data);
    } catch (error) {
      console.error('Error in handleMouseMove:', error);
    }
  }, [interpolateData]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleChartClick = useCallback((e) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 1000;
      const data = interpolateData(x);
      
      if (onDataPointClick) {
        onDataPointClick({
          period: data.time,
          openContracts: data.openContracts || 0,
          acceptedContracts: data.acceptedContracts || 0,
          contracts: data.contracts,
          value: data.value,
          x: x,
          y: data.y,
          hour: data.time
        });
      }
    } catch (error) {
      console.error('Error in handleChartClick:', error);
    }
  }, [interpolateData, onDataPointClick]);

  // Generate path for line chart
  const generateLinePath = () => {
    if (chartData.length === 0) return "";
    
    let path = `M ${chartData[0].x} ${chartData[0].y}`;
    for (let i = 1; i < chartData.length; i++) {
      path += ` L ${chartData[i].x} ${chartData[i].y}`;
    }
    return path;
  };

  // Generate bars for bar chart
  const generateBars = () => {
    if (chartData.length === 0) return [];
    
    return chartData.map((point, index) => {
      const barHeight = 280 - point.y;
      return (
        <rect
          key={index}
          x={point.x - 15}
          y={point.y}
          width="30"
          height={barHeight}
          fill="var(--accent-color)"
          className="chart-bar"
        />
      );
    });
  };

  // Generate accepted contracts line for both chart types
  const generateAcceptedContractsLine = () => {
    if (chartData.length === 0) return "";
    
    const maxAcceptedContracts = Math.max(...chartData.map(d => d.acceptedContracts || 0), 1);
    
    let path = `M ${chartData[0].x} ${280 - ((chartData[0].acceptedContracts || 0) / maxAcceptedContracts) * 100}`;
    
    for (let i = 1; i < chartData.length; i++) {
      const currentY = 280 - ((chartData[i].acceptedContracts || 0) / maxAcceptedContracts) * 100;
      path += ` L ${chartData[i].x} ${currentY}`;
    }
    
    return path;
  };

  // Show empty state if no data
  if (chartData.length === 0) {
    return (
      <div className="chart-visualization">
        <div className="chart-empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-message">
            <h3>No hay datos disponibles</h3>
            <p>Los datos de actividad aparecerán aquí cuando haya contratos y transacciones.</p>
          </div>
        </div>
      </div>
    );
  }

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
        {/* Define gradients */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="var(--accent-color)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* X-axis */}
        <line x1="0" y1="280" x2="1000" y2="280" stroke="var(--border-color)" strokeWidth="2" />
        
        {/* Accepted contracts line (dashed) */}
        <path 
          d={generateAcceptedContractsLine()}
          fill="none" 
          stroke="var(--text-secondary)" 
          strokeWidth="2" 
          strokeDasharray="5,5"
        />
        
        {/* Chart content based on type */}
        {chartType === 'line' ? (
          <>
            {/* Area under curve */}
            <path 
              d={`${generateLinePath()} L 1000 280 L 0 280 Z`}
              fill="url(#chartGradient)"
            />
            
            {/* Main line */}
            <path 
              d={generateLinePath()}
              fill="none" 
              stroke="var(--accent-color)" 
              strokeWidth="4"
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </>
        ) : (
          <>
            {/* Bar chart */}
            {generateBars()}
          </>
        )}
        
        {/* Mouse tracking line */}
        {isHovered && (
          <line 
            x1={mousePosition.x} 
            y1="0" 
            x2={mousePosition.x} 
            y2="300" 
            stroke="var(--accent-color)" 
            strokeWidth="2" 
            strokeDasharray="5,5"
          />
        )}
        
        {/* Hover circle */}
        {isHovered && (
          <circle 
            cx={mousePosition.x} 
            cy={mousePosition.y} 
            r="8" 
            fill="var(--accent-color)" 
            stroke="var(--bg-primary)"
            strokeWidth="3"
          />
        )}
      </svg>
      
      {/* Tooltip */}
      {isHovered && (
        <div 
          className="chart-tooltip"
          style={{
            left: `${Math.max(0, Math.min(100, (mousePosition.x / 1000) * 100))}%`,
            top: '10px',
            transform: 'translate(-50%, 0)',
            position: 'absolute'
          }}
        >
          <div className="tooltip-content">
            <div className="tooltip-time">{tooltipData.time}</div>
            <div className="tooltip-value">{tooltipData.openContracts || 0} contratos abiertos</div>
            <div className="tooltip-contracts">{tooltipData.acceptedContracts || 0} contratos aceptados</div>
            {tooltipData.contracts > 0 && (
              <div className="tooltip-activity">+{tooltipData.contracts} actividades</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { InteractiveChart };
export default InteractiveChart;