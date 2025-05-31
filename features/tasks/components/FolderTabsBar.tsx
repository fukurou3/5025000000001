// app/features/tasks/components/FolderTabsBar.tsx
import React, { useCallback, useEffect } from 'react';
import { ScrollView, View, Platform, type LayoutChangeEvent } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, interpolate, Extrapolate } from 'react-native-reanimated';
import type { TaskScreenStyles } from '@/features/tasks/styles';
import type { FolderTab, FolderTabLayout } from '@/features/tasks/hooks/useTasksScreenLogic';
import { ACCENT_LINE_HEIGHT, FOLDER_TABS_CONTAINER_PADDING_HORIZONTAL } from '@/features/tasks/constants';
import { AnimatedTabItem } from './AnimatedTabItem';

type FolderTabsBarProps = {
  styles: TaskScreenStyles;
  subColor: string;
  folderTabs: FolderTab[];
  folderTabLayouts: Record<number, FolderTabLayout>;
  setFolderTabLayouts: (updater: (prev: Record<number, FolderTabLayout>) => Record<number, FolderTabLayout>) => void;
  handleFolderTabPress: (folderName: string, index: number) => void;
  pageScrollPosition: Reanimated.SharedValue<number>;
  pageScrollOffset: Reanimated.SharedValue<number>;
  folderTabsScrollViewRef: React.RefObject<ScrollView>;
};

export const FolderTabsBar: React.FC<FolderTabsBarProps> = React.memo(({
  styles,
  subColor,
  folderTabs,
  folderTabLayouts,
  setFolderTabLayouts,
  handleFolderTabPress,
  pageScrollPosition,
  pageScrollOffset,
  folderTabsScrollViewRef,
}) => {
  const selectedTextColor = styles.folderTabSelectedText.color as string;
  const unselectedTextColor = styles.folderTabText.color as string;
  const selectedFontWeight = styles.folderTabSelectedText.fontWeight;
  const unselectedFontWeight = styles.folderTabText.fontWeight;
  const baseTabTextStyle = styles.folderTabText;
  const baseTabButtonStyle = styles.folderTabButton;

  const inputRange = useSharedValue<number[]>([]);
  const outputX = useSharedValue<number[]>([]);
  const outputWidth = useSharedValue<number[]>([]);

  useEffect(() => {
    const layoutsReady = folderTabs.length > 0 && Object.keys(folderTabLayouts).length >= folderTabs.length;
    if (layoutsReady) {
      const newRanges = folderTabs.map((_, i) => i);
      inputRange.value = newRanges;
      outputX.value = newRanges.map(i => folderTabLayouts[i]!.x);
      outputWidth.value = newRanges.map(i => folderTabLayouts[i]!.width);
    }
  }, [folderTabs, folderTabLayouts, inputRange, outputX, outputWidth]);

  const memoizedOnItemPress = useCallback((index: number, label: string) => {
    const folderName = folderTabs[index]?.name || label;
    handleFolderTabPress(folderName, index);
  }, [handleFolderTabPress, folderTabs]);

  const memoizedOnTabLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setFolderTabLayouts(prev => {
      const newLayouts = { ...prev };
      if (!newLayouts[index] || newLayouts[index].x !== x || newLayouts[index].width !== width) {
        newLayouts[index] = { x, width, index: index };
        return { ...newLayouts };
      }
      return prev;
    });
  }, [setFolderTabLayouts]);


  const animatedAccentLineStyle = useAnimatedStyle(() => {
    'worklet';
    const absoluteScrollPosition = pageScrollPosition.value + pageScrollOffset.value;

    if (inputRange.value.length === 0 || outputX.value.length === 0 || outputWidth.value.length === 0) {
      const firstTabLayout = folderTabLayouts[0];
      return {
        width: firstTabLayout?.width ?? 0,
        transform: [{ translateX: firstTabLayout?.x ?? FOLDER_TABS_CONTAINER_PADDING_HORIZONTAL }],
      };
    }
    
    if (inputRange.value.length === 1) {
        return {
          width: outputWidth.value[0],
          transform: [{ translateX: outputX.value[0] }],
        };
    }

    const width = interpolate(
      absoluteScrollPosition,
      inputRange.value,
      outputWidth.value,
      Extrapolate.CLAMP
    );
    const translateX = interpolate(
      absoluteScrollPosition,
      inputRange.value,
      outputX.value,
      Extrapolate.CLAMP
    );

    return {
      width: width,
      transform: [{ translateX: translateX }],
    };
  }, []);

  return (
    <View style={[styles.folderTabsContainer]}>
      <ScrollView
        ref={folderTabsScrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: FOLDER_TABS_CONTAINER_PADDING_HORIZONTAL,
        }}
      >
        <View style={{ flexDirection: 'row', position: 'relative' }}>
          {folderTabs.map((folder, index) => (
            <AnimatedTabItem
              key={`${folder.name}-${index}`}
              label={folder.label}
              index={index}
              onPress={memoizedOnItemPress}
              onTabLayout={memoizedOnTabLayout}
              pageScrollPosition={pageScrollPosition}
              pageScrollOffset={pageScrollOffset}
              selectedTextColor={selectedTextColor}
              unselectedTextColor={unselectedTextColor}
              selectedFontWeight={selectedFontWeight}
              unselectedFontWeight={unselectedFontWeight}
              baseTabTextStyle={baseTabTextStyle}
              baseTabButtonStyle={baseTabButtonStyle}
            />
          ))}
          {folderTabs.length > 0 && (
            <Reanimated.View
              style={[
                {
                  height: ACCENT_LINE_HEIGHT,
                  backgroundColor: subColor,
                  position: 'absolute',
                  bottom: 0,
                  borderRadius: ACCENT_LINE_HEIGHT / 2,
                },
                animatedAccentLineStyle,
              ]}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
});