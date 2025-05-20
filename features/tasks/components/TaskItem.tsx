// C:\Users\fukur\task-app\app\features\tasks\components\TaskItem.tsx
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../types';
import { createStyles } from '../styles';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FontSizeContext } from '@/context/FontSizeContext';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { getTimeColor, getTimeText } from '../utils';

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
    let intervalId: NodeJS.Timeout | undefined;
    const updateNow = () => setNow(dayjs());

    if (task.deadline || (task.deadlineDetails && task.deadlineDetails.taskDuration)) {
        const tempActualDueDate = task.deadlineDetails?.repeatFrequency && task.deadlineDetails.taskDuration && task.deadline
            ? dayjs(task.deadline).add(task.deadlineDetails.taskDuration.amount, task.deadlineDetails.taskDuration.unit)
            : task.deadline ? dayjs(task.deadline) : null;

        if (tempActualDueDate) {
            const diffMinutes = Math.abs(tempActualDueDate.diff(now, 'minute'));
            const intervalMs = diffMinutes <= 120 ? 60000 : 300000;
            intervalId = setInterval(updateNow, intervalMs);
        }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [task, now]);

  const timeLabel = getTimeText(task, t);
  const timeColor = getTimeColor(task, isDark);

  const handlePress = () => {
    if (isSelecting) {
      onLongPressSelect(task.id);
    } else {
      // ★★★ 修正箇所: router.push の呼び出し方を文字列形式に戻します ★★★
      router.push(`/task-detail/${task.id}`);
    }
  };

  const isSelected = selectedIds.includes(task.id);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={() => onLongPressSelect(task.id)}
      delayLongPress={200}
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

        <Text style={[
            styles.taskTime,
            { color: timeColor },
            (timeLabel === t('task_list.no_deadline')) && styles.noDeadlineText,
        ]}>
          {timeLabel}
        </Text>

        {isSelecting && (
          <View style={styles.selectionIconContainer}>
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={subColor}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}