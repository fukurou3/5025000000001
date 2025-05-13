import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'; // Platform は styles.modal で使わなくなったので削除可
import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/ThemeContext';
import { FontSizeContext } from '@/context/FontSizeContext';
import { fontSizes } from '@/constants/fontSizes';
import WheelPicker from 'react-native-wheely';
import Modal from 'react-native-modal'; // react-native-modal を使用
import { useTranslation } from 'react-i18next'

type Unit = 'minutes' | 'hours' | 'days';

interface WheelPickerModalProps {
  visible: boolean;
  initialAmount: number;
  initialUnit: Unit;
  onConfirm: (amount: number, unit: Unit) => void;
  onCancel: () => void;
}

// --- 定数は変更なし ---
const IOS_BLUE = '#007AFF';
const CONTAINER_BACKGROUND_LIGHT = '#F9F9F9';
const CONTAINER_BACKGROUND_DARK = '#1C1C1E';
const HEADER_BORDER_LIGHT = '#D1D1D6';
const HEADER_BORDER_DARK = '#38383A';
const TEXT_COLOR_LIGHT = '#000000';
const TEXT_COLOR_DARK = '#FFFFFF';
const SELECTION_INDICATOR_COLOR_LIGHT = HEADER_BORDER_LIGHT;
const SELECTION_INDICATOR_COLOR_DARK = HEADER_BORDER_DARK;
const WHEELY_ITEM_HEIGHT = 40;
const WHEELY_CONTAINER_WIDTH = 150;
const WHEELY_VISIBLE_COUNT = 5;
const BACKDROP_OPACITY = 0.4;
const ANIMATION_TIMING = 300; // アニメーション時間を定数化

export const WheelPickerModal: React.FC<WheelPickerModalProps> = ({
  visible,
  initialAmount,
  initialUnit,
  onConfirm,
  onCancel,
}) => {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { fontSizeKey: fsKey } = useContext(FontSizeContext);
  const { t } = useTranslation()

  const [selectedAmount, setSelectedAmount] = useState(initialAmount);
  const [selectedUnit, setSelectedUnit] = useState<Unit>(initialUnit);

  // --- データやuseEffectは変更なし ---
  const unitLabels: Record<Unit, string> = {
    minutes: t('add_task.minutes_before'),
    hours: t('add_task.hours_before'),
    days: t('add_task.days_before'),
  }
  const unitKeys: Unit[] = ['minutes', 'hours', 'days'];
  const amountOptions = Array.from({ length: 60 }, (_, i) => `${i + 1}`);
  const unitOptions = unitKeys.map(k => unitLabels[k]);
  const selectedAmountIndex = selectedAmount - 1;
  const selectedUnitIndex = unitKeys.indexOf(selectedUnit);

  useEffect(() => {
    if (visible) {
      setSelectedAmount(initialAmount);
      setSelectedUnit(initialUnit);
    }
  }, [visible, initialAmount, initialUnit])
  // --- ここまで変更なし ---

  const containerBackgroundColor = isDark ? CONTAINER_BACKGROUND_DARK : CONTAINER_BACKGROUND_LIGHT;
  const headerBorderColor = isDark ? HEADER_BORDER_DARK : HEADER_BORDER_LIGHT;
  const textColor = isDark ? TEXT_COLOR_DARK : TEXT_COLOR_LIGHT;
  const selectionIndicatorColor = isDark ? SELECTION_INDICATOR_COLOR_DARK : SELECTION_INDICATOR_COLOR_LIGHT;

  const wheelyContainerStyle = { /* ...変更なし... */
      width: WHEELY_CONTAINER_WIDTH,
      height: WHEELY_ITEM_HEIGHT * WHEELY_VISIBLE_COUNT,
  };
  const wheelyItemTextStyle = { /* ...変更なし... */
      color: textColor,
      fontSize: fontSizes[fsKey] + 4,
  };
  const wheelySelectedIndicatorStyle = { /* ...変更なし... */
       borderTopWidth: StyleSheet.hairlineWidth,
       borderBottomWidth: StyleSheet.hairlineWidth,
       borderColor: selectionIndicatorColor,
  };
  const dynamicStyles = StyleSheet.create({ /* ...変更なし... */
      container: {
          backgroundColor: containerBackgroundColor,
          paddingTop: 12,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
      },
      header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: headerBorderColor,
      },
      headerButtonText: {
          fontSize: fontSizes[fsKey] + 1,
          color: IOS_BLUE,
      },
      cancelText: {},
      confirmText: { fontWeight: '600' },
      title: {
          fontWeight: '600',
          color: textColor,
          fontSize: fontSizes[fsKey] + 2
      },
      pickerRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 10,
      },
      pickerWrapper: {
          alignItems: 'center',
          marginHorizontal: 6,
      },
  });
  const styles = StyleSheet.create({ /* ...変更なし... */
      modal: {
          justifyContent: 'flex-end',
          margin: 0,
      },
  });

  return (
    <Modal
      isVisible={visible}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      // === ↓ 修正点: アニメーション時間とネイティブドライバーの指定 ===
      animationInTiming={ANIMATION_TIMING}
      animationOutTiming={ANIMATION_TIMING}
      backdropTransitionInTiming={ANIMATION_TIMING}
      backdropTransitionOutTiming={ANIMATION_TIMING} // 背景が消える時間も指定
      useNativeDriver={true} // アニメーションにネイティブドライバーを使用
      useNativeDriverForBackdrop={true} // 背景のアニメーションにもネイティブドライバーを使用
      // === ↑ 修正点 ===
      backdropColor="#000000"
      backdropOpacity={BACKDROP_OPACITY}
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}
      style={styles.modal}
      hideModalContentWhileAnimating // アニメーション中のパフォーマンスを優先する場合
    >
      <SafeAreaView style={dynamicStyles.container}>
        {/* --- ヘッダー部分は変更なし --- */}
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={[dynamicStyles.headerButtonText, dynamicStyles.cancelText]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
          <Text style={dynamicStyles.title}>
            {t('add_task.notification')}
          </Text>
          <TouchableOpacity onPress={() => onConfirm(selectedAmount, selectedUnit)}>
            <Text style={[dynamicStyles.headerButtonText, dynamicStyles.confirmText]}>
              {t('common.done')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- ピッカー部分も変更なし --- */}
        <View style={dynamicStyles.pickerRow}>
          <View style={dynamicStyles.pickerWrapper}>
             <WheelPicker
               options={amountOptions}
               selectedIndex={selectedAmountIndex}
               onChange={(index) => setSelectedAmount(index + 1)}
               itemHeight={WHEELY_ITEM_HEIGHT}
               itemTextStyle={wheelyItemTextStyle}
               containerStyle={wheelyContainerStyle}
               selectedIndicatorStyle={wheelySelectedIndicatorStyle}
               decelerationRate="fast"
               visibleRest={Math.floor(WHEELY_VISIBLE_COUNT / 2)}
             />
          </View>
          <View style={dynamicStyles.pickerWrapper}>
             <WheelPicker
               options={unitOptions}
               selectedIndex={selectedUnitIndex}
               onChange={(index) => setSelectedUnit(unitKeys[index])}
               itemHeight={WHEELY_ITEM_HEIGHT}
               itemTextStyle={wheelyItemTextStyle}
               containerStyle={wheelyContainerStyle}
               selectedIndicatorStyle={wheelySelectedIndicatorStyle}
               decelerationRate="fast"
               visibleRest={Math.floor(WHEELY_VISIBLE_COUNT / 2)}
             />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}