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
  isActive: boolean; // For fontWeight, determined by current settled page
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
  isActive,
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

    // Determine color based on scroll position and offset
    // This tab is the current "from" tab or is fully selected
    if (index === Math.floor(currentPosition)) {
      finalColor = interpolateColor(currentOffset, [0, 1], [selectedColorString, unselectedColorString]);
    }
    // This tab is the "to" tab
    else if (index === Math.floor(currentPosition) + 1) {
      finalColor = interpolateColor(currentOffset, [0, 1], [unselectedColorString, selectedColorString]);
    }
    // This tab is not part of the current transition
    else {
      finalColor = unselectedColorString;
    }

    // Ensure correct color when page is settled (offset is 0)
    if (currentOffset === 0) {
      finalColor = (index === Math.round(currentPosition)) ? selectedColorString : unselectedColorString;
    }

    return {
      color: finalColor as string,
    };
  });

  // fontWeight is not smoothly interpolated here, it changes when isActive (settled page) changes.
  // For smooth fontWeight interpolation, you might need different font files or advanced techniques.
  const fontWeightStyle: TextStyle['fontWeight'] = isActive
    ? styles.folderTabSelectedText.fontWeight
    : styles.folderTabText.fontWeight;

  return (
    <TouchableOpacity
      style={[styles.folderTabButton, { borderBottomWidth: 0, marginRight: TAB_MARGIN_RIGHT }]} // Added marginRight from constants
      onPress={onPress}
      onLayout={onLayout}
      activeOpacity={0.7}
    >
      <Reanimated.Text
        style={[
          styles.folderTabText,
          tabAnimatedTextStyle,
          { fontWeight: fontWeightStyle },
        ]}
        numberOfLines={1}
      >
        {label}
      </Reanimated.Text>
    </TouchableOpacity>
  );
};