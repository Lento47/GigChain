/**
 * GigChain.io Mobile App
 * Main application entry point
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

// Import screens
import MainNavigator from './src/navigation/MainNavigator';
import { WalletProvider } from './src/contexts/WalletContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import LoadingScreen from './src/screens/LoadingScreen';

const API_URL = 'http://localhost:5000'; // Update for production

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const sessionToken = await SecureStore.getItemAsync('session_token');
      if (sessionToken) {
        // Validate session with backend
        // ... (implementation)
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <WalletProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
            <MainNavigator />
          </NavigationContainer>
        </WalletProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
