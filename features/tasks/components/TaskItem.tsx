// app/features/tasks/components/TaskItem.tsx
import React, { useContext, useState, useEffect } from 'react';
// StyleSheet と TextStyle を react-native からインポート
import { View, Text, TouchableOpacity, StyleSheet, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../types';
import { createStyles } from '../styles';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FontSizeContext } from '@/context/FontSizeContext';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { getTimeColor, getTimeText, calculateNextDisplayInstanceDate, getDeadlineDisplayText, calculateActualDueDate } from '../utils';
import { fontSizes } from '@/constants/fontSizes';

type Props = {
  task: Task;
  onToggle: (id: string, instanceDate?: string) => void;
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
  const { t, i18n } = useTranslation();
  const { fontSizeKey } = useContext(FontSizeContext);
  const styles = createStyles(isDark, subColor, fontSizeKey);
  const router = useRouter();
  const [now, setNow] = useState(dayjs());

  const actualDueDate = calculateActualDueDate(task);

  const displayInstanceDate = task.deadlineDetails?.repeatFrequency
    ? calculateNextDisplayInstanceDate(task, now)
    : actualDueDate;

  const displayStartDate = task.deadlineDetails?.isPeriodSettingEnabled && task.deadlineDetails.periodStartDate
    ? dayjs(task.deadlineDetails.periodStartDate).set(
        'hour',
        task.deadlineDetails.periodStartTime?.hour ?? 0
      ).set(
        'minute',
        task.deadlineDetails.periodStartTime?.minute ?? 0
      )
    : null;

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    const updateNow = () => setNow(dayjs());

    const dateToMonitor = displayStartDate?.isAfter(now) ? displayStartDate : displayInstanceDate;

    if (dateToMonitor) {
        const diffMinutesTotal = Math.abs(dateToMonitor.diff(now, 'minute'));
        let intervalMs = 60000;
        if (diffMinutesTotal <= 1) intervalMs = 5000;
        else if (diffMinutesTotal <= 5) intervalMs = 10000;
        else if (diffMinutesTotal <= 60) intervalMs = 30000;
        intervalId = setInterval(updateNow, intervalMs);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [task, now, displayInstanceDate, displayStartDate]);

  const isPeriodStartInFuture = task.deadlineDetails?.isPeriodSettingEnabled && displayStartDate && displayStartDate.isAfter(now);

  const deadlineDisplayText = getDeadlineDisplayText(actualDueDate, t);
  const startTimeDisplayText = getTimeText(task, t, displayInstanceDate, displayStartDate);

  const timeColor = getTimeColor(task, isDark, displayInstanceDate, displayStartDate);

  const handleToggle = () => {
    if (task.deadlineDetails?.repeatFrequency && displayInstanceDate) {
      const instanceDateForCompletion = calculateNextDisplayInstanceDate(task, dayjs(task.deadlineDetails.repeatStartDate ?? undefined))?.format('YYYY-MM-DD');
      onToggle(task.id, instanceDateForCompletion ?? task.id);
    } else {
      onToggle(task.id);
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

  let isCurrentInstanceDone = task.done;
  if (task.deadlineDetails?.repeatFrequency && displayInstanceDate) {
    const instanceDateForCheck = calculateNextDisplayInstanceDate(task, dayjs(task.deadlineDetails.repeatStartDate ?? undefined))?.format('YYYY-MM-DD');
    if (instanceDateForCheck) {
        isCurrentInstanceDone = task.completedInstanceDates?.includes(instanceDateForCheck) ?? false;
    }
  }

  let topText = "";
  let bottomText: string | null = null;
  // スタイルを TextStyle[] として型付けし、StyleSheet.flatten に渡せるようにする
  let topTextStyleArray: TextStyle[] = [styles.taskTime, { color: timeColor }];
  let bottomTextStyleArray: TextStyle[] = [styles.taskTime, { color: timeColor, fontSize: fontSizes[fontSizeKey] - 2, fontWeight: 'normal' }];


  if (isPeriodStartInFuture) {
    topText = deadlineDisplayText;
    bottomText = startTimeDisplayText;
    topTextStyleArray.push({ fontWeight: 'bold' });
    // bottomTextStyleArray はデフォルトで細字・小さめなので変更なし
  } else if (task.deadlineDetails?.repeatFrequency && displayInstanceDate) {
    topText = displayInstanceDate.locale(i18n.language).format(t('common.month_day_format', 'M月D日'));
    bottomText = startTimeDisplayText;
    topTextStyleArray.push({ fontSize: fontSizes[fontSizeKey] - 2, fontWeight: 'normal' });
    // bottomTextStyleArray を太字に変更
    bottomTextStyleArray = [styles.taskTime, { color: timeColor, fontWeight: 'bold' }];
     if (topText === t('task_list.no_deadline')) {
        // styles.noDeadlineText は fontStyle:'italic' を含むので、直接マージする
        topTextStyleArray.push(styles.noDeadlineText as TextStyle);
    }
  } else {
    topText = startTimeDisplayText;
    topTextStyleArray.push({ fontWeight: 'bold' });
    if (topText === t('task_list.no_deadline')) {
        topTextStyleArray.push(styles.noDeadlineText as TextStyle);
    }
  }


  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={() => onLongPressSelect(task.id)}
      delayLongPress={200}
      style={styles.taskItemContainer} // styles.ts に taskItemContainer を追加
    >
      <View style={styles.taskItem}>
        {!isSelecting && (
          <TouchableOpacity onPress={handleToggle} style={styles.checkboxContainer}>
            <Ionicons
              name={isCurrentInstanceDone ? 'checkbox' : 'square-outline'}
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
             {task.deadlineDetails?.isPeriodSettingEnabled && task.deadlineDetails.periodStartDate && !isPeriodStartInFuture && (
              <Ionicons name="calendar-outline" size={fontSizes[fontSizeKey]} color={isDark ? '#999' : '#777'} style={{ marginRight: 4 }} />
            )}
             {isPeriodStartInFuture && (
              <Ionicons name="time-outline" size={fontSizes[fontSizeKey]} color={isDark ? '#999' : '#777'} style={{ marginRight: 4 }} />
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

        <View style={{alignItems: 'flex-end', justifyContent: 'center', minHeight: 40 }}>
            <Text style={StyleSheet.flatten(topTextStyleArray)} numberOfLines={1} ellipsizeMode="tail">
                {topText}
            </Text>
            {bottomText && (
                <Text style={StyleSheet.flatten(bottomTextStyleArray)} numberOfLines={1} ellipsizeMode="tail">
                    {bottomText}
                </Text>
            )}
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