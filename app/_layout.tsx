// app/_layout.tsx

import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import '@/lib/i18n';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useAppTheme } from '@/hooks/ThemeContext';
import { FontSizeProvider } from '@/context/FontSizeContext';
import Toast from 'react-native-toast-message';

SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  const { colorScheme } = useAppTheme();

  return (
    <NavThemeProvider value={ colorScheme === 'dark' ? DarkTheme : DefaultTheme }>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar
        style={colorScheme === 'dark' ? 'light' : 'dark'}
        backgroundColor="transparent"
        translucent
      />
      <Toast />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

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
