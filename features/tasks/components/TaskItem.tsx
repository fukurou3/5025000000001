// app/features/tasks/components/TaskItem.tsx
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { DisplayableTaskItem } from '../types';
import { createStyles } from '../styles';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FontSizeContext } from '@/context/FontSizeContext';
import { useRouter } from 'expo-router';
import { getTimeColor, getTimeText, getDeadlineDisplayText, calculateActualDueDate } from '../utils';
import { fontSizes } from '@/constants/fontSizes';

dayjs.extend(utc);

type Props = {
  task: DisplayableTaskItem;
  onToggle: (id: string, instanceDate?: string) => void;
  isSelecting: boolean;
  selectedIds: string[];
  onLongPressSelect: (id: string) => void;
  currentTab: 'incomplete' | 'completed';
  isInsideFolder?: boolean;
  isLastItem?: boolean;
};

export function TaskItem({
  task,
  onToggle,
  isSelecting,
  selectedIds,
  onLongPressSelect,
  currentTab,
  isInsideFolder,
  isLastItem,
}: Props) {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { t, i18n } = useTranslation();
  const { fontSizeKey } = useContext(FontSizeContext);
  const styles = createStyles(isDark, subColor, fontSizeKey);
  const router = useRouter();
  const [nowLocal, setNowLocal] = useState(dayjs());

  const displayInstanceDateUtc = task.isCompletedInstance ? null : task.displaySortDate;
  const actualDueDateUtc = task.isCompletedInstance ? dayjs.utc(task.instanceDate) : calculateActualDueDate(task);


  let displayStartDateUtc: dayjs.Dayjs | null = null;
  if (!task.isCompletedInstance && task.deadlineDetails?.isPeriodSettingEnabled && task.deadlineDetails.periodStartDate) {
    displayStartDateUtc = dayjs.utc(task.deadlineDetails.periodStartDate);
    if (task.deadlineDetails.periodStartTime) {
      displayStartDateUtc = displayStartDateUtc
        .hour(task.deadlineDetails.periodStartTime.hour)
        .minute(task.deadlineDetails.periodStartTime.minute);
    } else {
      displayStartDateUtc = displayStartDateUtc.startOf('day');
    }
  }

  useEffect(() => {
    if (task.isCompletedInstance) return;
    let intervalId: NodeJS.Timeout | undefined;
    const updateNow = () => setNowLocal(dayjs());

    const dateToMonitorLocal = (displayStartDateUtc?.isAfter(nowLocal.utc()) ? displayStartDateUtc.local() : displayInstanceDateUtc?.local());

    if (dateToMonitorLocal) {
        const diffMinutesTotal = Math.abs(dateToMonitorLocal.diff(nowLocal, 'minute'));
        let intervalMs = 60000;
        if (diffMinutesTotal <= 1) intervalMs = 5000;
        else if (diffMinutesTotal <= 5) intervalMs = 10000;
        else if (diffMinutesTotal <= 60) intervalMs = 30000;
        intervalId = setInterval(updateNow, intervalMs);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [task, nowLocal, displayInstanceDateUtc, displayStartDateUtc]);

  const isPeriodStartInFuture = !task.isCompletedInstance && task.deadlineDetails?.isPeriodSettingEnabled && displayStartDateUtc && displayStartDateUtc.local().isAfter(nowLocal);

  const deadlineDisplayText = task.isCompletedInstance ? dayjs.utc(task.instanceDate).local().format(t('common.date_format_short', 'YYYY/M/D')) : getDeadlineDisplayText(actualDueDateUtc, t);
  const timeColor = task.isCompletedInstance ? (isDark ? '#8E8E93' : '#6D6D72') : getTimeColor(task, isDark, displayInstanceDateUtc, displayStartDateUtc);
  const startTimeDisplayText = task.isCompletedInstance ? t('task_list.completed_on_date_time', { date: dayjs.utc(task.instanceDate).local().format(t('common.date_time_format_short', "M/D H:mm"))}) : getTimeText(task, t, displayInstanceDateUtc, displayStartDateUtc);


  const handleToggle = () => {
    if (task.isCompletedInstance && task.instanceDate) {
      onToggle(task.id, task.instanceDate);
    } else if (currentTab === 'completed' && !task.isCompletedInstance) {
      onToggle(task.id);
    } else if (task.deadlineDetails?.repeatFrequency && displayInstanceDateUtc) {
      onToggle(task.id, displayInstanceDateUtc.format('YYYY-MM-DD'));
    } else {
      onToggle(task.id);
    }
  };

  const handlePress = () => {
    if (isSelecting) {
      onLongPressSelect(task.keyId);
    } else if (!task.isCompletedInstance) {
      router.push(`/task-detail/${task.id}`);
    }
  };

  const isSelected = selectedIds.includes(task.keyId);

  let isCurrentDisplayInstanceDone = false;
  if (task.isCompletedInstance) {
    isCurrentDisplayInstanceDone = true;
  } else if (currentTab === 'completed') {
    isCurrentDisplayInstanceDone = true;
  } else if (task.deadlineDetails?.repeatFrequency && displayInstanceDateUtc) {
    const instanceDateStr = displayInstanceDateUtc.format('YYYY-MM-DD');
    isCurrentDisplayInstanceDone = task.completedInstanceDates?.includes(instanceDateStr) ?? false;
  } else if (!task.deadlineDetails?.repeatFrequency) {
    isCurrentDisplayInstanceDone = !!task.completedAt;
  }


  let topText = "";
  let bottomText: string | null = null;
  let topTextStyleArray: TextStyle[] = [styles.taskTime, { color: timeColor }];
  let bottomTextStyleArray: TextStyle[] = [styles.taskTime, { color: timeColor, fontSize: fontSizes[fontSizeKey] - 2, fontWeight: 'normal' }];

  if (task.isCompletedInstance && task.instanceDate) {
    topText = dayjs.utc(task.instanceDate).local().locale(i18n.language).format(t('common.date_format_month_day', 'M月D日'));
    bottomText = dayjs.utc(task.instanceDate).local().locale(i18n.language).format(t('common.time_format_simple', 'H:mm'));
    topTextStyleArray.push({fontWeight: 'normal'});
  } else if (isPeriodStartInFuture) {
    topText = deadlineDisplayText;
    bottomText = startTimeDisplayText;
    topTextStyleArray.push({ fontWeight: 'bold' });
  } else if (displayInstanceDateUtc) {
    const displayDateLocal = displayInstanceDateUtc.local();
    if (task.deadlineDetails?.repeatFrequency) {
        topText = displayDateLocal.locale(i18n.language).format(t('common.month_day_format', 'M月D日'));
        if (task.deadlineDetails.isTaskStartTimeEnabled && task.deadlineDetails.taskStartTime) {
             bottomText = displayDateLocal.locale(i18n.language).format(t('common.time_format_simple', 'H:mm'));
             topTextStyleArray.push({ fontSize: fontSizes[fontSizeKey] - 2, fontWeight: 'normal' });
             bottomTextStyleArray = [styles.taskTime, { color: timeColor, fontWeight: 'bold' }];
        } else {
            bottomText = null;
            topTextStyleArray.push({ fontWeight: 'bold' });
        }
    } else {
        topText = startTimeDisplayText;
        if (task.deadlineDetails?.isTaskDeadlineTimeEnabled && task.deadlineDetails.taskDeadlineTime) {
             topTextStyleArray.push({ fontWeight: 'bold' });
        } else {
            topTextStyleArray.push({ fontWeight: 'normal' });
        }
        bottomText = null;
    }

    if (topText === t('task_list.no_deadline')) {
        topTextStyleArray.push(styles.noDeadlineText as TextStyle);
    }

  } else {
    topText = t('task_list.no_deadline');
    topTextStyleArray.push(styles.noDeadlineText as TextStyle);
    bottomText = null;
  }


  const baseStyle = isInsideFolder
    ? styles.folderTaskItemContainer
    : styles.taskItemContainer;

  const itemContainerStyle = StyleSheet.flatten([
    baseStyle,
    (isInsideFolder && isLastItem && !task.isCompletedInstance) && { borderBottomWidth: 0 }, // 通常のタスクの最後のアイテムのみ罫線を消す
    task.isCompletedInstance && isLastItem && { borderBottomWidth: 0 } // 完了インスタンスの場合も最後のアイテムは罫線を消す
  ]);


  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={() => onLongPressSelect(task.keyId)}
      delayLongPress={200}
      style={itemContainerStyle}
      disabled={isSelecting ? false : task.isCompletedInstance}
    >
      <View style={styles.taskItem}>
        {!isSelecting && (
          <TouchableOpacity
            onPress={handleToggle}
            style={styles.checkboxContainer}
          >
            <Ionicons
              name={isCurrentDisplayInstanceDone ? 'checkbox' : 'square-outline'}
              size={24}
              color={subColor}
            />
          </TouchableOpacity>
        )}

        <View style={styles.taskCenter}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {task.deadlineDetails?.repeatFrequency && !task.isCompletedInstance && (
              <Ionicons name="repeat" size={fontSizes[fontSizeKey]} color={isDark ? '#999' : '#777'} style={{ marginRight: 4 }} />
            )}
             {task.deadlineDetails?.isPeriodSettingEnabled && task.deadlineDetails.periodStartDate && !isPeriodStartInFuture && !task.isCompletedInstance && (
              <Ionicons name="calendar-outline" size={fontSizes[fontSizeKey]} color={isDark ? '#999' : '#777'} style={{ marginRight: 4 }} />
            )}
             {isPeriodStartInFuture && !task.isCompletedInstance && (
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