/**
 * GigChain Mobile - Create Contract Screen
 * Create new contract with AI assistance
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CreateContractScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Contract</Text>
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

export default CreateContractScreen;
