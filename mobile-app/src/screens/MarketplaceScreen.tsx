/**
 * GigChain Mobile - Marketplace Screen
 * Browse and purchase contract templates
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MarketplaceScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Template Marketplace</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});

export default MarketplaceScreen;
