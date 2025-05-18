// app/features/add/components/DeadlineSettingModal/RepeatTab.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Modal, Pressable, Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Switch } from 'react-native-elements';
import { CalendarUtils, LocaleConfig } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { isEqual } from 'lodash';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/hooks/ThemeContext';
import type {
    SpecificRepeatTabProps,
    RepeatFrequency,
    DeadlineModalTranslationKey,
    CommonTranslationKey,
    DeadlineSettings,
    DeadlineTime,
    AmountAndUnit,
    DurationUnit,
    CustomIntervalUnit,
} from './types';
import { DatePickerModal } from './DatePickerModal';
import { TimePickerModal } from './TimePickerModal';
import { DurationPickerModal } from './DurationPickerModal';
import { CustomIntervalModal } from './CustomIntervalModal';


const todayString = CalendarUtils.getCalendarDateString(new Date());

const formatTimeToDisplay = (time: DeadlineTime, t: (key: string, options?: any) => string): string => {
    const hour24 = time.hour;
    const ampmKey = (hour24 < 12 || hour24 === 24 || hour24 === 0) ? 'am' : 'pm';
    const ampm = t(`common.${ampmKey}`);
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    return `${ampm} ${hour12}:${String(time.minute).padStart(2, '0')}`;
};

const formatDateToDisplay = (dateString: string | undefined, t: (key: string, options?: any) => string, defaultText?: string): string => {
    if (!dateString) return defaultText || t('common.select');
    return dateString;
};

const formatDurationToDisplay = (duration: AmountAndUnit | undefined, t: (key: string, options?: any) => string): string => {
    if (!duration || !duration.amount || !duration.unit) {
        return t('common.not_set');
    }
    const unitKeyMap: Record<DurationUnit, CommonTranslationKey> = {
        minutes: 'minutes_unit_after',
        hours: 'hours_unit_after',
        days: 'days_unit_after',
        months: 'months_unit_after',
        years: 'years_unit_after',
    };
    const unitStr = t(`common.${unitKeyMap[duration.unit]}`);
    return `${duration.amount}${unitStr}`;
};

const formatCustomIntervalToDisplay = (
    value: number | undefined,
    unit: CustomIntervalUnit | undefined,
    t: (key: string, options?: any) => string
): string => {
    if (value === undefined || unit === undefined || value <=0) {
        return t('deadline_modal.interval_not_set');
    }
    if (unit === 'hours') {
        return t('deadline_modal.every_x_hours', { count: value });
    }
    if (unit === 'days') {
        return t('deadline_modal.every_x_days', { count: value });
    }
    return t('deadline_modal.interval_not_set');
};


const frequencyOptions: { labelKey: Extract<DeadlineModalTranslationKey, 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>; value: RepeatFrequency }[] = [
  { labelKey: 'daily', value: 'daily' },
  { labelKey: 'weekly', value: 'weekly' },
  { labelKey: 'monthly', value: 'monthly' },
  { labelKey: 'yearly', value: 'yearly' },
  { labelKey: 'custom', value: 'custom' },
];

const weekdayKeys: { key: Extract<CommonTranslationKey, 'sun_short' | 'mon_short' | 'tue_short' | 'wed_short' | 'thu_short' | 'fri_short' | 'sat_short'>; dayIndex: number }[] = [
  { key: 'sun_short', dayIndex: 0 },
  { key: 'mon_short', dayIndex: 1 },
  { key: 'tue_short', dayIndex: 2 },
  { key: 'wed_short', dayIndex: 3 },
  { key: 'thu_short', dayIndex: 4 },
  { key: 'fri_short', dayIndex: 5 },
  { key: 'sat_short', dayIndex: 6 },
];


const RepeatTabMemo: React.FC<SpecificRepeatTabProps> = ({ styles, settings, updateSettings, updateFullSettings, showErrorAlert }) => {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { t, i18n } = useTranslation();
  const isJapanese = i18n.language.startsWith('ja');

  const [isFrequencyPickerVisible, setFrequencyPickerVisible] = useState(false);
  const [isRepeatStartDatePickerVisible, setRepeatStartDatePickerVisible] = useState(false);
  const [isRepeatEndDatePickerVisible, setRepeatEndDatePickerVisible] = useState(false);
  const [isTaskStartTimePickerVisible, setTaskStartTimePickerVisible] = useState(false);
  const [isDurationPickerVisible, setDurationPickerVisible] = useState(false);
  const [isCustomIntervalModalVisible, setCustomIntervalModalVisible] = useState(false);


  const currentFrequency = settings.repeatFrequency;
  const currentRepeatStartDate = settings.repeatStartDate;
  const currentTaskStartTime = settings.taskStartTime;
  const currentIsTaskStartTimeEnabled = settings.isTaskStartTimeEnabled ?? false;
  const currentTaskDuration = settings.taskDuration;
  const currentDaysOfWeek = settings.repeatDaysOfWeek ?? weekdayKeys.reduce((acc, curr) => ({ ...acc, [curr.dayIndex]: false }), {});
  const currentExcludeHolidays = settings.isExcludeHolidays ?? false;
  const currentRepeatEndsDate = settings.repeatEnds?.date;
  const currentCustomIntervalValue = settings.customIntervalValue;
  const currentCustomIntervalUnit = settings.customIntervalUnit;


  const switchTrackColorTrue = isDark ? '#30D158' : '#34C759';
  const switchTrackColorFalse = isDark ? '#2C2C2E' : '#E9E9EA';
  const switchThumbColorValue = '#FFFFFF';
  const switchTrackBorderColorFalse = isDark ? '#555557' : '#ADADAF';


  const handleFrequencyChange = useCallback((freq: RepeatFrequency) => {
    const newSettingsUpdate: Partial<DeadlineSettings> = { repeatFrequency: freq };
    if (freq === 'weekly') {
        const anyDaySelected = Object.values(settings.repeatDaysOfWeek || {}).some(v => v);
        if (!anyDaySelected) {
            newSettingsUpdate.repeatDaysOfWeek = weekdayKeys.reduce((acc, curr) => {
                acc[curr.dayIndex] = curr.dayIndex !== 0 && curr.dayIndex !== 6;
                return acc;
            }, {} as Record<number, boolean>);
        }
    }
    if (freq && !currentIsTaskStartTimeEnabled) {
        newSettingsUpdate.isTaskStartTimeEnabled = true;
        if (!currentTaskStartTime) {
            newSettingsUpdate.taskStartTime = { hour: 9, minute: 0 };
        }
    } else if (!freq) {
        newSettingsUpdate.isTaskStartTimeEnabled = false;
        newSettingsUpdate.taskStartTime = undefined;
        newSettingsUpdate.taskDuration = undefined;
        newSettingsUpdate.customIntervalValue = undefined;
        newSettingsUpdate.customIntervalUnit = undefined;
    }

    if (freq !== 'custom') {
        newSettingsUpdate.customIntervalValue = undefined;
        newSettingsUpdate.customIntervalUnit = undefined;
    } else {
        if (!currentCustomIntervalValue || !currentCustomIntervalUnit) {
            newSettingsUpdate.customIntervalValue = 1;
            newSettingsUpdate.customIntervalUnit = 'days';
        }
    }

    updateFullSettings(newSettingsUpdate);
    setFrequencyPickerVisible(false);
  }, [updateFullSettings, settings.repeatDaysOfWeek, currentIsTaskStartTimeEnabled, currentTaskStartTime, currentCustomIntervalValue, currentCustomIntervalUnit]);

  const toggleWeekday = useCallback((dayIndex: number) => {
    const currentSelection = settings.repeatDaysOfWeek || {};
    const newDays = { ...currentSelection, [dayIndex]: !currentSelection[dayIndex] };
    updateSettings('repeatDaysOfWeek', newDays);
  }, [settings.repeatDaysOfWeek, updateSettings]);

  const handleExcludeHolidaysChange = useCallback((value: boolean) => {
    updateSettings('isExcludeHolidays', value);
  }, [updateSettings]);


  useEffect(() => {
    const lang = i18n.language.split('-')[0];
    if (LocaleConfig.locales[lang]) {
        LocaleConfig.defaultLocale = lang;
    } else if (LocaleConfig.locales['en']) {
        LocaleConfig.defaultLocale = 'en';
    } else {
        LocaleConfig.defaultLocale = '';
    }
  }, [i18n.language]);


  const handleFrequencyPickerPress = useCallback(() => setFrequencyPickerVisible(true), []);
  const handleRepeatStartDatePickerPress = useCallback(() => setRepeatStartDatePickerVisible(true), []);
  const handleRepeatEndDatePickerPress = useCallback(() => setRepeatEndDatePickerVisible(true), []);
  const handleTaskStartTimePickerPress = useCallback(() => setTaskStartTimePickerVisible(true), []);
  const handleDurationPickerPress = useCallback(() => {
    if (currentIsTaskStartTimeEnabled) {
        setDurationPickerVisible(true);
    }
  }, [currentIsTaskStartTimeEnabled]);
  const handleCustomIntervalModalPress = useCallback(() => setCustomIntervalModalVisible(true), []);


  const handleRepeatStartDatePickerClose = useCallback(() => setRepeatStartDatePickerVisible(false), []);
  const handleRepeatEndDatePickerClose = useCallback(() => setRepeatEndDatePickerVisible(false), []);
  const handleTaskStartTimePickerClose = useCallback(() => setTaskStartTimePickerVisible(false), []);
  const handleDurationPickerClose = useCallback(() => setDurationPickerVisible(false), []);
  const handleCustomIntervalModalClose = useCallback(() => setCustomIntervalModalVisible(false), []);


  const handleRepeatStartDateConfirm = useCallback((newDate: string) => {
    updateSettings('repeatStartDate', newDate);
    setRepeatStartDatePickerVisible(false);
  }, [updateSettings]);

  const handleRepeatEndDateConfirm = useCallback((newDate: string) => {
    updateSettings('repeatEnds', { type: 'on_date', date: newDate });
    setRepeatEndDatePickerVisible(false);
  }, [updateSettings]);

  const handleRepeatEndDateClear = useCallback(() => {
    updateSettings('repeatEnds', undefined);
    setRepeatEndDatePickerVisible(false);
  }, [updateSettings]);

  const handleTaskStartTimeConfirm = useCallback((newTime: DeadlineTime) => {
    updateFullSettings({ taskStartTime: newTime, isTaskStartTimeEnabled: true });
    setTaskStartTimePickerVisible(false);
  }, [updateFullSettings]);

  const handleTaskStartTimeClear = useCallback(() => {
    updateFullSettings({
        taskStartTime: undefined,
        isTaskStartTimeEnabled: false,
        taskDuration: undefined
    });
    setTaskStartTimePickerVisible(false);
  }, [updateFullSettings]);

  const handleDurationConfirm = useCallback((newDuration: AmountAndUnit) => {
    updateSettings('taskDuration', newDuration);
    setDurationPickerVisible(false);
  }, [updateSettings]);

  const handleDurationClear = useCallback(() => {
    updateSettings('taskDuration', undefined);
    setDurationPickerVisible(false);
  }, [updateSettings]);

  const handleCustomIntervalConfirm = useCallback((value: number, unit: CustomIntervalUnit) => {
    updateFullSettings({ customIntervalValue: value, customIntervalUnit: unit });
    setCustomIntervalModalVisible(false);
  }, [updateFullSettings]);


  const displayFrequency = useMemo(() => {
    if (!currentFrequency) return t('common.select');
    const option = frequencyOptions.find(opt => opt.value === currentFrequency);
    return option ? t(`deadline_modal.${option.labelKey}` as const) : t('common.select');
  }, [currentFrequency, t]);

  const displayRepeatStartDate = useMemo(() => {
    if (!currentRepeatStartDate) return t('common.not_set');
    const formattedDate = formatDateToDisplay(currentRepeatStartDate, t);
    if (currentRepeatStartDate === todayString) {
      return `${formattedDate} (${t('common.today')})`;
    }
    return formattedDate;
  }, [currentRepeatStartDate, t]);

  const displayTaskStartTime = useMemo(() => {
    if (currentIsTaskStartTimeEnabled && currentTaskStartTime) {
      return formatTimeToDisplay(currentTaskStartTime, t);
    }
    return t('common.select');
  }, [currentIsTaskStartTimeEnabled, currentTaskStartTime, t]);

  const displayTaskDuration = useMemo(() => {
    if (!currentIsTaskStartTimeEnabled) return t('common.not_set');
    return formatDurationToDisplay(currentTaskDuration, t);
  }, [currentTaskDuration, t, currentIsTaskStartTimeEnabled]);

  const displayRepeatEndDate = useMemo(() => {
    return formatDateToDisplay(currentRepeatEndsDate, t, t('common.not_set'));
  }, [currentRepeatEndsDate, t]);

  const displayCustomInterval = useMemo(() => {
    return formatCustomIntervalToDisplay(currentCustomIntervalValue, currentCustomIntervalUnit, t);
  }, [currentCustomIntervalValue, currentCustomIntervalUnit, t]);


  const labelFontSize = typeof styles.label?.fontSize === 'number' ? styles.label.fontSize : 16;
  const mutedTextColor = isDark ? '#A0A0A0' : '#555555';
  const separatorColor = styles.settingRow?.borderColor as string || (isDark ? '#3A3A3C' : '#C6C6C8');

  const sectionHeaderTextStyleWithFallback: TextStyle = styles.sectionHeaderText || {
    fontSize: (styles.label?.fontSize || 16) + 1,
    fontWeight: '600',
    color: isDark ? '#FFFFFF' : '#000000',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: styles.tabContentContainer?.backgroundColor
  };

  const switchContainerBaseStyle: ViewStyle = {
    width: 51,
    height: 31,
    borderRadius: 31 / 2,
    justifyContent: 'center',
    padding: 2,
  };


  return (
    <ScrollView style={styles.tabContentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={sectionHeaderTextStyleWithFallback}>
        {t('deadline_modal.section_task_addition')}
      </Text>

      <TouchableOpacity onPress={handleFrequencyPickerPress} style={styles.settingRow}>
        <Text style={styles.label}>{t('deadline_modal.repeat_frequency')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.pickerText, { marginRight: 4 }]}>
            {displayFrequency}
            </Text>
            <Ionicons name="chevron-forward" size={labelFontSize + 2} color={mutedTextColor} />
        </View>
      </TouchableOpacity>

      {currentFrequency === 'custom' && (
        <TouchableOpacity onPress={handleCustomIntervalModalPress} style={styles.settingRow}>
          <Text style={styles.label}>{t('deadline_modal.custom_interval')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.pickerText, { marginRight: 4 }]}>
              {displayCustomInterval}
            </Text>
            <Ionicons name="chevron-forward" size={labelFontSize + 2} color={mutedTextColor} />
          </View>
        </TouchableOpacity>
      )}


      {currentFrequency && (
        <>
          <TouchableOpacity onPress={handleTaskStartTimePickerPress} style={styles.settingRow}>
            <Text style={styles.label}>{t('deadline_modal.task_start_time_label')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.pickerText, { marginRight: 4 }]}>{displayTaskStartTime}</Text>
              <Ionicons name="chevron-forward" size={labelFontSize + 2} color={mutedTextColor} />
            </View>
          </TouchableOpacity>

          {currentIsTaskStartTimeEnabled && (
            <TouchableOpacity
                onPress={handleDurationPickerPress}
                style={styles.settingRow}
                disabled={!currentIsTaskStartTimeEnabled}
            >
              <Text style={[styles.label, !currentIsTaskStartTimeEnabled && { color: mutedTextColor } ]}>
                {t('deadline_modal.task_duration_label')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.pickerText, { marginRight: 4 }, !currentIsTaskStartTimeEnabled && { color: mutedTextColor }]}>
                    {displayTaskDuration}
                </Text>
                <Ionicons
                    name="chevron-forward"
                    size={labelFontSize + 2}
                    color={!currentIsTaskStartTimeEnabled ? styles.tabContentContainer?.backgroundColor || mutedTextColor : mutedTextColor}
                />
              </View>
            </TouchableOpacity>
          )}

          {isJapanese && (currentFrequency === 'daily' || currentFrequency === 'weekly' || currentFrequency === 'monthly' || currentFrequency === 'yearly') && (
            <View style={styles.exclusionSettingRow}>
              <Text style={styles.label}>
                {t('deadline_modal.exclude_holidays')}
              </Text>
              <View
                style={[
                  switchContainerBaseStyle,
                  {
                    backgroundColor: currentExcludeHolidays ? switchTrackColorTrue : switchTrackColorFalse,
                    borderWidth: 1,
                    borderColor: currentExcludeHolidays ? switchTrackColorTrue : switchTrackBorderColorFalse,
                  }
                ]}
              >
                <Switch
                  value={currentExcludeHolidays}
                  onValueChange={handleExcludeHolidaysChange}
                  thumbColor={switchThumbColorValue}
                  trackColor={{ false: 'transparent', true: 'transparent' }}
                />
              </View>
            </View>
          )}
        </>
      )}

      {currentFrequency && (
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: separatorColor, marginVertical: 10 }} />
      )}

      {currentFrequency && (
        <>
          <Text style={sectionHeaderTextStyleWithFallback}>
            {t('deadline_modal.section_repeat_settings')}
          </Text>

          <TouchableOpacity
            onPress={handleRepeatStartDatePickerPress}
            style={styles.settingRow}
          >
            <Text style={styles.label}>{t('deadline_modal.repeat_start_date_label')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.pickerText, { marginRight: 4 }]}>{displayRepeatStartDate}</Text>
              <Ionicons name="chevron-forward" size={labelFontSize + 2} color={mutedTextColor} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRepeatEndDatePickerPress} style={styles.settingRow}>
              <Text style={styles.label}>{t('deadline_modal.end_repeat_title')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.pickerText, { marginRight: 4 }]}>
                  {displayRepeatEndDate}
              </Text>
              <Ionicons name="chevron-forward" size={labelFontSize + 2} color={mutedTextColor}/>
              </View>
          </TouchableOpacity>

          {currentFrequency === 'weekly' && (
            <>
              <View style={styles.weekdaySelectorContainer}>
                {weekdayKeys.map(({ key, dayIndex }) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.daySelector, currentDaysOfWeek?.[dayIndex] && styles.daySelectorSelected]}
                    onPress={() => toggleWeekday(dayIndex)}
                  >
                    <Text style={[styles.daySelectorText, currentDaysOfWeek?.[dayIndex] && styles.daySelectorTextSelected]}>
                      {t(`common.${key}` as const)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          { (currentFrequency === 'monthly' || currentFrequency === 'yearly') && (
            <View style={{ paddingHorizontal: 16, paddingVertical:10, backgroundColor: (styles.settingRow as ViewStyle)?.backgroundColor }}>
                <Text style={{color: mutedTextColor, fontSize: labelFontSize-2}}>
                    {t(`deadline_modal.${currentFrequency}` as const)} {t('common.settings_not_implemented')}
                </Text>
            </View>
          )}
        </>
      )}

      <Modal visible={isFrequencyPickerVisible} onRequestClose={() => setFrequencyPickerVisible(false)} transparent animationType="fade">
        <Pressable style={styles.calendarOverlay} onPress={() => setFrequencyPickerVisible(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
            {frequencyOptions.map((opt, index) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => handleFrequencyChange(opt.value)}
                style={[
                    styles.modalOptionButton,
                    index === frequencyOptions.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <Text style={[styles.modalOptionText, currentFrequency === opt.value && { color: subColor, fontWeight: 'bold' }]}>
                  {t(`deadline_modal.${opt.labelKey}` as const)}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <TimePickerModal
        visible={isTaskStartTimePickerVisible}
        initialTime={currentTaskStartTime}
        onClose={handleTaskStartTimePickerClose}
        onConfirm={handleTaskStartTimeConfirm}
        onClear={handleTaskStartTimeClear}
      />

      <DurationPickerModal
        visible={isDurationPickerVisible}
        initialDuration={currentTaskDuration}
        onClose={handleDurationPickerClose}
        onConfirm={handleDurationConfirm}
        onClear={handleDurationClear}
      />

      <DatePickerModal
        visible={isRepeatStartDatePickerVisible}
        initialDate={currentRepeatStartDate || todayString}
        onClose={handleRepeatStartDatePickerClose}
        onConfirm={handleRepeatStartDateConfirm}
        onClear={undefined}
        clearButtonText={t('common.clear_date')}
      />

      <DatePickerModal
        visible={isRepeatEndDatePickerVisible}
        initialDate={currentRepeatEndsDate || currentRepeatStartDate || todayString}
        onClose={handleRepeatEndDatePickerClose}
        onConfirm={handleRepeatEndDateConfirm}
        onClear={handleRepeatEndDateClear}
        clearButtonText={t('common.clear_date')}
      />
      <CustomIntervalModal
        visible={isCustomIntervalModalVisible}
        initialValue={currentCustomIntervalValue}
        initialUnit={currentCustomIntervalUnit}
        onClose={handleCustomIntervalModalClose}
        onConfirm={handleCustomIntervalConfirm}
        styles={styles}
        showErrorAlert={showErrorAlert}
      />
    </ScrollView>
  );
};

const areRepeatTabPropsEqual = (
    prevProps: Readonly<SpecificRepeatTabProps>,
    nextProps: Readonly<SpecificRepeatTabProps>
): boolean => {
    return (
        prevProps.styles === nextProps.styles &&
        isEqual(prevProps.settings, nextProps.settings) &&
        prevProps.updateSettings === nextProps.updateSettings &&
        prevProps.updateFullSettings === nextProps.updateFullSettings &&
        prevProps.showErrorAlert === nextProps.showErrorAlert
    );
};

export const RepeatTab = React.memo(RepeatTabMemo, areRepeatTabPropsEqual);