import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../theme/ThemeContext';
import { exportAllData, importAllData, BackupData } from '../db/queries';

type Props = { navigation: any };

const BACKUP_FILENAME = 'lista_super_backup.json';

export default function OpcionesScreen({ navigation }: Props) {
  const { theme, colors, setTheme } = useTheme();
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const data = await exportAllData();
      const jsonString = JSON.stringify(data, null, 2);

      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        setBusy(false);
        return;
      }

      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        BACKUP_FILENAME,
        'application/json'
      );
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert('Copia guardada', 'El archivo se guardó correctamente en la carpeta elegida.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo crear la copia de seguridad.');
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const data = JSON.parse(content) as BackupData;

      if (!data || data.version !== 1 || !Array.isArray(data.categories)) {
        Alert.alert('Archivo inválido', 'Este archivo no es una copia de seguridad válida.');
        return;
      }

      Alert.alert(
        'Restaurar copia de seguridad',
        'Esto reemplazará TODOS tus datos actuales (listas, catálogo, todo) con los del archivo. Esta acción no se puede deshacer. ¿Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Restaurar',
            style: 'destructive',
            onPress: async () => {
              setBusy(true);
              try {
                await importAllData(data);
                Alert.alert(
                  'Restauración completa',
                  'Tus datos fueron restaurados. Cierra y vuelve a abrir la app para ver todos los cambios reflejados correctamente.'
                );
              } catch (e) {
                Alert.alert('Error', 'No se pudo restaurar la copia de seguridad.');
              } finally {
                setBusy(false);
              }
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'No se pudo leer el archivo seleccionado.');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Opciones</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Apariencia</Text>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Modo oscuro</Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={(v) => setTheme(v ? 'dark' : 'light')}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 30 }]}>
          Copia de seguridad
        </Text>
        <Text style={[styles.helpText, { color: colors.mutedText }]}>
          Elige una carpeta (por ejemplo, Descargas) y ahí se guardará un archivo con tus listas y
          catálogo. Útil antes de cambiar de teléfono.
        </Text>
        <TouchableOpacity style={styles.actionBtn} onPress={handleExport} disabled={busy}>
          <Text style={styles.actionBtnText}>Exportar copia de seguridad</Text>
        </TouchableOpacity>

        <Text style={[styles.helpText, { color: colors.mutedText, marginTop: 20 }]}>
          Restaurar reemplaza todos los datos actuales con los del archivo elegido.
        </Text>
        <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={handleImport} disabled={busy}>
          <Text style={styles.actionBtnText}>Restaurar desde archivo</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { fontSize: 16 },
  helpText: { fontSize: 13, marginBottom: 12 },
  actionBtn: { backgroundColor: '#5AC8FA', padding: 14, borderRadius: 10, alignItems: 'center' },
  dangerBtn: { backgroundColor: '#B5524A' },
  actionBtnText: { fontWeight: 'bold', fontSize: 15, color: '#000' },
});