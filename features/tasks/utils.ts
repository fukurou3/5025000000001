// app/features/tasks/utils.ts
import dayjs from 'dayjs';
import type { Task } from './types';
// DeadlineSettings を元の定義場所から直接インポートします
import type { DeadlineSettings } from '@/features/add/components/DeadlineSettingModal/types';
import i18n from '@/lib/i18n'; // i18n インスタンスのパスを適切に設定してください

export const calculateActualDueDate = (task: Task): dayjs.Dayjs | null => {
  if (!task.deadline) {
    return null;
  }
  const baseDate = dayjs(task.deadline);

  if (task.deadlineDetails?.repeatFrequency) {
    // 繰り返しタスクの場合、taskDuration は DeadlineSettings から削除されたため、
    // インスタンスの「実際の期日」は、そのインスタンスの開始時刻 (baseDate) そのものとします。
    // もしインスタンスごとに異なる所要時間や終了時刻を定義したい場合は、別途その情報を管理する必要があります。
    return baseDate;
  } else {
    // 単発タスクの場合
    return baseDate;
  }
};

// 新しいヘルパー関数: 次に表示すべき未完了の繰り返しインスタンスの日付を計算
export const calculateNextDisplayInstanceDate = (task: Task, fromDate: dayjs.Dayjs = dayjs()): dayjs.Dayjs | null => {
  if (!task.deadlineDetails?.repeatFrequency || !task.deadlineDetails.repeatStartDate) {
    return task.deadline ? dayjs(task.deadline) : null;
  }

  const {
    repeatFrequency,
    repeatStartDate,
    repeatDaysOfWeek,
    customIntervalValue,
    customIntervalUnit,
    repeatEnds,
    isExcludeHolidays,
  } = task.deadlineDetails;

  let currentDateCandidate = dayjs(repeatStartDate);
  if (task.deadlineDetails.isTaskStartTimeEnabled && task.deadlineDetails.taskStartTime) {
    currentDateCandidate = currentDateCandidate
      .hour(task.deadlineDetails.taskStartTime.hour)
      .minute(task.deadlineDetails.taskStartTime.minute)
      .second(0)
      .millisecond(0);
  } else {
      currentDateCandidate = currentDateCandidate.startOf('day');
  }

  const completedDates = task.completedInstanceDates || [];
  const repeatEndDate = repeatEnds?.date ? dayjs(repeatEnds.date).endOf('day') : null;

  let effectiveFromDate = fromDate.startOf('day');
  if (currentDateCandidate.isBefore(effectiveFromDate)) {
     currentDateCandidate = effectiveFromDate;
  }

  for (let i = 0; i < 365 * 2; i++) { // 2年先まで探索
    if (repeatEndDate && currentDateCandidate.isAfter(repeatEndDate)) {
      return null;
    }

    const currentDateStr = currentDateCandidate.format('YYYY-MM-DD');
    let isValidInstance = true;

    if (repeatFrequency === 'weekly') {
      const dayOfWeek = currentDateCandidate.day();
      if (!repeatDaysOfWeek || !repeatDaysOfWeek[dayOfWeek]) {
        isValidInstance = false;
      }
    }

    // TODO: isExcludeHolidays と isHoliday(currentDateStr) を使った祝日チェック (isHolidayの実装が必要)
    // if (isExcludeHolidays && isHoliday(currentDateStr)) {
    //   isValidInstance = false;
    // }

    if (isValidInstance) {
      if (!completedDates.includes(currentDateStr)) {
        return currentDateCandidate;
      }
    }

    let originalHour = task.deadlineDetails.isTaskStartTimeEnabled && task.deadlineDetails.taskStartTime ? task.deadlineDetails.taskStartTime.hour : currentDateCandidate.hour();
    let originalMinute = task.deadlineDetails.isTaskStartTimeEnabled && task.deadlineDetails.taskStartTime ? task.deadlineDetails.taskStartTime.minute : currentDateCandidate.minute();

    switch (repeatFrequency) {
      case 'daily':
        currentDateCandidate = currentDateCandidate.add(customIntervalValue || 1, 'day');
        break;
      case 'weekly':
        currentDateCandidate = currentDateCandidate.add(customIntervalValue || 1, 'week');
        break;
      case 'monthly':
        currentDateCandidate = currentDateCandidate.add(customIntervalValue || 1, 'month');
        break;
      case 'yearly':
        currentDateCandidate = currentDateCandidate.add(customIntervalValue || 1, 'year');
        break;
      case 'custom':
         if (customIntervalUnit === 'hours') { // 時間単位の繰り返しは日付の計算では注意が必要
            currentDateCandidate = currentDateCandidate.add(customIntervalValue || 1, 'hour');
         } else { // days
            currentDateCandidate = currentDateCandidate.add(customIntervalValue || 1, 'day');
         }
        break;
      default:
        return null;
    }
     if (task.deadlineDetails.isTaskStartTimeEnabled && task.deadlineDetails.taskStartTime) {
        currentDateCandidate = currentDateCandidate.hour(originalHour).minute(originalMinute);
    }
  }
  return null;
};

export const getTimeText = (task: Task, t: (key: string, options?: any) => string, displayDateOverride?: dayjs.Dayjs | null): string => {
  const dateToCompare = displayDateOverride !== undefined ? displayDateOverride : (task.deadline ? dayjs(task.deadline) : null) ;

  if (!dateToCompare) {
    return t('task_list.no_deadline', '期限なし');
  }
  const now = dayjs();

  if (dateToCompare.isBefore(now, 'day')) {
    return dateToCompare.locale(i18n.language).format(t('common.date_format_short', 'M月D日'));
  } else if (dateToCompare.isSame(now, 'day')) {
    if (task.deadlineDetails?.isTaskStartTimeEnabled && task.deadlineDetails.taskStartTime) {
        const diffMinutes = dateToCompare.diff(now, 'minute');
        if (diffMinutes < 0) return t('time.passed_today', '今日 (期限切れ)');
        if (diffMinutes < 1) return t('time.dueNow', '期限です');
        if (diffMinutes < 60) return t('time.remainingMinutes', { count: diffMinutes });
        return t('time.remainingHours', { count: dateToCompare.diff(now, 'hour') });
    }
    return t('common.today');
  } else {
    const daysRemainingTotal = dateToCompare.startOf('day').diff(now.startOf('day'), 'day');
    if (daysRemainingTotal === 1) {
        return t('time.tomorrow', '明日');
    }
    if (daysRemainingTotal < 7) {
        return t('time.remainingDays', { count: daysRemainingTotal });
    }
    return dateToCompare.locale(i18n.language).format(t('common.date_format_short', 'M月D日'));
  }
};

export const getTimeColor = (task: Task, isDark: boolean, displayDateOverride?: dayjs.Dayjs | null): string => {
  const dateToCompare = displayDateOverride !== undefined ? displayDateOverride : (task.deadline ? dayjs(task.deadline) : null);

  if (!dateToCompare) {
    return isDark ? '#8E8E93' : '#6D6D72';
  }
  const now = dayjs();

  if (dateToCompare.isBefore(now, 'day')) {
    return isDark ? '#FF6B6B' : '#D32F2F';
  }
  if (dateToCompare.isSame(now, 'day')) {
    if (task.deadlineDetails?.isTaskStartTimeEnabled && task.deadlineDetails.taskStartTime) {
        if (dateToCompare.isBefore(now)) return isDark ? '#FF6B6B' : '#D32F2F';
        const oneHourLater = now.add(1, 'hour');
        if (dateToCompare.isBefore(oneHourLater)) {
            return isDark ? '#FFD93D' : '#FFA000';
        }
    }
    return isDark ? '#FFC107' : '#FFB300';
  }
  return isDark ? '#E0E0E0' : '#212121';
};

// i18nの初期化とdayjsのロケール設定
if (i18n.isInitialized) {
    dayjs.locale(i18n.language.split('-')[0]);
}
i18n.on('languageChanged', (lng) => {
  dayjs.locale(lng.split('-')[0]);
});