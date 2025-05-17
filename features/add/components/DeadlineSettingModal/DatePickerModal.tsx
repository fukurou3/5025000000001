// app/features/add/components/DeadlineSettingModal/DatePickerModal.tsx
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform, TextStyle, useWindowDimensions, ViewStyle, ColorValue } from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import WheelPicker from 'react-native-wheely';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/hooks/ThemeContext';
import { FontSizeContext } from '@/context/FontSizeContext';
import { fontSizes as appFontSizes } from '@/constants/fontSizes';
import type { DeadlineModalStyles } from './types';
import { createDeadlineModalStyles } from './styles';

const WHEELY_ITEM_HEIGHT = Platform.OS === 'ios' ? 80 : 88;
const BASE_PICKER_FONT_SIZE_INCREASE = 18;

const DATE_PICKER_HORIZONTAL_SEPARATOR_PADDING = 5;

const ACCENT_LINE_THICKNESS = 4;
const ACCENT_LINE_LENGTH = 30;
const ACCENT_LINE_BORDER_RADIUS = 2;
const ACCENT_LINE_CONTAINER_HORIZONTAL_PADDING = 10; 
const ACCENT_LINE_HORIZONTAL_OFFSET = 5;          

const CUSTOM_VISUAL_ALIGNMENT_SHIFT = -28; 

const WHEELY_CONTAINER_WIDTH_YEAR = Platform.OS === 'ios' ? 120 : 120;
const WHEELY_CONTAINER_WIDTH_MONTH = Platform.OS === 'ios' ? 80 : 80;
const WHEELY_CONTAINER_WIDTH_DAY = Platform.OS === 'ios' ? 80 : 80;

const WHEELY_VISIBLE_COUNT = 3;
const PICKER_AREA_TOTAL_HEIGHT = WHEELY_ITEM_HEIGHT * WHEELY_VISIBLE_COUNT;

const BACKDROP_OPACITY = 0.4;
const ANIMATION_TIMING = 250;

const createYearData = (currentYear: number): Array<{ label: string; value: number }> => {
  const years = [];
  const startYear = currentYear - 70;
  const endYear = currentYear + 30;
  for (let i = startYear; i <= endYear; i++) {
    years.push({ label: `${i}`, value: i });
  }
  return years;
};

const createMonthData = (t: (key: string, options?: any) => string): Array<{ label: string; value: number }> => {
  const months = [];
  const monthKeys = ['jan_short', 'feb_short', 'mar_short', 'apr_short', 'may_short', 'jun_short', 'jul_short', 'aug_short', 'sep_short', 'oct_short', 'nov_short', 'dec_short'];
  for (let i = 0; i < 12; i++) {
    const label = t(`common.${monthKeys[i]as any}`, { defaultValue: `${i + 1}` });
    months.push({ label: label, value: i + 1 });
  }
  return months;
};

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

const createDayData = (year: number, month: number): Array<{ label: string; value: number }> => {
  const days = [];
  const numDays = getDaysInMonth(year, month);
  for (let i = 1; i <= numDays; i++) {
    days.push({ label: `${i}`, value: i });
  }
  return days;
};

interface DatePickerModalProps {
  visible: boolean;
  initialDate?: string;
  onClose: () => void;
  onConfirm: (date: string) => void;
  onClear?: () => void;
  clearButtonText?: string;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = React.memo(({
  visible,
  initialDate,
  onClose,
  onConfirm,
  onClear,
  clearButtonText,
}) => {
  const { t } = useTranslation();
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { fontSizeKey } = useContext(FontSizeContext);
  const { width: windowWidth } = useWindowDimensions();

  const stylesFromTs: DeadlineModalStyles = useMemo(() => createDeadlineModalStyles(isDark, subColor, fontSizeKey), [isDark, subColor, fontSizeKey]);
  const currentBaseFontSize = appFontSizes[fontSizeKey];
  const pickerItemFontSize = currentBaseFontSize + BASE_PICKER_FONT_SIZE_INCREASE;
  const accentLineColorValue = subColor as ColorValue;

  const today = new Date();
  const initialDateObj = useMemo(() => {
    if (initialDate) {
      const [year, month, day] = initialDate.split('-').map(Number);
      return { year, month, day };
    }
    return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
  }, [initialDate, today]);

  const [selectedYear, setSelectedYear] = useState<number>(initialDateObj.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialDateObj.month);
  const [selectedDay, setSelectedDay] = useState<number>(initialDateObj.day);

  const yearData = useMemo(() => createYearData(today.getFullYear()), [today]);
  const monthData = useMemo(() => createMonthData(t), [t]);
  const dayData = useMemo(() => createDayData(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  useEffect(() => {
    if (visible) {
      const newInitial = initialDate
        ? { year: parseInt(initialDate.substring(0, 4), 10), month: parseInt(initialDate.substring(5, 7), 10), day: parseInt(initialDate.substring(8, 10), 10) }
        : { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
      setSelectedYear(newInitial.year);
      setSelectedMonth(newInitial.month);
      const daysInNewMonth = getDaysInMonth(newInitial.year, newInitial.month);
      setSelectedDay(Math.min(newInitial.day, daysInNewMonth));
    }
  }, [visible, initialDate, today]);

  useEffect(() => {
    const daysInCurrentMonth = getDaysInMonth(selectedYear, selectedMonth);
    if (selectedDay > daysInCurrentMonth) {
      setSelectedDay(daysInCurrentMonth);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  const handleConfirm = useCallback(() => {
    const finalDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    onConfirm(finalDate);
  }, [selectedYear, selectedMonth, selectedDay, onConfirm]);

  const handleYearChange = useCallback((index: number) => setSelectedYear(yearData[index].value), [yearData]);
  const handleMonthChange = useCallback((index: number) => setSelectedMonth(monthData[index].value), [monthData]);
  const handleDayChange = useCallback((index: number) => setSelectedDay(dayData[index].value), [dayData]);

  const yearPickerOptions = useMemo(() => yearData.map(opt => opt.label), [yearData]);
  const monthPickerOptions = useMemo(() => monthData.map(opt => opt.label), [monthData]);
  const dayPickerOptions = useMemo(() => dayData.map(opt => opt.label), [dayData]);

  const wheelyItemTextStyle = useMemo((): TextStyle => ({
    color: stylesFromTs.label.color,
    fontSize: pickerItemFontSize,
    fontWeight: Platform.OS === 'ios' ? '500' : '500',
  }), [stylesFromTs.label.color, pickerItemFontSize]);

  const wheelySelectedIndicatorStyle = useMemo(() => ({
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderColor: 'transparent',
  }), []);

  const dateSeparatorStyle = useMemo((): TextStyle => ({
    ...stylesFromTs.timeSeparator,
    fontSize: pickerItemFontSize - (Platform.OS === 'ios' ? 7 : 7),
    lineHeight: WHEELY_ITEM_HEIGHT,
    textAlignVertical: 'center',
    marginHorizontal: Platform.OS === 'ios' ? -9 : -9, // ★ 年月日テキストの間隔を狭める
    color: stylesFromTs.label.color,
  }), [stylesFromTs.timeSeparator, stylesFromTs.label.color, pickerItemFontSize]);

  const pickerAreaPaddingVertical = useMemo((): number => {
    const defaultPaddingV = Platform.OS === 'ios' ? 10 : 10;
    const stylePaddingV = (stylesFromTs.timePickerContainer as ViewStyle)?.paddingVertical;
    return typeof stylePaddingV === 'number' ? stylePaddingV : defaultPaddingV;
  }, [stylesFromTs.timePickerContainer]);

  const datePickerOuterContainerStyle = useMemo((): ViewStyle => ({
    height: PICKER_AREA_TOTAL_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: ACCENT_LINE_CONTAINER_HORIZONTAL_PADDING,
    paddingVertical: pickerAreaPaddingVertical,
    position: 'relative',
  }), [PICKER_AREA_TOTAL_HEIGHT, pickerAreaPaddingVertical, ACCENT_LINE_CONTAINER_HORIZONTAL_PADDING]);

  const innerPickerContentWrapperStyle = useMemo((): ViewStyle => ({
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: CUSTOM_VISUAL_ALIGNMENT_SHIFT, 
  }), [CUSTOM_VISUAL_ALIGNMENT_SHIFT]);


  const adjustedDatePickerModalContainerStyle = useMemo((): ViewStyle => ({
    ...(stylesFromTs.timePickerModalContainer as ViewStyle),
  }), [stylesFromTs.timePickerModalContainer]);

  const yearUnitText = t('common.year_unit', '年');
  const monthUnitText = t('common.month_unit', '月');
  const dayUnitText = t('common.day_unit', '日');

  const pickerWrapperStyle = useMemo((): ViewStyle => ({
    ...(stylesFromTs.wheelPickerWrapper as ViewStyle),
  }), [stylesFromTs.wheelPickerWrapper]);

  const selectedItemAccentLineStyle = useMemo((): ViewStyle => ({
    position: 'absolute',
    width: ACCENT_LINE_LENGTH,
    height: ACCENT_LINE_THICKNESS,
    borderRadius: ACCENT_LINE_BORDER_RADIUS,
    backgroundColor: accentLineColorValue,
  }), [accentLineColorValue]);

  const accentLineTopPosition = pickerAreaPaddingVertical + WHEELY_ITEM_HEIGHT + (WHEELY_ITEM_HEIGHT / 2) - (ACCENT_LINE_THICKNESS / 2);
  
  const pickerOuterContainerActualWidth = windowWidth - 2 * ACCENT_LINE_CONTAINER_HORIZONTAL_PADDING;

  const leftAccentLeftPosition = ACCENT_LINE_HORIZONTAL_OFFSET;
  const rightAccentLeftPosition = pickerOuterContainerActualWidth - ACCENT_LINE_LENGTH - ACCENT_LINE_HORIZONTAL_OFFSET;

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
        style={adjustedDatePickerModalContainerStyle}
      >
        <View style={stylesFromTs.timePickerContentContainer}>
          <View style={stylesFromTs.headerContainer}>
            <Text style={stylesFromTs.headerText}>{t('deadline_modal.specify_date', '日付を指定')}</Text>
          </View>

          {stylesFromTs.pickerRowSeparator &&
            <View style={[stylesFromTs.pickerRowSeparator, {
                width: windowWidth - (DATE_PICKER_HORIZONTAL_SEPARATOR_PADDING * 2),
                marginHorizontal: DATE_PICKER_HORIZONTAL_SEPARATOR_PADDING,
            }]} />
          }

          <View style={datePickerOuterContainerStyle}>
            <View style={[ selectedItemAccentLineStyle, { top: accentLineTopPosition, left: leftAccentLeftPosition, }]} />
            <View style={[ selectedItemAccentLineStyle, { top: accentLineTopPosition, left: rightAccentLeftPosition, }]} />

            <View style={innerPickerContentWrapperStyle}>
              <View style={pickerWrapperStyle}>
                <WheelPicker
                  options={yearPickerOptions}
                  selectedIndex={yearData.findIndex(o => o.value === selectedYear)}
                  onChange={handleYearChange}
                  itemHeight={WHEELY_ITEM_HEIGHT}
                  itemTextStyle={wheelyItemTextStyle}
                  containerStyle={{ width: WHEELY_CONTAINER_WIDTH_YEAR, height: PICKER_AREA_TOTAL_HEIGHT }}
                  selectedIndicatorStyle={wheelySelectedIndicatorStyle}
                  decelerationRate="fast"
                  visibleRest={Math.floor(WHEELY_VISIBLE_COUNT / 2)}
                />
              </View>
              <Text style={dateSeparatorStyle}>{yearUnitText}</Text>
              <View style={pickerWrapperStyle}>
                <WheelPicker
                  options={monthPickerOptions}
                  selectedIndex={monthData.findIndex(o => o.value === selectedMonth)}
                  onChange={handleMonthChange}
                  itemHeight={WHEELY_ITEM_HEIGHT}
                  itemTextStyle={wheelyItemTextStyle}
                  containerStyle={{ width: WHEELY_CONTAINER_WIDTH_MONTH, height: PICKER_AREA_TOTAL_HEIGHT }}
                  selectedIndicatorStyle={wheelySelectedIndicatorStyle}
                  decelerationRate="fast"
                  visibleRest={Math.floor(WHEELY_VISIBLE_COUNT / 2)}
                />
              </View>
              <Text style={dateSeparatorStyle}>{monthUnitText}</Text>
              <View style={pickerWrapperStyle}>
                <WheelPicker
                  options={dayPickerOptions}
                  selectedIndex={dayData.findIndex(o => o.value === selectedDay)}
                  onChange={handleDayChange}
                  itemHeight={WHEELY_ITEM_HEIGHT}
                  itemTextStyle={wheelyItemTextStyle}
                  containerStyle={{ width: WHEELY_CONTAINER_WIDTH_DAY, height: PICKER_AREA_TOTAL_HEIGHT }}
                  selectedIndicatorStyle={wheelySelectedIndicatorStyle}
                  decelerationRate="fast"
                  visibleRest={Math.floor(WHEELY_VISIBLE_COUNT / 2)}
                />
              </View>
              <Text style={dateSeparatorStyle}>{dayUnitText}</Text>
            </View>
          </View>

          {stylesFromTs.pickerRowSeparator &&
            <View style={[stylesFromTs.pickerRowSeparator, {
                width: windowWidth - (DATE_PICKER_HORIZONTAL_SEPARATOR_PADDING * 2),
                marginHorizontal: DATE_PICKER_HORIZONTAL_SEPARATOR_PADDING,
            }]} />
          }

          <View style={[stylesFromTs.footer, stylesFromTs.timePickerModalFooter]}>
            <TouchableOpacity style={[stylesFromTs.button, stylesFromTs.timePickerModalButton]} onPress={onClose}>
              <Text style={stylesFromTs.buttonText} numberOfLines={1} adjustsFontSizeToFit>{t('common.cancel')}</Text>
            </TouchableOpacity>
            {onClear && (
                <TouchableOpacity style={[stylesFromTs.button, stylesFromTs.timePickerModalButton]} onPress={onClear}>
                    <Text style={stylesFromTs.buttonText} numberOfLines={1} adjustsFontSizeToFit>{clearButtonText || t('common.clear')}</Text>
                </TouchableOpacity>
            )}
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
});