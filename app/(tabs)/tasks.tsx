import React, { useEffect, useState, useCallback } from 'react'
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  BackHandler,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { useFocusEffect, useRouter } from 'expo-router'
import { useAppTheme } from '@/hooks/ThemeContext'

import 'dayjs/locale/ja'
dayjs.locale('ja')
dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

const STORAGE_KEY = 'TASKS'

export default function TaskListScreen() {
  const { colorScheme, subColor } = useAppTheme()
  const isDark = colorScheme === 'dark'
  const styles = createStyles(isDark, subColor)

  const [tasks, setTasks] = useState<any[]>([])
  const [sortByDeadline, setSortByDeadline] = useState(true)
  const router = useRouter()

  const loadTasks = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      const sorted = [...data].sort((a, b) => {
        if (!sortByDeadline) return 0
        return dayjs(a.deadline).diff(dayjs(b.deadline))
      })
      setTasks(sorted)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadTasks()
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/(tabs)/tasks')
        return true
      })
      return () => handler.remove()
    }, [sortByDeadline])
  )

  const getTimeText = (deadline: string) => {
    const now = dayjs()
    const due = dayjs(deadline)
    const diff = due.diff(now, 'minute')

    if (diff < 0) {
      const past = now.diff(due, 'minute')
      if (past < 60) return `${past}分経過`
      if (past < 1440) return `${Math.floor(past / 60)}時間経過`
      return `${Math.floor(past / 1440)}日経過`
    } else {
      if (diff < 60) return `残り${diff}分`
      if (diff < 1440) return `残り${Math.floor(diff / 60)}時間`
      return `残り${Math.floor(diff / 1440)}日`
    }
  }
// ◉ 締切までの時間表示のスタイル
  const getTimeStyle = (deadline: string) => {
    const now = dayjs()
    const due = dayjs(deadline)
    const diff = due.diff(now, 'minute')
    if (diff < 0) return { color: isDark ? '#d1241b' : '#d32f2f' }
    if (diff <= 240) return { color: isDark ? '#d1c21b' : '#ff9800' }
    if (diff <= 1440) return { color: isDark ? '#e0b114' : '#f0b907' }
    return { color: isDark ? '#fff' : '#000' }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>タスク一覧</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setSortByDeadline(!sortByDeadline)}>
            <Text style={styles.sortButton}>
              {sortByDeadline ? '締切順' : 'カスタム順'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/add')}>
            <Text style={styles.addButton}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {tasks.map(task => (
          <TouchableOpacity
            key={task.id}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/task-detail',
                params: { id: task.id },
              })
            }
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{task.title}</Text>
                <Text style={styles.memo} numberOfLines={2}>
                  {task.memo}
                </Text>
                <Text style={styles.deadline}>
                  締切: {dayjs(task.deadline).format('YYYY/MM/DD HH:mm')}
                </Text>
              </View>
              <View style={styles.rightBox}>
                <Text style={[styles.timeText, getTimeStyle(task.deadline)]}>
                  {getTimeText(task.deadline)}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/edit-task',
                      params: { id: task.id },
                    })
                  }
                >
                  <Text style={styles.edit}>編集</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = (isDark: boolean, subColor: string) =>
  StyleSheet.create({
    // ◉ 画面全体の背景色
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#ffffff', 
    },

    // ◉ タイトルバー（AppBar）の背景色
    header: {
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 16 : 16,
      paddingHorizontal: 16,
      height:
        56 + (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 16),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#121212' : '#fff', 
    },

    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 25,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#121212',
    },
    addButton: {
      fontSize: 24,
      color: subColor,
      marginLeft: 12,
    },
    sortButton: {
      fontSize: 20,
      color: subColor,
    },

    // ◉ 各タスクカードの背景色
    card: {
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: isDark ? 0 : 1,
      borderColor: '#ddd',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },

    //タイトル（大きい文字）
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#ededed' : '#000',
    },
    memo: {
      fontSize: 14,
      color: isDark ? '#ededed' : '#333',
      marginTop: 4,
    },
    //締切（小さい文字）
    deadline: {
      fontSize: 17,
      color: isDark ? '#ededed' : '#666',
      marginTop: 6,
    },
    // ◉ 締切までの時間表示（小さい文字）
    timeText: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'right',
      marginBottom: 4,
    },
    // ◉ 締切までの時間表示のスタイル
    rightBox: {
      marginLeft: 20,
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },

    // ◉ 編集ボタン背景
    edit: {
      fontSize: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: isDark ? '#333' : '#f0f0f0',
      color: subColor,
      overflow: 'hidden',
    },
  })
  