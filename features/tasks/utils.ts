// app/features/tasks/utils.ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { Task } from './types';
import i18n from '@/lib/i18n';

dayjs.extend(utc);
dayjs.extend(timezone);

export const calculateActualDueDate = (task: Task): dayjs.Dayjs | null => {
  const { deadlineDetails, deadline: taskDeadlineISO } = task;
  if (!deadlineDetails) {
    return taskDeadlineISO ? dayjs.utc(taskDeadlineISO) : null;
  }

  if (deadlineDetails.taskDeadlineDate) {
    let deadlineMoment = dayjs.utc(deadlineDetails.taskDeadlineDate);
    if (deadlineDetails.isTaskDeadlineTimeEnabled && deadlineDetails.taskDeadlineTime) {
      deadlineMoment = deadlineMoment
        .hour(deadlineDetails.taskDeadlineTime.hour)
        .minute(deadlineDetails.taskDeadlineTime.minute)
        .second(0)
        .millisecond(0);
    } else {
      deadlineMoment = deadlineMoment.startOf('day');
    }
    return deadlineMoment;
  }
  return taskDeadlineISO ? dayjs.utc(taskDeadlineISO) : null;
};

export const calculateNextDisplayInstanceDate = (task: Task, fromDateLocal: dayjs.Dayjs = dayjs()): dayjs.Dayjs | null => {
  if (!task.deadlineDetails?.repeatFrequency || !task.deadlineDetails.repeatStartDate) {
    return calculateActualDueDate(task);
  }

  const {
    repeatFrequency,
    repeatStartDate: repeatStartDateStr,
    repeatDaysOfWeek,
    customIntervalValue,
    customIntervalUnit,
    repeatEnds,
    taskStartTime,
    isTaskStartTimeEnabled,
  } = task.deadlineDetails;

  const fromDateUtc = fromDateLocal.utc();

  let currentDateCandidateUtc: dayjs.Dayjs;
  const originalRepeatStartDateUtc = dayjs.utc(repeatStartDateStr);

  if (isTaskStartTimeEnabled && taskStartTime) {
    currentDateCandidateUtc = originalRepeatStartDateUtc
      .hour(taskStartTime.hour)
      .minute(taskStartTime.minute)
      .second(0)
      .millisecond(0);
  } else {
    currentDateCandidateUtc = originalRepeatStartDateUtc.startOf('day');
  }

  const completedDates = task.completedInstanceDates || [];
  // 修正: repeatEnds の type をチェックして date プロパティに安全にアクセスする
  const repeatEndDateUtc = (repeatEnds && repeatEnds.type === 'on_date' && repeatEnds.date)
    ? dayjs.utc(repeatEnds.date).endOf('day')
    : null;

  let effectiveFromDateUtc = originalRepeatStartDateUtc.startOf('day');
  if (fromDateUtc.isAfter(effectiveFromDateUtc)) {
      effectiveFromDateUtc = fromDateUtc.startOf('day');
  }

  const originalHour = isTaskStartTimeEnabled && taskStartTime ? taskStartTime.hour : 0;
  const originalMinute = isTaskStartTimeEnabled && taskStartTime ? taskStartTime.minute : 0;

  if (currentDateCandidateUtc.isBefore(effectiveFromDateUtc) && !(repeatFrequency === 'custom' && customIntervalUnit === 'hours')) {
    switch (repeatFrequency) {
        case 'daily':
            currentDateCandidateUtc = effectiveFromDateUtc.hour(originalHour).minute(originalMinute);
            if (currentDateCandidateUtc.isBefore(effectiveFromDateUtc)) currentDateCandidateUtc = currentDateCandidateUtc.add(1, 'day');
            break;
        case 'weekly':
            const originalStartDay = originalRepeatStartDateUtc.day();
            currentDateCandidateUtc = effectiveFromDateUtc.day(originalStartDay).hour(originalHour).minute(originalMinute);
            if (currentDateCandidateUtc.isBefore(effectiveFromDateUtc)) {
                 currentDateCandidateUtc = currentDateCandidateUtc.add(1, 'week');
            }
            break;
        case 'monthly':
            const dateInMonth = originalRepeatStartDateUtc.date();
            currentDateCandidateUtc = effectiveFromDateUtc.date(dateInMonth).hour(originalHour).minute(originalMinute);
             if (currentDateCandidateUtc.isBefore(effectiveFromDateUtc) || currentDateCandidateUtc.date() !== dateInMonth) {
                currentDateCandidateUtc = effectiveFromDateUtc.add(1, 'month').date(dateInMonth);
             }
            if (currentDateCandidateUtc.date() !== dateInMonth) {
                currentDateCandidateUtc = currentDateCandidateUtc.subtract(1,'month').endOf('month');
            }
            break;
        case 'yearly':
            const monthInYear = originalRepeatStartDateUtc.month();
            const dateInYearMonth = originalRepeatStartDateUtc.date();
            currentDateCandidateUtc = effectiveFromDateUtc.month(monthInYear).date(dateInYearMonth).hour(originalHour).minute(originalMinute);
            if (currentDateCandidateUtc.isBefore(effectiveFromDateUtc) || currentDateCandidateUtc.date() !== dateInYearMonth) {
                currentDateCandidateUtc = effectiveFromDateUtc.add(1, 'year').month(monthInYear).date(dateInYearMonth);
            }
            if (currentDateCandidateUtc.date() !== dateInYearMonth) {
                 currentDateCandidateUtc = currentDateCandidateUtc.month(monthInYear).endOf('month');
            }
            break;
    }
  }

  for (let i = 0; i < 365 * 5 + 14; i++) {
    if (repeatEndDateUtc && currentDateCandidateUtc.isAfter(repeatEndDateUtc)) {
      return null;
    }

    let isValidInstance = true;
    const currentDateStr = currentDateCandidateUtc.format('YYYY-MM-DD');

    if (currentDateCandidateUtc.isBefore(originalRepeatStartDateUtc.startOf('day'))) {
        // isValidInstance = false; // Should be handled by above adjustment
    } else {
        if (repeatFrequency === 'weekly') {
            const dayOfWeek = currentDateCandidateUtc.day();
            if (!repeatDaysOfWeek || !repeatDaysOfWeek[dayOfWeek]) {
                isValidInstance = false;
            }
        }

        if (isValidInstance && currentDateCandidateUtc.isSameOrAfter(fromDateUtc.startOf('day')) && !completedDates.includes(currentDateStr)) {
            return currentDateCandidateUtc;
        }
    }

    const originalDateForCalc = originalRepeatStartDateUtc.date();

    switch (repeatFrequency) {
      case 'daily':
        currentDateCandidateUtc = currentDateCandidateUtc.add(1, 'day');
        break;
      case 'weekly':
        currentDateCandidateUtc = currentDateCandidateUtc.add(1, 'week');
        break;
      case 'monthly':
        let nextMonthCandidate = currentDateCandidateUtc.add(1, 'month');
        if (nextMonthCandidate.date() !== originalDateForCalc) {
            const lastDayOfNextMonth = nextMonthCandidate.endOf('month').date();
            nextMonthCandidate = nextMonthCandidate.date(Math.min(originalDateForCalc, lastDayOfNextMonth));
        }
        currentDateCandidateUtc = nextMonthCandidate;
        break;
      case 'yearly':
        let nextYearCandidate = currentDateCandidateUtc.add(1, 'year');
        const originalMonth = originalRepeatStartDateUtc.month();
        if (nextYearCandidate.month() !== originalMonth || nextYearCandidate.date() !== originalDateForCalc) {
             nextYearCandidate = nextYearCandidate.month(originalMonth).date(originalDateForCalc);
             if (nextYearCandidate.month() !== originalMonth) {
                nextYearCandidate = nextYearCandidate.subtract(1,'day').endOf('month');
             }
        }
        currentDateCandidateUtc = nextYearCandidate;
        break;
      case 'custom':
        const interval = customIntervalValue || 1;
        if (customIntervalUnit === 'hours') {
          currentDateCandidateUtc = currentDateCandidateUtc.add(interval, 'hour');
        } else {
          currentDateCandidateUtc = currentDateCandidateUtc.add(interval, 'day');
        }
        break;
      default:
        return null;
    }
    currentDateCandidateUtc = currentDateCandidateUtc.hour(originalHour).minute(originalMinute);
  }
  return null;
};

export const getDeadlineDisplayText = (actualDueDateUtc: dayjs.Dayjs | null, t: (key: string, options?: any) => string): string => {
  if (!actualDueDateUtc) {
    return t('task_list.no_deadline', '期限なし');
  }
  const nowLocal = dayjs();
  const actualDueDateLocal = actualDueDateUtc.local();

  const isOverdue = actualDueDateLocal.isBefore(nowLocal);

  if (isOverdue) {
    const diffDays = nowLocal.diff(actualDueDateLocal, 'day');
    if (diffDays > 0) {
      return t('time.overdue_days', { count: diffDays });
    }
    const diffHours = nowLocal.diff(actualDueDateLocal, 'hour');
    if (diffHours > 0) {
      return t('time.overdue_hours', { count: diffHours });
    }
    const diffMinutes = nowLocal.diff(actualDueDateLocal, 'minute');
    if (diffMinutes > 0){
        return t('time.overdue_minutes', { count: diffMinutes });
    }
    return t('time.overdue_minutes', { count: 1 });
  }

  const diffMinutes = actualDueDateLocal.diff(nowLocal, 'minute');
  if (diffMinutes < 1) return t('time.dueNow', '期限です');
  if (diffMinutes < 60) return t('time.remainingMinutes', { count: diffMinutes });

  const diffHours = actualDueDateLocal.diff(nowLocal, 'hour');
  if (diffHours < 24 && actualDueDateLocal.isSame(nowLocal, 'day')) {
     return t('time.remainingHours', { count: diffHours });
  }


  const diffDays = actualDueDateLocal.diff(nowLocal, 'day');
   if (diffDays === 0 && diffHours < 24 ) {
      return t('time.remainingHours', { count: diffHours });
  }
  if (diffDays === 0 && actualDueDateLocal.isAfter(nowLocal)) {
     return t('time.remainingHours', { count: diffHours });
  }


  const diffMonths = actualDueDateLocal.diff(nowLocal, 'month');
  if (diffMonths < 12) {
    if (diffMonths > 0) {
      const remainingDaysInLastMonth = actualDueDateLocal.diff(nowLocal.add(diffMonths, 'month'), 'day');
      if (remainingDaysInLastMonth > 0) {
        return t('time.remainingMonthsDays', { months: diffMonths, days: remainingDaysInLastMonth });
      }
      return t('time.remainingMonths', { count: diffMonths });
    }
  }

  if (diffDays < 30 && diffDays >= 0) {
    return t('time.remainingDays', { count: diffDays });
  }


  const diffYears = actualDueDateLocal.diff(nowLocal, 'year');
  if (diffYears > 0) {
    const remainingMonthsInLastYear = actualDueDateLocal.diff(nowLocal.add(diffYears, 'year'), 'month');
    if (remainingMonthsInLastYear > 0) {
      return t('time.remainingYearsMonths', { years: diffYears, months: remainingMonthsInLastYear });
    }
    return t('time.remainingYears', { count: diffYears });
  }

  if (diffDays >= 0) {
      return t('time.remainingDays', { count: diffDays });
  }

  return actualDueDateLocal.locale(i18n.language).format(t('common.date_time_format_short', 'M/D HH:mm'));
};


export const getTimeText = (
  task: Task,
  t: (key: string, options?: any) => string,
  displayInstanceDateUtc?: dayjs.Dayjs | null,
  displayStartDateUtc?: dayjs.Dayjs | null
): string => {
  const nowLocal = dayjs();

  if (task.deadlineDetails?.isPeriodSettingEnabled && displayStartDateUtc && displayStartDateUtc.local().isAfter(nowLocal)) {
    const displayStartDateLocal = displayStartDateUtc.local();
    const diffMinutes = displayStartDateLocal.diff(nowLocal, 'minute');
    if (diffMinutes < 1) return t('time.startsInMinutes', { count: 1 });
    if (diffMinutes < 60) return t('time.startsInMinutes', { count: diffMinutes });

    const diffHours = displayStartDateLocal.diff(nowLocal, 'hour');
    if (diffHours < 24) return t('time.startsInHours', { count: diffHours });

    if (displayStartDateLocal.isSame(nowLocal.add(1, 'day'), 'day')) return t('time.startsTomorrow');

    return t('time.startsOnDate', { date: displayStartDateLocal.locale(i18n.language).format(t('common.month_day_format', 'M月D日')) });
  }

  const dateToCompareUtc = displayInstanceDateUtc || calculateActualDueDate(task);
  return getDeadlineDisplayText(dateToCompareUtc, t);
};

export const getTimeColor = (
    task: Task,
    isDark: boolean,
    displayDeadlineDateUtc?: dayjs.Dayjs | null,
    displayStartDateUtc?: dayjs.Dayjs | null
): string => {
  const nowLocal = dayjs();

  if (displayStartDateUtc && displayStartDateUtc.local().isAfter(nowLocal)) {
    const actualDueDateUtc = displayDeadlineDateUtc || calculateActualDueDate(task);
    if (actualDueDateUtc && actualDueDateUtc.local().isAfter(nowLocal)) {
        return isDark ? '#E0E0E0' : '#212121';
    }
  }

  const dateToCompareUtc = displayDeadlineDateUtc !== undefined ? displayDeadlineDateUtc : calculateActualDueDate(task);

  if (!dateToCompareUtc) {
    return isDark ? '#8E8E93' : '#6D6D72';
  }
  const dateToCompareLocal = dateToCompareUtc.local();

  if (dateToCompareLocal.isBefore(nowLocal)) {
    return isDark ? '#FF6B6B' : '#D32F2F';
  }

  const oneHourLaterLocal = nowLocal.add(1, 'hour');
  if (dateToCompareLocal.isBefore(oneHourLaterLocal)) {
    return isDark ? '#FFD93D' : '#FFA000';
  }

  const oneDayLaterLocal = nowLocal.add(1, 'day');
  if (dateToCompareLocal.isBefore(oneDayLaterLocal)) {
    return isDark ? '#FFC107' : '#FFB300';
  }

  return isDark ? '#E0E0E0' : '#212121';
};

if (i18n.isInitialized) {
    dayjs.locale(i18n.language.split('-')[0]);
    dayjs.tz.setDefault(dayjs.tz.guess());
}
i18n.on('languageChanged', (lng) => {
  dayjs.locale(lng.split('-')[0]);
  dayjs.tz.setDefault(dayjs.tz.guess());
});