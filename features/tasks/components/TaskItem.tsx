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
  const [now, setNow] = useState(dayjs()); // getTimeTextで使うのでnowはTaskItemで管理する

  useEffect(() => {
    if (task.deadline) {
      const diffMinutes = Math.abs(dayjs(task.deadline).diff(dayjs(), 'minute'));
      const intervalMs = diffMinutes <= 120 ? 60000 : 300000; // 1分 or 5分更新
      const id = setInterval(() => setNow(dayjs()), intervalMs);
      return () => clearInterval(id);
    }
  }, [task.deadline]);

  const timeLabel = getTimeText(task.deadline, t);
  const timeColor = getTimeColor(task.deadline, isDark);

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

        {timeLabel && ( // timeLabelが存在する場合のみTextコンポーネントを描画
          <Text style={[styles.taskTime, { color: timeColor }, !task.deadline && styles.noDeadlineText]}>
            {timeLabel}
          </Text>
        )}

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