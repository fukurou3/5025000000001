// C:\Users\fukur\task-app\app\app\lib\tasks\taskUtils.ts

import dayjs from 'dayjs';

export const getTimeText = (deadline: string, t: any) => {
  const now = dayjs();
  const due = dayjs(deadline);
  const diff = due.diff(now, 'minute');
  if (diff < 0) {
    const past = now.diff(due, 'minute');
    if (past < 60) return t('time.minutesAgo', { count: past });
    if (past < 1440) return t('time.hoursAgo', { count: Math.floor(past / 60) });
    return t('time.daysAgo', { count: Math.floor(past / 1440) });
  } else {
    if (diff < 60) return t('time.remainingMinutes', { count: diff });
    if (diff < 1440) return t('time.remainingHours', { count: Math.floor(diff / 60) });
    return t('time.remainingDays', { count: Math.floor(diff / 1440) });
  }
};

export const getTimeColor = (deadline: string, isDark: boolean) => {
  const now = dayjs();
  const due = dayjs(deadline);
  if (due.isBefore(now)) return isDark ? '#ff6b6b' : '#d32f2f';
  if (due.isSame(now, 'day')) return isDark ? '#ffd93d' : '#ff9800';
  return isDark ? '#fff' : '#000';
};
