import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Star, Shield, Zap, Coins } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const UserProfileCard = ({ userId, compact = false }) => {
  const [userStats, setUserStats] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
    fetchWalletBalance();
  }, [userId]);

  const fetchUserStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/gamification/users/${userId}/stats`);
      setUserStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tokens/wallet/${userId}`);
      setWalletBalance(response.data);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!userStats) {
    return <div style={styles.error}>Unable to load profile</div>;
  }

  const progressPercentage = ((userStats.total_xp % 1000) / 1000) * 100;

  if (compact) {
    return (
      <div style={styles.compactCard}>
        <div style={styles.levelBadge}>
          <span style={styles.levelNumber}>{userStats.level}</span>
        </div>
        <div style={styles.compactInfo}>
          <div style={styles.compactName}>Level {userStats.level}</div>
          <div style={styles.trustScoreCompact}>
            <Shield size={14} style={{ color: getTrustColor(userStats.trust_score) }} />
            <span>{userStats.trust_score.toFixed(1)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      {/* Header with Level & Trust Score */}
      <div style={styles.header}>
        <div style={styles.levelSection}>
          <div style={styles.levelBadgeLarge}>
            <Zap size={32} style={{ color: '#fbbf24' }} />
            <span style={styles.levelNumberLarge}>{userStats.level}</span>
          </div>
          <div>
            <div style={styles.levelLabel}>Level {userStats.level}</div>
            <div style={styles.xpText}>{userStats.total_xp} XP</div>
          </div>
        </div>

        <div style={styles.trustSection}>
          <div style={styles.trustScore}>
            <Shield size={24} style={{ color: getTrustColor(userStats.trust_score) }} />
            <span style={styles.trustNumber}>{userStats.trust_score.toFixed(1)}</span>
          </div>
          <div style={styles.trustLabel}>Trust Score</div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div style={styles.progressSection}>
        <div style={styles.progressLabel}>
          <span>Progress to Level {userStats.level + 1}</span>
          <span>{userStats.xp_to_next_level} XP to go</span>
        </div>
        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progressFill,
              width: `${progressPercentage}%`
            }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statItem}>
          <TrendingUp size={20} style={{ color: '#8b5cf6' }} />
          <div style={styles.statValue}>{userStats.completed_contracts}</div>
          <div style={styles.statLabel}>Completed</div>
        </div>
        <div style={styles.statItem}>
          <Award size={20} style={{ color: '#f59e0b' }} />
          <div style={styles.statValue}>{userStats.badges.length}</div>
          <div style={styles.statLabel}>Badges</div>
        </div>
        <div style={styles.statItem}>
          <Star size={20} style={{ color: '#10b981' }} />
          <div style={styles.statValue}>{userStats.visibility_multiplier.toFixed(1)}x</div>
          <div style={styles.statLabel}>Visibility</div>
        </div>
        <div style={styles.statItem}>
          <Coins size={20} style={{ color: '#3b82f6' }} />
          <div style={styles.statValue}>
            {walletBalance ? `${walletBalance.balance.toFixed(2)}∞` : '0.00∞'}
          </div>
          <div style={styles.statLabel}>Credits</div>
        </div>
      </div>

      {/* Badges Display */}
      {userStats.badges.length > 0 && (
        <div style={styles.badgesSection}>
          <div style={styles.badgesHeader}>
            <Award size={16} style={{ color: '#8b5cf6' }} />
            <span>Recent Badges</span>
          </div>
          <div style={styles.badgesGrid}>
            {userStats.badges.slice(0, 6).map((badge, idx) => (
              <div 
                key={idx} 
                style={styles.badgeItem}
                title={`${badge.name}: ${badge.description}`}
              >
                <span style={styles.badgeIcon}>{badge.icon || '🏆'}</span>
                <span style={styles.badgeName}>{badge.name}</span>
              </div>
            ))}
          </div>
          {userStats.badges.length > 6 && (
            <div style={styles.moreBadges}>
              +{userStats.badges.length - 6} more badges
            </div>
          )}
        </div>
      )}

      {/* Ban Warning */}
      {userStats.is_banned && (
        <div style={styles.banWarning}>
          ⚠️ Account Restricted
        </div>
      )}
    </div>
  );
};

const getTrustColor = (score) => {
  if (score >= 90) return '#10b981'; // Green
  if (score >= 75) return '#3b82f6'; // Blue
  if (score >= 60) return '#f59e0b'; // Yellow
  if (score >= 40) return '#f97316'; // Orange
  return '#ef4444'; // Red
};

const styles = {
  card: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    border: '1px solid #475569',
    borderRadius: '16px',
    padding: '1.5rem',
    color: '#e2e8f0',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
  },
  compactCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 1rem',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid #475569',
    borderRadius: '12px',
    color: '#e2e8f0'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #475569'
  },
  levelSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  levelBadge: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)'
  },
  levelBadgeLarge: {
    width: '72px',
    height: '72px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)',
    position: 'relative'
  },
  levelNumber: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'white'
  },
  levelNumberLarge: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'white',
    marginTop: '0.25rem'
  },
  levelLabel: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '0.25rem'
  },
  xpText: {
    fontSize: '0.875rem',
    color: '#94a3b8'
  },
  trustSection: {
    textAlign: 'right'
  },
  trustScore: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    marginBottom: '0.25rem'
  },
  trustNumber: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#e2e8f0'
  },
  trustLabel: {
    fontSize: '0.875rem',
    color: '#94a3b8'
  },
  trustScoreCompact: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.875rem',
    color: '#94a3b8'
  },
  progressSection: {
    marginBottom: '1.5rem'
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: '#94a3b8',
    marginBottom: '0.5rem'
  },
  progressBar: {
    width: '100%',
    height: '12px',
    background: 'rgba(30, 41, 59, 0.8)',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid #475569'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%)',
    borderRadius: '6px',
    transition: 'width 0.3s ease',
    boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem',
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid #334155',
    borderRadius: '12px',
    transition: 'transform 0.2s ease',
    cursor: 'pointer'
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#e2e8f0',
    marginTop: '0.5rem'
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.25rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  badgesSection: {
    padding: '1rem',
    background: 'rgba(15, 23, 42, 0.3)',
    borderRadius: '12px',
    border: '1px solid #334155'
  },
  badgesHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#e2e8f0'
  },
  badgesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem'
  },
  badgeItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.75rem',
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid #475569',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  badgeIcon: {
    fontSize: '1.5rem',
    marginBottom: '0.25rem'
  },
  badgeName: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    textAlign: 'center'
  },
  moreBadges: {
    marginTop: '0.5rem',
    textAlign: 'center',
    fontSize: '0.75rem',
    color: '#64748b'
  },
  banWarning: {
    marginTop: '1rem',
    padding: '0.75rem',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: '600',
    color: 'white'
  },
  compactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  compactName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#e2e8f0'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    color: '#94a3b8'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(139, 92, 246, 0.1)',
    borderTop: '4px solid #8b5cf6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  error: {
    padding: '1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    color: '#ef4444',
    textAlign: 'center'
  }
};

export default UserProfileCard;
