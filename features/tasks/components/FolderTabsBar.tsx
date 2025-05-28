// app/features/tasks/components/FolderTabsBar.tsx
import React, { useCallback } from 'react';
import { ScrollView, View, Platform, type LayoutChangeEvent } from 'react-native';
import Reanimated, { useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated'; // useDerivedValue を削除
import type { TaskScreenStyles } from '@/features/tasks/styles';
import type { FolderTab, FolderTabLayout } from '@/features/tasks/hooks/useTasksScreenLogic';
import { ACCENT_LINE_HEIGHT, FOLDER_TABS_CONTAINER_PADDING_HORIZONTAL } from '@/features/tasks/constants';
import { AnimatedTabItem } from './AnimatedTabItem';

type FolderTabsBarProps = {
  styles: TaskScreenStyles; // これは AnimatedTabItem に渡すスタイル情報を取得するために残す
  subColor: string;
  folderTabs: FolderTab[];
  folderTabLayouts: Record<number, FolderTabLayout>; // これは引き続きアニメーション計算に必要
  setFolderTabLayouts: (updater: (prev: Record<number, FolderTabLayout>) => Record<number, FolderTabLayout>) => void;
  handleFolderTabPress: (folderName: string, index: number) => void;
  pageScrollPosition: Reanimated.SharedValue<number>;
  pageScrollOffset: Reanimated.SharedValue<number>;
  folderTabsScrollViewRef: React.RefObject<ScrollView>;
};

export const FolderTabsBar: React.FC<FolderTabsBarProps> = React.memo(({
  styles, // AnimatedTabItem に渡すスタイル情報を取得するために使用
  subColor,
  folderTabs,
  folderTabLayouts,
  setFolderTabLayouts,
  handleFolderTabPress,
  pageScrollPosition,
  pageScrollOffset,
  folderTabsScrollViewRef,
}) => {
  // AnimatedTabItem に渡すためのスタイル情報を抽出
  const selectedTextColor = styles.folderTabSelectedText.color as string;
  const unselectedTextColor = styles.folderTabText.color as string;
  const selectedFontWeight = styles.folderTabSelectedText.fontWeight;
  const unselectedFontWeight = styles.folderTabText.fontWeight;
  const baseTabTextStyle = styles.folderTabText;
  const baseTabButtonStyle = styles.folderTabButton;

  const memoizedOnItemPress = useCallback((index: number, label: string) => {
    const folderName = folderTabs[index]?.name || label;
    handleFolderTabPress(folderName, index);
  }, [handleFolderTabPress, folderTabs]);

  const memoizedOnTabLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setFolderTabLayouts(prev => {
      const newLayouts = { ...prev };
      // レイアウト情報が実際に変更された場合のみ更新する（参照の安定性のため）
      if (!newLayouts[index] || newLayouts[index].x !== x || newLayouts[index].width !== width) {
        newLayouts[index] = { x, width, index: index };
        return { ...newLayouts }; // 新しいオブジェクトを返す
      }
      return prev; // 変更がなければ前のオブジェクトを返す
    });
  }, [setFolderTabLayouts]);


  const animatedAccentLineStyle = useAnimatedStyle(() => {
    'worklet';
    const absoluteScrollPosition = pageScrollPosition.value + pageScrollOffset.value;

    // useDerivedValue を使わず、直接 folderTabs と folderTabLayouts を参照
    // これらの値は useAnimatedStyle のクロージャでキャプチャされる
    // スタイル計算が再実行されるのは、これらの参照が変わったとき (下記依存配列で指定)

    if (folderTabs.length === 0 || Object.keys(folderTabLayouts).length < folderTabs.length) {
      const firstTabLayout = folderTabLayouts[0];
      return {
        width: firstTabLayout?.width ?? 0,
        transform: [{ translateX: firstTabLayout?.x ?? FOLDER_TABS_CONTAINER_PADDING_HORIZONTAL }],
      };
    }

    const inputRange = folderTabs.map((_, i) => i);
    // folderTabLayouts が揃っている前提で outputX, outputWidth を生成
    // (Object.keys(folderTabLayouts).length < folderTabs.length のチェックで早期リターンしているため)
    const outputX = folderTabs.map((_, i) => folderTabLayouts[i]!.x);
    const outputWidth = folderTabs.map((_, i) => folderTabLayouts[i]!.width);

    if (inputRange.length === 1) {
      return {
        width: outputWidth[0],
        transform: [{ translateX: outputX[0] }],
      };
    }

    const width = interpolate(
      absoluteScrollPosition,
      inputRange,
      outputWidth,
      Extrapolate.CLAMP
    );
    const translateX = interpolate(
      absoluteScrollPosition,
      inputRange,
      outputX,
      Extrapolate.CLAMP
    );

    return {
      width: width,
      transform: [{ translateX: translateX }],
    };
  }, [folderTabs, folderTabLayouts, pageScrollPosition, pageScrollOffset]); // 依存配列に folderTabs と folderTabLayouts を追加

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
              // styles prop は削除
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
          {folderTabs.length > 0 && ( // アクセントラインの表示条件
            <Reanimated.View
              style={[
                {
                  height: ACCENT_LINE_HEIGHT,
                  backgroundColor: subColor,
                  position: 'absolute',
                  bottom: 0, // ACCENT_LINE_HEIGHT 分の高さがあるので、これが下線として機能する
                  borderRadius: ACCENT_LINE_HEIGHT / 2, // テストコードに合わせた
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