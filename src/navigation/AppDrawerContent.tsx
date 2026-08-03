import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLists, createList, renameList, deleteList, ListRow } from '../db/queries';
import PromptModal from '../components/PromptModal';

export default function AppDrawerContent(props: DrawerContentComponentProps) {
  const [lists, setLists] = useState<ListRow[]>([]);
  const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);
  const [newListModalVisible, setNewListModalVisible] = useState(false);
  const [renameModalFor, setRenameModalFor] = useState<ListRow | null>(null);
  const isFocused = useIsFocused();

  const reload = useCallback(() => {
    getLists().then(setLists);
  }, []);

  //Refrescar cada vez que el drawer es visible
  React.useEffect(() => {
    if (isFocused) reload();
  }, [isFocused, reload]);

  async function handleCreateList(name: string) {
    setNewListModalVisible(false);
    const id = await createList(name);
    reload();
    props.navigation.navigate('ListStack', {
      screen: 'ListDetail',
      params: { listId: id, listName: name },
    });
  }

  async function handleRename(name: string) {
    if (renameModalFor) {
      await renameList(renameModalFor.id, name);
      setRenameModalFor(null);
      reload();
    }
  }

  function confirmDelete(list: ListRow) {
    setMenuOpenFor(null);
    Alert.alert(
      `¿Borrar "${list.name}"?`,
      'Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await deleteList(list.id);
            reload();
            const state = props.navigation.getState();
            const stackRoute = state.routes.find((r: any) => r.name === 'ListStack');
            const nestedListDetailRoute = stackRoute?.state?.routes?.find(
              (r: any) => r.name === 'ListDetail'
            );
            const currentParams = nestedListDetailRoute?.params as { listId?: number } | undefined;
            if (currentParams?.listId === list.id) {
              props.navigation.navigate('ListStack', {
                screen: 'ListDetail',
                params: { listId: undefined, listName: undefined },
              });
            }
            props.navigation.closeDrawer();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.listasHeader}>
        <Text style={styles.listasTitle}>Listas</Text>
        <TouchableOpacity style={styles.nuevaListaBtn} onPress={() => setNewListModalVisible(true)}>
          <Text style={styles.nuevaListaText}>Nueva lista</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.listRow}>
            <TouchableOpacity
              style={styles.listRowNameArea}
              onPress={() => {
                setMenuOpenFor(null);
                props.navigation.navigate('ListStack', {
                  screen: 'ListDetail',
                  params: { listId: item.id, listName: item.name },
                });
                props.navigation.closeDrawer();
              }}
            >
              <Text style={styles.listRowText}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMenuOpenFor(menuOpenFor === item.id ? null : item.id)}
            >
              <Text style={styles.dots}>⋮</Text>
            </TouchableOpacity>
            {menuOpenFor === item.id && (
              <View style={styles.overlayMenu}>
                <TouchableOpacity
                  style={styles.overlayItem}
                  onPress={() => {
                    setMenuOpenFor(null);
                    setRenameModalFor(item);
                  }}
                >
                  <Text style={styles.overlayItemText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.overlayItem} onPress={() => confirmDelete(item)}>
                  <Text style={styles.overlayItemText}>Borrar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyHint}>No hay listas aún. Toca "Nueva lista".</Text>
        }
      />

      <View style={styles.staticRoutes}>
        <TouchableOpacity style={styles.staticRow} onPress={() => props.navigation.navigate('Catalogo')}>
          <Text style={styles.staticRowText}>Catálogo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.staticRow} onPress={() => props.navigation.navigate('Opciones')}>
          <Text style={styles.staticRowText}>Opciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.staticRow} onPress={() => props.navigation.navigate('Informacion')}>
          <Text style={styles.staticRowText}>Información</Text>
        </TouchableOpacity>
      </View>

      <PromptModal
        visible={newListModalVisible}
        title="Nueva lista"
        placeholder="Nombre de la lista"
        onCancel={() => setNewListModalVisible(false)}
        onConfirm={handleCreateList}
      />
      <PromptModal
        visible={renameModalFor !== null}
        title="Editar lista"
        placeholder="Nuevo nombre"
        initialValue={renameModalFor?.name}
        onCancel={() => setRenameModalFor(null)}
        onConfirm={handleRename}
      />
    </SafeAreaView>
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
  nuevaListaBtn: { backgroundColor: '#4CD137', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
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
  overlayItemText: { color: '#fff' },
  emptyHint: { color: '#222', padding: 16, fontStyle: 'italic' },
  staticRoutes: { borderTopWidth: 2, borderColor: '#000' },
  staticRow: { padding: 14, borderTopWidth: 1, borderColor: '#000' },
  staticRowText: { fontSize: 18, fontWeight: 'bold' },
});