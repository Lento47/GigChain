import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import { useWalletAuth } from './useWalletAuth';

/**
 * Custom hook for managing user profiles
 * Integrates with GigChain profile API and W-CSAP authentication
 */
export const useProfile = () => {
  const { address, isConnected } = useWallet();
  const { sessionData, isAuthenticated } = useWalletAuth();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:5000/api';

  // Get authentication headers
  const getAuthHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add session token if available
    if (sessionData?.session_token) {
      headers['Authorization'] = `Bearer ${sessionData.session_token}`;
    }
    
    return headers;
  };

  /**
   * Load user profile data
   */
  const loadProfile = async (walletAddress = address) => {
    if (!walletAddress) return;

    setIsLoading(true);
    setError(null);

    console.log('🔄 Loading profile for:', walletAddress);

    try {
      const response = await fetch(`${API_BASE}/profile/${walletAddress}`, {
        headers: getAuthHeaders()
      });
      
      if (response.status === 404) {
        // Profile doesn't exist yet
        console.log('ℹ️ Profile not found (404)');
        setProfile(null);
        setSkills([]);
        setNfts([]);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load profile: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Profile loaded:', {
        hasProfile: !!data.profile,
        displayName: data.profile?.display_name,
        hasAvatar: !!data.profile?.avatar_url,
        avatarSize: data.profile?.avatar_url ? `${Math.round(data.profile.avatar_url.length / 1024)}KB` : 'N/A',
        skillsCount: data.skills?.length || 0,
        nftsCount: data.nfts?.length || 0
      });
      setProfile(data.profile);
      setSkills(data.skills || []);
      setNfts(data.nfts || []);

    } catch (err) {
      console.error('❌ Error loading profile:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create new user profile
   */
  const createProfile = async (profileData) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Add wallet address to profile data
      const dataWithWallet = {
        ...profileData,
        wallet_address: address
      };

      const response = await fetch(`${API_BASE}/profile/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dataWithWallet),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create profile');
      }

      const result = await response.json();
      
      // Reload profile after creation
      await loadProfile();
      
      return result;

    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Add wallet address to updates
      const updatesWithWallet = {
        ...updates,
        wallet_address: address
      };

      const response = await fetch(`${API_BASE}/profile/update`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatesWithWallet),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      
      // Reload profile after update
      await loadProfile();
      
      return result;

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add or update user skill
   */
  const addSkill = async (skillData) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/profile/skills/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(skillData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add skill');
      }

      const result = await response.json();
      
      // Reload profile after adding skill
      await loadProfile();
      
      return result;

    } catch (err) {
      console.error('Error adding skill:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add user NFT/achievement
   */
  const addNFT = async (nftData) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/profile/nfts/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(nftData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add NFT');
      }

      const result = await response.json();
      
      // Reload profile after adding NFT
      await loadProfile();
      
      return result;

    } catch (err) {
      console.error('Error adding NFT:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get user tier information
   */
  const getTierInfo = async (walletAddress = address) => {
    if (!walletAddress) return null;

    try {
      const response = await fetch(`${API_BASE}/profile/tier/${walletAddress}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get tier info: ${response.statusText}`);
      }

      return await response.json();

    } catch (err) {
      console.error('Error getting tier info:', err);
      return null;
    }
  };

  /**
   * Calculate profile completeness
   */
  const calculateCompleteness = (profileData) => {
    if (!profileData) return 0;

    const fields = [
      'display_name',
      'bio',
      'location',
      'website',
      'avatar_url'
    ];

    const completedFields = fields.filter(field => 
      profileData[field] && profileData[field].trim() !== ''
    ).length;

    return Math.round((completedFields / fields.length) * 100);
  };

  /**
   * Get default profile data for new users
   */
  const getDefaultProfile = () => ({
    display_name: '',
    bio: '',
    location: '',
    website: '',
    avatar_url: '',
    twitter_handle: '',
    github_handle: '',
    linkedin_handle: '',
    preferences: {
      theme: 'dark',
      language: 'es',
      notifications: true
    },
    settings: {
      privacy_level: 'public',
      show_earnings: true,
      show_skills: true
    }
  });

  // Load profile when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadProfile();
    } else {
      setProfile(null);
      setSkills([]);
      setNfts([]);
    }
  }, [isConnected, address]);

  return {
    // State
    profile,
    skills,
    nfts,
    isLoading,
    error,
    
    // Actions
    loadProfile,
    createProfile,
    updateProfile,
    addSkill,
    addNFT,
    getTierInfo,
    
    // Utilities
    calculateCompleteness,
    getDefaultProfile,
    
    // Computed
    hasProfile: !!profile,
    profileCompleteness: profile ? calculateCompleteness(profile) : 0,
    isProfileComplete: profile ? calculateCompleteness(profile) >= 80 : false
  };
};
