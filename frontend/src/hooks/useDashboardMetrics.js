import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../constants/api';

// Local cache to persist data between component re-renders
const dashboardCache = {
  data: null,
  timestamp: null,
  walletAddress: null
};

// LocalStorage key for dashboard data
const DASHBOARD_STORAGE_KEY = 'gigchain_dashboard_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper functions for localStorage persistence
const saveDashboardToStorage = (data, walletAddress) => {
  try {
    const storageData = {
      data,
      timestamp: Date.now(),
      walletAddress,
      version: '1.0' // For future migrations
    };
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.warn('Failed to save dashboard data to localStorage:', error);
  }
};

const loadDashboardFromStorage = (walletAddress) => {
  try {
    const stored = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (!stored) return null;
    
    const storageData = JSON.parse(stored);
    
    // Validate stored data
    if (!storageData.data || 
        storageData.walletAddress !== walletAddress ||
        !storageData.timestamp ||
        Date.now() - storageData.timestamp > CACHE_DURATION) {
      
      // Clean up expired or invalid data
      clearDashboardStorage();
      return null;
    }
    
    return storageData;
  } catch (error) {
    console.warn('Failed to load dashboard data from localStorage:', error);
    // Clear corrupted data
    clearDashboardStorage();
    return null;
  }
};

const clearDashboardStorage = () => {
  try {
    localStorage.removeItem(DASHBOARD_STORAGE_KEY);
    // Also clear memory cache
    dashboardCache.data = null;
    dashboardCache.timestamp = null;
    dashboardCache.walletAddress = null;
  } catch (e) {
    // Ignore cleanup errors
  }
};

// Clean up expired cache on wallet address change
const handleWalletChange = (newWalletAddress, currentWalletAddress) => {
  if (newWalletAddress !== currentWalletAddress) {
    console.log('🔄 Wallet address changed, clearing cache');
    clearDashboardStorage();
  }
};

// Dashboard Metrics Hook - Real-time data from backend
const useDashboardMetrics = (walletAddress = null) => {
  // Initialize with cached data if available and valid
  const getCachedData = () => {
    // First try memory cache (fastest)
    if (dashboardCache.data && 
        dashboardCache.walletAddress === walletAddress &&
        dashboardCache.timestamp &&
        Date.now() - dashboardCache.timestamp < 60000) { // Memory cache valid for 1 minute
      return dashboardCache.data;
    }
    
    // Then try localStorage (persists across reloads)
    const storedData = loadDashboardFromStorage(walletAddress);
    if (storedData) {
      console.log('📦 Loading dashboard data from localStorage', {
        age: Date.now() - storedData.timestamp,
        totalContracts: storedData.data.totalContracts
      });
      // Update memory cache with stored data
      dashboardCache.data = storedData.data;
      dashboardCache.timestamp = storedData.timestamp;
      dashboardCache.walletAddress = walletAddress;
      return storedData.data;
    }
    
    // Fallback to empty data
    return {
      activeContracts: 0,
      totalEarnings: 0,
      totalSpent: 0,
      averageRating: 0,
      completedProjects: 0,
      totalContracts: 0,
      activityByHour: [],
      recentActivity: []
    };
  };

  // Initialize states with cached data
  const initialData = getCachedData();
  const hasCache = dashboardCache.data || loadDashboardFromStorage(walletAddress);
  
  const [metrics, setMetrics] = useState(initialData);
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(!hasCache);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(hasCache ? new Date(dashboardCache.timestamp || Date.now()) : null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Handle wallet address changes
  useEffect(() => {
    handleWalletChange(walletAddress, dashboardCache.walletAddress);
  }, [walletAddress]);

  // Fetch dashboard stats from backend
  useEffect(() => {
    let isInitialLoad = true;
    
    const fetchDashboardStats = async () => {
      try {
        // Only show loading spinner on initial load, not on refresh
        if (isInitialLoad) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }
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
        
        // Only update metrics if we got valid data
        if (data && typeof data === 'object') {
          const newMetrics = {
            activeContracts: data.active_contracts || 0,
            totalEarnings: data.total_earned || 0,
            totalSpent: data.total_spent || 0,
            averageRating: 0, // No rating system implemented yet - using real data only
            completedProjects: data.completed_contracts || 0,
            totalContracts: data.total_contracts || 0, // Add total contracts for calculations
            activityByHour: data.activity_by_hour || [],
            recentActivity: []
          };
          
          setMetrics(newMetrics);
          setLastUpdate(new Date());
          
          // Update memory cache
          dashboardCache.data = newMetrics;
          dashboardCache.timestamp = Date.now();
          dashboardCache.walletAddress = walletAddress;
          
          // Save to localStorage for persistence across page reloads
          saveDashboardToStorage(newMetrics, walletAddress);
          console.log('💾 Saving dashboard data to localStorage', {
            totalContracts: newMetrics.totalContracts,
            activeContracts: newMetrics.activeContracts
          });
          
          // Reset retry count on success
          retryCount.current = 0;
        }

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        
        // Increment retry count
        retryCount.current += 1;
        
        // Only set error if we've exceeded max retries
        if (retryCount.current >= maxRetries) {
          setError(`Failed to fetch data after ${maxRetries} attempts: ${err.message}`);
        } else {
          // Schedule a retry in 5 seconds
          setTimeout(() => {
            if (retryCount.current < maxRetries) {
              fetchDashboardStats();
            }
          }, 5000);
        }
        
        // Keep existing metrics on error, don't reset to zeros
        // This prevents "flickering" between data and empty state
        // If it's the first load and no cache, metrics will remain at initial zero state
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
          isInitialLoad = false;
        } else {
          setIsRefreshing(false);
        }
      }
    };

    fetchDashboardStats();
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [walletAddress]);

  return {
    metrics,
    contracts,
    isLoading,
    isRefreshing,
    error,
    lastUpdate
  };
};

export { useDashboardMetrics };
export default useDashboardMetrics;
