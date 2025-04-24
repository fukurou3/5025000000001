// app/(tabs)/drafts.tsx
import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
  useColorScheme,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter, useFocusEffect } from 'expo-router'
import dayjs from 'dayjs'
import { Ionicons } from '@expo/vector-icons'

const DRAFTS_KEY = 'TASK_DRAFTS'

export default function DraftsScreen() {
  const router = useRouter()
  const [drafts, setDrafts] = useState<any[]>([])
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const styles = createStyles(isDark)

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const raw = await AsyncStorage.getItem(DRAFTS_KEY)
        if (raw) setDrafts(JSON.parse(raw))
      }
      load()
    }, [])
  )

  const goToDraft = (id: string) => {
    router.push(`/edit-draft?draftId=${id}`)
  }

  const deleteDraft = async (id: string) => {
    const target = drafts.find(d => d.id === id)
    Alert.alert(
      '削除確認',
      `「${target?.title || 'タイトルなし'}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            const updated = drafts.filter(d => d.id !== id)
            await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updated))
            setDrafts(updated)
          },
        },
      ]
    )
  }

  const clearAll = async () => {
    Alert.alert('すべて削除', '全ての下書きを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(DRAFTS_KEY)
          setDrafts([])
        },
      },
    ])
  }

  return (
    <View style={[styles.container, { paddingTop: StatusBar.currentHeight || 24 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>下書き一覧</Text>
        {drafts.length > 0 && (
          <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.clearButtonText}>すべて削除</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {drafts.length === 0 && (
          <Text style={styles.empty}>下書きはありません</Text>
        )}
        {drafts.map(d => (
          <TouchableOpacity
            key={d.id}
            style={styles.card}
            onPress={() => goToDraft(d.id)}
          >
            <Text style={styles.title}>{d.title || '(タイトル未入力)'}</Text>
            <Text style={styles.subject}>{d.subject || '(教科なし)'}</Text>
            <Text style={styles.memo} numberOfLines={2}>{d.memo || '(メモなし)'}</Text>
            <Text style={styles.deadline}>
              締切: {d.deadline ? dayjs(d.deadline).format('YYYY/MM/DD HH:mm') : '未設定'}
            </Text>
            <TouchableOpacity
              onPress={() => deleteDraft(d.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>削除</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#ffffff',
    },
    header: {
      height: 56,
      paddingHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? '#2a2a2a' : '#f8f8f8',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#444' : '#ccc',
    },
    headerTitle: {
      fontSize: 25,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    clearButton: {
      flexDirection: 'row',
      backgroundColor: '#ff3b30',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      alignItems: 'center',
    },
    clearButtonText: {
      color: '#fff',
      marginLeft: 6,
      fontWeight: 'bold',
    },
    scroll: {
      padding: 20,
    },
    card: {
      backgroundColor: isDark ? '#1e1e1e' : '#f0f0f0',
      padding: 16,
      borderRadius: 10,
      marginBottom: 20,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    subject: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
      marginBottom: 4,
    },
    memo: {
      fontSize: 14,
      color: isDark ? '#eee' : '#333',
    },
    deadline: {
      fontSize: 12,
      color: isDark ? '#aaa' : '#999',
      marginTop: 8,
    },
    deleteButton: {
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: '#ff3b30',
      alignSelf: 'flex-end',
      borderRadius: 6,
    },
    deleteButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    empty: {
      textAlign: 'center',
      marginTop: 40,
      fontSize: 16,
      color: isDark ? '#777' : '#666',
    },
  })
