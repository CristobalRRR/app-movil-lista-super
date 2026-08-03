import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
 
type Props = {
  visible: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
};
 
export default function PromptModal({
  visible,
  title,
  initialValue = '',
  placeholder,
  confirmLabel = 'Guardar',
  onCancel,
  onConfirm,
}: Props) {
  const [value, setValue] = useState(initialValue);
 
  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);
 
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor="#888"
            autoFocus
          />
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn]}
              onPress={() => {
                if (value.trim()) onConfirm(value.trim());
              }}
            >
              <Text style={styles.btnText}>{confirmLabel}</Text>
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
    marginBottom: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  cancelBtn: { backgroundColor: '#B5524A' },
  confirmBtn: { backgroundColor: '#4CD137' },
  btnText: { fontWeight: 'bold', color: '#000' },
});