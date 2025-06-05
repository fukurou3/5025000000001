// features/calendar/utils.ts
import dayjs from 'dayjs';
import { MarkedDates } from 'react-native-calendars/src/types';
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

export const getHolidayMarksForMonths = (
  months: dayjs.Dayjs[],
  currentMarks: MarkedDates
): MarkedDates => {
  const newMarks: MarkedDates = { ...currentMarks };
  months.forEach(month => {
    const start = month.startOf('month');
    const end = month.endOf('month');
    for (let d = start; d.isBefore(end.add(1, 'day')); d = d.add(1, 'day')) {
      const ds = d.format('YYYY-MM-DD');
      if (isHoliday(new Date(ds))) {
        newMarks[ds] = { ...(newMarks[ds] || {}), marked: true, dotColor: 'red' };
      }
    }
  });
  return newMarks;
};

export const createMarkedDates = (
  grouped: Record<string, Task[]>,
  selected: string,
  holidayMarks: MarkedDates,
  subColor: string
): MarkedDates => {
  const marks: MarkedDates = { ...holidayMarks };
  Object.keys(grouped).forEach(date => {
    marks[date] = { ...(marks[date] || {}), marked: true, dotColor: subColor };
  });

  marks[selected] = {
    ...(marks[selected] || {}),
    selected: true,
    selectedColor: subColor,
    disableTouchEvent: true
  };

  return marks;
};