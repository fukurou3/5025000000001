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

const todayString = CalendarUtils.getCalendarDateString(new Date()); // 今日を表す文字列を定義

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
  selectedDate,
  selectedTime,
  isTimeEnabled,
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
    updateSettings('date', newDate);
    setStartDatePickerVisible(false);
  }, [updateSettings]);

  const handleStartDateClear = useCallback(() => {
    const now = new Date();
    // 開始日をクリアする場合、デフォルトの今日の日付と現在の時刻に戻す
    updateSettings('date', todayString);
    updateSettings('isTimeEnabled', true);
    updateSettings('time', { hour: now.getHours(), minute: now.getMinutes() });

    // 終了日・時刻もクリアするかどうかは要件によるが、ここでは一旦クリアしない
    // もし開始日クリア時に終了日もリセットするなら以下のコメントを外す
    // updateSettings('endDate', undefined);
    // updateSettings('isEndTimeEnabled', false);
    // updateSettings('endTime', undefined);
    setStartDatePickerVisible(false);
  }, [updateSettings]);

  const handleStartDatePickerClose = useCallback(() => {
    setStartDatePickerVisible(false);
  }, []);

  const handleStartTimeSectionPress = useCallback(() => {
    if (!selectedDate) {
        showErrorAlert(t('deadline_modal.date_missing_for_time_alert_message'));
        return;
    }
    setStartTimePickerVisible(true);
  }, [selectedDate, showErrorAlert, t]);

  const handleStartTimeConfirm = useCallback((newTime: DeadlineTime) => {
    updateSettings('time', newTime);
    updateSettings('isTimeEnabled', true);
    setStartTimePickerVisible(false);
  }, [updateSettings]);

  const handleStartTimeClear = useCallback(() => {
    // 開始時刻をクリアする場合、時刻を現在の時刻に戻し、有効状態は維持
    const now = new Date();
    updateSettings('time', { hour: now.getHours(), minute: now.getMinutes() });
    updateSettings('isTimeEnabled', true); // 常に有効とするか、falseにするかは要件次第
    setStartTimePickerVisible(false);
  }, [updateSettings]);

  const handleStartTimePickerClose = useCallback(() => {
    setStartTimePickerVisible(false);
  }, []);

  const handleEndDateSectionPress = useCallback(() => {
    if (!selectedDate) {
        showErrorAlert(t('deadline_modal.start_date_required_for_end_date'));
        return;
    }
    setEndDatePickerVisible(true);
  }, [selectedDate, showErrorAlert, t]);

  const handleEndDateConfirm = useCallback((newDate: string) => {
    if (selectedDate && newDate < selectedDate) {
        showErrorAlert(t('deadline_modal.end_date_before_start_date_alert_message'));
        return;
    }
    updateSettings('endDate', newDate);
    setEndDatePickerVisible(false);
  }, [updateSettings, selectedDate, showErrorAlert, t]);

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
    if (!selectedDate) return t('common.select');
    const formattedDate = formatDateToDisplay(selectedDate, t);
    if (selectedDate === todayString) { // selectedDate が今日かどうかを判定
      return `${formattedDate} (${t('common.today')})`;
    }
    return formattedDate;
  }, [selectedDate, t]);

  const displayStartTime = useMemo(() => {
    if (isTimeEnabled && selectedTime) return formatTimeToDisplay(selectedTime, t);
    // isTimeEnabled が false でも、開始時刻はデフォルトで現在の時刻なので、何かしら表示する
    // もし isTimeEnabled が false なら「未設定」や「選択」と表示したい場合は要調整
    if (selectedTime) return formatTimeToDisplay(selectedTime,t); // isTimeEnabled が false でも時刻データがあれば表示
    return t('common.select');
  }, [isTimeEnabled, selectedTime, t]);

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
        return selectedTime || currentTime;
    }
    if (type === 'end') {
        return selectedEndTime || currentTime;
    }
    return currentTime;
  };
  
  const getInitialDateForStartDatePicker = () => {
    return selectedDate || todayString;
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
        disabled={!selectedDate} // 開始日が選択されていなければ時刻選択は不可
      >
        <Text style={[styles.label, !selectedDate && { color: mutedTextColor }]}>
          {t('deadline_modal.specify_time')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }, !selectedDate && { color: mutedTextColor }]}>
            {displayStartTime}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={labelFontSize + 2}
            color={!selectedDate ? ((styles.tabContentContainer as ViewStyle)?.backgroundColor || mutedTextColor) as string : mutedTextColor}
           />
        </View>
      </TouchableOpacity>

      <View style={dateSectionSeparatorStyle} />

      <Text style={sectionHeaderTextStyle}>{t('deadline_modal.end_date_section_title')}</Text>
      <TouchableOpacity
        onPress={handleEndDateSectionPress}
        style={styles.settingRow}
        disabled={!selectedDate} // 開始日が選択されていなければ終了日選択は不可（または要件により変更）
      >
        <Text style={[styles.label, !selectedDate && { color: mutedTextColor }]}>
          {t('deadline_modal.end_date')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4 }, !selectedDate && { color: mutedTextColor }]}>
            {displayEndDate}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={labelFontSize + 2}
            color={!selectedDate ? ((styles.tabContentContainer as ViewStyle)?.backgroundColor || mutedTextColor) as string : mutedTextColor}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleEndTimeSectionPress}
        style={styles.settingRow}
        disabled={!selectedEndDate} // 終了日が選択されていなければ終了時刻選択は不可
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
        onClear={handleStartDateClear} // 開始日はクリア時に今日に戻す
        clearButtonText={t('common.clear_date')} // ボタン文言は汎用的でよいか、別途「今日に戻す」などにするか検討
      />

      <TimePickerModal
        visible={isStartTimePickerVisible}
        initialTime={getInitialTimeForPicker('start')}
        onClose={handleStartTimePickerClose}
        onConfirm={handleStartTimeConfirm}
        onClear={handleStartTimeClear} // 開始時刻はクリア時に現在時刻に戻す
      />

      <DatePickerModal
        visible={isEndDatePickerVisible}
        initialDate={selectedEndDate || selectedDate || todayString}
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
        prevProps.selectedDate === nextProps.selectedDate &&
        prevProps.isTimeEnabled === nextProps.isTimeEnabled &&
        prevProps.selectedTime?.hour === nextProps.selectedTime?.hour &&
        prevProps.selectedTime?.minute === nextProps.selectedTime?.minute &&
        prevProps.selectedEndDate === nextProps.selectedEndDate &&
        prevProps.isEndTimeEnabled === nextProps.isEndTimeEnabled &&
        prevProps.selectedEndTime?.hour === nextProps.selectedEndTime?.hour &&
        prevProps.selectedEndTime?.minute === nextProps.selectedEndTime?.minute &&
        prevProps.updateSettings === nextProps.updateSettings &&
        prevProps.showErrorAlert === nextProps.showErrorAlert
    );
};

export const DateSelectionTab = React.memo(DateSelectionTabMemo, areDateSelectionTabPropsEqual);