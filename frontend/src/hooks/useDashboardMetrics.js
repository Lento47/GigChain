import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/api';

// Dashboard Metrics Hook - Real-time data from backend
const useDashboardMetrics = (walletAddress = null) => {
  const [metrics, setMetrics] = useState({
    activeContracts: 0,
    totalEarnings: 0,
    totalSpent: 0,
    averageRating: 0,
    completedProjects: 0,
    activityByHour: [],
    recentActivity: []
  });

  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard stats from backend
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build URL with optional wallet parameter
        let url = `${API_BASE_URL}/api/contracts/stats/dashboard?hours=24`;
        if (walletAddress) {
          url += `&wallet_address=${walletAddress}`;
        }

        // Fetch stats from backend
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }

        const data = await response.json();
        
        setMetrics({
          activeContracts: data.active_contracts || 0,
          totalEarnings: data.total_earned || 0,
          totalSpent: data.total_spent || 0,
          averageRating: 4.8, // TODO: Implement rating system
          completedProjects: data.completed_contracts || 0,
          activityByHour: data.activity_by_hour || [],
          recentActivity: []
        });

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message);
        
        // Fallback to mock data
        setMetrics({
          activeContracts: 0,
          totalEarnings: 0,
          totalSpent: 0,
          averageRating: 0,
          completedProjects: 0,
          activityByHour: [],
          recentActivity: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchDashboardStats, 30000);
    
    return () => clearInterval(interval);
  }, [walletAddress]);

  return {
    metrics,
    contracts,
    isLoading,
    error
  };
};

export { useDashboardMetrics };
export default useDashboardMetrics;
