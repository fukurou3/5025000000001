// app/features/add/components/DeadlineSettingModal/TimePickerModal.tsx
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react'; // useCallback をインポート
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import WheelPicker from 'react-native-wheely';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/hooks/ThemeContext';
import { FontSizeContext } from '@/context/FontSizeContext';
import { fontSizes as appFontSizes } from '@/constants/fontSizes';
import type { DeadlineTime, AmPm } from './types';
import { ampmData as ampmOptions, hourData12 as hourOptions12, minuteData as minuteOptions } from './types';
import { createDeadlineModalStyles } from './styles'; // スタイル生成関数

// --- 定数 ---
// const IOS_BLUE = '#007AFF'; // 未使用なら削除
const WHEELY_ITEM_HEIGHT = 40;
const WHEELY_CONTAINER_WIDTH_SHORT = 80;
const WHEELY_CONTAINER_WIDTH_NORMAL = 70;
const WHEELY_VISIBLE_COUNT = 5;
const BACKDROP_OPACITY = 0.4;
const ANIMATION_TIMING = 300;

interface TimePickerModalProps {
  visible: boolean;
  initialTime?: DeadlineTime;
  onClose: () => void;
  onConfirm: (time: DeadlineTime) => void;
  onClear: () => void;
}

const to12HourFormat = (hour24: number, minute: number): { hour12: number; ampm: AmPm; minute: number } => {
  const ampm = hour24 < 12 || hour24 === 24 || hour24 === 0 ? 'AM' : 'PM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, ampm, minute };
};

const to24HourFormat = (hour12: number, ampm: AmPm, minute: number): DeadlineTime => {
  let hour24 = hour12;
  if (ampm === 'PM' && hour12 !== 12) {
    hour24 += 12;
  } else if (ampm === 'AM' && hour12 === 12) {
    hour24 = 0; // 午前12時は0時
  }
  return { hour: hour24, minute };
};

const TimePickerModalMemo: React.FC<TimePickerModalProps> = ({
  visible,
  initialTime,
  onClose,
  onConfirm,
  onClear,
}) => {
  const { t } = useTranslation();
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { fontSizeKey: fsKey } = useContext( FontSizeContext );

  const styles = useMemo(() => createDeadlineModalStyles(isDark, subColor, fsKey), [isDark, subColor, fsKey]);

  // initialTime が変更されたときに表示を更新するためのデフォルト値
  const defaultDisplayTime = useMemo(() => {
      return to12HourFormat(initialTime?.hour ?? 9, initialTime?.minute ?? 0);
  }, [initialTime]);


  const [selectedAmPm, setSelectedAmPm] = useState<AmPm>(defaultDisplayTime.ampm);
  const [selectedHour, setSelectedHour] = useState<number>(defaultDisplayTime.hour12);
  const [selectedMinute, setSelectedMinute] = useState<number>(defaultDisplayTime.minute);

  useEffect(() => {
    if (visible) { // モーダル表示時に初期値を再設定
      const displayTime = to12HourFormat(initialTime?.hour ?? 9, initialTime?.minute ?? 0);
      setSelectedAmPm(displayTime.ampm);
      setSelectedHour(displayTime.hour12);
      setSelectedMinute(displayTime.minute);
    }
  }, [visible, initialTime]); // initialTime の変更も監視

  const handleConfirm = useCallback(() => {
    const finalTime = to24HourFormat(selectedHour, selectedAmPm, selectedMinute);
    onConfirm(finalTime);
  }, [selectedHour, selectedAmPm, selectedMinute, onConfirm]);

  // WheelPickerのonChangeハンドラをメモ化
  const handleAmPmChange = useCallback((index: number) => setSelectedAmPm(ampmOptions[index].value), []);
  const handleHourChange = useCallback((index: number) => setSelectedHour(hourOptions12[index].value), []);
  const handleMinuteChange = useCallback((index: number) => setSelectedMinute(minuteOptions[index].value), []);


  const ampmPickerOptions = useMemo(() => ampmOptions.map(opt => t(`common.${opt.labelKey}`)), [t]);
  const hourPickerOptions = useMemo(() => hourOptions12.map(opt => opt.label), []); // これらは固定値なので初回のみ計算
  const minutePickerOptions = useMemo(() => minuteOptions.map(opt => opt.label), []); // 同上

  const wheelyItemTextStyle = useMemo(() => ({
      color: styles.label.color,
      fontSize: appFontSizes[fsKey] + 2,
  }), [styles.label.color, fsKey]);

  const wheelySelectedIndicatorStyle = useMemo(() => ({
       borderTopWidth: StyleSheet.hairlineWidth,
       borderBottomWidth: StyleSheet.hairlineWidth,
       borderColor: styles.headerContainer.borderColor, // stylesから取得
  }), [styles.headerContainer.borderColor]);

  return (
    <Modal
      isVisible={visible}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={ANIMATION_TIMING}
      animationOutTiming={ANIMATION_TIMING}
      backdropTransitionInTiming={ANIMATION_TIMING}
      backdropTransitionOutTiming={ANIMATION_TIMING}
      useNativeDriver={true}
      useNativeDriverForBackdrop={true}
      backdropColor="#000000"
      backdropOpacity={BACKDROP_OPACITY}
      onBackdropPress={onClose} // onCloseはpropsとして渡されるのでメモ化されている想定
      onBackButtonPress={onClose} // 同上
      style={styles.modal}
      hideModalContentWhileAnimating
    >
      <SafeAreaView style={[styles.container, { height: undefined, minHeight: '45%' }]}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{t('deadline_modal.specify_time')}</Text>
        </View>

        <View style={styles.timePickerContainer}>
          <View style={styles.wheelPickerWrapper}>
            <WheelPicker
              options={ampmPickerOptions}
              selectedIndex={ampmOptions.findIndex(o => o.value === selectedAmPm)}
              onChange={handleAmPmChange} // メモ化されたコールバック
              itemHeight={WHEELY_ITEM_HEIGHT}
              itemTextStyle={wheelyItemTextStyle}
              containerStyle={{ width: WHEELY_CONTAINER_WIDTH_SHORT, height: WHEELY_ITEM_HEIGHT * WHEELY_VISIBLE_COUNT }}
              selectedIndicatorStyle={wheelySelectedIndicatorStyle}
              decelerationRate="fast"
              visibleRest={Math.floor(WHEELY_VISIBLE_COUNT / 2)}
            />
          </View>
          <View style={styles.wheelPickerWrapper}>
            <WheelPicker
              options={hourPickerOptions}
              selectedIndex={hourOptions12.findIndex(o => o.value === selectedHour)}
              onChange={handleHourChange} // メモ化されたコールバック
              itemHeight={WHEELY_ITEM_HEIGHT}
              itemTextStyle={wheelyItemTextStyle}
              containerStyle={{ width: WHEELY_CONTAINER_WIDTH_NORMAL, height: WHEELY_ITEM_HEIGHT * WHEELY_VISIBLE_COUNT }}
              selectedIndicatorStyle={wheelySelectedIndicatorStyle}
              decelerationRate="fast"
              visibleRest={Math.floor(WHEELY_VISIBLE_COUNT / 2)}
            />
          </View>
           <Text style={styles.timeSeparator}>:</Text>
          <View style={styles.wheelPickerWrapper}>
            <WheelPicker
              options={minutePickerOptions}
              selectedIndex={minuteOptions.findIndex(o => o.value === selectedMinute)}
              onChange={handleMinuteChange} // メモ化されたコールバック
              itemHeight={WHEELY_ITEM_HEIGHT}
              itemTextStyle={wheelyItemTextStyle}
              containerStyle={{ width: WHEELY_CONTAINER_WIDTH_NORMAL, height: WHEELY_ITEM_HEIGHT * WHEELY_VISIBLE_COUNT }}
              selectedIndicatorStyle={wheelySelectedIndicatorStyle}
              decelerationRate="fast"
              visibleRest={Math.floor(WHEELY_VISIBLE_COUNT / 2)}
            />
          </View>
        </View>

        <View style={[styles.footer, { paddingTop: 12, paddingBottom: 12 }]}>
          <TouchableOpacity style={[styles.button, {minWidth: '30%'}]} onPress={onClear}>
            <Text style={styles.buttonText}>{t('common.clear')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, {minWidth: '30%'}]} onPress={onClose}>
            <Text style={styles.buttonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton, {minWidth: '30%'}]}
            onPress={handleConfirm} // メモ化されたコールバック
          >
            <Text style={styles.saveButtonText}>{t('common.ok')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
export const TimePickerModal = React.memo(TimePickerModalMemo);