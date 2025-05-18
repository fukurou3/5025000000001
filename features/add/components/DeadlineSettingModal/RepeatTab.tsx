// app/features/add/components/DeadlineSettingModal/RepeatTab.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Switch, Modal, Pressable, TextInput, Platform } from 'react-native';
import { Calendar, CalendarUtils, CalendarProps, LocaleConfig } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { isEqual } from 'lodash';

import { useAppTheme } from '@/hooks/ThemeContext';
import type {
    SpecificRepeatTabProps,
    RepeatFrequency,
    RepeatEnds,
    DeadlineModalTranslationKey,
    CommonTranslationKey,
    CalendarFontWeight,
    DeadlineSettings
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


const RepeatTabMemo: React.FC<SpecificRepeatTabProps> = ({ styles, settings, updateSettings, updateFullSettings }) => {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [occurrences, setOccurrences] = useState<string>(settings.repeatEnds?.occurrences?.toString() || '1');
  // 繰り返し頻度選択のためのモーダル表示制御などのstateを追加する (UIライブラリや自作ピッカーによる)
  // const [isFrequencyPickerVisible, setFrequencyPickerVisible] = useState(false);


  const currentFrequency = settings.repeatFrequency ?? 'none';
  const currentInterval = settings.repeatInterval ?? 1;
  const currentDaysOfWeek = settings.repeatDaysOfWeek ?? { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };
  const currentExcludeHolidays = settings.isExcludeHolidays ?? false;
  const currentRepeatEnds = settings.repeatEnds ?? { type: 'never' };

  const handleFrequencyChange = useCallback((freq: RepeatFrequency) => {
    const newSettingsUpdate: Partial<Pick<DeadlineSettings, 'repeatFrequency' | 'repeatInterval' | 'repeatDaysOfWeek' | 'isExcludeHolidays' | 'repeatEnds'>> = { repeatFrequency: freq };

    if (freq === 'none') {
      newSettingsUpdate.repeatInterval = undefined;
      newSettingsUpdate.repeatDaysOfWeek = undefined;
      newSettingsUpdate.isExcludeHolidays = undefined;
      newSettingsUpdate.repeatEnds = { type: 'never' };
    } else if (freq !== 'weekly') {
        newSettingsUpdate.repeatDaysOfWeek = undefined;
    }
    if (freq === 'daily' || freq === 'weekly') {
        if (!settings.repeatInterval) newSettingsUpdate.repeatInterval = 1; // 既存のIntervalがない場合のみ1を設定
    } else {
        newSettingsUpdate.repeatInterval = undefined; // daily/weekly以外はinterval不要
    }
    updateFullSettings(newSettingsUpdate);
    // setFrequencyPickerVisible(false); // ピッカーを閉じる
  }, [updateFullSettings, settings.repeatInterval]);

  const handleIntervalChange = useCallback((text: string) => {
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) {
      updateSettings('repeatInterval', num);
    } else if (text === '') {
      updateSettings('repeatInterval', 1); // 空の場合は1に戻すなど
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
    setOccurrences(text); // まず表示を更新
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) {
      updateSettings('repeatEnds', { ...(currentRepeatEnds || { type: 'after_occurrences' }), occurrences: num, type: 'after_occurrences' });
    } else if (text === '') {
        // 空文字の場合の扱い (例: 1に戻す、またはエラー表示など)
        updateSettings('repeatEnds', { ...(currentRepeatEnds || { type: 'after_occurrences' }), occurrences: 1, type: 'after_occurrences' });
    }
  }, [currentRepeatEnds, updateSettings]);

  const handleShowEndDatePicker = useCallback(() => setShowEndDatePicker(true), []);
  const handleHideEndDatePicker = useCallback(() => setShowEndDatePicker(false), []);

  const onEndDayPress = useCallback((day: { dateString: string }) => {
    updateSettings('repeatEnds', { ...currentRepeatEnds, date: day.dateString, type: 'on_date' });
    setShowEndDatePicker(false);
  },[currentRepeatEnds, updateSettings]);

  const clearRepeatEndDate = useCallback(() => {
    const updatedEnds = { ...currentRepeatEnds, date: undefined };
    if (!currentRepeatEnds || !currentRepeatEnds.type) { // type がない場合を補う
        (updatedEnds as RepeatEnds).type = 'on_date';
    }
    updateSettings('repeatEnds', updatedEnds as RepeatEnds);
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
    // TODO: 繰り返し頻度選択のためのUI（例: ActionSheetIOS, カスタムモーダルなど）を表示
    // setFrequencyPickerVisible(true);
    console.log("Frequency picker pressed. Implement selection UI.");
  }, []);

  const { i18n } = useTranslation();
  useEffect(() => {
    const lang = i18n.language.split('-')[0]; // 'ja-JP' -> 'ja'
    if (LocaleConfig.locales[lang]) {
        LocaleConfig.defaultLocale = lang;
    } else if (LocaleConfig.locales['en']) { // フォールバック
        LocaleConfig.defaultLocale = 'en';
    } else {
        LocaleConfig.defaultLocale = ''; // デフォルトに戻す
    }
  }, [i18n.language]);

  // モーダルの高さが縮小されたため、このタブのコンテンツ量によっては
  // paddingBottomを調整するか、ScrollView自体の必要性を検討します。
  // 現状はpaddingBottom: 20のままです。
  return (
    <ScrollView style={styles.tabContentContainer} contentContainerStyle={{ paddingBottom: 20}}>
      <TouchableOpacity onPress={handleFrequencyPickerPress} style={styles.settingRow}>
        <Text style={styles.label}>{t('deadline_modal.repeat_frequency')}</Text>
        <Text style={styles.pickerText}>
          {t(`deadline_modal.${currentFrequency as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'}` as const)}
        </Text>
      </TouchableOpacity>

      {/* 繰り返し頻度選択ピッカーの実装 (例: モーダルやActionSheet) */}
      {/*
      <Modal visible={isFrequencyPickerVisible} onRequestClose={() => setFrequencyPickerVisible(false)} transparent>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <View style={{backgroundColor: isDark ? '#333' : '#fff', padding: 20, borderRadius: 10}}>
            {frequencyOptions.map(opt => (
              <TouchableOpacity key={opt.value} onPress={() => handleFrequencyChange(opt.value)} style={{paddingVertical: 10}}>
                <Text style={{color: isDark ? '#fff' : '#000', fontSize: styles.label.fontSize}}>
                  {t(`deadline_modal.${opt.labelKey}` as const)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
      */}


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
              selectTextOnFocus // iOSではデフォルトでtrueの場合あり、Android挙動合わせ
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
                    style={[
                        styles.settingRow, // settingRowのスタイルを基本に
                        { paddingVertical: 12, borderBottomWidth: 0 }, // 微調整
                        currentRepeatEnds?.type === opt.value && styles.repeatEndOptionSelected // 選択時スタイル
                    ]}
                    onPress={() => handleRepeatEndTypeChange(opt.value)}
                >
                    <Text style={styles.repeatEndText}>{t(`deadline_modal.${opt.labelKey}` as const)}</Text>
                    {opt.value === 'on_date' && currentRepeatEnds?.type === 'on_date' && (
                         <TouchableOpacity onPress={handleShowEndDatePicker}>
                            <Text style={{color: subColor, fontSize: styles.repeatEndText.fontSize}}>{currentRepeatEnds.date || t('common.select')}</Text>
                         </TouchableOpacity>
                    )}
                    {opt.value === 'after_occurrences' && currentRepeatEnds?.type === 'after_occurrences' && (
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <TextInput
                                style={[styles.intervalInput, {width: 50, marginRight: 4, paddingVertical: Platform.OS === 'ios' ? 8: 4}]} // 高さ調整
                                value={occurrences}
                                onChangeText={handleOccurrencesChange}
                                keyboardType="number-pad"
                                maxLength={3}
                                selectTextOnFocus
                            />
                            <Text style={styles.repeatEndText}>{t('deadline_modal.occurrences_suffix')}</Text>
                        </View>
                    )}
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
              minDate={todayString} // 過去日は選択不可など
              onDayPress={onEndDayPress}
              markedDates={endPickerMarkedDates}
              theme={calendarTheme}
              // firstDay={1} // 週の始まりを月曜日にする場合
            />
            <TouchableOpacity
              style={styles.clearRepeatEndDateButton}
              onPress={clearRepeatEndDate}
            >
              <Text style={{ color: subColor, fontSize: styles.label.fontSize }}>{t('common.clear_date')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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