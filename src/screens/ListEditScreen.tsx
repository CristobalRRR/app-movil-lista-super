import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getListTree, updateListItemQuantity, renameList, CategoryNode } from '../db/queries';
import { lighten, SUBCATEGORY_TINT, PRODUCT_TINT } from '../utils/color';
import PromptModal from '../components/PromptModal';
 
type Props = { route: any; navigation: any };
 
export default function ListEditScreen({ route, navigation }: Props) {
  const { listId, listName: initialListName } = route.params;
  const [listName, setListName] = useState(initialListName);
  const [tree, setTree] = useState<CategoryNode[]>([]);
  //DB solo se actualiza al usar boton guardar
  const [pendingQuantities, setPendingQuantities] = useState<Map<number, number>>(new Map());
  const [renameModalVisible, setRenameModalVisible] = useState(false);
 
  const load = useCallback(() => {
    getListTree(listId).then((data) => {
      setTree(data);
      setPendingQuantities(new Map());
    });
  }, [listId]);
 
  //ListEdit se utiliza en todas las vistas, para evitar quedar con una lista
  //buggeada en caso de eliminarla y no se refleje el cambio
  useEffect(() => {
    setListName(initialListName);
  }, [listId, initialListName]);
 
  useFocusEffect(load);
 
  function getQty(productId: number, dbQty: number): number {
    return pendingQuantities.has(productId) ? pendingQuantities.get(productId)! : dbQty;
  }
 
  function changeQty(productId: number, delta: number, dbQty: number) {
    const current = getQty(productId, dbQty);
    const next = Math.max(1, current + delta);
    setPendingQuantities(new Map(pendingQuantities).set(productId, next));
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
 
  async function handleRename(name: string) {
    await renameList(listId, name);
    setListName(name);
    setRenameModalVisible(false);
  }
 
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancelar}>
          <Text style={styles.headerBtn}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.titleArea} onPress={() => setRenameModalVisible(true)}>
          <Text style={styles.pencil}>✎</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{listName}</Text>
        </TouchableOpacity>
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
        {tree.map((cat) => (
          <View key={cat.id}>
            <View style={[styles.row, { backgroundColor: cat.color }]}>
              <Text style={styles.rowText}>{cat.name}</Text>
            </View>
            {cat.subcategories.map((sub) => (
              <View key={sub.id}>
                <View style={[styles.row, { backgroundColor: lighten(cat.color, SUBCATEGORY_TINT) }]}>
                  <Text style={styles.rowText}>{sub.name}</Text>
                </View>
                {sub.products.map((prod) => {
                  const qty = getQty(prod.id, prod.quantity);
                  return (
                    <View
                      key={prod.id}
                      style={[styles.row, { backgroundColor: lighten(cat.color, PRODUCT_TINT) }]}
                    >
                      <Text style={styles.rowText}>{prod.name}</Text>
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
                  );
                })}
              </View>
            ))}
          </View>
        ))}
        {tree.length === 0 && (
          <Text style={styles.emptyHint}>Sin productos aún. Toca "Añadir producto".</Text>
        )}
      </ScrollView>
 
      <PromptModal
        visible={renameModalVisible}
        title="Renombrar lista"
        initialValue={listName}
        onCancel={() => setRenameModalVisible(false)}
        onConfirm={handleRename}
      />
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
  titleArea: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' },
  pencil: { fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
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
  rowText: { fontSize: 16, fontWeight: '600', color: '#000' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtn: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 8 },
  qtyValue: { fontSize: 16, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  emptyHint: { color: '#fff', textAlign: 'center', marginTop: 30, fontStyle: 'italic' },
});