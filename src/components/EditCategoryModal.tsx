import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { CATEGORY_COLOR_PALETTE } from '../utils/color';

type Props = {
  visible: boolean;
  initialName: string;
  initialColor: string;
  onCancel: () => void;
  onConfirm: (name: string, color: string) => void;
};

export default function EditCategoryModal({
  visible,
  initialName,
  initialColor,
  onCancel,
  onConfirm,
}: Props) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setColor(initialColor);
    }
  }, [visible, initialName, initialColor]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Editar categoría</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nombre"
            placeholderTextColor="#888"
            autoFocus
          />
          <Text style={styles.label}>Color</Text>
          <View style={styles.palette}>
            {CATEGORY_COLOR_PALETTE.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchSelected]}
              />
            ))}
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn]}
              onPress={() => {
                if (name.trim()) onConfirm(name.trim(), color);
              }}
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
  card: { backgroundColor: '#2a2a2a', borderRadius: 10, padding: 20, width: '85%' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  label: { color: '#fff', fontSize: 15, fontWeight: '600' },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  cancelBtn: { backgroundColor: '#B5524A' },
  confirmBtn: { backgroundColor: '#4CD137' },
  btnText: { fontWeight: 'bold', color: '#000' },
});