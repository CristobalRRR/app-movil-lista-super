import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/db/database';
 
export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch((e) => setError(String(e)));
  }, []);
 
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error iniciando la base de datos:</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
 
  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
 
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
 
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1e1e' },
  errorText: { color: 'red', textAlign: 'center', paddingHorizontal: 16 },
});