// app/features/add/components/DeadlineSettingModal/DateSelectionTab.tsx
import React, { useMemo, useState, useCallback } from 'react';
// Platform を react-native からインポート
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ViewStyle, Switch, Platform } from 'react-native';
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
<<<<<<< HEAD
  selectedTaskDeadlineDate,
  selectedTaskDeadlineTime,
  isTaskDeadlineTimeEnabled,
  isPeriodSettingEnabled,
  selectedPeriodStartDate,
  selectedPeriodStartTime,
=======
  selectedEndDate,
  selectedEndTime,
  isEndTimeEnabled,
>>>>>>> e0ad7c6a9bc77dfcdd00fc6d059ea553eec86ed1
  updateSettings,
  showErrorAlert,
}) => {
  const { colorScheme } = useAppTheme(); // subColor はここでは未使用なので削除
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const [isTaskDeadlineDatePickerVisible, setTaskDeadlineDatePickerVisible] = useState(false);
  const [isTaskDeadlineTimePickerVisible, setTaskDeadlineTimePickerVisible] = useState(false);
  const [isPeriodStartDatePickerVisible, setPeriodStartDatePickerVisible] = useState(false);
  const [isPeriodStartTimePickerVisible, setPeriodStartTimePickerVisible] = useState(false);

  const handleTaskDeadlineDateSectionPress = useCallback(() => {
    setTaskDeadlineDatePickerVisible(true);
  }, []);

<<<<<<< HEAD
  const handleTaskDeadlineDateConfirm = useCallback((newDate: string) => {
    updateSettings('taskDeadlineDate', newDate);
    setTaskDeadlineDatePickerVisible(false);
  }, [updateSettings]);

  const handleTaskDeadlineDateClear = useCallback(() => {
    updateSettings('taskDeadlineDate', undefined);
    updateSettings('isTaskDeadlineTimeEnabled', false);
    updateSettings('taskDeadlineTime', undefined);
    setTaskDeadlineDatePickerVisible(false);
=======
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
>>>>>>> e0ad7c6a9bc77dfcdd00fc6d059ea553eec86ed1
  }, [updateSettings]);

  const handleTaskDeadlineDatePickerClose = useCallback(() => {
    setTaskDeadlineDatePickerVisible(false);
  }, []);

<<<<<<< HEAD
  const handleTaskDeadlineTimeSectionPress = useCallback(() => {
    if (!selectedTaskDeadlineDate) {
        showErrorAlert(t('deadline_modal.date_missing_for_time_alert_message'));
        return;
    }
    setTaskDeadlineTimePickerVisible(true);
  }, [selectedTaskDeadlineDate, showErrorAlert, t]);

  const handleTaskDeadlineTimeConfirm = useCallback((newTime: DeadlineTime) => {
    updateSettings('taskDeadlineTime', newTime);
    updateSettings('isTaskDeadlineTimeEnabled', true);
    setTaskDeadlineTimePickerVisible(false);
  }, [updateSettings]);

  const handleTaskDeadlineTimeClear = useCallback(() => {
    updateSettings('taskDeadlineTime', undefined);
    updateSettings('isTaskDeadlineTimeEnabled', false);
    setTaskDeadlineTimePickerVisible(false);
=======
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
>>>>>>> e0ad7c6a9bc77dfcdd00fc6d059ea553eec86ed1
  }, [updateSettings]);

  const handleTaskDeadlineTimePickerClose = useCallback(() => {
    setTaskDeadlineTimePickerVisible(false);
  }, []);

<<<<<<< HEAD

  const handlePeriodStartDateSectionPress = useCallback(() => {
    if (!isPeriodSettingEnabled) return;
    setPeriodStartDatePickerVisible(true);
  }, [isPeriodSettingEnabled]);
=======
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
>>>>>>> e0ad7c6a9bc77dfcdd00fc6d059ea553eec86ed1

  const handlePeriodStartDateConfirm = useCallback((newDate: string) => {
    updateSettings('periodStartDate', newDate);
    setPeriodStartDatePickerVisible(false);
  }, [updateSettings]);

  const handlePeriodStartDateClear = useCallback(() => {
    updateSettings('periodStartDate', undefined);
    updateSettings('periodStartTime', undefined);
    setPeriodStartDatePickerVisible(false);
  }, [updateSettings]);

  const handlePeriodStartDatePickerClose = useCallback(() => {
    setPeriodStartDatePickerVisible(false);
  }, []);


  const handlePeriodStartTimeSectionPress = useCallback(() => {
    if (!isPeriodSettingEnabled || !selectedPeriodStartDate) {
      if (isPeriodSettingEnabled) {
        showErrorAlert(t('deadline_modal.start_date_required_for_time'));
      }
        return;
    }
    setPeriodStartTimePickerVisible(true);
  }, [isPeriodSettingEnabled, selectedPeriodStartDate, showErrorAlert, t]);

  const handlePeriodStartTimeConfirm = useCallback((newTime: DeadlineTime) => {
    updateSettings('periodStartTime', newTime);
    setPeriodStartTimePickerVisible(false);
  }, [updateSettings]);

  const handlePeriodStartTimeClear = useCallback(() => {
    updateSettings('periodStartTime', undefined);
    setPeriodStartTimePickerVisible(false);
  }, [updateSettings]);

  const handlePeriodStartTimePickerClose = useCallback(() => {
    setPeriodStartTimePickerVisible(false);
  }, []);

<<<<<<< HEAD

  const displayTaskDeadlineDate = useMemo(() => {
    if (!selectedTaskDeadlineDate) return t('common.select');
    const formattedDate = formatDateToDisplay(selectedTaskDeadlineDate, t);
    if (selectedTaskDeadlineDate === todayString) {
      return `${formattedDate} (${t('common.today')})`;
    }
    return formattedDate;
  }, [selectedTaskDeadlineDate, t]);

  const displayTaskDeadlineTime = useMemo(() => {
    if (isTaskDeadlineTimeEnabled && selectedTaskDeadlineTime) return formatTimeToDisplay(selectedTaskDeadlineTime, t);
    return t('common.select');
  }, [isTaskDeadlineTimeEnabled, selectedTaskDeadlineTime, t]);

  const displayPeriodStartDate = useMemo(() => formatDateToDisplay(selectedPeriodStartDate, t), [selectedPeriodStartDate, t]);
  const displayPeriodStartTime = useMemo(() => formatTimeToDisplay(selectedPeriodStartTime, t), [selectedPeriodStartTime, t]);
=======
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
>>>>>>> e0ad7c6a9bc77dfcdd00fc6d059ea553eec86ed1


  const labelFontSize = typeof styles.label.fontSize === 'number' ? styles.label.fontSize : 16;
  const mutedTextColor = isDark ? '#A0A0A0' : '#555555';
  const disabledTextColor = isDark ? '#555557' : '#ADADAF';

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

  const switchTrackColorTrue = isDark ? '#30D158' : '#34C759';
  const switchTrackColorFalse = isDark ? '#2C2C2E' : '#E9E9EA';
  const switchThumbColorValue = '#FFFFFF';
  const switchTrackBorderColorFalse = isDark ? '#555557' : '#ADADAF';
  const switchContainerBaseStyle: ViewStyle = {
    width: 51,
    height: 31,
    borderRadius: 31 / 2,
    justifyContent: 'center',
    padding: 2,
  };


  const getInitialTimeForPicker = (type: 'taskDeadline' | 'periodStart'): DeadlineTime => {
    const now = new Date();
    let currentTime = { hour: now.getHours(), minute: now.getMinutes() };

<<<<<<< HEAD
    if (type === 'taskDeadline') {
        return selectedTaskDeadlineTime || currentTime;
=======
    if (type === 'start') {
        return selectedEndTime || currentTime; // selectedTime を selectedEndTime に変更
>>>>>>> e0ad7c6a9bc77dfcdd00fc6d059ea553eec86ed1
    }
    if (type === 'periodStart') {
        return selectedPeriodStartTime || currentTime;
    }
    return currentTime;
  };
<<<<<<< HEAD
=======
  
  const getInitialDateForStartDatePicker = () => {
    return selectedEndDate || todayString; // selectedDate を selectedEndDate に変更
  };
>>>>>>> e0ad7c6a9bc77dfcdd00fc6d059ea553eec86ed1

  return (
    <ScrollView style={styles.tabContentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={sectionHeaderTextStyle}>{t('deadline_modal.task_deadline_section_title')}</Text>
      <TouchableOpacity onPress={handleTaskDeadlineDateSectionPress} style={styles.settingRow}>
        <Text style={styles.label}>{t('deadline_modal.date_label')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }]}>{displayTaskDeadlineDate}</Text>
          <Ionicons name="chevron-forward" size={labelFontSize + 2} color={mutedTextColor} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleTaskDeadlineTimeSectionPress}
        style={styles.settingRow}
<<<<<<< HEAD
        disabled={!selectedTaskDeadlineDate}
      >
        <Text style={[styles.label, !selectedTaskDeadlineDate && { color: mutedTextColor }]}>
          {t('deadline_modal.time_label')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }, !selectedTaskDeadlineDate && { color: mutedTextColor }]}>
            {displayTaskDeadlineTime}
=======
        disabled={!selectedEndDate} // selectedDate を selectedEndDate に変更
      >
        <Text style={[styles.label, !selectedEndDate && { color: mutedTextColor }]}>
          {t('deadline_modal.specify_time')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }, !selectedEndDate && { color: mutedTextColor }]}>
            {displayStartTime}
>>>>>>> e0ad7c6a9bc77dfcdd00fc6d059ea553eec86ed1
          </Text>
          <Ionicons
            name="chevron-forward"
            size={labelFontSize + 2}
<<<<<<< HEAD
            color={!selectedTaskDeadlineDate ? ((styles.tabContentContainer as ViewStyle)?.backgroundColor || mutedTextColor) as string : mutedTextColor}
=======
            color={!selectedEndDate ? ((styles.tabContentContainer as ViewStyle)?.backgroundColor || mutedTextColor) as string : mutedTextColor} // selectedDate を selectedEndDate に変更
>>>>>>> e0ad7c6a9bc77dfcdd00fc6d059ea553eec86ed1
           />
        </View>
      </TouchableOpacity>

      <View style={dateSectionSeparatorStyle} />

      <View style={styles.settingRow}>
        <Text style={styles.label}>{t('deadline_modal.set_period_toggle_label')}</Text>
        <View
            style={[
            switchContainerBaseStyle,
            {
                backgroundColor: isPeriodSettingEnabled ? switchTrackColorTrue : switchTrackColorFalse,
                borderWidth: Platform.OS === 'android' && !isPeriodSettingEnabled ? 1.5 : 0,
                borderColor: Platform.OS === 'android' && !isPeriodSettingEnabled ? switchTrackBorderColorFalse : 'transparent',
            }
            ]}
        >
            <Switch
            value={isPeriodSettingEnabled}
            onValueChange={(value) => updateSettings('isPeriodSettingEnabled', value)}
            thumbColor={switchThumbColorValue}
            trackColor={{ false: Platform.OS === 'ios' ? switchTrackColorFalse : 'transparent' , true: Platform.OS === 'ios' ? switchTrackColorTrue : 'transparent' }}
            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
            ios_backgroundColor={switchTrackColorFalse}
            />
        </View>
      </View>


      <TouchableOpacity
        onPress={handlePeriodStartDateSectionPress}
        style={styles.settingRow}
<<<<<<< HEAD
        disabled={!isPeriodSettingEnabled}
      >
        <Text style={[styles.label, !isPeriodSettingEnabled && { color: disabledTextColor }]}>
          {t('deadline_modal.start_date_label')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }, !isPeriodSettingEnabled && { color: disabledTextColor }]}>
            {displayPeriodStartDate}
=======
        disabled={!selectedEndDate} // selectedDate を selectedEndDate に変更
      >
        <Text style={[styles.label, !selectedEndDate && { color: mutedTextColor }]}>
          {t('deadline_modal.end_date')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }, !selectedEndDate && { color: mutedTextColor }]}>
            {displayEndDate}
>>>>>>> e0ad7c6a9bc77dfcdd00fc6d059ea553eec86ed1
          </Text>
          <Ionicons
            name="chevron-forward"
            size={labelFontSize + 2}
<<<<<<< HEAD
            color={!isPeriodSettingEnabled ? ((styles.tabContentContainer as ViewStyle)?.backgroundColor || disabledTextColor) as string : mutedTextColor}
=======
            color={!selectedEndDate ? ((styles.tabContentContainer as ViewStyle)?.backgroundColor || mutedTextColor) as string : mutedTextColor} // selectedDate を selectedEndDate に変更
>>>>>>> e0ad7c6a9bc77dfcdd00fc6d059ea553eec86ed1
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handlePeriodStartTimeSectionPress}
        style={styles.settingRow}
        disabled={!isPeriodSettingEnabled || !selectedPeriodStartDate}
      >
        <Text style={[styles.label, (!isPeriodSettingEnabled || !selectedPeriodStartDate) && { color: disabledTextColor }]}>
          {t('deadline_modal.time_label')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }, (!isPeriodSettingEnabled || !selectedPeriodStartDate) && { color: disabledTextColor }]}>
            {displayPeriodStartTime}
          </Text>
           <Ionicons
            name="chevron-forward"
            size={labelFontSize + 2}
            color={(!isPeriodSettingEnabled || !selectedPeriodStartDate) ? ((styles.tabContentContainer as ViewStyle)?.backgroundColor || disabledTextColor) as string : mutedTextColor}
          />
        </View>
      </TouchableOpacity>

      <DatePickerModal
        visible={isTaskDeadlineDatePickerVisible}
        initialDate={selectedTaskDeadlineDate || todayString}
        onClose={handleTaskDeadlineDatePickerClose}
        onConfirm={handleTaskDeadlineDateConfirm}
        onClear={handleTaskDeadlineDateClear}
        clearButtonText={t('common.clear_date')}
      />

      <TimePickerModal
        visible={isTaskDeadlineTimePickerVisible}
        initialTime={getInitialTimeForPicker('taskDeadline')}
        onClose={handleTaskDeadlineTimePickerClose}
        onConfirm={handleTaskDeadlineTimeConfirm}
        onClear={handleTaskDeadlineTimeClear}
      />

      <DatePickerModal
<<<<<<< HEAD
        visible={isPeriodStartDatePickerVisible}
        initialDate={selectedPeriodStartDate || todayString}
        onClose={handlePeriodStartDatePickerClose}
        onConfirm={handlePeriodStartDateConfirm}
        onClear={handlePeriodStartDateClear}
        clearButtonText={t('common.clear_start_date')}
=======
        visible={isEndDatePickerVisible}
        initialDate={selectedEndDate || selectedEndDate || todayString} // selectedDate を selectedEndDate に変更
        onClose={handleEndDatePickerClose}
        onConfirm={handleEndDateConfirm}
        onClear={handleEndDateClear}
        clearButtonText={t('common.clear_end_date')}
>>>>>>> e0ad7c6a9bc77dfcdd00fc6d059ea553eec86ed1
      />

      <TimePickerModal
        visible={isPeriodStartTimePickerVisible}
        initialTime={getInitialTimeForPicker('periodStart')}
        onClose={handlePeriodStartTimePickerClose}
        onConfirm={handlePeriodStartTimeConfirm}
        onClear={handlePeriodStartTimeClear}
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
<<<<<<< HEAD
        prevProps.selectedTaskDeadlineDate === nextProps.selectedTaskDeadlineDate &&
        prevProps.isTaskDeadlineTimeEnabled === nextProps.isTaskDeadlineTimeEnabled &&
        prevProps.selectedTaskDeadlineTime?.hour === nextProps.selectedTaskDeadlineTime?.hour &&
        prevProps.selectedTaskDeadlineTime?.minute === nextProps.selectedTaskDeadlineTime?.minute &&
        prevProps.isPeriodSettingEnabled === nextProps.isPeriodSettingEnabled &&
        prevProps.selectedPeriodStartDate === nextProps.selectedPeriodStartDate &&
        prevProps.selectedPeriodStartTime?.hour === nextProps.selectedPeriodStartTime?.hour &&
        prevProps.selectedPeriodStartTime?.minute === nextProps.selectedPeriodStartTime?.minute &&
=======
        prevProps.selectedEndDate === nextProps.selectedEndDate && // selectedDate を selectedEndDate に変更
        prevProps.isEndTimeEnabled === nextProps.isEndTimeEnabled && // isTimeEnabled を isEndTimeEnabled に変更
        prevProps.selectedEndTime?.hour === nextProps.selectedEndTime?.hour && // selectedTime を selectedEndTime に変更
        prevProps.selectedEndTime?.minute === nextProps.selectedEndTime?.minute && // selectedTime を selectedEndTime に変更
        prevProps.selectedEndDate === nextProps.selectedEndDate &&
        prevProps.isEndTimeEnabled === nextProps.isEndTimeEnabled &&
        prevProps.selectedEndTime?.hour === nextProps.selectedEndTime?.hour &&
        prevProps.selectedEndTime?.minute === nextProps.selectedEndTime?.minute &&
>>>>>>> e0ad7c6a9bc77dfcdd00fc6d059ea553eec86ed1
        prevProps.updateSettings === nextProps.updateSettings &&
        prevProps.showErrorAlert === nextProps.showErrorAlert
    );
};

export const DateSelectionTab = React.memo(DateSelectionTabMemo, areDateSelectionTabPropsEqual);