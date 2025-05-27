// app/features/tasks/components/FolderTabsBar.tsx
import React from 'react';
import { ScrollView, View, Platform } from 'react-native';
import Reanimated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import type { TaskScreenStyles } from '@/features/tasks/styles';
import type { FolderTab, FolderTabLayout } from '@/features/tasks/hooks/useTasksScreenLogic';
import { ACCENT_LINE_HEIGHT, FOLDER_TABS_CONTAINER_PADDING_HORIZONTAL, TAB_MARGIN_RIGHT } from '@/features/tasks/constants';
import { AnimatedTabItem } from './AnimatedTabItem';

type FolderTabsBarProps = {
  styles: TaskScreenStyles;
  isDark: boolean;
  subColor: string;
  folderTabs: FolderTab[];
  folderTabLayouts: Record<number, FolderTabLayout>;
  setFolderTabLayouts: (updater: (prev: Record<number, FolderTabLayout>) => Record<number, FolderTabLayout>) => void;
  handleFolderTabPress: (folderName: string, index: number) => void;
  pageScrollPosition: Reanimated.SharedValue<number>;
  pageScrollOffset: Reanimated.SharedValue<number>;
  folderTabsScrollViewRef: React.RefObject<ScrollView>;
  currentContentPage: number;
};

export const FolderTabsBar: React.FC<FolderTabsBarProps> = ({
  styles,
  isDark,
  subColor,
  folderTabs,
  folderTabLayouts,
  setFolderTabLayouts,
  handleFolderTabPress,
  pageScrollPosition,
  pageScrollOffset,
  folderTabsScrollViewRef,
  currentContentPage,
}) => {
  const animatedAccentLineStyle = useAnimatedStyle(() => {
    const currentViewPosition = pageScrollPosition.value;
    const scrollOffset = pageScrollOffset.value;

    const currentTabIndex = Math.floor(currentViewPosition);
    const nextTabIndex = currentTabIndex + 1;

    const currentLayout = folderTabLayouts[currentTabIndex];
    const nextLayout = folderTabLayouts[nextTabIndex];

    if (!currentLayout) {
      const firstTabLayout = folderTabLayouts[0];
      if (firstTabLayout) {
        return {
          width: firstTabLayout.width,
          transform: [{ translateX: firstTabLayout.x }],
        };
      }
      return {
        width: 0,
        transform: [{ translateX: 0 }],
      };
    }

    const targetLayoutForInterpolation = (nextLayout && scrollOffset !== 0) ? nextLayout : currentLayout;

    const width = interpolate(
      scrollOffset,
      [0, 1],
      [currentLayout.width, targetLayoutForInterpolation.width]
    );
    const translateX = interpolate(
      scrollOffset,
      [0, 1],
      [currentLayout.x, targetLayoutForInterpolation.x]
    );

    return {
      width: width,
      transform: [{ translateX: translateX }],
    };
  });

  const selectedColor = isDark ? styles.folderTabSelectedText.color : styles.folderTabSelectedText.color;
  const unselectedColor = isDark ? styles.folderTabText.color : styles.folderTabText.color;

  return (
    <View style={[styles.folderTabsContainer]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        ref={folderTabsScrollViewRef}
        contentContainerStyle={{
            paddingHorizontal: FOLDER_TABS_CONTAINER_PADDING_HORIZONTAL,
        }}
      >
        <View style={{ flexDirection: 'row', position: 'relative', paddingBottom: ACCENT_LINE_HEIGHT }}>
          {folderTabs.map((folder, index) => {
            return (
              <AnimatedTabItem
                key={`${folder.name}-${index}`}
                styles={styles}
                label={folder.label}
                index={index}
                isActive={index === currentContentPage}
                onPress={() => handleFolderTabPress(folder.name, index)}
                onLayout={(event) => {
                  const { x, width } = event.nativeEvent.layout;
                  setFolderTabLayouts(prev => {
                      const newLayouts = {...prev};
                      if (!newLayouts[index] || newLayouts[index].x !== x || newLayouts[index].width !== width ) {
                         newLayouts[index] = { x, width, index: index };
                         return newLayouts;
                      }
                      return prev;
                  });
                }}
                pageScrollPosition={pageScrollPosition}
                pageScrollOffset={pageScrollOffset}
                selectedColorString={selectedColor as string}
                unselectedColorString={unselectedColor as string}
              />
            );
          })}
          <Reanimated.View
            style={[
              {
                height: ACCENT_LINE_HEIGHT,
                backgroundColor: subColor,
                position: 'absolute',
                bottom: 0,
              },
              animatedAccentLineStyle,
            ]}
          />
        </View>
      </ScrollView>
    </View>
  );
};