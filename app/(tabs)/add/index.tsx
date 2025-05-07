import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useUnsavedStore } from '@/hooks/useUnsavedStore';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FontSizeContext } from '@/context/FontSizeContext';
import { fontSizes } from '@/constants/fontSizes';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AddTaskStyles } from './_types';
import { createStyles } from './styles';
import { useFolders } from './_hooks/_useFolders';
import { useImagePicker } from './_hooks/_useImagePicker';
import { useDeadlinePicker } from './_hooks/_useDeadlinePicker';
import { useSaveTask } from './_hooks/_useSaveTask';
import { TitleField } from './_components/_TitleField';
import { MemoField } from './_components/_MemoField';
import { PhotoPicker } from './_components/_PhotoPicker';
import { DeadlinePicker } from './_components/_DeadlinePicker';
import { NotificationToggle } from './_components/_NotificationToggle';
import { ActionButtons } from './_components/_ActionButtons';
import { FolderSelectorModal } from './_components/FolderSelectorModal';
import {
  LIGHT_PLACEHOLDER,
  DARK_PLACEHOLDER,
} from './_constants';

type TabParamList = {
  calendar: undefined;
  tasks: undefined;
  add: undefined;
  settings: undefined;
};

export default function AddTaskScreen() {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { fontSizeKey } = useContext(FontSizeContext);
  const fsKey = fontSizeKey;
  const { t } = useTranslation();
  const navigation =
    useNavigation<BottomTabNavigationProp<TabParamList>>();
  const router = useRouter();
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();
  const { reset: resetUnsaved } = useUnsavedStore();
  const styles = createStyles(isDark, subColor, fsKey);

  const [currentDraftId, setCurrentDraftId] =
    useState<string | null>(draftId ?? null);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [memoHeight, setMemoHeight] = useState(40);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [customUnit, setCustomUnit] = useState<
    'minutes' | 'hours' | 'days'
  >('hours');
  const [customAmount, setCustomAmount] = useState(1);
  const [folder, setFolder] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);

  const { imageUris, pickImages, removeImage } = useImagePicker();
  const {
    deadline,
    setDeadline,
    showDatePicker,
    showTimePicker,
  } = useDeadlinePicker(new Date());

  const clearForm = useCallback(() => {
    setCurrentDraftId(null);
    setTitle('');
    setMemo('');
    setMemoHeight(40);
    setDeadline(new Date());
    setNotifyEnabled(true);
    setCustomUnit('hours');
    setCustomAmount(1);
    setFolder('');
    resetUnsaved();
  }, [resetUnsaved, setDeadline]);

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
                if (e.data?.action)
                  navigation.dispatch(e.data.action);
              },
            },
          ]
        );
      }
    );
    return unsub;
  }, [navigation, title, memo, imageUris, clearForm, t]);

  const getRange = useCallback(
    (unit: 'minutes' | 'hours' | 'days') => {
      const max =
        unit === 'minutes'
          ? 60
          : unit === 'hours'
          ? 48
          : 31;
      return Array.from({ length: max }, (_, i) => i + 1);
    },
    []
  );

  const existingFolders = useFolders();
  useEffect(() => {
    if (showFolderModal) {
      setFolders(existingFolders);
    }
  }, [showFolderModal, existingFolders]);

  const { saveTask, saveDraft } = useSaveTask({
    title,
    memo,
    deadline,
    imageUris,
    notifyEnabled,
    customUnit,
    customAmount,
    folder,
    currentDraftId,
    clearForm,
    t,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>{t('add_task.title')}</Text>
        <TouchableOpacity
          style={styles.draftsButton}
          onPress={() => router.push('/(tabs)/drafts')}
        >
          <Ionicons
            name="document-text-outline"
            size={fontSizes[fsKey]}
            color={subColor}
          />
          <Text style={styles.draftsButtonText}>
            {t('add_task.drafts')}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TitleField
          label={t('add_task.input_title')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('add_task.input_title_placeholder')}
          placeholderTextColor={
            isDark ? DARK_PLACEHOLDER : LIGHT_PLACEHOLDER
          }
          labelStyle={[styles.label, { color: subColor }]}
          inputStyle={[styles.input, { minHeight: 40 }]}
        />
        <MemoField
          label={t('add_task.memo')}
          value={memo}
          onChangeText={setMemo}
          placeholder={t('add_task.memo_placeholder')}
          placeholderTextColor={
            isDark ? DARK_PLACEHOLDER : LIGHT_PLACEHOLDER
          }
          onContentSizeChange={e =>
            setMemoHeight(e.nativeEvent.contentSize.height)
          }
          height={memoHeight}
          labelStyle={[styles.label, { color: subColor }]}
          inputStyle={[
            styles.input,
            { height: Math.max(40, memoHeight) },
          ]}
        />
        <PhotoPicker
          imageUris={imageUris}
          onPick={pickImages}
          onRemove={removeImage}
          selectText={t('add_task.select_photo')}
          addText={t('add_task.add_photo')}
          isDark={isDark}
          subColor={subColor}
          fontSizeKey={fsKey}
          styles={styles}
        />
        <Text style={[styles.label, { color: subColor }]}>
          {t('add_task.folder')}
        </Text>
        <TouchableOpacity
          onPress={() => setShowFolderModal(true)}
          style={styles.folderInput}
        >
          <Text
            style={{
              color: isDark ? '#fff' : '#000',
              fontSize: fontSizes[fsKey],
            }}
          >
            {folder || t('add_task.no_folder')}
          </Text>
        </TouchableOpacity>
        <FolderSelectorModal
          visible={showFolderModal}
          onClose={() => setShowFolderModal(false)}
          onSubmit={name => {
            setFolder(name);
          }}
          folders={folders}
        />
        <View style={styles.notifyContainer}>
          <Text style={[styles.label, { color: subColor }]}>
            {t('add_task.deadline')}
          </Text>
          <DeadlinePicker
            deadline={deadline}
            showDatePicker={showDatePicker}
            showTimePicker={showTimePicker}
            styles={styles}
          />
          <View style={styles.notifyHeader}>
            <Text
              style={[styles.notifyLabel, { color: subColor }]}
            >
              {t('add_task.notification')}
            </Text>
            <NotificationToggle
              notifyEnabled={notifyEnabled}
              onToggle={() =>
                setNotifyEnabled(v => !v)
              }
              isDark={isDark}
              subColor={subColor}
              styles={styles}
            />
          </View>
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
                  {getRange(customUnit).map(n => (
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
                  onValueChange={v => {
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
        <ActionButtons
          onSave={saveTask}
          onSaveDraft={saveDraft}
          saveText={t('add_task.add_task_button')}
          draftText={t('add_task.save_draft_button')}
          styles={styles}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
