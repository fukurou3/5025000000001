// app/features/tasks/utils.ts

import dayjs from 'dayjs';

export const getTimeText = (deadline: string | undefined, t: any) => {
  if (!deadline) {
    return t('task_list.no_deadline');
  }
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

export const getTimeColor = (deadline: string | undefined, isDark: boolean) => {
  if (!deadline) {
    return isDark ? '#ffffff' : '#000000'; // 期限なし
  }

  const now = dayjs();
  const due = dayjs(deadline);

  if (due.isBefore(now)) {
    return isDark ? '#ff6b6b' : '#d32f2f'; // 期限切れ (赤色)
  }

  // 期限まで24時間以内かどうかを判定
  const oneDayLater = now.add(1, 'day');
  if (due.isBefore(oneDayLater)) {
    return isDark ? '#ffd93d' : '#ff9800'; // 残り一日未満 (黄色)
  }

  // それ以外 (期限が24時間以上先)
  return isDark ? '#ffffff' : '#000000'; // 通常色
};