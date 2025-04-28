// app/(tabs)/_layout.tsx

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SelectionProvider, useSelection } from './SelectionContext';

const TAB_HEIGHT = 56;

function InnerTabs() {
  const insets = useSafeAreaInsets();
  const { isSelecting } = useSelection();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: isSelecting ? 0 : TAB_HEIGHT,
          paddingBottom: isSelecting ? 0 : insets.bottom,
          paddingTop: isSelecting ? 0 : 6,
          overflow: 'hidden',
        },
      }}
    >
      <Tabs.Screen
        name="calendar/calendar"
        options={{
          title: 'カレンダー',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks/TasksScreen"
        options={{
          title: 'タスク一覧',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings/settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
      {[
        'add_edit/add',
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
