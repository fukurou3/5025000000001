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
  selectedTaskDeadlineDate,
  selectedTaskDeadlineTime,
  isTaskDeadlineTimeEnabled,
  isPeriodSettingEnabled,
  selectedPeriodStartDate,
  selectedPeriodStartTime,
  updateSettings,
  showErrorAlert,
}) => {
  const { colorScheme } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const [isTaskDeadlineDatePickerVisible, setTaskDeadlineDatePickerVisible] = useState(false);
  const [isTaskDeadlineTimePickerVisible, setTaskDeadlineTimePickerVisible] = useState(false);
  const [isPeriodStartDatePickerVisible, setPeriodStartDatePickerVisible] = useState(false);
  const [isPeriodStartTimePickerVisible, setPeriodStartTimePickerVisible] = useState(false);

  const handleTaskDeadlineDateSectionPress = useCallback(() => {
    setTaskDeadlineDatePickerVisible(true);
  }, []);

  const handleTaskDeadlineDateConfirm = useCallback((newDate: string) => {
    updateSettings('taskDeadlineDate', newDate);
    setTaskDeadlineDatePickerVisible(false);
  }, [updateSettings]);

  const handleTaskDeadlineDateClear = useCallback(() => {
    updateSettings('taskDeadlineDate', undefined);
    updateSettings('isTaskDeadlineTimeEnabled', false);
    updateSettings('taskDeadlineTime', undefined);
    setTaskDeadlineDatePickerVisible(false);
  }, [updateSettings]);

  const handleTaskDeadlineDatePickerClose = useCallback(() => {
    setTaskDeadlineDatePickerVisible(false);
  }, []);

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
  }, [updateSettings]);

  const handleTaskDeadlineTimePickerClose = useCallback(() => {
    setTaskDeadlineTimePickerVisible(false);
  }, []);


  const handlePeriodStartDateSectionPress = useCallback(() => {
    if (!isPeriodSettingEnabled) return;
    setPeriodStartDatePickerVisible(true);
  }, [isPeriodSettingEnabled]);

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


  const displayTaskDeadlineDate = useMemo(() => {
    if (!selectedTaskDeadlineDate) return t('common.select');
    const formattedDate = formatDateToDisplay(selectedTaskDeadlineDate, t);
    if (selectedTaskDeadlineDate === todayString) {
      return `${formattedDate} (${t('common.today')})`;
    }
    return formattedDate;
  }, [selectedTaskDeadlineDate, t]);

  const displayTaskDeadlineTime = useMemo(() => {
    if (isTaskDeadlineTimeEnabled && selectedTaskDeadlineTime) {
      return formatTimeToDisplay(selectedTaskDeadlineTime, t);
    }
    // 時刻設定が有効で、時刻がまだない(0時が内部的に設定される)場合の表示
    if (isTaskDeadlineTimeEnabled && !selectedTaskDeadlineTime) {
      return formatTimeToDisplay({ hour: 0, minute: 0 }, t);
    }
    return t('common.select');
  }, [isTaskDeadlineTimeEnabled, selectedTaskDeadlineTime, t]);

  const displayPeriodStartDate = useMemo(() => formatDateToDisplay(selectedPeriodStartDate, t), [selectedPeriodStartDate, t]);
  const displayPeriodStartTime = useMemo(() => formatTimeToDisplay(selectedPeriodStartTime, t), [selectedPeriodStartTime, t]);


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

  const getInitialTimeForPicker = useCallback((type: 'taskDeadline' | 'periodStart'): DeadlineTime | undefined => {
    if (type === 'taskDeadline') {
      if (isTaskDeadlineTimeEnabled && !selectedTaskDeadlineTime) {
        return { hour: 0, minute: 0 }; // 時刻設定がONで時刻が未選択なら0時を初期値
      }
      return selectedTaskDeadlineTime; // それ以外は選択中の時刻かundefined (TimePickerModalのデフォルトへ)
    }
    if (type === 'periodStart') {
      if (selectedPeriodStartDate && !selectedPeriodStartTime) { // 開始日が設定されていて開始時刻が未選択
        return { hour: 0, minute: 0 };
      }
      return selectedPeriodStartTime;
    }
    return undefined;
  }, [isTaskDeadlineTimeEnabled, selectedTaskDeadlineTime, selectedPeriodStartDate, selectedPeriodStartTime]);


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
        disabled={!selectedTaskDeadlineDate}
      >
        <Text style={[styles.label, !selectedTaskDeadlineDate && { color: mutedTextColor }]}>
          {t('deadline_modal.time_label')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }, !selectedTaskDeadlineDate && { color: mutedTextColor }]}>
            {displayTaskDeadlineTime}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={labelFontSize + 2}
            color={!selectedTaskDeadlineDate ? ((styles.tabContentContainer as ViewStyle)?.backgroundColor || mutedTextColor) as string : mutedTextColor}
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
        disabled={!isPeriodSettingEnabled}
      >
        <Text style={[styles.label, !isPeriodSettingEnabled && { color: disabledTextColor }]}>
          {t('deadline_modal.start_date_label')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }, !isPeriodSettingEnabled && { color: disabledTextColor }]}>
            {displayPeriodStartDate}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={labelFontSize + 2}
            color={!isPeriodSettingEnabled ? ((styles.tabContentContainer as ViewStyle)?.backgroundColor || disabledTextColor) as string : mutedTextColor}
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
        visible={isPeriodStartDatePickerVisible}
        initialDate={selectedPeriodStartDate || todayString}
        onClose={handlePeriodStartDatePickerClose}
        onConfirm={handlePeriodStartDateConfirm}
        onClear={handlePeriodStartDateClear}
        clearButtonText={t('common.clear_start_date')}
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
        prevProps.selectedTaskDeadlineDate === nextProps.selectedTaskDeadlineDate &&
        prevProps.isTaskDeadlineTimeEnabled === nextProps.isTaskDeadlineTimeEnabled &&
        prevProps.selectedTaskDeadlineTime?.hour === nextProps.selectedTaskDeadlineTime?.hour &&
        prevProps.selectedTaskDeadlineTime?.minute === nextProps.selectedTaskDeadlineTime?.minute &&
        prevProps.isPeriodSettingEnabled === nextProps.isPeriodSettingEnabled &&
        prevProps.selectedPeriodStartDate === nextProps.selectedPeriodStartDate &&
        prevProps.selectedPeriodStartTime?.hour === nextProps.selectedPeriodStartTime?.hour &&
        prevProps.selectedPeriodStartTime?.minute === nextProps.selectedPeriodStartTime?.minute &&
        prevProps.updateSettings === nextProps.updateSettings &&
        prevProps.showErrorAlert === nextProps.showErrorAlert
    );
};

export const DateSelectionTab = React.memo(DateSelectionTabMemo, areDateSelectionTabPropsEqual);