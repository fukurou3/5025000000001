import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import type { AddTaskStyles } from '../_types';

interface DeadlinePickerProps {
  deadline: Date;
  showDatePicker: () => void;
  showTimePicker: () => void;
  styles: AddTaskStyles;
}

export const DeadlinePicker: React.FC<DeadlinePickerProps> = ({
  deadline,
  showDatePicker,
  showTimePicker,
  styles,
}) =>
  Platform.OS === 'android' ? (
    <View style={styles.datetimeRow}>
      <TouchableOpacity
        style={[styles.fieldWrapper, styles.dateWrapper]}
        onPress={showDatePicker}
      >
        <Text style={styles.datetimeText}>
          {deadline.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.fieldWrapper, styles.timeWrapper]}
        onPress={showTimePicker}
      >
        <Text style={styles.datetimeText}>
          {deadline.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </TouchableOpacity>
    </View>
  ) : null;
