// /app/(tabs)/_layout.tsx
import React, { useContext } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SelectionProvider, useSelection } from './_SelectionContext';
import { useAppTheme } from '@/hooks/ThemeContext';
import { FontSizeContext } from '@/context/FontSizeContext';
import { Text } from 'react-native';

const TAB_HEIGHT = 56;

function InnerTabs() {
  const insets = useSafeAreaInsets();
  const { isSelecting } = useSelection();
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { fontSizeKey } = useContext(FontSizeContext);

  const fontSizeMap: Record<string, number> = {
    small: 10,
    medium: 12,
    large: 14,
  };

  const inactiveColor = isDark ? '#CCCCCC' : '#000000';

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: isSelecting ? 0 : TAB_HEIGHT,
          paddingBottom: isSelecting ? 0 : insets.bottom > 0 ? insets.bottom : 0,
          paddingTop: isSelecting ? 0 : 0,
          backgroundColor: isDark ? '#121212' : '#FFFFFF',
          borderTopWidth: 1,
          borderColor: isDark ? '#555' : '#CCC',
          overflow: 'hidden',
        },
        tabBarLabelPosition: 'below-icon',
        tabBarIcon: ({ focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
          if (route.name === 'calendar/calendar') {
            iconName = 'calendar-outline';
          } else if (route.name === 'tasks/TasksScreen') {
            iconName = 'list-outline';
          } else if (route.name === 'settings/settings') {
            iconName = 'settings-outline';
          }
          return (
            <Ionicons
              name={iconName}
              size={26}
              color={focused ? subColor : inactiveColor}
            />
          );
        },
        tabBarLabel: ({ focused }) => {
          let label = '';
          if (route.name === 'calendar/calendar') {
            label = 'カレンダー';
          } else if (route.name === 'tasks/TasksScreen') {
            label = 'タスク一覧';
          } else if (route.name === 'settings/settings') {
            label = '設定';
          }
          return (
            <Text
              style={{
                fontSize: fontSizeMap[fontSizeKey] ?? 12,
                color: focused ? subColor : inactiveColor,
                textAlign: 'center',
                marginTop: 2,
              }}
            >
              {label}
            </Text>
          );
        },
      })}
    >
      <Tabs.Screen name="calendar/calendar" />
      <Tabs.Screen name="tasks/TasksScreen" />
      <Tabs.Screen name="settings/settings" />
      {[
        'add/index',
        'add_edit/edit-draft',
        'add_edit/edit-task',
        'settings/language',
        'task-detail/[id]',
        'tasks/tasks',
        'drafts',
        'index',
        'explore',
      ].map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}

export default function TabsLayout() {
  return (
    <SelectionProvider>
      <InnerTabs />
    </SelectionProvider>
  );
}
