import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  getCategoryOptions,
  getSubcategoryOptions,
  renameProduct,
  moveProductToSubcategory,
  findProductByName,
  CategoryOption,
  SubcategoryOption,
} from '../db/queries';

type Props = {
  visible: boolean;
  productId: number;
  initialName: string;
  initialCategoryId: number;
  initialSubcategoryId: number;
  onCancel: () => void;
  onSaved: () => void;
};

export default function EditProductModal({
  visible,
  productId,
  initialName,
  initialCategoryId,
  initialSubcategoryId,
  onCancel,
  onSaved,
}: Props) {
  const [name, setName] = useState(initialName);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubcategoryOption | null>(null);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [subcategoryPickerOpen, setSubcategoryPickerOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initialName);
    setCategoryPickerOpen(false);
    setSubcategoryPickerOpen(false);
    (async () => {
      const cats = await getCategoryOptions();
      setCategories(cats);
      const cat = cats.find((c) => c.id === initialCategoryId) ?? null;
      setSelectedCategory(cat);
      if (cat) {
        const subs = await getSubcategoryOptions(cat.id);
        setSubcategories(subs);
        setSelectedSubcategory(subs.find((s) => s.id === initialSubcategoryId) ?? null);
      }
    })();
  }, [visible, initialName, initialCategoryId, initialSubcategoryId]);

  useEffect(() => {
    if (selectedCategory && selectedCategory.id !== initialCategoryId) {
      getSubcategoryOptions(selectedCategory.id).then((subs) => {
        setSubcategories(subs);
        setSelectedSubcategory(null);
      });
    } else if (selectedCategory && selectedCategory.id === initialCategoryId) {
      getSubcategoryOptions(selectedCategory.id).then(setSubcategories);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  async function doSave() {
    if (!name.trim() || !selectedSubcategory) return;
    await renameProduct(productId, name.trim());
    if (selectedSubcategory.id !== initialSubcategoryId) {
      await moveProductToSubcategory(productId, selectedSubcategory.id);
    }
    onSaved();
  }

  async function handleSave() {
    if (!name.trim() || !selectedSubcategory) return;

    // Only worth checking for a duplicate if the name actually changed —
    // otherwise this product would "duplicate" itself.
    if (name.trim().toUpperCase() !== initialName.trim().toUpperCase()) {
      const duplicate = await findProductByName(name.trim());
      if (duplicate && duplicate.id !== productId) {
        Alert.alert(
          'Producto existente',
          `Este producto ya existe en ${duplicate.categoryName} - ${duplicate.subcategoryName}, ¿guardar igualmente?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Guardar igualmente', onPress: confirmAndSave },
          ]
        );
        return;
      }
    }
    confirmAndSave();
  }

  function confirmAndSave() {
    Alert.alert('Confirmar cambios', `¿Guardar cambios en "${initialName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Guardar', onPress: doSave },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Editar producto</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nombre"
            placeholderTextColor="#888"
          />

          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setCategoryPickerOpen(!categoryPickerOpen)}
          >
            <Text style={styles.label}>
              Categoría{selectedCategory ? `: ${selectedCategory.name}` : ''}
            </Text>
            <Text>{categoryPickerOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {categoryPickerOpen && (
            <ScrollView style={styles.optionsList}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.option, { backgroundColor: c.color }]}
                  onPress={() => {
                    setSelectedCategory(c);
                    setCategoryPickerOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {selectedCategory && (
            <>
              <TouchableOpacity
                style={styles.dropdownHeader}
                onPress={() => setSubcategoryPickerOpen(!subcategoryPickerOpen)}
              >
                <Text style={styles.label}>
                  Subcategoría{selectedSubcategory ? `: ${selectedSubcategory.name}` : ''}
                </Text>
                <Text>{subcategoryPickerOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {subcategoryPickerOpen && (
                <ScrollView style={styles.optionsList}>
                  {subcategories.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.option}
                      onPress={() => {
                        setSelectedSubcategory(s);
                        setSubcategoryPickerOpen(false);
                      }}
                    >
                      <Text style={styles.optionText}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          )}

          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn, !(name.trim() && selectedSubcategory) && styles.btnDisabled]}
              onPress={handleSave}
              disabled={!(name.trim() && selectedSubcategory)}
            >
              <Text style={styles.btnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000099', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#2a2a2a', borderRadius: 10, padding: 20, width: '88%', maxHeight: '85%' },
  title: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginBottom: 14 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  label: { color: '#fff', fontSize: 15, fontWeight: '600' },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#444',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  optionsList: { maxHeight: 160, marginBottom: 10 },
  option: { padding: 10, backgroundColor: '#ddd', borderBottomWidth: 1, borderColor: '#0002' },
  optionText: { fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  cancelBtn: { backgroundColor: '#B5524A' },
  confirmBtn: { backgroundColor: '#4CD137' },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontWeight: 'bold', color: '#000' },
});