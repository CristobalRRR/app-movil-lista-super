import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import {
  getListTree,
  updateListItemQuantity,
  moveListCategory,
  moveListSubcategory,
  moveListProduct,
  CategoryNode,
} from '../db/queries';
import { lighten, SUBCATEGORY_TINT, PRODUCT_TINT } from '../utils/color';

type Props = { route: any; navigation: any };

export default function ListEditScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { listId, listName } = route.params;
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [pendingQuantities, setPendingQuantities] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    setPendingQuantities(new Map());
  }, [listId]);

  const loadStructure = useCallback(() => {
    getListTree(listId).then(setTree);
  }, [listId]);

  useFocusEffect(loadStructure);

  function getQty(productId: number, dbQty: number): number {
    return pendingQuantities.has(productId) ? pendingQuantities.get(productId)! : dbQty;
  }

  function changeQty(productId: number, delta: number, dbQty: number) {
    const current = getQty(productId, dbQty);
    const next = Math.max(1, current + delta);
    setPendingQuantities((prev) => new Map(prev).set(productId, next));
  }

  async function handleMoveCategory(categoryId: number, direction: 'up' | 'down') {
    await moveListCategory(listId, categoryId, direction);
    loadStructure();
  }

  async function handleMoveSubcategory(subcategoryId: number, categoryId: number, direction: 'up' | 'down') {
    await moveListSubcategory(listId, categoryId, subcategoryId, direction);
    loadStructure();
  }

  async function handleMoveProduct(productId: number, subcategoryId: number, direction: 'up' | 'down') {
    await moveListProduct(listId, subcategoryId, productId, direction);
    loadStructure();
  }

  async function handleGuardar() {
    for (const [productId, quantity] of pendingQuantities.entries()) {
      await updateListItemQuantity(listId, productId, quantity);
    }
    navigation.goBack();
  }

  function handleCancelar() {
    navigation.goBack();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancelar}>
          <Text style={styles.headerBtn}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {listName}
        </Text>
        <TouchableOpacity onPress={handleGuardar}>
          <Text style={styles.headerBtn}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addProductBtn}
        onPress={() => navigation.navigate('AddProductToList', { listId, listName })}
      >
        <Text style={styles.addProductBtnText}>Añadir{'\n'}producto</Text>
      </TouchableOpacity>

      <ScrollView>
        {tree.map((cat, catIndex) => (
          <View key={cat.id}>
            <View style={[styles.row, { backgroundColor: cat.color }]}>
              <Text style={styles.rowText}>{cat.name}</Text>
              <View style={styles.reorderControls}>
                <TouchableOpacity
                  disabled={catIndex === 0}
                  onPress={() => handleMoveCategory(cat.id, 'up')}
                >
                  <Text style={[styles.reorderIcon, catIndex === 0 && styles.reorderIconDisabled]}>↑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={catIndex === tree.length - 1}
                  onPress={() => handleMoveCategory(cat.id, 'down')}
                >
                  <Text style={[styles.reorderIcon, catIndex === tree.length - 1 && styles.reorderIconDisabled]}>
                    ↓
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {cat.subcategories.map((sub, subIndex) => (
              <View key={sub.id}>
                <View style={[styles.row, { backgroundColor: lighten(cat.color, SUBCATEGORY_TINT) }]}>
                  <Text style={styles.rowText}>{sub.name}</Text>
                  <View style={styles.reorderControls}>
                    <TouchableOpacity
                      disabled={subIndex === 0}
                      onPress={() => handleMoveSubcategory(sub.id, cat.id, 'up')}
                    >
                      <Text style={[styles.reorderIcon, subIndex === 0 && styles.reorderIconDisabled]}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={subIndex === cat.subcategories.length - 1}
                      onPress={() => handleMoveSubcategory(sub.id, cat.id, 'down')}
                    >
                      <Text
                        style={[
                          styles.reorderIcon,
                          subIndex === cat.subcategories.length - 1 && styles.reorderIconDisabled,
                        ]}
                      >
                        ↓
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {sub.products.map((prod, prodIndex) => {
                  const qty = getQty(prod.id, prod.quantity);
                  return (
                    <View
                      key={prod.id}
                      style={[styles.row, { backgroundColor: lighten(cat.color, PRODUCT_TINT) }]}
                    >
                      <Text style={styles.rowText}>{prod.name}</Text>
                      <View style={styles.rightControls}>
                        <View style={styles.reorderControls}>
                          <TouchableOpacity
                            disabled={prodIndex === 0}
                            onPress={() => handleMoveProduct(prod.id, sub.id, 'up')}
                          >
                            <Text style={[styles.reorderIcon, prodIndex === 0 && styles.reorderIconDisabled]}>
                              ↑
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            disabled={prodIndex === sub.products.length - 1}
                            onPress={() => handleMoveProduct(prod.id, sub.id, 'down')}
                          >
                            <Text
                              style={[
                                styles.reorderIcon,
                                prodIndex === sub.products.length - 1 && styles.reorderIconDisabled,
                              ]}
                            >
                              ↓
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.stepper}>
                          <TouchableOpacity onPress={() => changeQty(prod.id, 1, prod.quantity)}>
                            <Text style={styles.stepperBtn}>+</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyValue}>{qty}</Text>
                          <TouchableOpacity onPress={() => changeQty(prod.id, -1, prod.quantity)}>
                            <Text style={styles.stepperBtn}>-</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ))}
        {tree.length === 0 && (
          <Text style={[styles.emptyHint, { color: colors.text }]}>Sin productos aún. Toca "Añadir producto".</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#B5807A',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  headerBtn: { fontWeight: 'bold', backgroundColor: '#fff6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, overflow: 'hidden' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  addProductBtn: { backgroundColor: '#5AC8FA', margin: 14, padding: 20, borderRadius: 14, alignItems: 'center' },
  addProductBtnText: { fontWeight: 'bold', fontSize: 18, textAlign: 'center' },
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
  rightControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  reorderControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reorderIcon: { fontSize: 17, fontWeight: 'bold', color: '#000' },
  reorderIconDisabled: { opacity: 0.25 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtn: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 8 },
  qtyValue: { fontSize: 16, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  emptyHint: { color: '#fff', textAlign: 'center', marginTop: 30, fontStyle: 'italic' },
});