import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
 
export default function OpcionesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Opciones (pendiente)</Text>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1e1e' },
  text: { color: '#fff', fontSize: 18 },
});