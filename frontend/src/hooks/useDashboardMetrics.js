import { useState, useEffect } from 'react';

// Dashboard Metrics Hook
const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState({
    activeContracts: 0,
    totalEarnings: 0,
    averageRating: 0,
    completedProjects: 0,
    recentActivity: []
  });

  const [contracts, setContracts] = useState([]);

  // Load contracts from localStorage or API
  useEffect(() => {
    const loadContracts = () => {
      try {
        const savedContracts = localStorage.getItem('gigchain-contracts');
        const contractsData = savedContracts ? JSON.parse(savedContracts) : [];
        setContracts(contractsData);
        
        // Calculate metrics based on contracts
        const activeContracts = contractsData.filter(c => c.status === 'active' || c.status === 'in-progress').length;
        const completedProjects = contractsData.filter(c => c.status === 'completed').length;
        
        // Calculate total earnings from completed contracts
        const totalEarnings = contractsData
          .filter(c => c.status === 'completed' && c.paidAmount)
          .reduce((sum, c) => sum + (c.paidAmount || 0), 0);
        
        // Calculate average rating
        const ratings = contractsData
          .filter(c => c.rating && c.rating > 0)
          .map(c => c.rating);
        const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
        
        // Get recent activity (last 10 contracts)
        const recentActivity = contractsData
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
          .slice(0, 10);
        
        setMetrics({
          activeContracts,
          totalEarnings,
          averageRating: Math.round(averageRating * 10) / 10,
          completedProjects,
          recentActivity
        });
      } catch (error) {
        console.error('Error loading contracts:', error);
      }
    };

    loadContracts();
    
    // Listen for storage changes (when contracts are updated in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'gigchain-contracts') {
        loadContracts();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Add new contract
  const addContract = (contract) => {
    const newContract = {
      ...contract,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft'
    };
    
    const updatedContracts = [...contracts, newContract];
    setContracts(updatedContracts);
    localStorage.setItem('gigchain-contracts', JSON.stringify(updatedContracts));
    
    // Recalculate metrics
    const activeContracts = updatedContracts.filter(c => c.status === 'active' || c.status === 'in-progress').length;
    const completedProjects = updatedContracts.filter(c => c.status === 'completed').length;
    const totalEarnings = updatedContracts
      .filter(c => c.status === 'completed' && c.paidAmount)
      .reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    
    const ratings = updatedContracts
      .filter(c => c.rating && c.rating > 0)
      .map(c => c.rating);
    const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
    
    const recentActivity = updatedContracts
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 10);
    
    setMetrics({
      activeContracts,
      totalEarnings,
      averageRating: Math.round(averageRating * 10) / 10,
      completedProjects,
      recentActivity
    });
  };

  // Update contract status
  const updateContractStatus = (contractId, status, additionalData = {}) => {
    const updatedContracts = contracts.map(contract => {
      if (contract.id === contractId) {
        return {
          ...contract,
          status,
          updatedAt: new Date().toISOString(),
          ...additionalData
        };
      }
      return contract;
    });
    
    setContracts(updatedContracts);
    localStorage.setItem('gigchain-contracts', JSON.stringify(updatedContracts));
    
    // Recalculate metrics
    const activeContracts = updatedContracts.filter(c => c.status === 'active' || c.status === 'in-progress').length;
    const completedProjects = updatedContracts.filter(c => c.status === 'completed').length;
    const totalEarnings = updatedContracts
      .filter(c => c.status === 'completed' && c.paidAmount)
      .reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    
    const ratings = updatedContracts
      .filter(c => c.rating && c.rating > 0)
      .map(c => c.rating);
    const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
    
    const recentActivity = updatedContracts
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 10);
    
    setMetrics({
      activeContracts,
      totalEarnings,
      averageRating: Math.round(averageRating * 10) / 10,
      completedProjects,
      recentActivity
    });
  };

  return {
    metrics,
    contracts,
    addContract,
    updateContractStatus
  };
};

export { useDashboardMetrics };
export default useDashboardMetrics;
