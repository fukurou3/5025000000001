// app/(tabs)/edit-draft.tsx
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  StatusBar,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'
import uuid from 'react-native-uuid'
import Toast from 'react-native-toast-message'
import { Ionicons } from '@expo/vector-icons'
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'

const STORAGE_KEY = 'TASKS'
const DRAFTS_KEY = 'TASK_DRAFTS'
const notificationPresets = [1440, 60, 30]

export default function EditDraftScreen() {
  const { draftId } = useLocalSearchParams()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [memo, setMemo] = useState('')
  const [deadline, setDeadline] = useState(new Date())
  const [imageUris, setImageUris] = useState<string[]>([])
  const [notificationTimes, setNotificationTimes] = useState<number[]>([])

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem(DRAFTS_KEY)
      if (!raw) return
      const list = JSON.parse(raw)
      const draft = list.find((d: any) => d.id === draftId)
      if (!draft) return
      setTitle(draft.title)
      setSubject(draft.subject)
      setMemo(draft.memo)
      setDeadline(new Date(draft.deadline))
      setImageUris(draft.imageUris || [])
      setNotificationTimes(draft.notificationTimes || [])
    }
    load()
  }, [draftId])

  const showToast = (message: string) => {
    Toast.show({
      type: 'success',
      text1: message,
      position: 'top',
      visibilityTime: 2000,
      autoHide: true,
      topOffset: 50,
    })
  }

  const saveAsDraft = async () => {
    if (!title.trim()) {
      Alert.alert('タイトルは必須です')
      return
    }
    if (!draftId) return
    const raw = await AsyncStorage.getItem(DRAFTS_KEY)
    const list = raw ? JSON.parse(raw) : []
    const updated = list.map((d: any) =>
      d.id === draftId
        ? {
            ...d,
            title,
            subject,
            memo,
            deadline,
            imageUris,
            notificationTimes,
          }
        : d
    )
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updated))
    showToast('下書きを保存しました')
    router.replace('/(tabs)/add')
  }

  const convertToTask = async () => {
    if (!title.trim()) {
      Alert.alert('タイトルは必須です')
      return
    }

    const newTask = {
      id: uuid.v4() as string,
      title,
      subject,
      memo,
      deadline: deadline.toISOString(),
      imageUris,
      notificationTimes,
    }

    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    const tasks = raw ? JSON.parse(raw) : []
    const updated = [...tasks, newTask]
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    // 下書きも削除
    const draftsRaw = await AsyncStorage.getItem(DRAFTS_KEY)
    const drafts = draftsRaw ? JSON.parse(draftsRaw) : []
    const filtered = drafts.filter((d: any) => d.id !== draftId)
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered))

    showToast('タスクとして保存しました')
    router.replace('/(tabs)/tasks')
  }

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    })

    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri)
      const filtered = newUris.filter((uri) => !imageUris.includes(uri))
      setImageUris((prev) => [...prev, ...filtered])
    }
  }

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleNotificationTime = (min: number) => {
    setNotificationTimes((prev) =>
      prev.includes(min) ? prev.filter((t) => t !== min) : [...prev, min]
    )
  }

  const showAndroidDatePicker = () => {
    DateTimePickerAndroid.open({
      value: deadline,
      mode: 'date',
      is24Hour: true,
      onChange: (_, selectedDate) => {
        if (selectedDate) {
          setDeadline((prev) =>
            new Date(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              selectedDate.getDate(),
              prev.getHours(),
              prev.getMinutes()
            )
          )
        }
      },
    })
  }

  const showAndroidTimePicker = () => {
    DateTimePickerAndroid.open({
      value: deadline,
      mode: 'time',
      is24Hour: true,
      onChange: (_, selectedTime) => {
        if (selectedTime) {
          setDeadline((prev) =>
            new Date(
              prev.getFullYear(),
              prev.getMonth(),
              prev.getDate(),
              selectedTime.getHours(),
              selectedTime.getMinutes()
            )
          )
        }
      },
    })
  }

  return (
    <View style={[styles.container, { paddingTop: StatusBar.currentHeight || 24 }]}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/drafts')}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>下書きを編集</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.label}>タイトル</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="課題名など" style={styles.input} />
        <Text style={styles.label}>教科</Text>
        <TextInput value={subject} onChangeText={setSubject} placeholder="例：心理学" style={styles.input} />
        <Text style={styles.label}>締切</Text>
        {Platform.OS === 'android' && (
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <TouchableOpacity style={styles.pickerButton} onPress={showAndroidDatePicker}>
              <Text>{deadline.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerButton} onPress={showAndroidTimePicker}>
              <Text>{deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>メモ</Text>
        <TextInput value={memo} onChangeText={setMemo} placeholder="詳細メモ" multiline style={[styles.input, { height: 100 }]} />

        <Text style={styles.label}>写真</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={pickImages}>
          <Text>{imageUris.length > 0 ? '写真を追加する' : '写真を選択'}</Text>
        </TouchableOpacity>
        <ScrollView horizontal style={{ marginTop: 10 }}>
          {imageUris.map((uri, index) => (
            <View key={index} style={{ position: 'relative', marginRight: 10 }}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={20} color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.label}>通知タイミング</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {notificationPresets.map((min) => (
            <TouchableOpacity
              key={min}
              style={[styles.notificationButton, notificationTimes.includes(min) && { backgroundColor: '#007aff' }]}
              onPress={() => toggleNotificationTime(min)}
            >
              <Text style={{ color: notificationTimes.includes(min) ? '#fff' : '#000' }}>
                {min === 1440 ? '前日' : `${min}分前`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={convertToTask} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>タスクに追加</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={saveAsDraft} style={[styles.saveButton, { backgroundColor: '#888', marginTop: 10 }]}>
          <Text style={styles.saveButtonText}>下書きとして保存</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  appBar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f2f2f2',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  notificationButton: {
    borderWidth: 1,
    borderColor: '#007aff',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  saveButton: {
    backgroundColor: '#007aff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
