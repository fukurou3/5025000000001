// app/(tabs)/_layout.tsx
import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { Tabs, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnsavedStore } from '@/hooks/useUnsavedStore';

export default function Layout() {
  const navigation = useNavigation();
  const { unsaved, reset } = useUnsavedStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (!unsaved) return;

      e.preventDefault();
      Alert.alert('変更を破棄しますか？', '保存されていない内容は失われます。', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '破棄',
          style: 'destructive',
          onPress: () => {
            reset();
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });
    return () => unsub();
  }, [navigation, unsaved]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6, // 上の余白も少しつけるとバランスがいい
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
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

      {/* 非表示にするページたち */}
      {[
        "add_edit/add",
        "add_edit/edit-draft",
        "add_edit/edit-task",

        "settings/language",

        "task-detail/task-detail",

        "tasks/tasks",
        "drafts",
        "index",
        "explore",
      ].map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ href: null }}
        />
      ))}
    </Tabs>
  );
}
