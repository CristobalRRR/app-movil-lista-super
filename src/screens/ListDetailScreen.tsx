import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
 
export default function ListDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Presiona editar para añadir productos</Text>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1e1e', padding: 24 },
  text: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
});