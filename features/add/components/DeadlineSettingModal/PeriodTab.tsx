// app/features/add/components/DeadlineSettingModal/PeriodTab.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Calendar, CalendarUtils, CalendarProps } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/ThemeContext';
import type { SpecificPeriodTabProps, CalendarFontWeight } from './types';

import { LocaleConfig } from 'react-native-calendars';
import { useEffect } from 'react';



const todayString = CalendarUtils.getCalendarDateString(new Date());

interface PeriodMarking {
  color?: string;
  textColor?: string;
  startingDay?: boolean;
  endingDay?: boolean;
  selected?: boolean;
  disableTouchEvent?: boolean;
}

const PeriodTabMemo: React.FC<SpecificPeriodTabProps> = ({
  styles,
  periodStartDate,
  periodEndDate,
  updateSettings,
}) => {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const [selectingFor, setSelectingFor] = useState<'start' | 'end'>('start');

  const onDayPress = useCallback((day: { dateString: string }) => {
    if (selectingFor === 'start') {
      updateSettings('periodStartDate', day.dateString);
      if (periodEndDate && day.dateString > periodEndDate) {
        updateSettings('periodEndDate', undefined);
      }
      setSelectingFor('end');
    } else {
      if (periodStartDate && day.dateString < periodStartDate) {
        updateSettings('periodStartDate', day.dateString);
        updateSettings('periodEndDate', undefined);
        setSelectingFor('end');
      } else {
        updateSettings('periodEndDate', day.dateString);
        setSelectingFor('start');
      }
    }
  }, [selectingFor, periodStartDate, periodEndDate, updateSettings]);

  const handleSelectForStart = useCallback(() => setSelectingFor('start'), []);
  const handleSelectForEnd = useCallback(() => setSelectingFor('end'), []);


  const markedDates = useMemo(() => {
    const marked: { [key: string]: PeriodMarking } = {};
    if (periodStartDate) {
      marked[periodStartDate] = {
        startingDay: true,
        color: subColor,
        textColor: isDark ? '#000' : '#FFF',
        selected: true,
      };
    }
    if (periodEndDate) {
      marked[periodEndDate] = {
        endingDay: true,
        color: subColor,
        textColor: isDark ? '#000' : '#FFF',
        selected: true,
        ...(periodStartDate === periodEndDate && { startingDay: true }),
      };
    }
    const startDateToDate = (dateStr: string | undefined): Date | null => {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const startDt = startDateToDate(periodStartDate);
    const endDt = startDateToDate(periodEndDate);

    if (startDt && endDt && startDt < endDt) {
      let current = new Date(startDt);
      current.setDate(current.getDate() + 1);
      while (current < endDt) {
        const dateStr = CalendarUtils.getCalendarDateString(current);
        marked[dateStr] = { color: subColor + '30', textColor: subColor, selected: false, disableTouchEvent: true };
        current.setDate(current.getDate() + 1);
      }
    }
    return marked;
  }, [periodStartDate, periodEndDate, subColor, isDark]);

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
const { i18n } = useTranslation();
useEffect(() => {
  LocaleConfig.defaultLocale = i18n.language;
}, [i18n.language]);

  const periodButtonTextFontSize = (styles.periodButtonText.fontSize as number || 14) - 2;

  return (
    <ScrollView style={styles.tabContentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={styles.periodButtonContainer}>
        <TouchableOpacity
          style={[styles.periodButton, selectingFor === 'start' && styles.periodButtonSelected]}
          onPress={handleSelectForStart}
        >
          <Text style={[styles.periodButtonText, selectingFor === 'start' && styles.periodButtonTextSelected]}>
            {t('deadline_modal.start_date')}
          </Text>
          <Text style={[styles.periodButtonText, {opacity:0.7, fontSize: periodButtonTextFontSize }, selectingFor === 'start' && styles.periodButtonTextSelected]}>
            {periodStartDate ? periodStartDate : t('deadline_modal.not_selected')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, selectingFor === 'end' && styles.periodButtonSelected]}
          onPress={handleSelectForEnd}
        >
          <Text style={[styles.periodButtonText, selectingFor === 'end' && styles.periodButtonTextSelected]}>
            {t('deadline_modal.end_date')}
          </Text>
           <Text style={[styles.periodButtonText, {opacity:0.7, fontSize: periodButtonTextFontSize }, selectingFor === 'end' && styles.periodButtonTextSelected]}>
            {periodEndDate ? periodEndDate : t('deadline_modal.not_selected')}
          </Text>
        </TouchableOpacity>
      </View>
      <Calendar
        current={periodStartDate || todayString}
        onDayPress={onDayPress}
        markingType={'period'}
        markedDates={markedDates}
        theme={calendarTheme}
      />
    </ScrollView>
  );
};

const arePeriodTabPropsEqual = (
    prevProps: Readonly<SpecificPeriodTabProps>,
    nextProps: Readonly<SpecificPeriodTabProps>
): boolean => {
    return (
        prevProps.styles === nextProps.styles &&
        prevProps.periodStartDate === nextProps.periodStartDate &&
        prevProps.periodEndDate === nextProps.periodEndDate &&
        prevProps.updateSettings === nextProps.updateSettings
    );
};


export const PeriodTab = React.memo(PeriodTabMemo, arePeriodTabPropsEqual);