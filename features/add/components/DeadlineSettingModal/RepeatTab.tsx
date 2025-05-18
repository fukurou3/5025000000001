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
} from './types';
import { DatePickerModal } from './DatePickerModal';
import { TimePickerModal } from './TimePickerModal';
import { DurationPickerModal } from './DurationPickerModal';

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
    if (!dateString) return defaultText || t('common.select', '選択');
    return dateString;
};

const formatDurationToDisplay = (duration: AmountAndUnit | undefined, t: (key: string, options?: any) => string): string => {
    if (!duration || !duration.amount || !duration.unit) {
        return t('common.not_set', '未設定');
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


const RepeatTabMemo: React.FC<SpecificRepeatTabProps> = ({ styles, settings, updateSettings, updateFullSettings }) => {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { t, i18n } = useTranslation();
  const isJapanese = i18n.language.startsWith('ja');

  const [isFrequencyPickerVisible, setFrequencyPickerVisible] = useState(false);
  const [isRepeatStartDatePickerVisible, setRepeatStartDatePickerVisible] = useState(false);
  const [isRepeatEndDatePickerVisible, setRepeatEndDatePickerVisible] = useState(false);
  const [isTaskStartTimePickerVisible, setTaskStartTimePickerVisible] = useState(false);
  const [isDurationPickerVisible, setDurationPickerVisible] = useState(false);

  const currentFrequency = settings.repeatFrequency;
  const currentRepeatStartDate = settings.repeatStartDate;
  const currentTaskStartTime = settings.taskStartTime;
  const currentIsTaskStartTimeEnabled = settings.isTaskStartTimeEnabled ?? false;
  const currentTaskDuration = settings.taskDuration;
  const currentDaysOfWeek = settings.repeatDaysOfWeek ?? weekdayKeys.reduce((acc, curr) => ({ ...acc, [curr.dayIndex]: false }), {});
  const currentExcludeHolidays = settings.isExcludeHolidays ?? false;
  const currentRepeatEndsDate = settings.repeatEnds?.date;

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
    // 繰り返し頻度を設定したら、追加時刻もデフォルトで有効にする (任意で無効化も可能)
    if (freq && !currentIsTaskStartTimeEnabled) {
        newSettingsUpdate.isTaskStartTimeEnabled = true;
        if (!currentTaskStartTime) { // もし既存の時刻がなければデフォルトをセット
            newSettingsUpdate.taskStartTime = { hour: 9, minute: 0 };
        }
    } else if (!freq) { // 繰り返し頻度を解除したら追加時刻と期限もクリア
        newSettingsUpdate.isTaskStartTimeEnabled = false;
        newSettingsUpdate.taskStartTime = undefined;
        newSettingsUpdate.taskDuration = undefined;
    }
    updateFullSettings(newSettingsUpdate);
    setFrequencyPickerVisible(false);
  }, [updateFullSettings, settings.repeatDaysOfWeek, currentIsTaskStartTimeEnabled, currentTaskStartTime]);

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
    // 追加時刻が有効な場合のみ期限ピッカーを開く
    if (currentIsTaskStartTimeEnabled) {
        setDurationPickerVisible(true);
    }
    // 必要であれば、ここでユーザーに「追加時刻を設定してください」というアラートを出すことも可能
  }, [currentIsTaskStartTimeEnabled]);

  const handleRepeatStartDatePickerClose = useCallback(() => setRepeatStartDatePickerVisible(false), []);
  const handleRepeatEndDatePickerClose = useCallback(() => setRepeatEndDatePickerVisible(false), []);
  const handleTaskStartTimePickerClose = useCallback(() => setTaskStartTimePickerVisible(false), []);
  const handleDurationPickerClose = useCallback(() => setDurationPickerVisible(false), []);


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
    // 追加時刻をクリアしたら、タスクの期限もクリアする
    updateFullSettings({
        taskStartTime: undefined,
        isTaskStartTimeEnabled: false,
        taskDuration: undefined // ★ 期限もクリア
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


  const displayFrequency = useMemo(() => {
    if (!currentFrequency) return t('common.select', '選択');
    const option = frequencyOptions.find(opt => opt.value === currentFrequency);
    return option ? t(`deadline_modal.${option.labelKey}` as const, option.value) : t('common.select', '選択');
  }, [currentFrequency, t]);

  const displayRepeatStartDate = useMemo(() => {
    if (!currentRepeatStartDate) return t('common.not_set');
    const formattedDate = formatDateToDisplay(currentRepeatStartDate, t);
    if (currentRepeatStartDate === todayString) {
      return `${formattedDate} (${t('common.today', '今日')})`;
    }
    return formattedDate;
  }, [currentRepeatStartDate, t]);

  const displayTaskStartTime = useMemo(() => {
    if (currentIsTaskStartTimeEnabled && currentTaskStartTime) {
      return formatTimeToDisplay(currentTaskStartTime, t);
    }
    return t('common.select', '選択');
  }, [currentIsTaskStartTimeEnabled, currentTaskStartTime, t]);

  const displayTaskDuration = useMemo(() => {
    // 追加時刻が有効な場合のみ期限を表示（そうでなければ「未設定」と同じ扱い）
    if (!currentIsTaskStartTimeEnabled) return t('common.not_set', '未設定');
    return formatDurationToDisplay(currentTaskDuration, t);
  }, [currentTaskDuration, t, currentIsTaskStartTimeEnabled]);

  const displayRepeatEndDate = useMemo(() => {
    return formatDateToDisplay(currentRepeatEndsDate, t, t('common.not_set', '未設定'));
  }, [currentRepeatEndsDate, t]);

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
        {t('deadline_modal.section_task_addition', 'タスク追加')}
      </Text>

      <TouchableOpacity onPress={handleFrequencyPickerPress} style={styles.settingRow}>
        <Text style={styles.label}>{t('deadline_modal.repeat_frequency', '繰り返し頻度')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.pickerText, { marginRight: 4 }]}>
            {displayFrequency}
            </Text>
            <Ionicons name="chevron-forward" size={labelFontSize + 2} color={mutedTextColor} />
        </View>
      </TouchableOpacity>

      {/* 繰り返し頻度が設定されている場合のみ以下の設定項目を表示 */}
      {currentFrequency && (
        <>
          <TouchableOpacity onPress={handleTaskStartTimePickerPress} style={styles.settingRow}>
            <Text style={styles.label}>{t('deadline_modal.task_start_time_label', '追加時刻')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.pickerText, { marginRight: 4 }]}>{displayTaskStartTime}</Text>
              <Ionicons name="chevron-forward" size={labelFontSize + 2} color={mutedTextColor} />
            </View>
          </TouchableOpacity>

          {/* 追加時刻が有効な場合のみ「期限」の行を表示・操作可能にする */}
          {currentIsTaskStartTimeEnabled && (
            <TouchableOpacity
                onPress={handleDurationPickerPress}
                style={styles.settingRow}
                disabled={!currentIsTaskStartTimeEnabled} // disabled属性も活用
            >
              <Text style={[styles.label, !currentIsTaskStartTimeEnabled && { color: mutedTextColor } ]}>
                {t('deadline_modal.task_duration_label', '期限')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.pickerText, { marginRight: 4 }, !currentIsTaskStartTimeEnabled && { color: mutedTextColor }]}>
                    {displayTaskDuration}
                </Text>
                <Ionicons
                    name="chevron-forward"
                    size={labelFontSize + 2}
                    color={!currentIsTaskStartTimeEnabled ? styles.tabContentContainer?.backgroundColor || mutedTextColor : mutedTextColor} // 非アクティブ時は背景色と同化させるか、より薄い色に
                />
              </View>
            </TouchableOpacity>
          )}

          {isJapanese && (currentFrequency === 'daily' || currentFrequency === 'weekly' || currentFrequency === 'monthly' || currentFrequency === 'yearly') && (
            <View style={styles.exclusionSettingRow}>
              <Text style={styles.label}>
                {t('deadline_modal.exclude_holidays', '祝日を除く')}
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
            {t('deadline_modal.section_repeat_settings', '繰り返し')}
          </Text>

          <TouchableOpacity
            onPress={handleRepeatStartDatePickerPress}
            style={styles.settingRow}
          >
            <Text style={styles.label}>{t('deadline_modal.repeat_start_date_label', '開始日')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.pickerText, { marginRight: 4 }]}>{displayRepeatStartDate}</Text>
              <Ionicons name="chevron-forward" size={labelFontSize + 2} color={mutedTextColor} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRepeatEndDatePickerPress} style={styles.settingRow}>
              <Text style={styles.label}>{t('deadline_modal.end_repeat_title', '終了日')}</Text>
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

          { (currentFrequency === 'monthly' || currentFrequency === 'yearly' || currentFrequency === 'custom') && (
            <View style={{ paddingHorizontal: 16, paddingVertical:10, backgroundColor: (styles.settingRow as ViewStyle)?.backgroundColor }}>
                <Text style={{color: mutedTextColor, fontSize: labelFontSize-2}}>
                    {t(`deadline_modal.${currentFrequency}` as const)} {t('common.settings_not_implemented', 'の詳細設定は現在実装されていません。')}
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
                  {t(`deadline_modal.${opt.labelKey}` as const, opt.value)}
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
        clearButtonText={t('common.clear_date', '日付をクリア')}
      />

      <DatePickerModal
        visible={isRepeatEndDatePickerVisible}
        initialDate={currentRepeatEndsDate || currentRepeatStartDate || todayString}
        onClose={handleRepeatEndDatePickerClose}
        onConfirm={handleRepeatEndDateConfirm}
        onClear={handleRepeatEndDateClear}
        clearButtonText={t('common.clear_date', '日付をクリア')}
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
        prevProps.updateFullSettings === nextProps.updateFullSettings
    );
};

export const RepeatTab = React.memo(RepeatTabMemo, areRepeatTabPropsEqual);