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
    if (!dateString) return t('common.select');
    return dateString;
};


const DateSelectionTabMemo: React.FC<SpecificDateSelectionTabProps> = ({
  styles,
  selectedDate,
  selectedTime,
  isTimeEnabled,
  updateSettings,
}) => {
  const { colorScheme } = useAppTheme();
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
    return t('common.select');
  }, [isTimeEnabled, selectedTime, t]);

  const labelFontSize = typeof styles.label.fontSize === 'number' ? styles.label.fontSize : 16;
  const mutedTextColor = isDark ? '#A0A0A0' : '#555555';

  return (
    <ScrollView style={styles.tabContentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
      <TouchableOpacity onPress={handleDateSectionPress} style={styles.settingRow}>
        <Text style={styles.label}>{t('deadline_modal.specify_date_label')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }]}>
            {displayDate}
          </Text>
          <Ionicons
            name={"chevron-forward"}
            size={labelFontSize + 2}
            color={mutedTextColor}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleTimeSectionPress} style={styles.settingRow}>
        <Text style={styles.label}>{t('deadline_modal.specify_time')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
        clearButtonText={t('common.clear_date')}
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