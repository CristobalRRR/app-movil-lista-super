import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
 
type ListSummary = { id: number; name: string };

//Placeholder, cambiar
const PLACEHOLDER_LISTS: ListSummary[] = [
  { id: 1, name: 'Lista nombre' },
  { id: 2, name: 'Lista nombre 2' },
];
 
export default function AppDrawerContent(props: DrawerContentComponentProps) {
  const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);
 
  return (
    <View style={styles.container}>
      <View style={styles.listasHeader}>
        <Text style={styles.listasTitle}>Listas</Text>
        <TouchableOpacity style={styles.nuevaListaBtn}>
          <Text style={styles.nuevaListaText}>Nueva lista</Text>
        </TouchableOpacity>
      </View>
 
      <FlatList
        data={PLACEHOLDER_LISTS}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.listRow}>
            <TouchableOpacity
              style={styles.listRowNameArea}
              onPress={() => {
                //Pendiente: navegar a ListDetailScreen usando item.id
              }}
            >
              <Text style={styles.listRowText}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setMenuOpenFor(menuOpenFor === item.id ? null : item.id)
              }
            >
              <Text style={styles.dots}>⋮</Text>
            </TouchableOpacity>
            {menuOpenFor === item.id && (
              <View style={styles.overlayMenu}>
                <TouchableOpacity style={styles.overlayItem}>
                  <Text>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.overlayItem}>
                  <Text>Borrar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
 
      <View style={styles.staticRoutes}>
        <TouchableOpacity
          style={styles.staticRow}
          onPress={() => props.navigation.navigate('Catalogo')}
        >
          <Text style={styles.staticRowText}>Catálogo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.staticRow}
          onPress={() => props.navigation.navigate('Opciones')}
        >
          <Text style={styles.staticRowText}>Opciones</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.staticRow}
          onPress={() => props.navigation.navigate('Informacion')}
        >
          <Text style={styles.staticRowText}>Información</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6B72B0' },
  listasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  listasTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  nuevaListaBtn: {
    backgroundColor: '#4CD137',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nuevaListaText: { fontSize: 11, fontWeight: 'bold' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  listRowNameArea: { flex: 1 },
  listRowText: { fontSize: 15, fontWeight: '600' },
  dots: { fontSize: 18, paddingHorizontal: 6 },
  overlayMenu: {
    position: 'absolute',
    right: 30,
    top: 36,
    backgroundColor: '#333',
    borderRadius: 6,
    overflow: 'hidden',
    zIndex: 10,
  },
  overlayItem: { paddingVertical: 8, paddingHorizontal: 16 },
  staticRoutes: { borderTopWidth: 2, borderColor: '#000' },
  staticRow: {
    padding: 14,
    borderTopWidth: 1,
    borderColor: '#000',
  },
  staticRowText: { fontSize: 18, fontWeight: 'bold' },
});