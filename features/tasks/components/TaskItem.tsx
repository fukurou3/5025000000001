// app/features/tasks/components/TaskItem.tsx
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
import { getTimeColor, getTimeText, calculateNextDisplayInstanceDate } from '../utils'; // calculateNextDisplayInstanceDate をインポート
import { fontSizes } from '@/constants/fontSizes';

type Props = {
  task: Task;
  onToggle: (id: string, instanceDate?: string) => void; // instanceDate を渡せるように変更
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
  const { t, i18n } = useTranslation(); // i18n を追加
  const { fontSizeKey } = useContext(FontSizeContext);
  const styles = createStyles(isDark, subColor, fontSizeKey);
  const router = useRouter();
  const [now, setNow] = useState(dayjs()); // now の更新ロジックは既存のまま

  // 繰り返しタスクの現在のインスタンスの日付を決定
  const displayInstanceDate = task.deadlineDetails?.repeatFrequency
    ? calculateNextDisplayInstanceDate(task)
    : task.deadline ? dayjs(task.deadline) : null;

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    const updateNow = () => setNow(dayjs());

    if (displayInstanceDate) { // displayInstanceDate を使用
        const diffMinutes = Math.abs(displayInstanceDate.diff(now, 'minute'));
        const intervalMs = diffMinutes <= 120 ? 60000 : 300000; // 2時間以内なら毎分、それ以外は5分ごと
        intervalId = setInterval(updateNow, intervalMs);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [task, now, displayInstanceDate]);

  // getTimeText と getTimeColor に displayInstanceDate を渡す
  const timeLabel = getTimeText(task, t, displayInstanceDate);
  const timeColor = getTimeColor(task, isDark, displayInstanceDate);


  const handleToggle = () => {
    if (task.deadlineDetails?.repeatFrequency && displayInstanceDate) {
      onToggle(task.id, displayInstanceDate.format('YYYY-MM-DD'));
    } else {
      onToggle(task.id);
    }
  };

  const handlePress = () => {
    if (isSelecting) {
      onLongPressSelect(task.id);
    } else {
      // 詳細画面に渡すIDは親タスクのIDのまま
      router.push(`/task-detail/${task.id}`);
    }
  };

  const isSelected = selectedIds.includes(task.id);

  // 繰り返しタスクの特定の日付インスタンスが完了しているかチェック
  let isCurrentInstanceDone = task.done; // デフォルトはtask.done
  if (task.deadlineDetails?.repeatFrequency && displayInstanceDate) {
    const dateStr = displayInstanceDate.format('YYYY-MM-DD');
    isCurrentInstanceDone = task.completedInstanceDates?.includes(dateStr) ?? false;
  }


  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={() => onLongPressSelect(task.id)} // 親タスクのIDを選択対象とする
      delayLongPress={200}
    >
      <View style={styles.taskItem}>
        {!isSelecting && (
          <TouchableOpacity onPress={handleToggle} style={styles.checkboxContainer}>
            <Ionicons
              name={isCurrentInstanceDone ? 'checkbox' : 'square-outline'} // isCurrentInstanceDone を使用
              size={24}
              color={subColor}
            />
          </TouchableOpacity>
        )}

        <View style={styles.taskCenter}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {task.deadlineDetails?.repeatFrequency && (
              <Ionicons name="repeat" size={fontSizes[fontSizeKey]} color={isDark ? '#999' : '#777'} style={{ marginRight: 4 }} />
            )}
            <Text style={styles.taskTitle} numberOfLines={1}>
              {task.title}
            </Text>
          </View>
          {task.memo && (
            <Text style={styles.taskMemo} numberOfLines={2}>
              {task.memo}
            </Text>
          )}
        </View>

        <View style={{alignItems: 'flex-end'}}>
            {task.deadlineDetails?.repeatFrequency && displayInstanceDate ? (
                 <Text style={[styles.taskTime, { color: timeColor, fontSize: fontSizes[fontSizeKey] -1 }]}>
                    {displayInstanceDate.locale(i18n.language).format(t('common.month_day_format', 'M月D日'))} {/* 〇月〇日形式 */}
                 </Text>
            ) : null }
            <Text style={[
                styles.taskTime,
                { color: timeColor },
                (timeLabel === t('task_list.no_deadline')) && styles.noDeadlineText,
                task.deadlineDetails?.repeatFrequency && displayInstanceDate ? {fontSize: fontSizes[fontSizeKey]-2, fontWeight: 'normal'} : {}
            ]}>
              {timeLabel}
            </Text>
        </View>

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