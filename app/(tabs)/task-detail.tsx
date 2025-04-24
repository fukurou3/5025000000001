import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  useColorScheme,
  StatusBar,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import dayjs from 'dayjs'
import { Ionicons } from '@expo/vector-icons'
import ImageViewing from 'react-native-image-viewing'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

const STORAGE_KEY = 'TASKS'
const screenWidth = Dimensions.get('window').width

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [task, setTask] = useState<any>(null)
  const [imageViewerVisible, setImageViewerVisible] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const styles = createStyles(isDark)
  const { t } = useTranslation()

  const loadTask = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (raw) {
      const list = JSON.parse(raw)
      const target = list.find((t: any) => t.id === id)
      setTask(target)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadTask()
    }, [id])
  )

  const deleteTask = async () => {
    Alert.alert(
      t('task_detail.delete_confirm_title', '削除確認'),
      t('task_detail.delete_confirm'),
      [
        { text: t('common.cancel', 'キャンセル') },
        {
          text: t('common.delete', '削除'),
          style: 'destructive',
          onPress: async () => {
            const raw = await AsyncStorage.getItem(STORAGE_KEY)
            if (raw) {
              const list = JSON.parse(raw)
              const filtered = list.filter((t: any) => t.id !== id)
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
              router.replace('/(tabs)/tasks')
            }
          },
        },
      ]
    )
  }

  if (!task) return <Text style={styles.loading}>{t('common.loading', '読み込み中...')}</Text>

  return (
    <SafeAreaView style={styles.wrapper} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/tasks')}>
          <Ionicons name="arrow-back" size={24} color="#007aff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('task_detail.title')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/edit-task', params: { id: task.id } })}>
            <Ionicons name="create-outline" size={24} color="#007aff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={deleteTask} style={{ marginLeft: 16 }}>
            <Ionicons name="trash-outline" size={24} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.subject}>{task.subject}</Text>
        <Text style={styles.label}>{t('task_detail.deadline')}: {dayjs(task.deadline).format('YYYY/MM/DD HH:mm')}</Text>
        <Text style={styles.label}>{t('task_detail.memo')}:</Text>
        <Text style={styles.memo}>{task.memo}</Text>

        {task.imageUris?.length > 0 && (
          <View style={styles.imageList}>
            {task.imageUris.map((uri: string, index: number) => (
              <TouchableOpacity key={index} onPress={() => { setViewerIndex(index); setImageViewerVisible(true) }}>
                <Image source={{ uri }} style={styles.image} resizeMode="contain" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <ImageViewing
        images={(task.imageUris || []).map((uri: string) => ({ uri }))}
        imageIndex={viewerIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
    </SafeAreaView>
  )
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#fff',
    },
    loading: {
      padding: 20,
      color: isDark ? '#fff' : '#000',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      height: 56,
      backgroundColor: isDark ? '#121212' : '#fff',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#333',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    container: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 12,
      color: isDark ? '#ededed' : '#000',
    },
    subject: {
      fontSize: 16,
      color: isDark ? '#ededed' : '#555',
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: 'bold',
      marginTop: 12,
      color: isDark ? '#ededed' : '#000',
    },
    memo: {
      fontSize: 14,
      color: isDark ? '#ededed' : '#333',
      marginTop: 4,
    },
    imageList: {
      marginTop: 16,
      gap: 16,
    },
    image: {
      width: screenWidth - 40,
      height: 260,
      borderRadius: 8,
      marginBottom: 12,
      backgroundColor: '#eee',
    },
  })
