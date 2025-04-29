// /app/(tabs)/tasks/TaskItem.tsx

import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../../lib/tasks/taskTypes';
import { createStyles } from '../../lib/tasks/taskStyles';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FontSizeContext } from '@/context/FontSizeContext';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';

type Props = {
  task: Task;
  onToggle: (id: string) => void;
  isSelecting: boolean;
  selectedIds: string[];
  onLongPressSelect: (id: string) => void;
};

export function TaskItem({
  task,
  onToggle,
  isSelecting,
  selectedIds,
  onLongPressSelect,
}: Props) {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const { fontSizeKey } = useContext(FontSizeContext);
  const styles = createStyles(isDark, subColor, fontSizeKey);
  const router = useRouter();
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const diffMinutes = Math.abs(dayjs(task.deadline).diff(dayjs(), 'minute'));
    const intervalMs = diffMinutes <= 120 ? 60000 : 600000;
    const id = setInterval(() => setNow(dayjs()), intervalMs);
    return () => clearInterval(id);
  }, [task.deadline]);

  const getTimeLabel = () => {
    const deadline = dayjs(task.deadline);
    const diffMs = deadline.diff(now);

    if (diffMs > 0) {
      const weeks = deadline.diff(now, 'week');
      const days = deadline.diff(now, 'day');
      const hours = deadline.diff(now, 'hour');
      const minutes = deadline.diff(now, 'minute');

      if (weeks >= 1) return t('countdown.after_weeks', { count: weeks });
      if (days >= 1) return t('countdown.after_days', { count: days });
      if (hours >= 1) return t('countdown.after_hours', { count: hours });
      return t('countdown.after_minutes', { count: minutes });
    } else {
      const weeksPassed = now.diff(deadline, 'week');
      const daysPassed = now.diff(deadline, 'day');
      const hoursPassed = now.diff(deadline, 'hour');
      const minutesPassed = now.diff(deadline, 'minute');

      if (weeksPassed >= 1) return t('countdown.passed_weeks', { count: weeksPassed });
      if (daysPassed >= 1) return t('countdown.passed_days', { count: daysPassed });
      if (hoursPassed >= 1) return t('countdown.passed_hours', { count: hoursPassed });
      return t('countdown.passed_minutes', { count: minutesPassed });
    }
  };

  const handlePress = () => {
    if (isSelecting) {
      onLongPressSelect(task.id);
    } else {
      router.push(`/task-detail/${task.id}`);
    }
  };

  const isSelected = selectedIds.includes(task.id);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={() => onLongPressSelect(task.id)}
    >
      <View style={styles.taskItem}>
        {!isSelecting && (
          <TouchableOpacity onPress={() => onToggle(task.id)} style={styles.checkboxContainer}>
            <Ionicons
              name={task.done ? 'checkbox' : 'square-outline'}
              size={24}
              color={subColor}
            />
          </TouchableOpacity>
        )}

        <View style={styles.taskCenter}>
          <Text style={styles.taskTitle} numberOfLines={1}>
            {task.title}
          </Text>
          {task.memo && (
            <Text style={styles.taskMemo} numberOfLines={2}>
              {task.memo}
            </Text>
          )}
        </View>

        <View style={styles.taskRight}>
          <Text style={styles.taskTime}>{getTimeLabel()}</Text>
          {isSelecting && (
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={subColor}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
