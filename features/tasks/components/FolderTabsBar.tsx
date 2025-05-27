// app/features/tasks/components/FolderTabsBar.tsx
import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, type TextStyle, type ViewStyle, type ColorValue, Animated } from 'react-native'; // Animated を削除 (ScrollView はデフォルトで Animated)
import type { TaskScreenStyles } from '@/features/tasks/styles';
import type { FolderTab, FolderTabLayout, AccentLineStyle, PageScrollData } from '@/features/tasks/hooks/useTasksScreenLogic';
import { interpolateColor, interpolateFontWeight } from '@/features/tasks/utils';
import { ACCENT_LINE_HEIGHT, FOLDER_TABS_CONTAINER_PADDING_HORIZONTAL } from '@/features/tasks/constants';

type FolderTabsBarProps = {
  styles: TaskScreenStyles;
  isDark: boolean;
  subColor: string;
  folderTabs: FolderTab[];
  folderTabLayouts: Record<string, FolderTabLayout>;
  setFolderTabLayouts: (updater: (prev: Record<string, FolderTabLayout>) => Record<string, FolderTabLayout>) => void;
  handleFolderTabPress: (folderName: string, index: number) => void;
  accentLineStyle: AccentLineStyle;
  pageScrollData: PageScrollData;
  folderTabsScrollViewRef: React.RefObject<ScrollView>; // 修正: Animated.ScrollView -> ScrollView
};

export const FolderTabsBar: React.FC<FolderTabsBarProps> = ({
  styles,
  isDark,
  subColor,
  folderTabs,
  setFolderTabLayouts,
  handleFolderTabPress,
  accentLineStyle,
  pageScrollData,
  folderTabsScrollViewRef,
}) => {
  return (
    <View style={[styles.folderTabsContainer, { paddingBottom: ACCENT_LINE_HEIGHT }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        ref={folderTabsScrollViewRef}
        contentContainerStyle={{ alignItems: 'flex-end', paddingHorizontal: FOLDER_TABS_CONTAINER_PADDING_HORIZONTAL }}
      >
        {folderTabs.map((folder, index) => {
          let textStyleToApply: TextStyle = { ...styles.folderTabText };
          let tabStyleToApply: ViewStyle = { ...styles.folderTabButton, borderBottomWidth: 0 };

          const scrollPos = pageScrollData.position;
          const scrollOffset = pageScrollData.offset;

          const selectedTextColor = isDark ? styles.folderTabSelectedText.color : styles.folderTabSelectedText.color;
          const unselectedTextColor = isDark ? styles.folderTabText.color : styles.folderTabText.color;
          
          const selectedWeight = styles.folderTabSelectedText.fontWeight;
          const unselectedWeight = styles.folderTabText.fontWeight;

          if (scrollOffset === 0) {
            if (index === scrollPos) {
                textStyleToApply = {...styles.folderTabText, ...styles.folderTabSelectedText};
            }
          } else {
            if (index === scrollPos) {
                textStyleToApply.color = interpolateColor(selectedTextColor as string, unselectedTextColor as string, scrollOffset);
                textStyleToApply.fontWeight = interpolateFontWeight(1 - scrollOffset, selectedWeight, unselectedWeight);
            } else if (index === scrollPos + 1) {
                textStyleToApply.color = interpolateColor(unselectedTextColor as string, selectedTextColor as string, scrollOffset);
                textStyleToApply.fontWeight = interpolateFontWeight(scrollOffset, selectedWeight, unselectedWeight);
            } else {
                textStyleToApply.color = unselectedTextColor as ColorValue;
                textStyleToApply.fontWeight = unselectedWeight;
            }
          }

          return (
            <TouchableOpacity
              key={folder.name}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                setFolderTabLayouts(prev => {
                    const newLayouts = {...prev};
                    if (!newLayouts[folder.name] || newLayouts[folder.name].x !== x || newLayouts[folder.name].width !== width || newLayouts[folder.name].index !== index) {
                       newLayouts[folder.name] = { x, width, index };
                       return newLayouts;
                    }
                    return prev;
                });
              }}
              style={tabStyleToApply}
              onPress={() => handleFolderTabPress(folder.name, index)}
              activeOpacity={0.7}
            >
              <Text style={textStyleToApply} numberOfLines={1}>{folder.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View
        style={{
            height: ACCENT_LINE_HEIGHT,
            backgroundColor: subColor,
            width: accentLineStyle.width,
            transform: accentLineStyle.transform,
            position: 'absolute',
            bottom: 0, 
            left: FOLDER_TABS_CONTAINER_PADDING_HORIZONTAL, 
        }}
      />
    </View>
  );
};