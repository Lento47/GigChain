import { useContract, useContractWrite, useContractRead, useContractEvents } from '@thirdweb-dev/react';
import { useState, useEffect } from 'react';

export const useContractManager = (contractAddress) => {
  const { contract } = useContract(contractAddress);
  const [contractInfo, setContractInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Contract write operations
  const { mutate: deployContract, isLoading: isDeploying } = useContractWrite(contract, "deploy");
  const { mutate: fundContract, isLoading: isFunding } = useContractWrite(contract, "fund");
  const { mutate: releaseFunds, isLoading: isReleasing } = useContractWrite(contract, "releaseFunds");
  const { mutate: disputeContract, isLoading: isDisputing } = useContractWrite(contract, "dispute");

  // Contract read operations
  const { data: contractBalance, isLoading: isLoadingBalance } = useContractRead(contract, "getBalance");
  const { data: milestones, isLoading: isLoadingMilestones } = useContractRead(contract, "getMilestones");
  const { data: contractStatus, isLoading: isLoadingStatus } = useContractRead(contract, "getStatus");

  // Contract events
  const { data: contractEvents, isLoading: isLoadingEvents } = useContractEvents(contract, "ContractFunded");
  const { data: milestoneEvents, isLoading: isLoadingMilestoneEvents } = useContractEvents(contract, "MilestoneCompleted");

  // Get contract information
  useEffect(() => {
    const getContractInfo = async () => {
      if (!contract) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get contract details
        const info = {
          address: contractAddress,
          balance: contractBalance || 0,
          milestones: milestones || [],
          status: contractStatus || 'unknown',
          events: contractEvents || [],
          milestoneEvents: milestoneEvents || []
        };
        
        setContractInfo(info);
      } catch (err) {
        setError(err.message);
        console.error('Error getting contract info:', err);
      } finally {
        setIsLoading(false);
      }
    };

    getContractInfo();
  }, [contract, contractAddress, contractBalance, milestones, contractStatus, contractEvents, milestoneEvents]);

  // Contract actions
  const deployEscrowContract = async (milestones, tokenAddress) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await deployContract({
        args: [milestones, tokenAddress]
      });
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error deploying contract:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const fundEscrow = async (amount) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await fundContract({
        args: [amount]
      });
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error funding contract:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const releaseMilestone = async (milestoneIndex) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await releaseFunds({
        args: [milestoneIndex]
      });
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error releasing milestone:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const disputeContractAction = async (reason) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await disputeContract({
        args: [reason]
      });
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error disputing contract:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Utility functions
  const formatBalance = (balance) => {
    if (!balance) return '0.00';
    return (parseFloat(balance) / 1e6).toFixed(2); // Assuming 6 decimals for USDC
  };

  const getMilestoneStatus = (milestoneIndex) => {
    if (!milestones || !milestoneEvents) return 'pending';
    
    const milestone = milestones[milestoneIndex];
    const completedEvent = milestoneEvents.find(event => 
      event.data.milestoneIndex === milestoneIndex
    );
    
    return completedEvent ? 'completed' : 'pending';
  };

  const getContractSummary = () => {
    if (!contractInfo) return null;
    
    return {
      address: contractInfo.address,
      balance: formatBalance(contractInfo.balance),
      status: contractInfo.status,
      totalMilestones: contractInfo.milestones?.length || 0,
      completedMilestones: contractInfo.milestoneEvents?.length || 0,
      isFullyFunded: contractInfo.balance > 0,
      hasDisputes: contractInfo.events?.some(event => event.eventName === 'ContractDisputed') || false
    };
  };

  return {
    // Contract instance
    contract,
    
    // State
    contractInfo,
    isLoading: isLoading || isDeploying || isFunding || isReleasing || isDisputing,
    error,
    
    // Read data
    contractBalance: formatBalance(contractBalance),
    milestones: milestones || [],
    contractStatus: contractStatus || 'unknown',
    events: contractEvents || [],
    milestoneEvents: milestoneEvents || [],
    
    // Actions
    deployEscrowContract,
    fundEscrow,
    releaseMilestone,
    disputeContractAction,
    
    // Utils
    formatBalance,
    getMilestoneStatus,
    getContractSummary
  };
};

export default useContractManager;
