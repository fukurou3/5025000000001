// components/_components/WheelPickerModal.tsx
import React, { useContext, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/ThemeContext';
import { FontSizeContext } from '@/context/FontSizeContext';
import { fontSizes } from '@/constants/fontSizes';

type WheelPickerModalProps = {
  visible: boolean;
  initialAmount: number;
  initialUnit: 'minutes' | 'hours' | 'days';
  onConfirm: (amount: number, unit: 'minutes' | 'hours' | 'days') => void;
  onCancel: () => void;
};

export const WheelPickerModal: React.FC<WheelPickerModalProps> = ({
  visible,
  initialAmount,
  initialUnit,
  onConfirm,
  onCancel,
}) => {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { fontSizeKey: fsKey } = useContext(FontSizeContext);

  const [selectedAmount, setSelectedAmount] = useState(initialAmount);
  const [selectedUnit, setSelectedUnit] = useState(initialUnit);

  // モーダルを開くたびに初期値をセット
  useEffect(() => {
    if (visible) {
      setSelectedAmount(initialAmount);
      setSelectedUnit(initialUnit);
    }
  }, [visible, initialAmount, initialUnit]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: isDark ? '#222' : '#fff' }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close" size={24} color={subColor} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: subColor, fontSize: fontSizes[fsKey] }]}>
              {`通知までの時間を設定`}
            </Text>
            <TouchableOpacity
              onPress={() => onConfirm(selectedAmount, selectedUnit)}
            >
              <Text style={[styles.confirm, { color: subColor, fontSize: fontSizes[fsKey] }]}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerRow}>
            {/* 数値ホイール */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedAmount}
                onValueChange={(v) => setSelectedAmount(Number(v))}
                style={styles.picker}
                itemStyle={styles.itemStyle}
                mode="dialog" // iOS はホイール、Android はダイアログ
              >
                {Array.from({ length: 60 }, (_, i) => i + 1).map((n) => (
                  <Picker.Item key={n} label={`${n}`} value={n} />
                ))}
              </Picker>
            </View>
            {/* 単位ホイール */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedUnit}
                onValueChange={(v) => setSelectedUnit(v as any)}
                style={styles.picker}
                itemStyle={styles.itemStyle}
                mode="dialog"
              >
                <Picker.Item label="分" value="minutes" />
                <Picker.Item label="時間" value="hours" />
                <Picker.Item label="日" value="days" />
              </Picker>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {},
  confirm: { fontWeight: '600' },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 200,
  },
  pickerWrapper: {
    flex: 1,
  },
  picker: { flex: 1 },
  itemStyle: {
    height: 200,
  },
});
