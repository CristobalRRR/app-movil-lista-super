import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
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
  //Snapshot de lo que estaba en la lista segun la DB cuando se entra a la pantalla
  const [committedInList, setCommittedInList] = useState<Set<number>>(new Set());
  //DB solo se toca cuando se apreta Guardar
  const [overrides, setOverrides] = useState<Map<number, boolean>>(new Map());
  const [addModalVisible, setAddModalVisible] = useState(false);

  const freshEntry = useCallback(() => {
    getCatalogTree(listId).then((data) => {
      setTree(data);
      const committed = new Set<number>();
      data.forEach((c) =>
        c.subcategories.forEach((s) =>
          s.products.forEach((p) => {
            if (p.in_list) committed.add(p.id);
          })
        )
      );
      setCommittedInList(committed);
      setOverrides(new Map());
    });
  }, [listId]);

  useEffect(() => {
    freshEntry();
  }, [freshEntry]);

  function effectiveInList(productId: number, dbInList: boolean): boolean {
    return overrides.has(productId) ? overrides.get(productId)! : dbInList;
  }

  function handleToggle(productId: number, dbInList: boolean) {
    const current = effectiveInList(productId, dbInList);
    if (current) {
      if (committedInList.has(productId)) {
        const productName = findProductName(tree, productId);
        Alert.alert(
          'Quitar producto',
          `"${productName}" estaba en la lista, si lo desmarca se eliminará el producto y cantidad actuales, ¿continuar?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Continuar',
              style: 'destructive',
              onPress: () => setOverrides((prev) => new Map(prev).set(productId, false)),
            },
          ]
        );
        return;
      }
      setOverrides((prev) => new Map(prev).set(productId, false));
    } else {
      setOverrides((prev) => new Map(prev).set(productId, true));
    }
  }

  async function handleGuardar() {
    for (const [productId, desired] of overrides.entries()) {
      const wasCommitted = committedInList.has(productId);
      if (desired && !wasCommitted) {
        await addProductToList(listId, productId);
      } else if (!desired && wasCommitted) {
        await removeProductFromList(listId, productId);
      }
    }
    navigation.goBack();
  }

  function handleCancelar() {
    //Cancelar no toca la DB y retrocede
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancelar}>
          <Text style={styles.headerBtn}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={2}>
          Añadir producto a{'\n'}{listName}
        </Text>
        <TouchableOpacity onPress={handleGuardar}>
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
                {sub.products.map((prod) => {
                  const checked = effectiveInList(prod.id, prod.in_list);
                  return (
                    <TouchableOpacity
                      key={prod.id}
                      style={[styles.row, { backgroundColor: lighten(cat.color, PRODUCT_TINT) }]}
                      onPress={() => handleToggle(prod.id, prod.in_list)}
                    >
                      <Text style={styles.rowText}>{prod.name}</Text>
                      <Text style={styles.checkbox}>{checked ? '☑' : '☐'}</Text>
                    </TouchableOpacity>
                  );
                })}
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
          const data = await getCatalogTree(listId);
          setTree(data);
          setOverrides((prev) => new Map(prev).set(productId, true));
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