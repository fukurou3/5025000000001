// app/features/add/components/DeadlineSettingModal/DateSelectionTab.tsx
import { LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['ja'] = {
  monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
  today: '今日'
};


import React, { useMemo, useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Calendar, CalendarUtils, CalendarProps } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/hooks/ThemeContext';
import type { SpecificDateSelectionTabProps, DeadlineTime, CalendarFontWeight } from './types';
import { TimePickerModal } from './TimePickerModal';

const formatTimeToDisplay = (time: DeadlineTime, t: (key: string) => string): string => {
    const hour24 = time.hour;
    const ampmKey = (hour24 < 12 || hour24 === 24 || hour24 === 0) ? 'am' : 'pm';
    const ampm = t(`common.${ampmKey}`);
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    return `${ampm} ${hour12}:${String(time.minute).padStart(2, '0')}`;
};

const DateSelectionTabMemo: React.FC<SpecificDateSelectionTabProps> = ({
  styles,
  selectedDate,
  selectedTime,
  isTimeEnabled,
  updateSettings,
}) => {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const [isTimePickerModalVisible, setTimePickerModalVisible] = useState(false);

  const currentSelectedDate = selectedDate || CalendarUtils.getCalendarDateString(new Date());

  const onDayPress = useCallback((day: { dateString: string }) => {
    updateSettings('date', day.dateString);
  }, [updateSettings]);

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


  const displayTime = useMemo(() => {
    if (isTimeEnabled && selectedTime) {
      return formatTimeToDisplay(selectedTime, t);
    }
    return t('common.select');
  }, [isTimeEnabled, selectedTime, t]);

  const labelFontSize = typeof styles.label.fontSize === 'number' ? styles.label.fontSize : 16;

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

  const markedDates = useMemo(() => ({
    [currentSelectedDate]: { selected: true, selectedColor: subColor, disableTouchEvent: true },
  }), [currentSelectedDate, subColor]);


  return (
    <ScrollView style={styles.tabContentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
      <Calendar
        current={currentSelectedDate}
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={calendarTheme}
      />
      <TouchableOpacity onPress={handleTimeSectionPress} style={styles.timePickerToggleContainer}>
        <Text style={[styles.label, { marginBottom: 0 }]}>{t('deadline_modal.specify_time')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.pickerText, { marginRight: 4, color: isTimeEnabled ? subColor : (isDark ? '#A0A0A0' : '#555555')}]}>
            {displayTime}
          </Text>
          <Ionicons
            name={"chevron-forward"}
            size={labelFontSize + 2}
            color={isDark ? '#A0A0A0' : '#555555'}
          />
        </View>
      </TouchableOpacity>

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