// app/features/add/components/DeadlineSettingModal/TimePickerModal.tsx
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform, TextStyle, useWindowDimensions, ViewStyle, StyleSheet, ColorValue } from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import WheelPicker from 'react-native-wheely';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/hooks/ThemeContext';
import { FontSizeContext, type FontSizeKey } from '@/context/FontSizeContext';
import { fontSizes as appFontSizes } from '@/constants/fontSizes';
import type { DeadlineTime, AmPm, DeadlineModalStyles } from './types';
import { ampmData as ampmOptions, hourData12 } from './types';
import { createDeadlineModalStyles } from './styles';

const createMinuteData = (): Array<{ label: string; value: number }> => {
  const data = [];
  for (let i = 0; i < 60; i++) {
    data.push({ label: i < 10 ? `0${i}` : `${i}`, value: i });
  }
  return data;
};

const minuteDataFull = createMinuteData();

const WHEELY_ITEM_HEIGHT = Platform.OS === 'ios' ? 80 : 88;
const BASE_PICKER_FONT_SIZE_INCREASE = 22;

const getAmPmPickerWidth = (baseFontSize: number): number => {
  const effectiveFontSize = baseFontSize + BASE_PICKER_FONT_SIZE_INCREASE;
  if (effectiveFontSize > 38) return Platform.OS === 'ios' ? 130 : 150;
  if (effectiveFontSize > 28) return Platform.OS === 'ios' ? 110 : 130;
  return Platform.OS === 'ios' ? 90 : 110;
};

const WHEELY_CONTAINER_WIDTH_NORMAL = Platform.OS === 'ios' ? 80 : 100;
const WHEELY_VISIBLE_COUNT = 3;
const PICKER_AREA_TOTAL_HEIGHT = WHEELY_ITEM_HEIGHT * WHEELY_VISIBLE_COUNT;

const BACKDROP_OPACITY = 0.4;
const ANIMATION_TIMING = 300;
const HORIZONTAL_SEPARATOR_PADDING = 24;

const ACCENT_LINE_THICKNESS = 4;
const ACCENT_LINE_LENGTH = 30;
const ACCENT_LINE_BORDER_RADIUS = 2;
const ACCENT_LINE_HORIZONTAL_OFFSET = 5;

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
    hour24 = 0;
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
  const { fontSizeKey } = useContext(FontSizeContext);
  const { width: windowWidth } = useWindowDimensions();

  const stylesFromTs: DeadlineModalStyles = useMemo(() => createDeadlineModalStyles(isDark, subColor, fontSizeKey), [isDark, subColor, fontSizeKey]);
  const currentBaseFontSize = appFontSizes[fontSizeKey];
  const WHEELY_CONTAINER_WIDTH_SHORT = useMemo(() => getAmPmPickerWidth(currentBaseFontSize), [currentBaseFontSize]);

  const pickerItemFontSize = currentBaseFontSize + BASE_PICKER_FONT_SIZE_INCREASE;
  const accentLineColorValue = subColor as ColorValue;

  const defaultDisplayTime = useMemo(() => {
    return to12HourFormat(initialTime?.hour ?? 9, initialTime?.minute ?? 0);
  }, [initialTime]);

  const [selectedAmPm, setSelectedAmPm] = useState<AmPm>(defaultDisplayTime.ampm);
  const [selectedHour, setSelectedHour] = useState<number>(defaultDisplayTime.hour12);
  const [selectedMinute, setSelectedMinute] = useState<number>(defaultDisplayTime.minute);

  useEffect(() => {
    if (visible) {
      const displayTime = to12HourFormat(initialTime?.hour ?? 9, initialTime?.minute ?? 0);
      setSelectedAmPm(displayTime.ampm);
      setSelectedHour(displayTime.hour12);
      setSelectedMinute(displayTime.minute);
    }
  }, [visible, initialTime]);

  const handleConfirm = useCallback(() => {
    const finalTime = to24HourFormat(selectedHour, selectedAmPm, selectedMinute);
    onConfirm(finalTime);
  }, [selectedHour, selectedAmPm, selectedMinute, onConfirm]);

  const handleAmPmChange = useCallback((index: number) => setSelectedAmPm(ampmOptions[index].value), []);
  const handleHourChange = useCallback((index: number) => setSelectedHour(hourData12[index].value), []);
  const handleMinuteChange = useCallback((index: number) => setSelectedMinute(minuteDataFull[index].value), []);

  const ampmPickerOptions = useMemo(() => ampmOptions.map(opt => t(`common.${opt.labelKey}`)), [t]);
  const hourPickerOptions = useMemo(() => hourData12.map(opt => opt.label), []);
  const minutePickerOptions = useMemo(() => minuteDataFull.map(opt => opt.label), []);

  const wheelyItemTextStyle = useMemo((): TextStyle => ({
    color: stylesFromTs.label.color,
    fontSize: pickerItemFontSize,
    fontWeight: Platform.OS === 'ios' ? '400' : 'normal',
  }), [stylesFromTs.label.color, pickerItemFontSize]);

  const wheelySelectedIndicatorStyle = useMemo(() => ({
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderColor: 'transparent',
  }), []);

  const originalTimeSeparatorStyle = useMemo((): TextStyle => ({ // 元のスタイルを保持
    ...stylesFromTs.timeSeparator,
    fontSize: pickerItemFontSize + (Platform.OS === 'ios' ? 2 : 0),
    lineHeight: WHEELY_ITEM_HEIGHT,
    textAlignVertical: 'center',
  }), [stylesFromTs.timeSeparator, pickerItemFontSize, WHEELY_ITEM_HEIGHT]);

  const adjustedTimeSeparatorStyle = useMemo((): TextStyle => ({ // 調整後のコロンのスタイル
    ...originalTimeSeparatorStyle,
    marginHorizontal: Platform.OS === 'ios' ? -10 : -8, // コロンの左右マージンを調整して時分を近づける
  }), [originalTimeSeparatorStyle]);


  const pickerRowSeparatorStyle = useMemo((): ViewStyle => ({
    ...(stylesFromTs.pickerRowSeparator as ViewStyle),
    width: windowWidth - (HORIZONTAL_SEPARATOR_PADDING * 2),
    marginHorizontal: HORIZONTAL_SEPARATOR_PADDING,
  }), [stylesFromTs.pickerRowSeparator, windowWidth]);

  const timePickerOuterContainerPaddingVertical = useMemo((): number => {
    const defaultPaddingV = Platform.OS === 'ios' ? 10 : 8;
    const stylePaddingV = (stylesFromTs.timePickerContainer as ViewStyle)?.paddingVertical;
    if (typeof stylePaddingV === 'number') {
      return stylePaddingV;
    }
    return defaultPaddingV;
  }, [stylesFromTs.timePickerContainer]);

  const timePickerOuterContainerStyle = useMemo((): ViewStyle => ({
    height: PICKER_AREA_TOTAL_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: timePickerOuterContainerPaddingVertical,
    marginHorizontal: HORIZONTAL_SEPARATOR_PADDING,
    position: 'relative',
  }), [PICKER_AREA_TOTAL_HEIGHT, timePickerOuterContainerPaddingVertical]);

   const adjustedTimePickerModalContainerStyle = useMemo((): ViewStyle => ({
    ...(stylesFromTs.timePickerModalContainer as ViewStyle),
   }), [stylesFromTs.timePickerModalContainer]);

  const selectedItemAccentLineStyle = useMemo((): ViewStyle => ({
    position: 'absolute',
    width: ACCENT_LINE_LENGTH,
    height: ACCENT_LINE_THICKNESS,
    borderRadius: ACCENT_LINE_BORDER_RADIUS,
    backgroundColor: accentLineColorValue,
  }), [accentLineColorValue]);

  const accentLineTopPosition = timePickerOuterContainerPaddingVertical + WHEELY_ITEM_HEIGHT + (WHEELY_ITEM_HEIGHT / 2) - (ACCENT_LINE_THICKNESS / 2);
  const pickerOuterContainerWidth = windowWidth - 2 * HORIZONTAL_SEPARATOR_PADDING;
  const leftAccentLeftPosition = ACCENT_LINE_HORIZONTAL_OFFSET;
  const rightAccentLeftPosition = pickerOuterContainerWidth - ACCENT_LINE_LENGTH - ACCENT_LINE_HORIZONTAL_OFFSET;

  // ピッカーラッパーのスタイル調整
  const ampmPickerWrapperStyle = useMemo((): ViewStyle => ({
    ...(stylesFromTs.wheelPickerWrapper as ViewStyle),
    marginRight: Platform.OS === 'ios' ? -5 : -30, // AM/PMピッカーの右マージンを詰めて、時ピッカーを左に寄せる
  }), [stylesFromTs.wheelPickerWrapper]);

  const hourPickerWrapperStyle = useMemo((): ViewStyle => ({
    ...(stylesFromTs.wheelPickerWrapper as ViewStyle),
    // 時ピッカーの左右マージンは、コロンの調整とAM/PMピッカーの調整に委ねるか、必要ならここで微調整
  }), [stylesFromTs.wheelPickerWrapper]);

  const minutePickerWrapperStyle = useMemo((): ViewStyle => ({
    ...(stylesFromTs.wheelPickerWrapper as ViewStyle),
    // 分ピッカーの左右マージンは、コロンの調整に委ねるか、必要ならここで微調整
  }), [stylesFromTs.wheelPickerWrapper]);


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
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={[stylesFromTs.modal, { justifyContent: 'flex-end' }]}
      hideModalContentWhileAnimating
    >
      <SafeAreaView
        edges={['bottom']}
        style={adjustedTimePickerModalContainerStyle}
      >
        <View style={stylesFromTs.timePickerContentContainer}>
            <View style={stylesFromTs.headerContainer}>
                <Text style={stylesFromTs.headerText}>{t('deadline_modal.specify_time')}</Text>
            </View>

            {stylesFromTs.pickerRowSeparator && <View style={pickerRowSeparatorStyle} />}

            <View style={timePickerOuterContainerStyle}>
                <View style={[
                    selectedItemAccentLineStyle,
                    {
                        top: accentLineTopPosition,
                        left: leftAccentLeftPosition,
                    }
                ]} />

                <View style={[
                    selectedItemAccentLineStyle,
                    {
                        top: accentLineTopPosition,
                        left: rightAccentLeftPosition,
                    }
                ]} />

                <View style={ampmPickerWrapperStyle}>
                    <WheelPicker
                    options={ampmPickerOptions}
                    selectedIndex={ampmOptions.findIndex(o => o.value === selectedAmPm)}
                    onChange={handleAmPmChange}
                    itemHeight={WHEELY_ITEM_HEIGHT}
                    itemTextStyle={wheelyItemTextStyle}
                    containerStyle={{ width: WHEELY_CONTAINER_WIDTH_SHORT, height: PICKER_AREA_TOTAL_HEIGHT }}
                    selectedIndicatorStyle={wheelySelectedIndicatorStyle}
                    decelerationRate="fast"
                    visibleRest={Math.floor(WHEELY_VISIBLE_COUNT / 2)}
                    />
                </View>
                <View style={hourPickerWrapperStyle}>
                    <WheelPicker
                    options={hourPickerOptions}
                    selectedIndex={hourData12.findIndex(o => o.value === selectedHour)}
                    onChange={handleHourChange}
                    itemHeight={WHEELY_ITEM_HEIGHT}
                    itemTextStyle={wheelyItemTextStyle}
                    containerStyle={{ width: WHEELY_CONTAINER_WIDTH_NORMAL, height: PICKER_AREA_TOTAL_HEIGHT }}
                    selectedIndicatorStyle={wheelySelectedIndicatorStyle}
                    decelerationRate="fast"
                    visibleRest={Math.floor(WHEELY_VISIBLE_COUNT / 2)}
                    />
                </View>
                <Text style={adjustedTimeSeparatorStyle}>:</Text>
                <View style={minutePickerWrapperStyle}>
                    <WheelPicker
                    options={minutePickerOptions}
                    selectedIndex={minuteDataFull.findIndex(o => o.value === selectedMinute)}
                    onChange={handleMinuteChange}
                    itemHeight={WHEELY_ITEM_HEIGHT}
                    itemTextStyle={wheelyItemTextStyle}
                    containerStyle={{ width: WHEELY_CONTAINER_WIDTH_NORMAL, height: PICKER_AREA_TOTAL_HEIGHT }}
                    selectedIndicatorStyle={wheelySelectedIndicatorStyle}
                    decelerationRate="fast"
                    visibleRest={Math.floor(WHEELY_VISIBLE_COUNT / 2)}
                    />
                </View>
            </View>

            {stylesFromTs.pickerRowSeparator && <View style={pickerRowSeparatorStyle} />}

            <View style={[stylesFromTs.footer, stylesFromTs.timePickerModalFooter]}>
                <TouchableOpacity style={[stylesFromTs.button, stylesFromTs.timePickerModalButton]} onPress={onClose}>
                    <Text style={stylesFromTs.buttonText} numberOfLines={1} adjustsFontSizeToFit>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[stylesFromTs.button, stylesFromTs.timePickerModalButton]} onPress={onClear}>
                    <Text style={stylesFromTs.buttonText} numberOfLines={1} adjustsFontSizeToFit>{t('common.clear')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[stylesFromTs.button, stylesFromTs.saveButton, stylesFromTs.timePickerModalButton]}
                    onPress={handleConfirm}
                >
                    <Text style={stylesFromTs.saveButtonText} numberOfLines={1} adjustsFontSizeToFit>{t('common.ok')}</Text>
                </TouchableOpacity>
            </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
export const TimePickerModal = React.memo(TimePickerModalMemo);