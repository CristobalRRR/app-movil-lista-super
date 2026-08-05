import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  getCategoryOptions,
  getSubcategoryOptions,
  createCategory,
  createSubcategory,
  createProduct,
  findProductByName,
  findCategoryByName,
  findSubcategoryByName,
  CategoryOption,
  SubcategoryOption,
} from '../db/queries';
import { CATEGORY_COLOR_PALETTE } from '../utils/color';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onCreated: (productId: number) => void;
};

type Step = 'form' | 'newCategory' | 'newSubcategory';

export default function AddProductModal({ visible, onCancel, onCreated }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubcategoryOption | null>(null);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [subcategoryPickerOpen, setSubcategoryPickerOpen] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLOR_PALETTE[0]);
  const [newSubName, setNewSubName] = useState('');

  useEffect(() => {
    if (visible) {
      setStep('form');
      setName('');
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      getCategoryOptions().then(setCategories);
    }
  }, [visible]);

  useEffect(() => {
    if (selectedCategory) {
      getSubcategoryOptions(selectedCategory.id).then(setSubcategories);
      setSelectedSubcategory(null);
    }
  }, [selectedCategory]);

  async function doCreateCategory() {
    const id = await createCategory(newCatName.trim(), newCatColor);
    const updated = await getCategoryOptions();
    setCategories(updated);
    setSelectedCategory(updated.find((c) => c.id === id) ?? null);
    setNewCatName('');
    setStep('form');
  }

  async function handleSaveCategory() {
    if (!newCatName.trim()) return;
    const duplicate = await findCategoryByName(newCatName.trim());
    if (duplicate) {
      Alert.alert(
        'Categoría existente',
        `Ya existe una categoría llamada "${duplicate.name}", ¿crear otra igual?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Crear igual', onPress: doCreateCategory },
        ]
      );
      return;
    }
    await doCreateCategory();
  }

  async function doCreateSubcategory() {
    if (!selectedCategory) return;
    const id = await createSubcategory(selectedCategory.id, newSubName.trim());
    const updated = await getSubcategoryOptions(selectedCategory.id);
    setSubcategories(updated);
    setSelectedSubcategory(updated.find((s) => s.id === id) ?? null);
    setNewSubName('');
    setStep('form');
  }

  async function handleSaveSubcategory() {
    if (!newSubName.trim() || !selectedCategory) return;
    const duplicate = await findSubcategoryByName(selectedCategory.id, newSubName.trim());
    if (duplicate) {
      Alert.alert(
        'Subcategoría existente',
        `"${selectedCategory.name}" ya tiene una subcategoría llamada "${duplicate.name}", ¿crear otra igual?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Crear igual', onPress: doCreateSubcategory },
        ]
      );
      return;
    }
    await doCreateSubcategory();
  }

  async function doCreateProduct() {
    if (!name.trim() || !selectedSubcategory) return;
    const id = await createProduct(selectedSubcategory.id, name.trim());
    onCreated(id);
  }

  async function handleSaveProduct() {
    if (!name.trim() || !selectedSubcategory) return;
    const duplicate = await findProductByName(name.trim());
    if (duplicate) {
      Alert.alert(
        'Producto existente',
        `Este producto ya existe en ${duplicate.categoryName} - ${duplicate.subcategoryName}, ¿añadir igualmente?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Añadir igualmente', onPress: doCreateProduct },
        ]
      );
      return;
    }
    await doCreateProduct();
  }

  if (step === 'newCategory') {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>Añadir categoría</Text>
            <TextInput
              style={styles.input}
              value={newCatName}
              onChangeText={setNewCatName}
              placeholder="Nombre"
              placeholderTextColor="#888"
              autoFocus
            />
            <Text style={styles.label}>Color</Text>
            <View style={styles.palette}>
              {CATEGORY_COLOR_PALETTE.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setNewCatColor(c)}
                  style={[
                    styles.swatch,
                    { backgroundColor: c },
                    newCatColor === c && styles.swatchSelected,
                  ]}
                />
              ))}
            </View>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setStep('form')}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={handleSaveCategory}>
                <Text style={styles.btnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (step === 'newSubcategory') {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>Añadir subcategoría</Text>
            <TextInput
              style={styles.input}
              value={newSubName}
              onChangeText={setNewSubName}
              placeholder="Nombre"
              placeholderTextColor="#888"
              autoFocus
            />
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setStep('form')}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={handleSaveSubcategory}>
                <Text style={styles.btnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Añadir producto a catálogo</Text>

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
              <TouchableOpacity style={styles.addNewOption} onPress={() => setStep('newCategory')}>
                <Text style={styles.addNewOptionText}>Añadir nuevo +</Text>
              </TouchableOpacity>
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
                  <TouchableOpacity style={styles.addNewOption} onPress={() => setStep('newSubcategory')}>
                    <Text style={styles.addNewOptionText}>Añadir nuevo +</Text>
                  </TouchableOpacity>
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
              onPress={handleSaveProduct}
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
  addNewOption: { padding: 10, backgroundColor: '#555' },
  addNewOptionText: { color: '#fff', fontWeight: 'bold' },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  cancelBtn: { backgroundColor: '#B5524A' },
  confirmBtn: { backgroundColor: '#4CD137' },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontWeight: 'bold', color: '#000' },
});