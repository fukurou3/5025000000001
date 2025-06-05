import React, { useEffect, useState, useMemo, useCallback, useContext } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { Calendar, CalendarUtils } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useGoogleCalendarSync } from '@/context/GoogleCalendarContext';
import { groupTasksByDate, createMarkedDates } from './utils';
import { useGoogleCalendarEvents } from './useGoogleCalendar';
import type { Task } from '@/features/tasks/types';
import { STORAGE_KEY as TASKS_KEY } from '@/features/tasks/constants';
import { TaskItem } from '@/features/tasks/components/TaskItem';

export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const { colorScheme, subColor } = useAppTheme();
  const { enabled: googleEnabled } = useGoogleCalendarSync();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(CalendarUtils.getCalendarDateString(new Date()));

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(TASKS_KEY);
        setTasks(raw ? JSON.parse(raw) : []);
      } catch {
        setTasks([]);
      }
    })();
  }, []);

  const grouped = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const marked = useMemo(
    () => createMarkedDates(grouped, selectedDate, i18n.language, subColor),
    [grouped, selectedDate, i18n.language, subColor]
  );

  const googleEvents = useGoogleCalendarEvents(selectedDate, googleEnabled);
  const dayTasks = grouped[selectedDate] || [];

  const renderTask = useCallback(({ item }: { item: Task }) => (
    <TaskItem
      task={{ ...item, keyId: item.id, displaySortDate: undefined, isTaskFullyCompleted: !!item.completedAt }}
      onToggle={() => {}}
      isSelecting={false}
      selectedIds={[]}
      onLongPressSelect={() => {}}
      currentTab="incomplete"
    />
  ), []);

  const renderHeader = useCallback(() => {
    if (googleEvents.length === 0) return null;
    return (
      <View style={styles.googleHeader}>
        <Text style={styles.googleHeaderText}>Google</Text>
        {googleEvents.map(ev => (
          <Text key={ev.id} style={styles.googleEvent}>{ev.title}</Text>
        ))}
      </View>
    );
  }, [googleEvents]);

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }]}>
      <Calendar
        markedDates={marked}
        onDayPress={day => setSelectedDate(day.dateString)}
        theme={{
          calendarBackground: colorScheme === 'dark' ? '#000' : '#fff',
          dayTextColor: colorScheme === 'dark' ? '#fff' : '#000',
          monthTextColor: subColor,
          textDayFontWeight: '500',
        }}
      />
      <FlatList
        data={dayTasks}
        keyExtractor={item => item.id}
        renderItem={renderTask}
        ListHeaderComponent={renderHeader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  googleHeader: { padding: 8 },
  googleHeaderText: { fontWeight: '600' },
  googleEvent: { paddingLeft: 8, paddingTop: 2 },
});
