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
  // isActive prop は不要になります
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
    const effectivePage = pageScrollPosition.value + pageScrollOffset.value;
    const shouldBeThick = effectivePage >= index - 0.6 && effectivePage < index + 0.6;

    return {
      fontWeight: shouldBeThick
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
          animatedFontWeightStyle, // fontWeight のスタイルを適用
        ]}
        numberOfLines={1}
      >
        {label}
      </Reanimated.Text>
    </TouchableOpacity>
  );
};