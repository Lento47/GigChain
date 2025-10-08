/**
 * GigChain Mobile - Loading Screen
 * Initial loading screen with branding
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>GigChain</Text>
      <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
      <Text style={styles.tagline}>Web3 Contract Platform</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default LoadingScreen;
