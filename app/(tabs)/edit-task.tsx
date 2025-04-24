// app/(tabs)/edit-task.tsx
import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'

const STORAGE_KEY = 'TASKS'
const notificationPresets = [1440, 60, 30]

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [memo, setMemo] = useState('')
  const [deadline, setDeadline] = useState<Date>(new Date())
  const [imageUris, setImageUris] = useState<string[]>([])
  const [notificationTimes, setNotificationTimes] = useState<number[]>([])
  const original = useRef<any>(null)

  useEffect(() => {
    const loadTask = async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const list = JSON.parse(raw)
      const task = list.find((t: any) => t.id === id)
      if (!task) return
      original.current = task
      setTitle(task.title)
      setSubject(task.subject)
      setMemo(task.memo)
      setDeadline(new Date(task.deadline))
      setImageUris(task.imageUris || [])
      setNotificationTimes(task.notificationTimes || [])
    }
    loadTask()
  }, [id])

  const hasChanges = () => {
    const o = original.current
    return (
      title !== o.title ||
      subject !== o.subject ||
      memo !== o.memo ||
      deadline.toISOString() !== o.deadline ||
      JSON.stringify(imageUris) !== JSON.stringify(o.imageUris || []) ||
      notificationTimes.toString() !== (o.notificationTimes || []).toString()
    )
  }

  const confirmBack = () => {
    if (hasChanges()) {
      Alert.alert('変更を破棄しますか？', '保存されていない変更があります。', [
        { text: 'キャンセル' },
        { text: 'OK', style: 'destructive', onPress: () => router.replace('/(tabs)/tasks') },
      ])
    } else {
      router.replace('/(tabs)/tasks')
    }
  }

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    })
    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri)
      setImageUris((prev) => [...prev, ...newUris])
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

  const saveChanges = async () => {
    if (!title.trim()) return Alert.alert('タイトルは必須です')
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const list = JSON.parse(raw)
    const updated = list.map((t: any) =>
      t.id === id
        ? {
            ...t,
            title,
            subject,
            memo,
            deadline: deadline.toISOString(),
            imageUris,
            notificationTimes,
          }
        : t
    )
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    Alert.alert('保存しました')
    router.replace('/(tabs)/tasks')
  }

  return (
    <View style={[styles.container, { paddingTop: StatusBar.currentHeight || 24 }]}> 
      <View style={styles.appBar}>
        <TouchableOpacity onPress={confirmBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>編集</Text>
        <TouchableOpacity onPress={saveChanges}>
          <Ionicons name="checkmark" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>タイトル</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="タイトル" />

        <Text style={styles.label}>教科</Text>
        <TextInput value={subject} onChangeText={setSubject} style={styles.input} placeholder="教科" />

        <Text style={styles.label}>メモ</Text>
        <TextInput value={memo} onChangeText={setMemo} style={[styles.input, { height: 100 }]} multiline placeholder="メモ" />

        <Text style={styles.label}>締切</Text>
        {Platform.OS === 'android' ? (
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <TouchableOpacity style={styles.pickerButton} onPress={showAndroidDatePicker}>
              <Text>{deadline.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerButton} onPress={showAndroidTimePicker}>
              <Text>{deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
              style={[styles.tag, notificationTimes.includes(min) && { backgroundColor: '#007aff' }]}
              onPress={() => toggleNotificationTime(min)}
            >
              <Text style={{ color: notificationTimes.includes(min) ? '#fff' : '#000' }}>
                {min === 1440 ? '前日' : `${min}分前`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
    backgroundColor: '#007aff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    fontSize: 14,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#007aff',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
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
})