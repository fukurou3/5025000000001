import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import type { AddTaskStyles } from '../_types';
import { LIGHT_INPUT_BG, DARK_INPUT_BG } from '../_constants';

interface NotificationToggleProps {
  notifyEnabled: boolean;
  onToggle: () => void;
  styles: AddTaskStyles;
  subColor: string;
  isDark: boolean;
}

export const NotificationToggle: React.FC<NotificationToggleProps> = ({
  notifyEnabled,
  onToggle,
  styles,
  subColor,
  isDark,
}) => (
  <TouchableOpacity
    style={[
      styles.toggleContainer,
      notifyEnabled
        ? { backgroundColor: subColor }
        : { backgroundColor: isDark ? DARK_INPUT_BG : LIGHT_INPUT_BG },
    ]}
    onPress={onToggle}
  >
    <View
      style={[
        styles.toggleCircle,
        notifyEnabled
          ? { alignSelf: 'flex-end' }
          : { alignSelf: 'flex-start' },
      ]}
    />
  </TouchableOpacity>
);
