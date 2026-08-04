import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

type Props = { navigation: any };

export default function InformacionScreen({ navigation }: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Información</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.appName, { color: colors.text }]}>Lista Super</Text>
        <Text style={[styles.version, { color: colors.mutedText }]}>Versión 1.0</Text>
        <Text style={[styles.description, { color: colors.text }]}>
          Una lista de supermercado simple, con categorías y subcategorías, para usar sin conexión
          a internet.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B5807A',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerIcon: { fontSize: 22, color: '#000' },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: 'bold', color: '#000', textAlign: 'center' },
  content: { padding: 24, alignItems: 'center', marginTop: 20 },
  appName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  version: { fontSize: 14, marginBottom: 20 },
  description: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});