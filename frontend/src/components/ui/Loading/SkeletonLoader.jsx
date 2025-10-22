import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ 
  width = '100%', 
  height = '20px', 
  className = '',
  variant = 'text',
  count = 1,
  spacing = '0.5rem'
}) => {
  const renderSkeleton = (index) => (
    <div
      key={index}
      className={`skeleton skeleton-${variant} ${className}`}
      style={{ 
        width, 
        height,
        marginBottom: index < count - 1 ? spacing : 0
      }}
      role="progressbar"
      aria-label="Loading content..."
      aria-valuetext="Loading"
    />
  );

  if (count === 1) {
    return renderSkeleton(0);
  }

  return (
    <div className="skeleton-group">
      {Array.from({ length: count }, (_, index) => renderSkeleton(index))}
    </div>
  );
};

// Specialized skeleton components
export const SkeletonCard = ({ className = '' }) => (
  <div className={`skeleton-card ${className}`} role="progressbar" aria-label="Loading card...">
    <div className="skeleton-card-header">
      <SkeletonLoader variant="circle" width="48px" height="48px" />
      <div className="skeleton-card-title">
        <SkeletonLoader variant="text" width="60%" height="18px" />
        <SkeletonLoader variant="text" width="40%" height="14px" />
      </div>
    </div>
    <div className="skeleton-card-body">
      <SkeletonLoader variant="text" count={3} height="16px" />
    </div>
    <div className="skeleton-card-footer">
      <SkeletonLoader variant="button" width="80px" height="36px" />
      <SkeletonLoader variant="button" width="100px" height="36px" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`skeleton-table ${className}`} role="progressbar" aria-label="Loading table...">
    {/* Table Header */}
    <div className="skeleton-table-header">
      {Array.from({ length: columns }, (_, i) => (
        <SkeletonLoader key={`header-${i}`} variant="text" height="20px" width="80%" />
      ))}
    </div>
    
    {/* Table Rows */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="skeleton-table-row">
        {Array.from({ length: columns }, (_, colIndex) => (
          <SkeletonLoader 
            key={`cell-${rowIndex}-${colIndex}`} 
            variant="text" 
            height="16px" 
            width={colIndex === 0 ? '60%' : '80%'} 
          />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonChart = ({ className = '' }) => (
  <div className={`skeleton-chart ${className}`} role="progressbar" aria-label="Loading chart...">
    <div className="skeleton-chart-header">
      <SkeletonLoader variant="text" width="200px" height="24px" />
      <SkeletonLoader variant="text" width="120px" height="16px" />
    </div>
    <div className="skeleton-chart-body">
      <div className="skeleton-chart-bars">
        {Array.from({ length: 7 }, (_, i) => (
          <div 
            key={i} 
            className="skeleton-chart-bar" 
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
    </div>
  </div>
);

export const SkeletonDashboard = ({ className = '' }) => (
  <div className={`skeleton-dashboard ${className}`}>
    {/* Stats Cards */}
    <div className="skeleton-stats-grid">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="skeleton-stat-card">
          <SkeletonLoader variant="text" width="100px" height="14px" />
          <SkeletonLoader variant="text" width="80px" height="28px" />
          <SkeletonLoader variant="text" width="60px" height="12px" />
        </div>
      ))}
    </div>
    
    {/* Chart Section */}
    <div className="skeleton-chart-section">
      <SkeletonChart />
    </div>
    
    {/* Recent Activity */}
    <div className="skeleton-activity-section">
      <SkeletonLoader variant="text" width="200px" height="20px" />
      <div className="skeleton-activity-list">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="skeleton-activity-item">
            <SkeletonLoader variant="circle" width="32px" height="32px" />
            <div className="skeleton-activity-content">
              <SkeletonLoader variant="text" width="70%" height="16px" />
              <SkeletonLoader variant="text" width="50%" height="14px" />
            </div>
            <SkeletonLoader variant="text" width="60px" height="14px" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const SkeletonList = ({ items = 5, showAvatar = false, className = '' }) => (
  <div className={`skeleton-list ${className}`} role="progressbar" aria-label="Loading list...">
    {Array.from({ length: items }, (_, i) => (
      <div key={i} className="skeleton-list-item">
        {showAvatar && (
          <SkeletonLoader variant="circle" width="40px" height="40px" />
        )}
        <div className="skeleton-list-content">
          <SkeletonLoader variant="text" width="70%" height="18px" />
          <SkeletonLoader variant="text" width="50%" height="14px" />
        </div>
        <SkeletonLoader variant="text" width="80px" height="16px" />
      </div>
    ))}
  </div>
);

export const SkeletonButton = ({ width = '120px', height = '40px', className = '' }) => (
  <SkeletonLoader 
    variant="button" 
    width={width} 
    height={height} 
    className={`skeleton-button ${className}`}
  />
);

export const SkeletonAvatar = ({ size = '48px', className = '' }) => (
  <SkeletonLoader 
    variant="circle" 
    width={size} 
    height={size} 
    className={`skeleton-avatar ${className}`}
  />
);

export default SkeletonLoader;
