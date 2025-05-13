// app/features/add/components/DeadlineSettingModal/RepeatTab.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Switch, Modal, Pressable, TextInput, Platform } from 'react-native';
import { Calendar, CalendarUtils, CalendarProps } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/hooks/ThemeContext';
import type {
    RepeatTabProps,
    RepeatFrequency,
    RepeatEnds,
    DeadlineModalTranslationKey,
    CommonTranslationKey,
    CalendarFontWeight
} from './types';

const todayString = CalendarUtils.getCalendarDateString(new Date());

const frequencyOptions: { labelKey: Extract<DeadlineModalTranslationKey, 'no_repeat' | 'daily' | 'weekly' | 'monthly' | 'yearly'>; value: RepeatFrequency }[] = [
  { labelKey: 'no_repeat', value: 'none' },
  { labelKey: 'daily', value: 'daily' },
  { labelKey: 'weekly', value: 'weekly' },
  { labelKey: 'monthly', value: 'monthly' },
  { labelKey: 'yearly', value: 'yearly' },
];

const repeatEndOptions: { labelKey: Extract<DeadlineModalTranslationKey, 'ends_never' | 'ends_on_date' | 'ends_after_occurrences'>; value: RepeatEnds['type'] }[] = [
  { labelKey: 'ends_never', value: 'never'},
  { labelKey: 'ends_on_date', value: 'on_date'},
  { labelKey: 'ends_after_occurrences', value: 'after_occurrences'},
];

const dayNameKeys: Extract<CommonTranslationKey, 'sun_short' | 'mon_short' | 'tue_short' | 'wed_short' | 'thu_short' | 'fri_short' | 'sat_short'>[] =
  ['sun_short', 'mon_short', 'tue_short', 'wed_short', 'thu_short', 'fri_short', 'sat_short'];


const RepeatTabMemo: React.FC<RepeatTabProps> = ({ styles, settings, updateSettings, updateFullSettings }) => {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [occurrences, setOccurrences] = useState<string>(settings.repeatEnds?.occurrences?.toString() || '1');

  const currentFrequency = settings.repeatFrequency ?? 'none';
  const currentInterval = settings.repeatInterval ?? 1;
  const currentDaysOfWeek = settings.repeatDaysOfWeek ?? { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };
  const currentExcludeHolidays = settings.isExcludeHolidays ?? false;
  const currentRepeatEnds = settings.repeatEnds ?? { type: 'never' };

  const handleFrequencyChange = useCallback((freq: RepeatFrequency) => {
    const newSettings: Partial<typeof settings> = { repeatFrequency: freq };
    if (freq === 'none') {
      newSettings.repeatInterval = undefined;
      newSettings.repeatDaysOfWeek = undefined;
      newSettings.isExcludeHolidays = undefined;
      newSettings.repeatEnds = { type: 'never' };
    } else if (freq !== 'weekly') {
        newSettings.repeatDaysOfWeek = undefined;
    }
    if (freq === 'daily' || freq === 'weekly') {
        if (!settings.repeatInterval) newSettings.repeatInterval = 1;
    } else {
        newSettings.repeatInterval = undefined;
    }
    updateFullSettings(newSettings);
  }, [updateFullSettings, settings.repeatInterval]);

  const handleIntervalChange = useCallback((text: string) => {
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) {
      updateSettings('repeatInterval', num);
    } else if (text === '') {
      updateSettings('repeatInterval', 1);
    }
  }, [updateSettings]);

  const toggleRepeatDay = useCallback((dayIndex: number) => {
    const newDays = { ...(currentDaysOfWeek || {}), [dayIndex]: !currentDaysOfWeek?.[dayIndex] };
    updateSettings('repeatDaysOfWeek', newDays);
  }, [currentDaysOfWeek, updateSettings]);

  const handleRepeatEndTypeChange = useCallback((type: RepeatEnds['type']) => {
    const newEnds: RepeatEnds = { type };
    if (type === 'on_date') {
        newEnds.date = currentRepeatEnds?.date || todayString;
    }
    if (type === 'after_occurrences') {
        newEnds.occurrences = currentRepeatEnds?.occurrences || 1;
        setOccurrences((currentRepeatEnds?.occurrences || 1).toString());
    }
    updateSettings('repeatEnds', newEnds);
  }, [currentRepeatEnds, updateSettings]);

  const handleOccurrencesChange = useCallback((text: string) => {
    setOccurrences(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) {
      updateSettings('repeatEnds', { ...(currentRepeatEnds || { type: 'after_occurrences' }), occurrences: num, type: 'after_occurrences' });
    }
  }, [currentRepeatEnds, updateSettings]);

  const handleShowEndDatePicker = useCallback(() => setShowEndDatePicker(true), []);
  const handleHideEndDatePicker = useCallback(() => setShowEndDatePicker(false), []);

  const onEndDayPress = useCallback((day: { dateString: string }) => {
    updateSettings('repeatEnds', { ...currentRepeatEnds, date: day.dateString, type: 'on_date' });
    setShowEndDatePicker(false);
  },[currentRepeatEnds, updateSettings]);

  const clearRepeatEndDate = useCallback(() => {
    updateSettings('repeatEnds', { ...currentRepeatEnds, date: undefined });
    setShowEndDatePicker(false);
  }, [currentRepeatEnds, updateSettings]);

  const handleExcludeHolidaysChange = useCallback((value: boolean) => {
    updateSettings('isExcludeHolidays', value);
  }, [updateSettings]);


  const intervalUnitTranslationKey = useMemo((): DeadlineModalTranslationKey | '' => {
    if (currentFrequency === 'daily') return 'every_x_days';
    if (currentFrequency === 'weekly') return 'every_x_weeks';
    return '';
  }, [currentFrequency]);

  const calendarTheme = useMemo((): CalendarProps['theme'] => ({
    backgroundColor: isDark ? '#000000' : '#FFFFFF',
    calendarBackground: isDark ? '#000000' : '#FFFFFF',
    textSectionTitleColor: isDark ? '#A0A0A0' : subColor,
    selectedDayBackgroundColor: subColor,
    selectedDayTextColor: isDark ? '#000' : '#FFFFFF',
    todayTextColor: subColor,
    dayTextColor: isDark ? '#FFFFFF' : '#2d4150',
    textDisabledColor: isDark ? '#555555' : '#d9e1e8',
    arrowColor: subColor,
    monthTextColor: subColor,
    indicatorColor: subColor,
    textDayFontWeight: '400' as CalendarFontWeight,
    textMonthFontWeight: 'bold' as CalendarFontWeight,
    textDayHeaderFontWeight: '500' as CalendarFontWeight,
    textDayFontSize: 15,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 13,
   }), [isDark, subColor]);

   const endPickerMarkedDates = useMemo(() => ({
        [currentRepeatEnds?.date || '']: { selected: true, selectedColor: subColor },
   }), [currentRepeatEnds?.date, subColor]);

  const handleFrequencyPickerPress = useCallback(() => {
    console.log("Frequency picker pressed. Implement selection UI.");
  }, []);


  return (
    <ScrollView style={styles.tabContentContainer} contentContainerStyle={{ paddingBottom: 20}}>
      <View style={styles.settingRow}>
        <Text style={styles.label}>{t('deadline_modal.repeat_frequency')}</Text>
        <TouchableOpacity onPress={handleFrequencyPickerPress}>
            <Text style={styles.pickerText}>{t(`deadline_modal.${currentFrequency}` as const)}</Text>
        </TouchableOpacity>
      </View>

      {(currentFrequency === 'daily' || currentFrequency === 'weekly') && (
        <View style={styles.settingRow}>
          <Text style={styles.label}>{t('deadline_modal.interval')}</Text>
          <View style={styles.intervalContainer}>
            <TextInput
              style={styles.intervalInput}
              value={currentInterval.toString()}
              onChangeText={handleIntervalChange}
              keyboardType="number-pad"
              maxLength={2}
            />
            {intervalUnitTranslationKey && (
                <Text style={styles.intervalText}>
                {t(`deadline_modal.${intervalUnitTranslationKey}`, { count: currentInterval })}
                </Text>
            )}
          </View>
        </View>
      )}

      {currentFrequency === 'weekly' && (
        <View style={styles.weekDaysContainer}>
          {dayNameKeys.map((dayKey, index) => (
            <TouchableOpacity
              key={dayKey}
              style={[styles.daySelector, currentDaysOfWeek?.[index] && styles.daySelectorSelected]}
              onPress={() => toggleRepeatDay(index)}
            >
              <Text style={[styles.daySelectorText, currentDaysOfWeek?.[index] && styles.daySelectorTextSelected]}>
                {t(`common.${dayKey}` as const)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {(currentFrequency === 'daily' || currentFrequency === 'weekly') && (
        <View style={styles.settingRow}>
          <Text style={styles.label}>{t('deadline_modal.exclude_holidays')}</Text>
          <Switch
            trackColor={{ false: '#767577', true: subColor }}
            thumbColor={currentExcludeHolidays ? (Platform.OS === 'ios' ? '#FFFFFF' : subColor) : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={handleExcludeHolidaysChange}
            value={currentExcludeHolidays}
          />
        </View>
      )}

      {currentFrequency !== 'none' && (
          <>
            <Text style={[styles.label, {paddingHorizontal: 16, paddingTop: 16, paddingBottom:8}]}>{t('deadline_modal.end_repeat_title')}</Text>
            {repeatEndOptions.map(opt => (
                <TouchableOpacity
                    key={opt.value}
                    style={[styles.repeatEndOption, currentRepeatEnds?.type === opt.value && styles.repeatEndOptionSelected]}
                    onPress={() => handleRepeatEndTypeChange(opt.value)}
                >
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Text style={styles.repeatEndText}>{t(`deadline_modal.${opt.labelKey}` as const)}</Text>
                        {opt.value === 'on_date' && currentRepeatEnds?.type === 'on_date' && (
                             <TouchableOpacity onPress={handleShowEndDatePicker}>
                                <Text style={{color: subColor, fontSize: styles.repeatEndText.fontSize}}>{currentRepeatEnds.date || t('common.select')}</Text>
                             </TouchableOpacity>
                        )}
                        {opt.value === 'after_occurrences' && currentRepeatEnds?.type === 'after_occurrences' && (
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <TextInput
                                    style={[styles.intervalInput, {width: 50, marginRight: 4}]}
                                    value={occurrences}
                                    onChangeText={handleOccurrencesChange}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                />
                                <Text style={styles.repeatEndText}>{t('deadline_modal.occurrences_suffix')}</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            ))}
        </>
      )}

      <Modal
        visible={showEndDatePicker}
        transparent
        animationType="fade"
        onRequestClose={handleHideEndDatePicker}
      >
        <Pressable style={styles.calendarOverlay} onPress={handleHideEndDatePicker}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.calendarInModalContainer}>
            <Calendar
              current={currentRepeatEnds?.date || todayString}
              minDate={todayString}
              onDayPress={onEndDayPress}
              markedDates={endPickerMarkedDates}
              theme={calendarTheme}
            />
            <TouchableOpacity
              style={styles.clearRepeatEndDateButton}
              onPress={clearRepeatEndDate}
            >
              <Text style={{ color: subColor, fontSize: styles.label.fontSize }}>{t('common.clear')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};
export const RepeatTab = React.memo(RepeatTabMemo);