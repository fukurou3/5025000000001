// app/features/tasks/utils.ts
import dayjs from 'dayjs';
import type { Task } from './types';
import i18n from '@/lib/i18n';

export const calculateActualDueDate = (task: Task): dayjs.Dayjs | null => {
  const { deadlineDetails } = task;
  if (!deadlineDetails) {
    return task.deadline ? dayjs(task.deadline) : null;
  }

  if (deadlineDetails.taskDeadlineDate) {
    let deadline = dayjs(deadlineDetails.taskDeadlineDate);
    if (deadlineDetails.isTaskDeadlineTimeEnabled && deadlineDetails.taskDeadlineTime) {
      deadline = deadline.hour(deadlineDetails.taskDeadlineTime.hour).minute(deadlineDetails.taskDeadlineTime.minute);
    } else {
      deadline = deadline.startOf('day');
    }
    return deadline;
  }
  return task.deadline ? dayjs(task.deadline) : null;
};

export const calculateNextDisplayInstanceDate = (task: Task, fromDate: dayjs.Dayjs = dayjs()): dayjs.Dayjs | null => {
  if (!task.deadlineDetails?.repeatFrequency || !task.deadlineDetails.repeatStartDate) {
    return calculateActualDueDate(task);
  }

  const {
    repeatFrequency,
    repeatStartDate,
    repeatDaysOfWeek,
    customIntervalValue, // 'custom' frequency でのみ使用
    customIntervalUnit,  // 'custom' frequency でのみ使用
    repeatEnds,
    taskStartTime,
    isTaskStartTimeEnabled,
  } = task.deadlineDetails;

  let currentDateCandidate = dayjs(repeatStartDate);
  if (isTaskStartTimeEnabled && taskStartTime) {
    currentDateCandidate = currentDateCandidate
      .hour(taskStartTime.hour)
      .minute(taskStartTime.minute)
      .second(0)
      .millisecond(0);
  } else {
    currentDateCandidate = currentDateCandidate.startOf('day');
  }

  const completedDates = task.completedInstanceDates || [];
  const repeatEndDate = repeatEnds?.date ? dayjs(repeatEnds.date).endOf('day') : null;
  
  let effectiveFromDateBase = dayjs(repeatStartDate).startOf('day');
  if (fromDate.isAfter(effectiveFromDateBase)) {
      effectiveFromDateBase = fromDate.startOf('day');
  }

  function originalHourGetter() {
    return isTaskStartTimeEnabled && taskStartTime ? taskStartTime.hour : 0;
  }
  function originalMinuteGetter() {
    return isTaskStartTimeEnabled && taskStartTime ? taskStartTime.minute : 0;
  }

  if (currentDateCandidate.isBefore(effectiveFromDateBase) && !(repeatFrequency === 'custom' && customIntervalUnit === 'hours')) {
    switch (repeatFrequency) {
        case 'daily':
            currentDateCandidate = effectiveFromDateBase.hour(originalHourGetter()).minute(originalMinuteGetter());
            if (currentDateCandidate.isBefore(effectiveFromDateBase)) currentDateCandidate = currentDateCandidate.add(1, 'day');
            break;
        case 'weekly':
            // repeatStartDateの曜日を維持しつつ、effectiveFromDateBase以降の直近の該当曜日に設定
            const originalStartDay = dayjs(repeatStartDate).day();
            currentDateCandidate = effectiveFromDateBase.day(originalStartDay).hour(originalHourGetter()).minute(originalMinuteGetter());
            if (currentDateCandidate.isBefore(effectiveFromDateBase)) {
                 currentDateCandidate = currentDateCandidate.add(1, 'week');
            }
            break;
        case 'monthly':
            const dateInMonth = dayjs(repeatStartDate).date();
            currentDateCandidate = effectiveFromDateBase.date(dateInMonth).hour(originalHourGetter()).minute(originalMinuteGetter());
             if (currentDateCandidate.isBefore(effectiveFromDateBase) || currentDateCandidate.date() !== dateInMonth) {
                currentDateCandidate = effectiveFromDateBase.add(1, 'month').date(dateInMonth);
             }
            // 月末処理の再確認: 1/31開始で、fromDateが2/10の場合、次のインスタンスは2/28(or29)になるべきか、3/31になるべきか。
            // 現在は、fromDate以降で、元の開始日と同じ日付を持つ最初の月。なければ翌月の同じ日付。
            if (currentDateCandidate.date() !== dateInMonth) { // 2/30 のような日付になった場合
                currentDateCandidate = currentDateCandidate.subtract(1,'month').endOf('month');
            }
            break;
        case 'yearly':
            const monthInYear = dayjs(repeatStartDate).month();
            const dateInYearMonth = dayjs(repeatStartDate).date();
            currentDateCandidate = effectiveFromDateBase.month(monthInYear).date(dateInYearMonth).hour(originalHourGetter()).minute(originalMinuteGetter());
            if (currentDateCandidate.isBefore(effectiveFromDateBase) || currentDateCandidate.date() !== dateInYearMonth) {
                currentDateCandidate = effectiveFromDateBase.add(1, 'year').month(monthInYear).date(dateInYearMonth);
            }
            if (currentDateCandidate.date() !== dateInYearMonth) { // うるう年の2/29など
                 currentDateCandidate = currentDateCandidate.month(monthInYear).endOf('month');
            }
            break;
        // 'custom' (days) は下のループで処理
    }
  }


  for (let i = 0; i < 365 * 5 + 14; i++) { // 探索回数を少し増やす
    if (repeatEndDate && currentDateCandidate.isAfter(repeatEndDate)) {
      return null;
    }

    let isValidInstance = true;
    const currentDateStr = currentDateCandidate.format('YYYY-MM-DD');

    // 繰り返し開始日より前の日付はスキップ (ただし、上で調整済みのはず)
    if (currentDateCandidate.isBefore(dayjs(repeatStartDate).startOf('day'))) {
        // isValidInstance = false; // 実質スキップ
    } else {
        if (repeatFrequency === 'weekly') {
            const dayOfWeek = currentDateCandidate.day();
            if (!repeatDaysOfWeek || !repeatDaysOfWeek[dayOfWeek]) {
                isValidInstance = false;
            }
        }
        // if (isExcludeHolidays && isHoliday(currentDateStr)) { isValidInstance = false; }

        if (isValidInstance && currentDateCandidate.isSameOrAfter(fromDate.startOf('day')) && !completedDates.includes(currentDateStr)) {
            return currentDateCandidate;
        }
    }

    const originalHour = originalHourGetter();
    const originalMinute = originalMinuteGetter();

    switch (repeatFrequency) {
      case 'daily':
        currentDateCandidate = currentDateCandidate.add(1, 'day');
        break;
      case 'weekly':
        currentDateCandidate = currentDateCandidate.add(1, 'week');
        break;
      case 'monthly':
        // 'monthly' の場合は常に1ヶ月後。customIntervalValueは参照しない。
        const monthToAdd = 1;
        const baseDateForMonthCalc = dayjs(repeatStartDate).date();
        currentDateCandidate = currentDateCandidate.add(monthToAdd, 'month');
        // 日にちが元の開始日と異なる場合 (例: 1/31の次が2/28)、調整
        if (currentDateCandidate.date() !== baseDateForMonthCalc) {
            // その月の最終日を超えていなければ元の日にちを設定、超えていればその月の最終日
            const lastDayOfMonth = currentDateCandidate.endOf('month').date();
            currentDateCandidate = currentDateCandidate.date(Math.min(baseDateForMonthCalc, lastDayOfMonth));
        }
        break;
      case 'yearly':
        // 'yearly' の場合は常に1年後。customIntervalValueは参照しない。
        const yearToAdd = 1;
        const originalMonthForYearCalc = dayjs(repeatStartDate).month();
        const originalDateForYearCalc = dayjs(repeatStartDate).date();
        currentDateCandidate = currentDateCandidate.add(yearToAdd, 'year');
        // 元の月日に調整 (うるう年などを考慮)
        currentDateCandidate = currentDateCandidate.month(originalMonthForYearCalc).date(originalDateForYearCalc);
        // 2/29のようなケースで日付が存在しない場合、その月の最終日にする (例: 2/28)
        if (currentDateCandidate.month() !== originalMonthForYearCalc) {
            currentDateCandidate = currentDateCandidate.subtract(1, 'day').endOf('month');
        }
        break;
      case 'custom':
        const interval = customIntervalValue || 1; // customIntervalValue が未設定なら1
        if (customIntervalUnit === 'hours') {
          currentDateCandidate = currentDateCandidate.add(interval, 'hour');
        } else { // days
          currentDateCandidate = currentDateCandidate.add(interval, 'day');
        }
        break;
      default:
        return null;
    }
    currentDateCandidate = currentDateCandidate.hour(originalHour).minute(originalMinute);
  }
  return null;
};

export const getDeadlineDisplayText = (actualDueDate: dayjs.Dayjs | null, t: (key: string, options?: any) => string): string => {
  if (!actualDueDate) {
    return t('task_list.no_deadline', '期限なし');
  }
  const now = dayjs();
  const isOverdue = actualDueDate.isBefore(now);

  if (isOverdue) {
    const diffDays = now.diff(actualDueDate, 'day');
    if (diffDays > 0) {
      return t('time.overdue_days', { count: diffDays });
    }
    const diffHours = now.diff(actualDueDate, 'hour');
    if (diffHours > 0) {
      return t('time.overdue_hours', { count: diffHours });
    }
    const diffMinutes = now.diff(actualDueDate, 'minute');
    if (diffMinutes > 0){
        return t('time.overdue_minutes', { count: diffMinutes });
    }
    return t('time.overdue_minutes', { count: 1 });
  }

  const diffMinutes = actualDueDate.diff(now, 'minute');
  if (diffMinutes < 1) return t('time.dueNow', '期限です');
  if (diffMinutes < 60) return t('time.remainingMinutes', { count: diffMinutes });

  const diffHours = actualDueDate.diff(now, 'hour');
  if (diffHours < 24) return t('time.remainingHours', { count: diffHours });

  const diffDays = actualDueDate.diff(now, 'day');
  if (diffDays === 0 && diffHours < 24) {
      return t('time.remainingHours', { count: diffHours });
  }

  const diffMonths = actualDueDate.diff(now, 'month');
  if (diffMonths < 12) {
    if (diffMonths > 0) {
      const remainingDaysInLastMonth = actualDueDate.diff(now.add(diffMonths, 'month'), 'day');
      if (remainingDaysInLastMonth > 0) {
        return t('time.remainingMonthsDays', { months: diffMonths, days: remainingDaysInLastMonth });
      }
      return t('time.remainingMonths', { count: diffMonths });
    }
    // diffMonthsが0の場合は、日単位で表示 (diffDays < 30 の条件でカバー)
  }
  
  if (diffDays < 30 && diffDays > 0) {
    return t('time.remainingDays', { count: diffDays });
  }

  const diffYears = actualDueDate.diff(now, 'year');
  if (diffYears > 0) {
    const remainingMonthsInLastYear = actualDueDate.diff(now.add(diffYears, 'year'), 'month');
    if (remainingMonthsInLastYear > 0) {
      return t('time.remainingYearsMonths', { years: diffYears, months: remainingMonthsInLastYear });
    }
    return t('time.remainingYears', { count: diffYears });
  }
  
  if (diffDays > 0) { // 30日以上で年単位未満の場合
      return t('time.remainingDays', { count: diffDays });
  }

  return t('time.dueNow', '期限です');
};

export const getTimeText = (task: Task, t: (key: string, options?: any) => string, displayInstanceDate?: dayjs.Dayjs | null, displayStartDate?: dayjs.Dayjs | null): string => {
  const now = dayjs();

  if (task.deadlineDetails?.isPeriodSettingEnabled && displayStartDate && displayStartDate.isAfter(now)) {
    const diffMinutes = displayStartDate.diff(now, 'minute');
    if (diffMinutes < 1) return t('time.startsInMinutes', { count: 1 });
    if (diffMinutes < 60) return t('time.startsInMinutes', { count: diffMinutes });

    const diffHours = displayStartDate.diff(now, 'hour');
    if (diffHours < 24) return t('time.startsInHours', { count: diffHours });

    if (displayStartDate.isSame(now.add(1, 'day'), 'day')) return t('time.startsTomorrow');

    return t('time.startsOnDate', { date: displayStartDate.locale(i18n.language).format(t('common.month_day_format', 'M月D日')) });
  }

  const dateToCompare = displayInstanceDate || calculateActualDueDate(task);
  return getDeadlineDisplayText(dateToCompare, t);
};

export const getTimeColor = (task: Task, isDark: boolean, displayDeadlineDate?: dayjs.Dayjs | null, displayStartDate?: dayjs.Dayjs | null): string => {
  const now = dayjs();

  if (displayStartDate && displayStartDate.isAfter(now)) {
    const actualDueDate = displayDeadlineDate || calculateActualDueDate(task);
    if (actualDueDate && actualDueDate.isAfter(now)) {
        return isDark ? '#E0E0E0' : '#212121';
    }
  }

  const dateToCompare = displayDeadlineDate !== undefined ? displayDeadlineDate : calculateActualDueDate(task);

  if (!dateToCompare) {
    return isDark ? '#8E8E93' : '#6D6D72';
  }

  if (dateToCompare.isBefore(now)) {
    return isDark ? '#FF6B6B' : '#D32F2F';
  }

  const oneHourLater = now.add(1, 'hour');
  if (dateToCompare.isBefore(oneHourLater)) {
    return isDark ? '#FFD93D' : '#FFA000';
  }

  const oneDayLater = now.add(1, 'day');
  if (dateToCompare.isBefore(oneDayLater)) {
    return isDark ? '#FFC107' : '#FFB300';
  }

  return isDark ? '#E0E0E0' : '#212121';
};

if (i18n.isInitialized) {
    dayjs.locale(i18n.language.split('-')[0]);
}
i18n.on('languageChanged', (lng) => {
  dayjs.locale(lng.split('-')[0]);
});