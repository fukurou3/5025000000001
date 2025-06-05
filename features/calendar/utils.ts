import dayjs from 'dayjs';
import { MarkedDates } from 'react-native-calendars';
import { isHoliday } from '@holiday-jp/holiday_jp';
import type { Task } from '@/features/tasks/types';
import { calculateActualDueDate, calculateNextDisplayInstanceDate } from '@/features/tasks/utils';

export const groupTasksByDate = (tasks: Task[]): Record<string, Task[]> => {
  const map: Record<string, Task[]> = {};
  const add = (date: dayjs.Dayjs | null, task: Task) => {
    if (!date) return;
    const key = date.local().format('YYYY-MM-DD');
    if (!map[key]) map[key] = [];
    map[key].push(task);
  };

  tasks.forEach(task => {
    if (task.deadlineDetails?.repeatFrequency) {
      task.completedInstanceDates?.forEach(d => add(dayjs.utc(d), task));
      add(calculateNextDisplayInstanceDate(task), task);
    } else {
      add(calculateActualDueDate(task), task);
    }
  });

  return map;
};

export const createMarkedDates = (
  grouped: Record<string, Task[]>,
  selected: string,
  language: string,
  subColor: string
): MarkedDates => {
  const marks: MarkedDates = {};
  Object.keys(grouped).forEach(date => {
    marks[date] = { marked: true, dotColor: subColor };
  });
  if (language.startsWith('ja')) {
    const month = dayjs(selected).startOf('month');
    const end = dayjs(selected).endOf('month');
    for (let d = month; d.isBefore(end.add(1, 'day')); d = d.add(1, 'day')) {
      const ds = d.format('YYYY-MM-DD');
      if (isHoliday(new Date(ds))) {
        marks[ds] = { ...(marks[ds] || {}), marked: true, dotColor: 'red' };
      }
    }
  }
  marks[selected] = { ...(marks[selected] || {}), selected: true };
  return marks;
};
