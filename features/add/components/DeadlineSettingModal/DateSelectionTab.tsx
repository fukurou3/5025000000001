// app/features/add/components/DeadlineSettingModal/DateSelectionTab.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { CalendarUtils } from 'react-native-calendars';

import { useAppTheme } from '@/hooks/ThemeContext';
import type { SpecificDateSelectionTabProps, DeadlineTime } from './types';
import { TimePickerModal } from './TimePickerModal';
import { DatePickerModal } from './DatePickerModal';

const todayString = CalendarUtils.getCalendarDateString(new Date());

const formatTimeToDisplay = (time: DeadlineTime | undefined, t: (key: string, options?: any) => string): string => {
    if (!time) return t('common.select');
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
  selectedEndDate,
  selectedEndTime,
  isEndTimeEnabled,
  updateSettings,
  showErrorAlert,
}) => {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);

  const handleStartDateSectionPress = useCallback(() => {
    setStartDatePickerVisible(true);
  }, []);

  const handleStartDateConfirm = useCallback((newDate: string) => {
    updateSettings('endDate', newDate); // "date" を "endDate" に変更
    setStartDatePickerVisible(false);
  }, [updateSettings]);

  const handleStartDateClear = useCallback(() => {
    const now = new Date();
    updateSettings('endDate', todayString); // "date" を "endDate" に変更
    updateSettings('isEndTimeEnabled', true); // "isTimeEnabled" を "isEndTimeEnabled" に変更
    updateSettings('endTime', { hour: now.getHours(), minute: now.getMinutes() }); // "time" を "endTime" に変更
    setStartDatePickerVisible(false);
  }, [updateSettings]);

  const handleStartDatePickerClose = useCallback(() => {
    setStartDatePickerVisible(false);
  }, []);

  const handleStartTimeSectionPress = useCallback(() => {
    if (!selectedEndDate) { // selectedDate を selectedEndDate に変更
        showErrorAlert(t('deadline_modal.date_missing_for_time_alert_message'));
        return;
    }
    setStartTimePickerVisible(true);
  }, [selectedEndDate, showErrorAlert, t]); // selectedDate を selectedEndDate に変更

  const handleStartTimeConfirm = useCallback((newTime: DeadlineTime) => {
    updateSettings('endTime', newTime); // "time" を "endTime" に変更
    updateSettings('isEndTimeEnabled', true); // "isTimeEnabled" を "isEndTimeEnabled" に変更
    setStartTimePickerVisible(false);
  }, [updateSettings]);

  const handleStartTimeClear = useCallback(() => {
    updateSettings('endTime', undefined); // "time" を "endTime" に変更
    updateSettings('isEndTimeEnabled', false); // "isTimeEnabled" を "isEndTimeEnabled" に変更
    setStartTimePickerVisible(false);
  }, [updateSettings]);

  const handleStartTimePickerClose = useCallback(() => {
    setStartTimePickerVisible(false);
  }, []);

  const handleEndDateSectionPress = useCallback(() => {
    if (!selectedEndDate) { // selectedDate を selectedEndDate に変更
        showErrorAlert(t('deadline_modal.start_date_required_for_end_date'));
        return;
    }
    setEndDatePickerVisible(true);
  }, [selectedEndDate, showErrorAlert, t]); // selectedDate を selectedEndDate に変更

  const handleEndDateConfirm = useCallback((newDate: string) => {
    if (selectedEndDate && newDate < selectedEndDate) { // selectedDate を selectedEndDate に変更
        showErrorAlert(t('deadline_modal.end_date_before_start_date_alert_message'));
        return;
    }
    updateSettings('endDate', newDate);
    setEndDatePickerVisible(false);
  }, [updateSettings, selectedEndDate, showErrorAlert, t]); // selectedDate を selectedEndDate に変更

  const handleEndDateClear = useCallback(() => {
    updateSettings('endDate', undefined);
    updateSettings('isEndTimeEnabled', false);
    updateSettings('endTime', undefined);
    setEndDatePickerVisible(false);
  }, [updateSettings]);

  const handleEndDatePickerClose = useCallback(() => {
    setEndDatePickerVisible(false);
  }, []);

  const handleEndTimeSectionPress = useCallback(() => {
    if (!selectedEndDate) {
        showErrorAlert(t('deadline_modal.end_time_requires_end_date_alert_message'));
        return;
    }
    setEndTimePickerVisible(true);
  }, [selectedEndDate, showErrorAlert, t]);

  const handleEndTimeConfirm = useCallback((newTime: DeadlineTime) => {
    updateSettings('endTime', newTime);
    updateSettings('isEndTimeEnabled', true);
    setEndTimePickerVisible(false);
  }, [updateSettings]);

  const handleEndTimeClear = useCallback(() => {
    updateSettings('isEndTimeEnabled', false);
    updateSettings('endTime', undefined);
    setEndTimePickerVisible(false);
  }, [updateSettings]);

  const handleEndTimePickerClose = useCallback(() => {
    setEndTimePickerVisible(false);
  }, []);

  const displayStartDate = useMemo(() => {
    if (!selectedEndDate) return t('common.select'); // selectedDate を selectedEndDate に変更
    const formattedDate = formatDateToDisplay(selectedEndDate, t); // selectedDate を selectedEndDate に変更
    if (selectedEndDate === todayString) { // selectedDate を selectedEndDate に変更
      return `${formattedDate} (${t('common.today')})`;
    }
    return formattedDate;
  }, [selectedEndDate, t]); // selectedDate を selectedEndDate に変更

  const displayStartTime = useMemo(() => {
    if (isEndTimeEnabled && selectedEndTime) return formatTimeToDisplay(selectedEndTime, t); // isTimeEnabled を isEndTimeEnabled に、selectedTime を selectedEndTime に変更
    if (selectedEndTime) return formatTimeToDisplay(selectedEndTime,t); // selectedTime を selectedEndTime に変更
    return t('common.select');
  }, [isEndTimeEnabled, selectedEndTime, t]); // isTimeEnabled を isEndTimeEnabled に、selectedTime を selectedEndTime に変更

  const displayEndDate = useMemo(() => formatDateToDisplay(selectedEndDate, t), [selectedEndDate, t]);
  const displayEndTime = useMemo(() => {
    if (isEndTimeEnabled && selectedEndTime) return formatTimeToDisplay(selectedEndTime, t);
    return t('common.select');
  }, [isEndTimeEnabled, selectedEndTime, t]);

  const labelFontSize = typeof styles.label.fontSize === 'number' ? styles.label.fontSize : 16;
  const mutedTextColor = isDark ? '#A0A0A0' : '#555555';
  const sectionHeaderTextStyle = styles.sectionHeaderText || {
    fontSize: labelFontSize + 1,
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#000000',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: (styles.tabContentContainer as ViewStyle)?.backgroundColor,
  };
  const dateSectionSeparatorStyle = styles.dateSectionSeparator || {
    height: StyleSheet.hairlineWidth,
    backgroundColor: isDark ? '#3A3A3C' : '#C6C6C8',
    marginVertical: 15,
    marginHorizontal: 16,
  };

  const getInitialTimeForPicker = (type: 'start' | 'end'): DeadlineTime => {
    const now = new Date();
    let currentTime = { hour: now.getHours(), minute: now.getMinutes() };

    if (type === 'start') {
        return selectedEndTime || currentTime; // selectedTime を selectedEndTime に変更
    }
    if (type === 'end') {
        return selectedEndTime || currentTime;
    }
    return currentTime;
  };
  
  const getInitialDateForStartDatePicker = () => {
    return selectedEndDate || todayString; // selectedDate を selectedEndDate に変更
  };

  return (
    <ScrollView style={styles.tabContentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={sectionHeaderTextStyle}>{t('deadline_modal.start_date_section_title')}</Text>
      <TouchableOpacity onPress={handleStartDateSectionPress} style={styles.settingRow}>
        <Text style={styles.label}>{t('deadline_modal.start_date')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }]}>{displayStartDate}</Text>
          <Ionicons name="chevron-forward" size={labelFontSize + 2} color={mutedTextColor} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleStartTimeSectionPress}
        style={styles.settingRow}
        disabled={!selectedEndDate} // selectedDate を selectedEndDate に変更
      >
        <Text style={[styles.label, !selectedEndDate && { color: mutedTextColor }]}>
          {t('deadline_modal.specify_time')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }, !selectedEndDate && { color: mutedTextColor }]}>
            {displayStartTime}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={labelFontSize + 2}
            color={!selectedEndDate ? ((styles.tabContentContainer as ViewStyle)?.backgroundColor || mutedTextColor) as string : mutedTextColor} // selectedDate を selectedEndDate に変更
           />
        </View>
      </TouchableOpacity>

      <View style={dateSectionSeparatorStyle} />

      <Text style={sectionHeaderTextStyle}>{t('deadline_modal.end_date_section_title')}</Text>
      <TouchableOpacity
        onPress={handleEndDateSectionPress}
        style={styles.settingRow}
        disabled={!selectedEndDate} // selectedDate を selectedEndDate に変更
      >
        <Text style={[styles.label, !selectedEndDate && { color: mutedTextColor }]}>
          {t('deadline_modal.end_date')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }, !selectedEndDate && { color: mutedTextColor }]}>
            {displayEndDate}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={labelFontSize + 2}
            color={!selectedEndDate ? ((styles.tabContentContainer as ViewStyle)?.backgroundColor || mutedTextColor) as string : mutedTextColor} // selectedDate を selectedEndDate に変更
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleEndTimeSectionPress}
        style={styles.settingRow}
        disabled={!selectedEndDate}
      >
        <Text style={[styles.label, !selectedEndDate && { color: mutedTextColor }]}>
          {t('deadline_modal.specify_time')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }, !selectedEndDate && { color: mutedTextColor }]}>
            {displayEndTime}
          </Text>
           <Ionicons
            name="chevron-forward"
            size={labelFontSize + 2}
            color={!selectedEndDate ? ((styles.tabContentContainer as ViewStyle)?.backgroundColor || mutedTextColor) as string : mutedTextColor}
          />
        </View>
      </TouchableOpacity>

      <DatePickerModal
        visible={isStartDatePickerVisible}
        initialDate={getInitialDateForStartDatePicker()}
        onClose={handleStartDatePickerClose}
        onConfirm={handleStartDateConfirm}
        onClear={handleStartDateClear}
        clearButtonText={t('common.clear_date')}
      />

      <TimePickerModal
        visible={isStartTimePickerVisible}
        initialTime={getInitialTimeForPicker('start')}
        onClose={handleStartTimePickerClose}
        onConfirm={handleStartTimeConfirm}
        onClear={handleStartTimeClear}
      />

      <DatePickerModal
        visible={isEndDatePickerVisible}
        initialDate={selectedEndDate || selectedEndDate || todayString} // selectedDate を selectedEndDate に変更
        onClose={handleEndDatePickerClose}
        onConfirm={handleEndDateConfirm}
        onClear={handleEndDateClear}
        clearButtonText={t('common.clear_end_date')}
      />

      <TimePickerModal
        visible={isEndTimePickerVisible}
        initialTime={getInitialTimeForPicker('end')}
        onClose={handleEndTimePickerClose}
        onConfirm={handleEndTimeConfirm}
        onClear={handleEndTimeClear}
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
        prevProps.selectedEndDate === nextProps.selectedEndDate && // selectedDate を selectedEndDate に変更
        prevProps.isEndTimeEnabled === nextProps.isEndTimeEnabled && // isTimeEnabled を isEndTimeEnabled に変更
        prevProps.selectedEndTime?.hour === nextProps.selectedEndTime?.hour && // selectedTime を selectedEndTime に変更
        prevProps.selectedEndTime?.minute === nextProps.selectedEndTime?.minute && // selectedTime を selectedEndTime に変更
        prevProps.selectedEndDate === nextProps.selectedEndDate &&
        prevProps.isEndTimeEnabled === nextProps.isEndTimeEnabled &&
        prevProps.selectedEndTime?.hour === nextProps.selectedEndTime?.hour &&
        prevProps.selectedEndTime?.minute === nextProps.selectedEndTime?.minute &&
        prevProps.updateSettings === nextProps.updateSettings &&
        prevProps.showErrorAlert === nextProps.showErrorAlert
    );
};

export const DateSelectionTab = React.memo(DateSelectionTabMemo, areDateSelectionTabPropsEqual);