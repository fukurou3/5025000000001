// app/(tabs)/add.tsx

import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
} from 'react';
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
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useUnsavedStore } from '@/hooks/useUnsavedStore';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FontSizeContext, FontSizeKey } from '@/context/FontSizeContext';
import { fontSizes } from '@/constants/fontSizes';

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

type TabParamList = {
  calendar: undefined;
  tasks: undefined;
  add: undefined;
  settings: undefined;
};

type AddTaskStyles = {
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

const createStyles = (
  isDark: boolean,
  subColor: string,
  fsKey: FontSizeKey
) =>
  StyleSheet.create<AddTaskStyles>({
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
      fontSize: fontSizes[fsKey] + 4,
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
      fontSize: fontSizes[fsKey],
      marginLeft: 6,
      fontWeight: 'bold',
      color: subColor,
    },
    label: {
      fontSize: fontSizes[fsKey],
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
      fontSize: fontSizes[fsKey],           // ← ユーザー入力文字も大きく
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
      fontSize: fontSizes[fsKey] - 2,
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
    dateWrapper: {
      flex: 1,
      marginRight: 8,
    },
    timeWrapper: {
      flex: 1,
    },
    datetimeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    datetimeText: {
      color: isDark ? '#fff' : '#000',
      fontSize: fontSizes[fsKey],
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
      fontSize: fontSizes[fsKey],
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
      fontSize: fontSizes[fsKey],
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
      fontSize: fontSizes[fsKey],
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
      fontSize: fontSizes[fsKey],
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

export default function AddTaskScreen() {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { fontSizeKey } = useContext(FontSizeContext);
  const styles = createStyles(isDark, subColor, fontSizeKey);
  const { t } = useTranslation();

  const router = useRouter();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();
  const { reset: resetUnsaved } = useUnsavedStore();

  const [currentDraftId, setCurrentDraftId] = useState<string | null>(
    draftId ?? null
  );
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [memoHeight, setMemoHeight] = useState(40);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [deadline, setDeadline] = useState(new Date());
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [customUnit, setCustomUnit] = useState<
    'minutes' | 'hours' | 'days'
  >('hours');
  const [customAmount, setCustomAmount] = useState(1);

  const clearForm = useCallback(() => {
    setCurrentDraftId(null);
    setTitle('');
    setMemo('');
    setMemoHeight(40);
    setImageUris([]);
    setDeadline(new Date());
    setNotifyEnabled(true);
    setCustomUnit('hours');
    setCustomAmount(1);
    resetUnsaved();
  }, [resetUnsaved]);

  useEffect(() => {
    const unsub = navigation.addListener(
      'beforeRemove',
      (e: any) => {
        if (!title && !memo && imageUris.length === 0) return;
        e.preventDefault();
        Alert.alert(
          t('add_task.alert_discard_changes_title'),
          t('add_task.alert_discard_changes_message'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('add_task.alert_discard'),
              style: 'destructive',
              onPress: () => {
                clearForm();
                if (e.data?.action) navigation.dispatch(e.data.action);
              },
            },
          ]
        );
      }
    );
    return unsub;
  }, [navigation, title, memo, imageUris, clearForm, t]);

  const getRange = useCallback((unit: 'minutes' | 'hours' | 'days') => {
    const max = unit === 'minutes' ? 60 : unit === 'hours' ? 48 : 31;
    return Array.from({ length: max }, (_, i) => i + 1);
  }, []);

  const showDatePicker = useCallback(() => {
    DateTimePickerAndroid.open({
      value: deadline,
      mode: 'date',
      is24Hour: true,
      onChange: (_e, d) => {
        if (d) {
          setDeadline(
            new Date(
              d.getFullYear(),
              d.getMonth(),
              d.getDate(),
              deadline.getHours(),
              deadline.getMinutes()
            )
          );
        }
      },
    });
  }, [deadline]);

  const showTimePicker = useCallback(() => {
    DateTimePickerAndroid.open({
      value: deadline,
      mode: 'time',
      is24Hour: true,
      onChange: (_e, t) => {
        if (t) {
          setDeadline(
            new Date(
              deadline.getFullYear(),
              deadline.getMonth(),
              deadline.getDate(),
              t.getHours(),
              t.getMinutes()
            )
          );
        }
      },
    });
  }, [deadline]);

  const handlePickImages = useCallback(async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!res.canceled) {
      const uris = res.assets.map((a) => a.uri);
      setImageUris((prev) => [
        ...prev,
        ...uris.filter((u) => !prev.includes(u)),
      ]);
    }
  }, []);

  const handleRemoveImage = useCallback((uri: string) => {
    setImageUris((prev) => prev.filter((u) => u !== uri));
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(t('add_task.alert_no_title'));
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
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const tasks = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...tasks, newTask])
    );
    Toast.show({ type: 'success', text1: t('add_task.add_task_button') });
    clearForm();
    router.replace('/(tabs)/tasks');
  }, [
    title,
    memo,
    deadline,
    imageUris,
    notifyEnabled,
    customUnit,
    customAmount,
    clearForm,
    router,
    t,
  ]);

  const handleSaveDraft = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(t('add_task.alert_no_title'));
      return;
    }
    const id = currentDraftId || (uuid.v4() as string);
    const draft = {
      id,
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
    await AsyncStorage.setItem(
      DRAFTS_KEY,
      JSON.stringify([
        ...drafts.filter((d: any) => d.id !== id),
        draft,
      ])
    );
    Toast.show({
      type: 'success',
      text1: t('add_task.save_draft_button'),
    });
    clearForm();
    router.replace('/(tabs)/drafts');
  }, [
    title,
    memo,
    deadline,
    imageUris,
    notifyEnabled,
    customUnit,
    customAmount,
    currentDraftId,
    clearForm,
    router,
    t,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>
          {t('add_task.title')}
        </Text>
        <TouchableOpacity
          style={styles.draftsButton}
          onPress={() => router.push('/(tabs)/drafts')}
        >
          <Ionicons
            name="document-text-outline"
            size={fontSizes[fontSizeKey]}
            color={subColor}
          />
          <Text style={styles.draftsButtonText}>
            {t('add_task.drafts')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
      >
        {/* タイトル入力 */}
        <Text style={[styles.label, { color: subColor }]}>
          {t('add_task.input_title')}
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('add_task.input_title_placeholder')}
          placeholderTextColor={
            isDark ? DARK_PLACEHOLDER : LIGHT_PLACEHOLDER
          }
          multiline
          style={[styles.input, { minHeight: 40 }]}
        />

        {/* メモ入力 */}
        <Text style={[styles.label, { color: subColor }]}>
          {t('add_task.memo')}
        </Text>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder={t('add_task.memo_placeholder')}
          placeholderTextColor={
            isDark ? DARK_PLACEHOLDER : LIGHT_PLACEHOLDER
          }
          multiline
          onContentSizeChange={(
            e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
          ) => setMemoHeight(e.nativeEvent.contentSize.height)}
          style={[
            styles.input,
            { height: Math.max(40, memoHeight) },
          ]}
        />

        {/* 写真 */}
        <Text style={[styles.label, { color: subColor }]}>
          {t('add_task.photo')}
        </Text>
        {imageUris.length === 0 ? (
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={handlePickImages}
          >
            <Text style={{ color: isDark ? '#fff' : '#000' }}>
              {t('add_task.select_photo')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.pickerButtonWithPreview}>
            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={handlePickImages}
            >
              <Text style={styles.addMoreButtonText}>
                {t('add_task.add_photo')}
              </Text>
            </TouchableOpacity>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {imageUris.map((uri) => (
                <View
                  key={uri}
                  style={styles.previewWrapper}
                >
                  <Image
                    source={{ uri }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity
                    style={styles.removeIcon}
                    onPress={() => handleRemoveImage(uri)}
                  >
                    <Ionicons
                      name="close-circle"
                      size={fontSizes[fontSizeKey]}
                      color="red"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 期限＋通知 */}
        <View style={styles.notifyContainer}>
          <Text style={[styles.label, { color: subColor }]}>
            {t('add_task.deadline')}
          </Text>
          {Platform.OS === 'android' && (
            <View style={styles.datetimeRow}>
              <TouchableOpacity
                style={[styles.fieldWrapper, styles.dateWrapper]}
                onPress={showDatePicker}
              >
                <Text style={styles.datetimeText}>
                  {deadline.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fieldWrapper, styles.timeWrapper]}
                onPress={showTimePicker}
              >
                <Text style={styles.datetimeText}>
                  {deadline.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 通知設定 */}
          <View style={styles.notifyHeader}>
            <Text
              style={[styles.notifyLabel, { color: subColor }]}
            >
              {t('add_task.notification')}
            </Text>
            <TouchableOpacity
              style={[
                styles.toggleContainer,
                notifyEnabled
                  ? { backgroundColor: subColor }
                  : {
                      backgroundColor: isDark
                        ? DARK_INPUT_BG
                        : LIGHT_INPUT_BG,
                    },
              ]}
              onPress={() =>
                setNotifyEnabled((v) => !v)
              }
            >
              <View
                style={[
                  styles.toggleCircle,
                  notifyEnabled
                    ? { alignSelf: 'flex-end' }
                    : { alignSelf: 'flex-start' },
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* 通知オフセット設定 */}
          {notifyEnabled && (
            <View style={styles.slotPickerRow}>
              <View
                style={[
                  styles.fieldWrapper,
                  styles.slotPickerWrapper,
                ]}
              >
                <Picker
                  mode={
                    Platform.OS === 'android'
                      ? 'dropdown'
                      : 'dialog'
                  }
                  selectedValue={customAmount}
                  onValueChange={setCustomAmount}
                  style={styles.slotPicker}
                  dropdownIconColor={
                    isDark ? '#fff' : '#000'
                  }
                >
                  {getRange(customUnit).map((n) => (
                    <Picker.Item
                      key={n}
                      label={`${n}`}
                      value={n}
                    />
                  ))}
                </Picker>
              </View>
              <View
                style={[
                  styles.fieldWrapper,
                  styles.slotPickerWrapper,
                ]}
              >
                <Picker
                  mode={
                    Platform.OS === 'android'
                      ? 'dropdown'
                      : 'dialog'
                  }
                  selectedValue={customUnit}
                  onValueChange={(v) => {
                    setCustomUnit(v);
                    setCustomAmount(1);
                  }}
                  style={styles.slotPicker}
                  dropdownIconColor={
                    isDark ? '#fff' : '#000'
                  }
                >
                  <Picker.Item
                    label={t('add_task.minutes_before')}
                    value="minutes"
                  />
                  <Picker.Item
                    label={t('add_task.hours_before')}
                    value="hours"
                  />
                  <Picker.Item
                    label={t('add_task.days_before')}
                    value="days"
                  />
                </Picker>
              </View>
            </View>
          )}
        </View>

        {/* 保存ボタン */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>
              {t('add_task.add_task_button')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.draftButton}
            onPress={handleSaveDraft}
          >
            <Text style={styles.saveButtonText}>
              {t('add_task.save_draft_button')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
