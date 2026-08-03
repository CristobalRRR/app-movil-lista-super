import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, DrawerActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getCatalogTree,
  renameCategory,
  renameSubcategory,
  renameProduct,
  getCategoryImpact,
  getSubcategoryImpact,
  getListsContainingProduct,
  deleteCategory,
  deleteSubcategory,
  deleteProduct,
  CatalogCategory,
} from '../db/queries';
import { lighten, SUBCATEGORY_TINT, PRODUCT_TINT } from '../utils/color';
import AddProductModal from '../components/AddProductModal';
import EditCategoryModal from '../components/EditCategoryModal';
import PromptModal from '../components/PromptModal';

type Props = { navigation: any };

type EditTarget =
  | { level: 'category'; id: number; name: string; color: string }
  | { level: 'subcategory'; id: number; name: string }
  | { level: 'product'; id: number; name: string }
  | null;

export default function CatalogoScreen({ navigation }: Props) {
  const [tree, setTree] = useState<CatalogCategory[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<number>>(new Set());
  const [collapsedSubs, setCollapsedSubs] = useState<Set<number>>(new Set());
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);

  const load = useCallback(() => {
    getCatalogTree().then(setTree);
  }, []);

  useFocusEffect(load);

  function toggleCollapsedCat(id: number) {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleCollapsedSub(id: number) {
    setCollapsedSubs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  //Renombrar

  function confirmRenameCategory(name: string, color: string) {
    if (editTarget?.level !== 'category') return;
    const { id } = editTarget;
    Alert.alert('Confirmar cambios', `¿Guardar cambios en "${editTarget.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Guardar',
        onPress: async () => {
          await renameCategory(id, name, color);
          setEditTarget(null);
          load();
        },
      },
    ]);
  }

  function confirmRenameSubcategory(name: string) {
    if (editTarget?.level !== 'subcategory') return;
    const { id } = editTarget;
    Alert.alert('Confirmar cambios', `¿Guardar cambios en "${editTarget.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Guardar',
        onPress: async () => {
          await renameSubcategory(id, name);
          setEditTarget(null);
          load();
        },
      },
    ]);
  }

  function confirmRenameProduct(name: string) {
    if (editTarget?.level !== 'product') return;
    const { id } = editTarget;
    Alert.alert('Confirmar cambios', `¿Guardar cambios en "${editTarget.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Guardar',
        onPress: async () => {
          await renameProduct(id, name);
          setEditTarget(null);
          load();
        },
      },
    ]);
  }

  //Eliminar, con advertencias de cascada

  async function handleDeleteCategory(id: number, name: string) {
    const impact = await getCategoryImpact(id);
    const parts: string[] = [];
    if (impact.subcategoryCount > 0) parts.push(`${impact.subcategoryCount} subcategoría(s)`);
    if (impact.productCount > 0) parts.push(`${impact.productCount} producto(s)`);
    let msg = parts.length ? `Esto también borrará ${parts.join(' y ')}.` : '';
    if (impact.listNames.length > 0) {
      msg += `\n\nSe eliminará de estas listas: ${impact.listNames.join(', ')}.`;
    }
    Alert.alert(`¿Borrar "${name}"?`, msg || 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await deleteCategory(id);
          load();
        },
      },
    ]);
  }

  async function handleDeleteSubcategory(id: number, name: string) {
    const impact = await getSubcategoryImpact(id);
    let msg = impact.productCount > 0 ? `Esto también borrará ${impact.productCount} producto(s).` : '';
    if (impact.listNames.length > 0) {
      msg += `\n\nSe eliminará de estas listas: ${impact.listNames.join(', ')}.`;
    }
    Alert.alert(`¿Borrar "${name}"?`, msg || 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await deleteSubcategory(id);
          load();
        },
      },
    ]);
  }

  async function handleDeleteProduct(id: number, name: string) {
    const lists = await getListsContainingProduct(id);
    const msg =
      lists.length > 0
        ? `Se eliminará de estas listas: ${lists.map((l) => l.name).join(', ')}.`
        : 'Esta acción no se puede deshacer.';
    Alert.alert(`¿Borrar "${name}"?`, msg, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(id);
          load();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catálogo</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(!editMode)}>
          <Text style={styles.editBtnText}>{editMode ? 'Listo' : 'Editar'}</Text>
        </TouchableOpacity>
      </View>

      {editMode && (
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.addBtnText}>Añadir producto</Text>
        </TouchableOpacity>
      )}

      <ScrollView>
        {tree.map((cat) => {
          const catCollapsed = collapsedCats.has(cat.id);
          return (
            <View key={cat.id}>
              <View style={[styles.row, { backgroundColor: cat.color }]}>
                <Text style={styles.rowText}>{cat.name}</Text>
                <View style={styles.rowControls}>
                  {editMode && (
                    <>
                      <TouchableOpacity
                        onPress={() =>
                          setEditTarget({ level: 'category', id: cat.id, name: cat.name, color: cat.color })
                        }
                      >
                        <Text style={styles.icon}>✎</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteCategory(cat.id, cat.name)}>
                        <Text style={styles.icon}>➖</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity onPress={() => toggleCollapsedCat(cat.id)}>
                    <Text style={styles.arrow}>{catCollapsed ? '▼' : '▲'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {!catCollapsed &&
                cat.subcategories.map((sub) => {
                  const subCollapsed = collapsedSubs.has(sub.id);
                  return (
                    <View key={sub.id}>
                      <View style={[styles.row, { backgroundColor: lighten(cat.color, SUBCATEGORY_TINT) }]}>
                        <Text style={styles.rowText}>{sub.name}</Text>
                        <View style={styles.rowControls}>
                          {editMode && (
                            <>
                              <TouchableOpacity
                                onPress={() =>
                                  setEditTarget({ level: 'subcategory', id: sub.id, name: sub.name })
                                }
                              >
                                <Text style={styles.icon}>✎</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteSubcategory(sub.id, sub.name)}>
                                <Text style={styles.icon}>➖</Text>
                              </TouchableOpacity>
                            </>
                          )}
                          <TouchableOpacity onPress={() => toggleCollapsedSub(sub.id)}>
                            <Text style={styles.arrow}>{subCollapsed ? '▼' : '▲'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {!subCollapsed &&
                        sub.products.map((prod) => (
                          <View
                            key={prod.id}
                            style={[styles.row, { backgroundColor: lighten(cat.color, PRODUCT_TINT) }]}
                          >
                            <Text style={styles.rowText}>{prod.name}</Text>
                            {editMode && (
                              <View style={styles.rowControls}>
                                <TouchableOpacity
                                  onPress={() =>
                                    setEditTarget({ level: 'product', id: prod.id, name: prod.name })
                                  }
                                >
                                  <Text style={styles.icon}>✎</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteProduct(prod.id, prod.name)}>
                                  <Text style={styles.icon}>➖</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        ))}
                    </View>
                  );
                })}
            </View>
          );
        })}
        {tree.length === 0 && (
          <Text style={styles.emptyHint}>El catálogo está vacío.</Text>
        )}
      </ScrollView>

      <AddProductModal
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onCreated={() => {
          setAddModalVisible(false);
          load();
        }}
      />

      <EditCategoryModal
        visible={editTarget?.level === 'category'}
        initialName={editTarget?.level === 'category' ? editTarget.name : ''}
        initialColor={editTarget?.level === 'category' ? editTarget.color : '#E6194B'}
        onCancel={() => setEditTarget(null)}
        onConfirm={confirmRenameCategory}
      />
      <PromptModal
        visible={editTarget?.level === 'subcategory'}
        title="Editar subcategoría"
        initialValue={editTarget?.level === 'subcategory' ? editTarget.name : ''}
        onCancel={() => setEditTarget(null)}
        onConfirm={confirmRenameSubcategory}
      />
      <PromptModal
        visible={editTarget?.level === 'product'}
        title="Editar producto"
        initialValue={editTarget?.level === 'product' ? editTarget.name : ''}
        onCancel={() => setEditTarget(null)}
        onConfirm={confirmRenameProduct}
      />
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
  addBtn: { backgroundColor: '#5AC8FA', margin: 10, padding: 12, borderRadius: 10, alignItems: 'center' },
  addBtnText: { fontWeight: 'bold', fontSize: 15 },
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
  rowControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 18 },
  arrow: { fontSize: 16 },
  emptyHint: { color: '#fff', textAlign: 'center', marginTop: 30, fontStyle: 'italic' },
});