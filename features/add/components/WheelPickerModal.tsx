import React, { useContext, useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/ThemeContext';
import { FontSizeContext } from '@/context/FontSizeContext';
import { fontSizes } from '@/constants/fontSizes';
import WheelPickerExpo from 'react-native-wheel-picker-expo';

type Unit = 'minutes' | 'hours' | 'days';

const unitLabels: Record<Unit, string> = {
  minutes: '分',
  hours: '時間',
  days: '日',
};

const unitKeys: Unit[] = ['minutes', 'hours', 'days'];

interface WheelPickerModalProps {
  visible: boolean;
  initialAmount: number;
  initialUnit: Unit;
  onConfirm: (amount: number, unit: Unit) => void;
  onCancel: () => void;
}

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
  const [selectedUnit, setSelectedUnit] = useState<Unit>(initialUnit);

  useEffect(() => {
    if (visible) {
      setSelectedAmount(initialAmount);
      setSelectedUnit(initialUnit);
    }
  }, [visible, initialAmount, initialUnit]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: isDark ? '#222222' : '#FFFFFF' }]}>  
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close" size={24} color={subColor} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: subColor, fontSize: fontSizes[fsKey] + 2 }]}>通知までの時間を設定</Text>
            <TouchableOpacity onPress={() => onConfirm(selectedAmount, selectedUnit)}>
              <Text style={[styles.confirm, { color: subColor, fontSize: fontSizes[fsKey] + 2 }]}>OK</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerRow}>
            <View style={styles.pickerWrapper}>
              <WheelPickerExpo
                height={200}
                width={150}
                initialSelectedIndex={selectedAmount - 1}
                items={Array.from({ length: 60 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }))}
                onChange={({ item }) => setSelectedAmount(item.value)}
                backgroundColor={isDark ? '#333333' : '#F5F5F5'}
                renderItem={(item) => (
                  <Text style={{
                    fontSize: fontSizes[fsKey],
                    color: isDark ? '#FFFFFF' : '#000000',
                    textAlign: 'center',
                  }}>{item.label}</Text>
                )}
              />
            </View>
            <View style={styles.pickerWrapper}>
              <WheelPickerExpo
                height={200}
                width={150}
                initialSelectedIndex={unitKeys.indexOf(selectedUnit)}
                items={unitKeys.map((k) => ({ label: unitLabels[k], value: k }))}
                onChange={({ item }) => setSelectedUnit(item.value as Unit)}
                backgroundColor={isDark ? '#333333' : '#F5F5F5'}
                renderItem={(item) => (
                  <Text style={{
                    fontSize: fontSizes[fsKey],
                    color: isDark ? '#FFFFFF' : '#000000',
                    textAlign: 'center',
                  }}>{item.label}</Text>
                )}
              />
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
    paddingTop: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  title: { fontWeight: '600' },
  confirm: { fontWeight: '700' },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pickerWrapper: {
    marginHorizontal: 6,
    alignItems: 'center',
  },
});
