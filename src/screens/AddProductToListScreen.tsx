import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getCatalogTree,
  addProductToList,
  removeProductFromList,
  CatalogCategory,
} from '../db/queries';
import { lighten, SUBCATEGORY_TINT, PRODUCT_TINT } from '../utils/color';
import AddProductModal from '../components/AddProductModal';
 
type Props = { route: any; navigation: any };
 
export default function AddProductToListScreen({ route, navigation }: Props) {
  const { listId, listName } = route.params;
  const [tree, setTree] = useState<CatalogCategory[]>([]);
  //Se guarda un snapshot de la lista antes de editarla, para no quitar por accidente
  //algun producto que haya estado antes
  const [originalInList, setOriginalInList] = useState<Set<number>>(new Set());
  const [addModalVisible, setAddModalVisible] = useState(false);
 
  const load = useCallback(() => {
    getCatalogTree(listId).then((data) => {
      setTree(data);
      const inListIds = new Set<number>();
      data.forEach((c) => c.subcategories.forEach((s) => s.products.forEach((p) => {
        if (p.in_list) inListIds.add(p.id);
      })));
      setOriginalInList(inListIds);
    });
  }, [listId]);
 
  useFocusEffect(load);
 
  async function handleToggle(productId: number, currentlyInList: boolean) {
    if (currentlyInList) {
      const wasOriginallyInList = originalInList.has(productId);
      if (wasOriginallyInList) {
        const productName = findProductName(tree, productId);
        Alert.alert(
          'Quitar producto',
          `"${productName}" estaba en la lista, si lo desmarca se eliminará el producto y cantidad actuales, ¿continuar?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Continuar',
              style: 'destructive',
              onPress: async () => {
                await removeProductFromList(listId, productId);
                load();
              },
            },
          ]
        );
        return;
      }
      //Si no estaba en la lista no necesita confirmacion
      await removeProductFromList(listId, productId);
      load();
    } else {
      await addProductToList(listId, productId);
      load();
    }
  }
 
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtn}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={2}>
          Añadir producto a{'\n'}{listName}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtn}>Guardar</Text>
        </TouchableOpacity>
      </View>
 
      <TouchableOpacity style={styles.addToCatalogBtn} onPress={() => setAddModalVisible(true)}>
        <Text style={styles.addToCatalogBtnText}>Añadir producto a catálogo</Text>
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
                {sub.products.map((prod) => (
                  <TouchableOpacity
                    key={prod.id}
                    style={[styles.row, { backgroundColor: lighten(cat.color, PRODUCT_TINT) }]}
                    onPress={() => handleToggle(prod.id, prod.in_list)}
                  >
                    <Text style={styles.rowText}>{prod.name}</Text>
                    <Text style={styles.checkbox}>{prod.in_list ? '☑' : '☐'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
 
      <AddProductModal
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onCreated={async (productId) => {
          setAddModalVisible(false);
          await addProductToList(listId, productId);
          load();
        }}
      />
    </SafeAreaView>
  );
}
 
function findProductName(tree: CatalogCategory[], productId: number): string {
  for (const c of tree) {
    for (const s of c.subcategories) {
      const p = s.products.find((p) => p.id === productId);
      if (p) return p.name;
    }
  }
  return 'este producto';
}
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#B5807A',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerBtn: { fontWeight: 'bold', backgroundColor: '#fff4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
  addToCatalogBtn: { backgroundColor: '#5AC8FA', margin: 10, padding: 12, borderRadius: 10, alignItems: 'center' },
  addToCatalogBtnText: { fontWeight: 'bold', fontSize: 15 },
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
  checkbox: { fontSize: 22 },
});