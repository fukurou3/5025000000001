import { useState, useCallback } from 'react';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

export const useDeadlinePicker = (initial: Date) => {
  const [deadline, setDeadline] = useState<Date>(initial);

  const showDatePicker = useCallback(() => {
    DateTimePickerAndroid.open({
      value: deadline,
      mode: 'date',
      is24Hour: true,
      onChange: (_e, d) => {
        if (d) {
          setDeadline(
            new Date(
              d.getFullYear(),
              d.getMonth(),
              d.getDate(),
              deadline.getHours(),
              deadline.getMinutes()
            )
          );
        }
      },
    });
  }, [deadline]);

  const showTimePicker = useCallback(() => {
    DateTimePickerAndroid.open({
      value: deadline,
      mode: 'time',
      is24Hour: true,
      onChange: (_e, t) => {
        if (t) {
          setDeadline(
            new Date(
              deadline.getFullYear(),
              deadline.getMonth(),
              deadline.getDate(),
              t.getHours(),
              t.getMinutes()
            )
          );
        }
      },
    });
  }, [deadline]);

  return { deadline, setDeadline, showDatePicker, showTimePicker };
};
