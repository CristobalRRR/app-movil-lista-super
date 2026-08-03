import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, DrawerActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getListTree,
  getListById,
  toggleProductChecked,
  setSubcategoryChecked,
  setCategoryChecked,
  setCategoryCollapsed,
  setSubcategoryCollapsed,
  CategoryNode,
} from '../db/queries';
import { lighten, SUBCATEGORY_TINT, PRODUCT_TINT } from '../utils/color';

type Props = {
  route: { params?: { listId?: number; listName?: string } };
  navigation: any;
};

export default function ListDetailScreen({ route, navigation }: Props) {
  const listId = route.params?.listId;
  const listName = route.params?.listName ?? 'Lista';
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!listId) {
      setTree([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getListById(listId).then((list) => {
      if (!list) {
        //Devuelve a la pantalla sin listas en caso de eliminar todas
        navigation.setParams({ listId: undefined, listName: undefined });
        setTree([]);
        setLoading(false);
        return;
      }
      getListTree(listId)
        .then(setTree)
        .finally(() => setLoading(false));
    });
  }, [listId, navigation]);

  useFocusEffect(reload);

  const isEmpty = tree.length === 0;

  async function handleToggleProduct(productId: number, current: boolean) {
    await toggleProductChecked(listId!, productId, !current);
    reload();
  }

  function confirmAndToggleSubcategory(sub: { id: number; name: string; is_checked: boolean }) {
    Alert.alert(
      `¿Marcar/desmarcar "${sub.name}"?`,
      `¿Seguro que quieres ${sub.is_checked ? 'desmarcar' : 'marcar'} "${sub.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: async () => {
            await setSubcategoryChecked(listId!, sub.id, !sub.is_checked);
            reload();
          },
        },
      ]
    );
  }

  function confirmAndToggleCategory(cat: { id: number; name: string; is_checked: boolean }) {
    Alert.alert(
      `¿Marcar/desmarcar "${cat.name}"?`,
      `¿Seguro que quieres ${cat.is_checked ? 'desmarcar' : 'marcar'} "${cat.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: async () => {
            await setCategoryChecked(listId!, cat.id, !cat.is_checked);
            reload();
          },
        },
      ]
    );
  }

  async function toggleCategoryCollapsed(cat: CategoryNode) {
    await setCategoryCollapsed(listId!, cat.id, !cat.is_collapsed);
    reload();
  }

  async function toggleSubcategoryCollapsed(subId: number, collapsed: boolean) {
    await setSubcategoryCollapsed(listId!, subId, !collapsed);
    reload();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {listName}
        </Text>
        {listId && (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('ListEdit', { listId, listName })}
          >
            <Text style={styles.editBtnText}>Editar</Text>
          </TouchableOpacity>
        )}
      </View>

      {!listId ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Selecciona una lista desde el menú, o crea una nueva.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Cargando...</Text>
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Presiona editar para añadir productos</Text>
        </View>
      ) : (
        <ScrollView>
          {tree.map((cat) => (
            <View key={cat.id}>
              <View style={[styles.row, { backgroundColor: cat.color }]}>
                <Text style={styles.rowText}>{cat.name}</Text>
                <View style={styles.rowControls}>
                  <TouchableOpacity onPress={() => confirmAndToggleCategory(cat)}>
                    <Text style={styles.checkbox}>{cat.is_checked ? '☑' : '☐'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => toggleCategoryCollapsed(cat)}>
                    <Text style={styles.arrow}>{cat.is_collapsed ? '▼' : '▲'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {!cat.is_collapsed &&
                cat.subcategories.map((sub) => (
                  <View key={sub.id}>
                    <View
                      style={[
                        styles.row,
                        { backgroundColor: lighten(cat.color, SUBCATEGORY_TINT) },
                      ]}
                    >
                      <Text style={styles.rowText}>{sub.name}</Text>
                      <View style={styles.rowControls}>
                        <TouchableOpacity onPress={() => confirmAndToggleSubcategory(sub)}>
                          <Text style={styles.checkbox}>{sub.is_checked ? '☑' : '☐'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => toggleSubcategoryCollapsed(sub.id, sub.is_collapsed)}
                        >
                          <Text style={styles.arrow}>{sub.is_collapsed ? '▼' : '▲'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {!sub.is_collapsed &&
                      sub.products.map((prod) => (
                        <View
                          key={prod.id}
                          style={[
                            styles.row,
                            { backgroundColor: lighten(cat.color, PRODUCT_TINT) },
                          ]}
                        >
                          <Text style={styles.rowText}>{prod.name}</Text>
                          <View style={styles.rowControls}>
                            <Text style={styles.qty}>{prod.quantity}</Text>
                            <TouchableOpacity
                              onPress={() => handleToggleProduct(prod.id, prod.is_checked)}
                            >
                              <Text style={styles.checkbox}>
                                {prod.is_checked ? '☑' : '☐'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                  </View>
                ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B5807A',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerIcon: { fontSize: 22, marginRight: 12, color: '#000' },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: 'bold', color: '#000' },
  editBtn: { backgroundColor: '#5AC8FA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { fontWeight: 'bold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#00000033',
  },
  rowText: { fontSize: 16, fontWeight: '600', color: '#000', flex: 1 },
  rowControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { fontSize: 22 },
  arrow: { fontSize: 16 },
  qty: { fontSize: 16, fontWeight: 'bold', marginRight: 4 },
});