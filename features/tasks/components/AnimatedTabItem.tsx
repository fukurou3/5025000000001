// app/features/tasks/components/AnimatedTabItem.tsx
import React from 'react';
import { TouchableOpacity, type TextStyle } from 'react-native';
import Reanimated, { useAnimatedStyle, interpolateColor } from 'react-native-reanimated';
import type { TaskScreenStyles } from '@/features/tasks/styles';
import { TAB_MARGIN_RIGHT } from '../constants';

type AnimatedTabItemProps = {
  styles: TaskScreenStyles;
  label: string;
  index: number;
  onPress: () => void;
  onLayout: (event: any) => void;
  pageScrollPosition: Reanimated.SharedValue<number>;
  pageScrollOffset: Reanimated.SharedValue<number>;
  selectedColorString: string;
  unselectedColorString: string;
};

export const AnimatedTabItem: React.FC<AnimatedTabItemProps> = ({
  styles,
  label,
  index,
  onPress,
  onLayout,
  pageScrollPosition,
  pageScrollOffset,
  selectedColorString,
  unselectedColorString,
}) => {
  const tabAnimatedTextStyle = useAnimatedStyle(() => {
    const currentPosition = pageScrollPosition.value;
    const currentOffset = pageScrollOffset.value;
    let finalColor: string | number;

    if (index === Math.floor(currentPosition)) {
      finalColor = interpolateColor(currentOffset, [0, 1], [selectedColorString, unselectedColorString]);
    }
    else if (index === Math.floor(currentPosition) + 1) {
      finalColor = interpolateColor(currentOffset, [0, 1], [unselectedColorString, selectedColorString]);
    }
    else {
      finalColor = unselectedColorString;
    }

    if (currentOffset === 0) {
      finalColor = (index === Math.round(currentPosition)) ? selectedColorString : unselectedColorString;
    }

    return {
      color: finalColor as string,
    };
  });

  const animatedFontWeightStyle = useAnimatedStyle(() => {
    const currentPosition = pageScrollPosition.value;
    const currentOffset = pageScrollOffset.value;
    let isActive = false;
    const activeThreshold = 0.5;

    if (index === Math.floor(currentPosition)) {
        isActive = currentOffset < activeThreshold;
    } else if (index === Math.floor(currentPosition) + 1) {
        isActive = currentOffset >= activeThreshold;
    }

    if (currentOffset === 0) {
        isActive = (index === Math.round(currentPosition));
    }

    return {
      fontWeight: isActive
        ? styles.folderTabSelectedText.fontWeight
        : styles.folderTabText.fontWeight,
    };
  });

  return (
    <TouchableOpacity
      style={[styles.folderTabButton, { borderBottomWidth: 0, marginRight: TAB_MARGIN_RIGHT }]}
      onPress={onPress}
      onLayout={onLayout}
      activeOpacity={0.7}
    >
      <Reanimated.Text
        style={[
          styles.folderTabText,
          tabAnimatedTextStyle,
          animatedFontWeightStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Reanimated.Text>
    </TouchableOpacity>
  );
};