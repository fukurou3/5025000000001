// app/features/tasks/components/AnimatedTabItem.tsx
import React from 'react';
import { TouchableOpacity, type LayoutChangeEvent } from 'react-native'; // TextStyle を削除 (直接使わないため)
import Reanimated, { useAnimatedStyle, interpolateColor, interpolate, Extrapolate } from 'react-native-reanimated';
// import type { TaskScreenStyles } from '@/features/tasks/styles'; // styles prop を使わないので削除可能
import { TAB_MARGIN_RIGHT } from '../constants'; // これは元のままでOK

type AnimatedTabItemProps = {
  // styles: TaskScreenStyles; // styles prop を削除
  label: string;
  index: number;
  onPress: (index: number, label: string) => void;
  onTabLayout: (index: number, event: LayoutChangeEvent) => void;
  pageScrollPosition: Reanimated.SharedValue<number>;
  pageScrollOffset: Reanimated.SharedValue<number>;
  selectedTextColor: string; // selectedColorString から変更
  unselectedTextColor: string; // unselectedColorString から変更
  selectedFontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | undefined; // fontWeight を直接受け取る
  unselectedFontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | undefined; // fontWeight を直接受け取る
  baseTabTextStyle: any; // styles.folderTabText 相当のスタイルを直接受け取る
  baseTabButtonStyle: any; // styles.folderTabButton 相当のスタイルを直接受け取る
};

export const AnimatedTabItem: React.FC<AnimatedTabItemProps> = React.memo(({
  // styles, //削除
  label,
  index,
  onPress,
  onTabLayout,
  pageScrollPosition,
  pageScrollOffset,
  selectedTextColor, //変更
  unselectedTextColor, //変更
  selectedFontWeight,
  unselectedFontWeight,
  baseTabTextStyle,
  baseTabButtonStyle,
}) => {
  // const selectedFontWeight = styles.folderTabSelectedText.fontWeight; // props から受け取るように変更
  // const unselectedFontWeight = styles.folderTabText.fontWeight; // props から受け取るように変更

  const handlePress = () => {
    onPress(index, label);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    onTabLayout(index, event);
  };

  const animatedTextStyle = useAnimatedStyle(() => {
    'worklet';
    const absolutePosition = pageScrollPosition.value + pageScrollOffset.value;

    const progress = interpolate(
      absolutePosition,
      [index - 1, index, index + 1],
      [0, 1, 0],
      Extrapolate.CLAMP
    );

    const color = interpolateColor(
      progress,
      [0, 1],
      [unselectedTextColor, selectedTextColor] // props から受け取った色を使用
    );

    // fontWeight の扱いをテストコードに合わせて単純化 (progress > 0.5 で判定)
    const fontWeight = progress > 0.5 ? selectedFontWeight : unselectedFontWeight;

    return {
      color: color as string, // キャストは元のまま
      fontWeight: fontWeight,
    };
  });

  return (
    <TouchableOpacity
      style={[baseTabButtonStyle, { borderBottomWidth: 0, marginRight: TAB_MARGIN_RIGHT }]} // props から受け取った基本スタイルを使用
      onPress={handlePress}
      onLayout={handleLayout}
      activeOpacity={0.7}
    >
      <Reanimated.Text style={[baseTabTextStyle, animatedTextStyle]}> {/* props から受け取った基本スタイルを使用 */}
        {label}
      </Reanimated.Text>
    </TouchableOpacity>
  );
});