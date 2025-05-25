// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import '@/lib/i18n'; // 多言語対応のi18nライブラリをインポート
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useAppTheme } from '@/hooks/ThemeContext'; // テーマコンテキストをインポート
import { FontSizeProvider } from '@/context/FontSizeContext'; // フォントサイズコンテキストをインポート
import Toast from 'react-native-toast-message'; // Toastメッセージライブラリをインポート

// SplashScreen.preventAutoHideAsync(); はRootLayoutの外、またはuseEffect内で呼び出すのが一般的です
// この位置だと、コンポーネントのレンダリング前に実行されてしまう可能性があります。
// ただし、元のコードのまま記載します。
SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  const { colorScheme } = useAppTheme(); // 現在のカラーテーマ（'light' または 'dark'）を取得
  return (
    <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar
        style={colorScheme === 'dark' ? 'light' : 'dark'}
        backgroundColor="transparent" // ステータスバーの背景色を透明に
        translucent // Androidでステータスバーを透明にするために必要
      />
      <Toast />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  // フォントの読み込み設定
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'), // SpaceMonoフォントを読み込み
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync(); // フォント読み込み完了後にスプラッシュスクリーンを非表示
    }
  }, [loaded]);

  if (!loaded) {
    return null; // フォント読み込み前は何も表示しない
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <FontSizeProvider>
          <InnerLayout />
        </FontSizeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}