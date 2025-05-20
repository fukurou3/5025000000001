// app/features/tasks/utils.ts
import dayjs from 'dayjs';
import type { Task } from './types';

const calculateActualDueDate = (task: Task): dayjs.Dayjs | null => {
  if (!task.deadline) {
    return null;
  }

  const baseDate = dayjs(task.deadline);

  if (task.deadlineDetails?.repeatFrequency) {
    if (task.deadlineDetails.isTaskStartTimeEnabled && task.deadlineDetails.taskDuration) {
      let dueDate = dayjs(baseDate);
      const { amount, unit } = task.deadlineDetails.taskDuration;
      switch (unit) {
        case 'minutes':
          dueDate = dueDate.add(amount, 'minute');
          break;
        case 'hours':
          dueDate = dueDate.add(amount, 'hour');
          break;
        case 'days':
          dueDate = dueDate.add(amount, 'day');
          break;
        case 'months':
          dueDate = dueDate.add(amount, 'month');
          break;
        case 'years':
          dueDate = dueDate.add(amount, 'year');
          break;
      }
      return dueDate;
    }
    return null;
  } else {
    return baseDate;
  }
};
export { calculateActualDueDate }; // <--- 修正: エクスポートを追加

export const getTimeText = (task: Task, t: (key: string, options?: any) => string): string => {
  const actualDueDate = calculateActualDueDate(task);

  if (!actualDueDate) {
    return t('task_list.no_deadline', '期限なし');
  }

  const now = dayjs();

  if (actualDueDate.isBefore(now)) {
    const yearsPassed = now.diff(actualDueDate, 'year');
    const monthsPassedTotal = now.diff(actualDueDate, 'month');
    const daysPassedTotal = now.diff(actualDueDate, 'day');
    const hoursPassedTotal = now.diff(actualDueDate, 'hour');
    const minutesPassedTotal = now.diff(actualDueDate, 'minute');

    if (minutesPassedTotal < 1) return t('time.justNow', 'たった今');
    if (hoursPassedTotal < 1) return t('time.minutesAgo', { count: minutesPassedTotal });
    if (daysPassedTotal < 1) return t('time.hoursAgo', { count: hoursPassedTotal });
    if (monthsPassedTotal < 1) return t('time.daysAgo', { count: daysPassedTotal });

    if (yearsPassed < 1) {
      return t('time.monthsAgoApprox', { count: monthsPassedTotal });
    } else {
      const monthsInYearRemainder = now.subtract(yearsPassed, 'year').diff(actualDueDate, 'month');
      if (monthsInYearRemainder === 0) {
        return t('time.yearsAgoExact', { count: yearsPassed });
      }
      return t('time.yearsMonthsAgo', { years: yearsPassed, months: monthsInYearRemainder });
    }
  } else {
    const yearsRemaining = actualDueDate.diff(now, 'year');
    const monthsRemainingTotal = actualDueDate.diff(now, 'month');
    const daysRemainingTotal = actualDueDate.diff(now, 'day');
    const hoursRemainingTotal = actualDueDate.diff(now, 'hour');
    const minutesRemainingTotal = actualDueDate.diff(now, 'minute');

    if (minutesRemainingTotal < 1 && hoursRemainingTotal < 1 && daysRemainingTotal < 1 ) return t('time.dueNow', '期限です');

    if (hoursRemainingTotal < 1) return t('time.remainingMinutes', { count: minutesRemainingTotal });
    if (daysRemainingTotal < 1) return t('time.remainingHours', { count: hoursRemainingTotal });
    if (monthsRemainingTotal < 1) return t('time.remainingDays', { count: daysRemainingTotal });

    if (yearsRemaining < 1) {
      const monthsPart = monthsRemainingTotal;
      const daysPart = actualDueDate.subtract(monthsPart, 'month').diff(now, 'day');
      if (daysPart === 0 && monthsPart > 0) {
          return t('time.remainingMonths', { count: monthsPart });
      }
      if (monthsPart === 0 && daysPart > 0) {
          return t('time.remainingDays', { count: daysPart });
      }
      if (monthsPart > 0) {
        return t('time.remainingMonthsDays', { months: monthsPart, days: daysPart });
      }
      return t('time.remainingDays', { count: daysRemainingTotal });

    } else {
      const monthsInYearRemainder = actualDueDate.subtract(yearsRemaining, 'year').diff(now, 'month');
      if (monthsInYearRemainder === 0) {
          return t('time.remainingYears', { count: yearsRemaining });
      }
      return t('time.remainingYearsMonths', { years: yearsRemaining, months: monthsInYearRemainder });
    }
  }
};

export const getTimeColor = (task: Task, isDark: boolean): string => {
  const actualDueDate = calculateActualDueDate(task);

  if (!actualDueDate) {
    return isDark ? '#8E8E93' : '#6D6D72';
  }

  const now = dayjs();

  if (actualDueDate.isBefore(now)) {
    return isDark ? '#FF6B6B' : '#D32F2F';
  }

  const oneHourLater = now.add(1, 'hour');
  if (actualDueDate.isBefore(oneHourLater)) {
    return isDark ? '#FFD93D' : '#FFA000';
  }

  const oneDayLater = now.add(1, 'day');
  if (actualDueDate.isBefore(oneDayLater)) {
    return isDark ? '#FFC107' : '#FFB300';
  }

  return isDark ? '#E0E0E0' : '#212121';
};