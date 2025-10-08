/**
 * GigChain Mobile - Main Navigator
 * Bottom tab navigation for main app sections
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ContractsScreen from '../screens/ContractsScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WalletScreen from '../screens/WalletScreen';
import ContractDetailScreen from '../screens/ContractDetailScreen';
import CreateContractScreen from '../screens/CreateContractScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="CreateContract" component={CreateContractScreen} />
  </Stack.Navigator>
);

// Contracts Stack
const ContractsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ContractsList" component={ContractsScreen} />
    <Stack.Screen name="ContractDetail" component={ContractDetailScreen} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="Wallet" component={WalletScreen} />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Contracts"
        component={ContractsStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="storefront" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
