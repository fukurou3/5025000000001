// app/features/add/components/DeadlineSettingModal/DateSelectionTab.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { CalendarUtils } from 'react-native-calendars';

import { useAppTheme } from '@/hooks/ThemeContext';
import type { SpecificDateSelectionTabProps, DeadlineTime } from './types';
import { TimePickerModal } from './TimePickerModal';
import { DatePickerModal } from './DatePickerModal';

const formatTimeToDisplay = (time: DeadlineTime, t: (key: string, options?: any) => string): string => {
    const hour24 = time.hour;
    const ampmKey = (hour24 < 12 || hour24 === 24 || hour24 === 0) ? 'am' : 'pm';
    const ampm = t(`common.${ampmKey}`);
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    return `${ampm} ${hour12}:${String(time.minute).padStart(2, '0')}`;
};

const formatDateToDisplay = (dateString: string | undefined, t: (key: string, options?: any) => string): string => {
    if (!dateString) return t('common.select', '選択');
    return dateString;
};


const DateSelectionTabMemo: React.FC<SpecificDateSelectionTabProps> = ({
  styles,
  selectedDate,
  selectedTime,
  isTimeEnabled,
  updateSettings,
}) => {
  const { colorScheme } = useAppTheme(); // subColor はここでは不要に
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const [isDatePickerModalVisible, setDatePickerModalVisible] = useState(false);
  const [isTimePickerModalVisible, setTimePickerModalVisible] = useState(false);

  const handleDateSectionPress = useCallback(() => {
    setDatePickerModalVisible(true);
  }, []);

  const handleDateConfirm = useCallback((newDate: string) => {
    updateSettings('date', newDate);
    setDatePickerModalVisible(false);
  }, [updateSettings]);

  const handleDateClear = useCallback(() => {
    updateSettings('date', undefined);
    setDatePickerModalVisible(false);
  }, [updateSettings]);

  const handleDatePickerClose = useCallback(() => {
    setDatePickerModalVisible(false);
  }, []);


  const handleTimeSectionPress = useCallback(() => {
    setTimePickerModalVisible(true);
  }, []);

  const handleTimeConfirm = useCallback((newTime: DeadlineTime) => {
    updateSettings('time', newTime);
    updateSettings('isTimeEnabled', true);
    setTimePickerModalVisible(false);
  }, [updateSettings]);

  const handleTimeClear = useCallback(() => {
    updateSettings('isTimeEnabled', false);
    const defaultInitialTime: DeadlineTime = { hour: 9, minute: 0 };
    updateSettings('time', defaultInitialTime);
    setTimePickerModalVisible(false);
  }, [updateSettings]);

  const handleTimePickerClose = useCallback(() => {
    setTimePickerModalVisible(false);
  }, []);


  const displayDate = useMemo(() => {
    return formatDateToDisplay(selectedDate, t);
  }, [selectedDate, t]);

  const displayTime = useMemo(() => {
    if (isTimeEnabled && selectedTime) {
      return formatTimeToDisplay(selectedTime, t);
    }
    // 時刻指定が無効、または時刻が未選択の場合は「選択」と表示
    return t('common.select', '選択');
  }, [isTimeEnabled, selectedTime, t]);

  // label の fontSize は styles.label から取得される
  const labelFontSize = typeof styles.label.fontSize === 'number' ? styles.label.fontSize : 16;
  // pickerText の color は styles.pickerText.color から取得される (baseTextColor)
  // 未選択時のグレーアウト用の色は styles.ts で mutedTextColorとして定義可能 (ここでは使用しない)
  const mutedTextColor = isDark ? '#A0A0A0' : '#555555'; // アイコンの色などには引き続き使用

  return (
    <ScrollView style={styles.tabContentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
      <TouchableOpacity onPress={handleDateSectionPress} style={styles.settingRow}>
        {/* ラベルは styles.label でユーザーカラーとfontWeight: '600' が適用される */}
        <Text style={styles.label}>{t('deadline_modal.specify_date_label', '日付')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* pickerText の color は常に styles.pickerText.color (baseTextColor) を使用 */}
          <Text style={[styles.pickerText, { marginRight: 4 }]}>
            {displayDate}
          </Text>
          <Ionicons
            name={"chevron-forward"}
            size={labelFontSize + 2} // アイコンサイズはラベルのフォントサイズに連動
            color={mutedTextColor} // アイコンの色は未選択時などに使う色
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleTimeSectionPress} style={styles.timePickerToggleContainer}>
        {/* ラベルは styles.label でユーザーカラーとfontWeight: '600' が適用される */}
        <Text style={styles.label}>{t('deadline_modal.specify_time', '時刻を指定')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* pickerText の color は常に styles.pickerText.color (baseTextColor) を使用 */}
          <Text style={[styles.pickerText, { marginRight: 4 }]}>
            {displayTime}
          </Text>
          <Ionicons
            name={"chevron-forward"}
            size={labelFontSize + 2}
            color={mutedTextColor}
          />
        </View>
      </TouchableOpacity>

      <DatePickerModal
        visible={isDatePickerModalVisible}
        initialDate={selectedDate || CalendarUtils.getCalendarDateString(new Date())}
        onClose={handleDatePickerClose}
        onConfirm={handleDateConfirm}
        onClear={handleDateClear}
        clearButtonText={t('common.clear_date', '日付をクリア')}
      />

      <TimePickerModal
        visible={isTimePickerModalVisible}
        initialTime={selectedTime}
        onClose={handleTimePickerClose}
        onConfirm={handleTimeConfirm}
        onClear={handleTimeClear}
      />
    </ScrollView>
  );
};

const areDateSelectionTabPropsEqual = (
    prevProps: Readonly<SpecificDateSelectionTabProps>,
    nextProps: Readonly<SpecificDateSelectionTabProps>
): boolean => {
    return (
        prevProps.styles === nextProps.styles &&
        prevProps.selectedDate === nextProps.selectedDate &&
        prevProps.isTimeEnabled === nextProps.isTimeEnabled &&
        prevProps.selectedTime?.hour === nextProps.selectedTime?.hour &&
        prevProps.selectedTime?.minute === nextProps.selectedTime?.minute &&
        prevProps.updateSettings === nextProps.updateSettings
    );
};

export const DateSelectionTab = React.memo(DateSelectionTabMemo, areDateSelectionTabPropsEqual);