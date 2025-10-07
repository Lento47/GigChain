/**
 * GigChain Mobile - Home Screen
 * Dashboard with quick actions and statistics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

const HomeScreen = ({ navigation }: any) => {
  const { wallet, isConnected } = useWallet();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    activeContracts: 0,
    totalEarned: 0,
    trustScore: 0,
    level: 'Novice',
  });

  useEffect(() => {
    if (isConnected) {
      fetchUserStats();
    }
  }, [isConnected, wallet]);

  const fetchUserStats = async () => {
    try {
      if (!wallet?.address) return;

      // Fetch user reputation
      const repResponse = await axios.get(
        `${API_URL}/api/reputation/user/${wallet.address}`
      );
      
      if (repResponse.data.success) {
        const rep = repResponse.data.reputation;
        setStats({
          activeContracts: rep.contracts_completed,
          totalEarned: rep.total_earned,
          trustScore: rep.trust_score,
          level: rep.level_name,
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserStats();
    setRefreshing(false);
  };

  const StatCard = ({ icon, title, value, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Icon name={icon} size={32} color={color} />
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const QuickAction = ({ icon, title, onPress }: any) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Icon name={icon} size={24} color="#6366f1" />
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          {isConnected && (
            <Text style={styles.walletAddress}>
              {wallet?.address?.slice(0, 6)}...{wallet?.address?.slice(-4)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => {}}
        >
          <Icon name="notifications-outline" size={24} color="#333" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="briefcase"
          title="Active Contracts"
          value={stats.activeContracts}
          color="#6366f1"
        />
        <StatCard
          icon="cash"
          title="Total Earned"
          value={`$${stats.totalEarned.toFixed(2)}`}
          color="#10b981"
        />
        <StatCard
          icon="shield-checkmark"
          title="Trust Score"
          value={`${stats.trustScore}%`}
          color="#f59e0b"
        />
        <StatCard
          icon="trending-up"
          title="Level"
          value={stats.level}
          color="#8b5cf6"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            icon="add-circle"
            title="New Contract"
            onPress={() => navigation.navigate('CreateContract')}
          />
          <QuickAction
            icon="search"
            title="Find Work"
            onPress={() => navigation.navigate('Marketplace')}
          />
          <QuickAction
            icon="scan"
            title="Scan QR"
            onPress={() => {}}
          />
          <QuickAction
            icon="chatbubbles"
            title="AI Assistant"
            onPress={() => {}}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <Text style={styles.emptyText}>
            No recent activity
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  walletAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    marginLeft: 12,
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
});

export default HomeScreen;
