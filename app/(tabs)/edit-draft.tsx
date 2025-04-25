// app/(tabs)/edit-draft.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useUnsavedStore } from '@/hooks/useUnsavedStore';
import { useAppTheme } from '@/hooks/ThemeContext';

const LIGHT_INPUT_BG = '#e0e0e0';
const DARK_INPUT_BG = '#2e2d2d';
const LIGHT_GUIDE_TEXT = '#333';
const DARK_GUIDE_TEXT = '#faf7f7';
const LIGHT_PLACEHOLDER = '#777';
const DARK_PLACEHOLDER = '#adaaaa';
const LIGHT_REMOVE_BG = '#fff';
const DARK_REMOVE_BG = '#0d0d0d';
const LIGHT_DRAFTS_BG = '#ffffff';
const DARK_DRAFTS_BG = '#1e1e1e';

const STORAGE_KEY = 'TASKS';
const DRAFTS_KEY = 'TASK_DRAFTS';

type EditDraftStyles = {
  container: ViewStyle;
  appBar: ViewStyle;
  appBarTitle: TextStyle;
  draftsButton: ViewStyle;
  draftsButtonText: TextStyle;
  label: TextStyle;
  input: TextStyle;
  pickerButton: ViewStyle;
  pickerButtonWithPreview: ViewStyle;
  addMoreButton: ViewStyle;
  addMoreButtonText: TextStyle;
  fieldWrapper: ViewStyle;
  datetimeRow: ViewStyle;
  datetimeText: TextStyle;
  dateWrapper: ViewStyle;
  timeWrapper: ViewStyle;
  notifyContainer: ViewStyle;
  notifyHeader: ViewStyle;
  notifyLabel: TextStyle;
  toggleContainer: ViewStyle;
  toggleCircle: ViewStyle;
  guideText: TextStyle;
  slotPickerRow: ViewStyle;
  slotPickerWrapper: ViewStyle;
  slotPicker: TextStyle;
  imageWrapper: ViewStyle;
  image: ImageStyle;
  previewImage: ImageStyle;
  previewWrapper: ViewStyle;
  removeIcon: ViewStyle;
  buttonRow: ViewStyle;
  saveButton: ViewStyle;
  saveButtonText: TextStyle;
  draftButton: ViewStyle;
};

const createStyles = (isDark: boolean, subColor: string) =>
  StyleSheet.create<EditDraftStyles>({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#ffffff',
    },
    appBar: {
      height: 56,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#121212' : '#ffffff',
    },
    appBarTitle: {
      fontSize: 25,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    draftsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: subColor,
      backgroundColor: isDark ? DARK_DRAFTS_BG : LIGHT_DRAFTS_BG,
    },
    draftsButtonText: {
      fontSize: 16,
      marginLeft: 6,
      fontWeight: 'bold',
      color: subColor,
    },
    label: {
      fontSize: 20,
      marginBottom: 3,
      fontWeight: '600',
      color: subColor,
    },
    input: {
      backgroundColor: isDark ? DARK_INPUT_BG : LIGHT_INPUT_BG,
      color: isDark ? '#fff' : '#000',
      padding: 13,
      borderRadius: 8,
      marginBottom: 16,
    },
    pickerButton: {
      backgroundColor: isDark ? DARK_INPUT_BG : LIGHT_INPUT_BG,
      borderRadius: 8,
      padding: 12,
      marginBottom: 22,
      alignItems: 'center',
    },
    pickerButtonWithPreview: {
      backgroundColor: isDark ? DARK_INPUT_BG : LIGHT_INPUT_BG,
      borderRadius: 10,
      padding: 8,
      marginBottom: 10,
    },
    addMoreButton: {
      alignSelf: 'flex-end',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: subColor,
      marginBottom: 8,
    },
    addMoreButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    fieldWrapper: {
      backgroundColor: isDark ? DARK_INPUT_BG : LIGHT_INPUT_BG,
      borderRadius: 10,
      paddingHorizontal: 15,
      justifyContent: 'center',
      height: 50,
      marginBottom: 10,
    },
    datetimeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    datetimeText: {
      color: isDark ? '#fff' : '#000',
      fontSize: 16,
    },
    dateWrapper: {
      flex: 1,
      marginRight: 8,
    },
    timeWrapper: {
      flex: 1,
    },
    notifyContainer: {
      backgroundColor: isDark ? '#1e1e1e' : '#f4f4f4',
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
    },
    notifyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    notifyLabel: {
      fontSize: 18,
      fontWeight: '600',
    },
    toggleContainer: {
      width: 50,
      height: 28,
      borderRadius: 14,
      padding: 2,
      justifyContent: 'center',
    },
    toggleCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#fff',
    },
    guideText: {
      fontSize: 16,
      color: isDark ? DARK_GUIDE_TEXT : LIGHT_GUIDE_TEXT,
      marginBottom: 6,
    },
    slotPickerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 0,
    },
    slotPickerWrapper: {
      flex: 1,
      marginRight: 8,
      justifyContent: 'center',
    },
    slotPicker: {
      width: '100%',
      color: isDark ? '#fff' : '#000',
    },
    imageWrapper: {
      position: 'relative',
      marginRight: 16,
    },
    image: {
      width: 100,
      height: 100,
      borderRadius: 8,
    },
    previewImage: {
      width: 100,
      height: 100,
      borderRadius: 8,
    },
    previewWrapper: {
      position: 'relative',
      marginRight: 12,
    },
    removeIcon: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: isDark ? DARK_REMOVE_BG : LIGHT_REMOVE_BG,
      borderRadius: 10,
      padding: 2,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    saveButton: {
      flex: 1,
      backgroundColor: subColor,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 19,
      fontWeight: 'bold',
    },
    draftButton: {
      flex: 1,
      backgroundColor: '#888',
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      marginLeft: 10,
    },
  });

export default function EditDraftScreen() {
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { reset: resetUnsaved } = useUnsavedStore();
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark, subColor);

  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [memoHeight, setMemoHeight] = useState(40);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [deadline, setDeadline] = useState(new Date());
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [customUnit, setCustomUnit] = useState<'minutes' | 'hours' | 'days'>('hours');
  const [customAmount, setCustomAmount] = useState(1);

  // draft 読み込み
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(DRAFTS_KEY);
      if (!raw) return;
      const list = JSON.parse(raw);
      const draft = list.find((d: any) => d.id === draftId);
      if (!draft) return;
      setTitle(draft.title);
      setMemo(draft.memo);
      setMemoHeight(Math.max(40, draft.memo.length));
      setDeadline(new Date(draft.deadline));
      setImageUris(draft.imageUris || []);
      setNotifyEnabled(typeof draft.notifyEnabled === 'boolean' ? draft.notifyEnabled : true);
      setCustomUnit(draft.customUnit ?? 'hours');
      setCustomAmount(draft.customAmount ?? 1);
    })();
  }, [draftId]);

  // 未保存確認
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (!title && !memo && imageUris.length === 0) return;
      e.preventDefault();
      Alert.alert('変更を破棄しますか？', '保存されていない変更は失われます。', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '破棄',
          style: 'destructive',
          onPress: () => {
            resetUnsaved();
            router.replace('/(tabs)/drafts');
          },
        },
      ]);
    });
    return unsub;
  }, [navigation, title, memo, imageUris, resetUnsaved, router]);

  const getRange = useCallback((unit: 'minutes' | 'hours' | 'days') => {
    const max = unit === 'minutes' ? 60 : unit === 'hours' ? 48 : 31;
    return Array.from({ length: max }, (_, i) => i + 1);
  }, []);

  const showDatePicker = useCallback(() => {
    DateTimePickerAndroid.open({
      value: deadline,
      mode: 'date',
      is24Hour: true,
      onChange: (_e, d) =>
        d && setDeadline(prev => new Date(d.getFullYear(), d.getMonth(), d.getDate(), prev.getHours(), prev.getMinutes())),
    });
  }, [deadline]);

  const showTimePicker = useCallback(() => {
    DateTimePickerAndroid.open({
      value: deadline,
      mode: 'time',
      is24Hour: true,
      onChange: (_e, t) =>
        t && setDeadline(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), t.getHours(), t.getMinutes())),
    });
  }, [deadline]);

  const pickImages = useCallback(async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!res.canceled) {
      const uris = res.assets.map(a => a.uri);
      setImageUris(prev => [...prev, ...uris.filter(u => !prev.includes(u))]);
    }
  }, []);

  const removeImage = useCallback((uri: string) => {
    setImageUris(prev => prev.filter(u => u !== uri));
  }, []);

  const handleSaveDraft = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('タイトルは必須です');
      return;
    }
    const updatedDraft = {
      id: draftId,
      title,
      memo,
      deadline: deadline.toISOString(),
      imageUris,
      notifyEnabled,
      customUnit,
      customAmount,
    };
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    const drafts = raw ? JSON.parse(raw) : [];
    const filtered = drafts.filter((d: any) => d.id !== draftId);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify([updatedDraft, ...filtered]));
    Toast.show({ type: 'success', text1: '下書きを保存しました' });
    resetUnsaved();
    router.replace('/(tabs)/drafts');
  }, [draftId, title, memo, deadline, imageUris, notifyEnabled, customAmount, customUnit, resetUnsaved, router]);

  const handleConvertToTask = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('タイトルは必須です');
      return;
    }
    const newTask = {
      id: uuid.v4() as string,
      title,
      memo,
      deadline: deadline.toISOString(),
      imageUris,
      notifyEnabled,
      customUnit,
      customAmount,
    };
    // タスク追加
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const tasks = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([newTask, ...tasks]));
    // 下書き削除
    const draftsRaw = await AsyncStorage.getItem(DRAFTS_KEY);
    const drafts = draftsRaw ? JSON.parse(draftsRaw) : [];
    const kept = drafts.filter((d: any) => d.id !== draftId);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(kept));

    Toast.show({ type: 'success', text1: 'タスクとして保存しました' });
    resetUnsaved();
    router.replace('/(tabs)/tasks');
  }, [draftId, title, memo, deadline, imageUris, notifyEnabled, customUnit, customAmount, resetUnsaved, router]);

  return (
    <SafeAreaView style={styles.container}>
      {/* AppBar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/drafts')}>
          <Ionicons name="arrow-back" size={24} color={subColor} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>下書きを編集</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        {/* タイトル */}
        <Text style={styles.label}>タイトル</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="タイトルを入力"
          placeholderTextColor={isDark ? DARK_PLACEHOLDER : LIGHT_PLACEHOLDER}
          multiline
          style={[styles.input, { minHeight: 40 }]}
        />

        {/* メモ */}
        <Text style={styles.label}>メモ</Text>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="メモを入力"
          placeholderTextColor={isDark ? DARK_PLACEHOLDER : LIGHT_PLACEHOLDER}
          multiline
          onContentSizeChange={(e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) =>
            setMemoHeight(e.nativeEvent.contentSize.height)
          }
          style={[styles.input, { height: Math.max(40, memoHeight) }]}
        />

        {/* 写真 */}
        <Text style={styles.label}>写真</Text>
        {imageUris.length === 0 ? (
          <TouchableOpacity style={styles.pickerButton} onPress={pickImages}>
            <Text style={{ color: isDark ? '#fff' : '#000' }}>写真を選択</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.pickerButtonWithPreview}>
            <TouchableOpacity style={styles.addMoreButton} onPress={pickImages}>
              <Text style={styles.addMoreButtonText}>写真を追加</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {imageUris.map(uri => (
                <View key={uri} style={styles.previewWrapper}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeIcon} onPress={() => removeImage(uri)}>
                    <Ionicons name="close-circle" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 期限＋通知 */}
        <View style={styles.notifyContainer}>
          <Text style={styles.label}>期限</Text>
          {Platform.OS === 'android' && (
            <View style={styles.datetimeRow}>
              <TouchableOpacity style={[styles.fieldWrapper, styles.dateWrapper]} onPress={showDatePicker}>
                <Text style={styles.datetimeText}>{deadline.toLocaleDateString()}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.fieldWrapper, styles.timeWrapper]} onPress={showTimePicker}>
                <Text style={styles.datetimeText}>
                  {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.notifyHeader}>
            <Text style={styles.notifyLabel}>通知</Text>
            <TouchableOpacity
              style={[
                styles.toggleContainer,
                notifyEnabled
                  ? { backgroundColor: subColor }
                  : { backgroundColor: isDark ? DARK_INPUT_BG : LIGHT_INPUT_BG },
              ]}
              onPress={() => setNotifyEnabled(v => !v)}
            >
              <View
                style={[
                  styles.toggleCircle,
                  notifyEnabled ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },
                ]}
              />
            </TouchableOpacity>
          </View>
          {notifyEnabled && (
            <View style={styles.slotPickerRow}>
              <View style={[styles.fieldWrapper, styles.slotPickerWrapper]}>
                <Picker
                  mode={Platform.OS === 'android' ? 'dropdown' : 'dialog'}
                  selectedValue={customAmount}
                  onValueChange={setCustomAmount}
                  style={styles.slotPicker}
                  dropdownIconColor={isDark ? '#fff' : '#000'}
                >
                  {getRange(customUnit).map(n => (
                    <Picker.Item key={n} label={`${n}`} value={n} />
                  ))}
                </Picker>
              </View>
              <View style={[styles.fieldWrapper, styles.slotPickerWrapper]}>
                <Picker
                  mode={Platform.OS === 'android' ? 'dropdown' : 'dialog'}
                  selectedValue={customUnit}
                  onValueChange={v => {
                    setCustomUnit(v);
                    setCustomAmount(1);
                  }}
                  style={styles.slotPicker}
                  dropdownIconColor={isDark ? '#fff' : '#000'}
                >
                  <Picker.Item label="分前" value="minutes" />
                  <Picker.Item label="時間前" value="hours" />
                  <Picker.Item label="日前" value="days" />
                </Picker>
              </View>
            </View>
          )}
        </View>

        {/* ボタン */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.saveButton} onPress={handleConvertToTask}>
            <Text style={styles.saveButtonText}>タスクに追加</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft}>
            <Text style={styles.saveButtonText}>下書きを保存</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
