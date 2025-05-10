//C:\Users\fukur\task-app\app\features\add\index.tsx

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { Image } from 'react-native';
import { Modal, Pressable } from 'react-native';

import type { AddTaskStyles } from './types';
import { createStyles } from './styles';
import { useFolders } from './hooks/useFolders';
import { useImagePicker } from './hooks/useImagePicker';
import { useDeadlinePicker } from './hooks/useDeadlinePicker';
import { useSaveTask } from './hooks/useSaveTask';
import { TitleField } from './components/TitleField';
import { MemoField } from './components/MemoField';
import { PhotoPicker } from './components/PhotoPicker';
import { DeadlinePicker } from './components/DeadlinePicker';
import { NotificationToggle } from './components/NotificationToggle';
import { ActionButtons } from './components/ActionButtons';
import { FolderSelectorModal } from './components/FolderSelectorModal';
import { WheelPickerModal } from './components/WheelPickerModal';
import {
  LIGHT_PLACEHOLDER,
  DARK_PLACEHOLDER,
} from './constants';

type TabParamList = {
  calendar: undefined;
  tasks: undefined;
  add: undefined;
  settings: undefined;
};

export default function AddTaskScreen() {
  const [deadlineEnabled, setDeadlineEnabled] = useState(true);
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

  const [currentDraftId, setCurrentDraftId] = useState<string | null>(
    draftId ?? null,
  );
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [memoHeight, setMemoHeight] = useState(40);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [customUnit, setCustomUnit] = useState<
    'minutes' | 'hours' | 'days'
  >('hours');
  const [customAmount, setCustomAmount] = useState(1);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [folder, setFolder] = useState('');
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  
  const { imageUris, pickImages, removeImage, setImageUris } = useImagePicker();
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
    setImageUris([]);     // ✅ 画像リセット
    resetUnsaved();       // ✅ dirty 状態クリア
  }, [resetUnsaved, setDeadline, setImageUris]);  

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
          ],
        );
      },
    );
    return unsub;
  }, [navigation, title, memo, imageUris, clearForm, t]);

  const getRange = useCallback(
    (unit: 'minutes' | 'hours' | 'days') => {
      const max =
        unit === 'minutes' ? 60 : unit === 'hours' ? 48 : 31;
      return Array.from({ length: max }, (_, i) => i + 1);
    },
    [],
  );

  const existingFolders = useFolders(showFolderModal);
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
    clearForm: () => {
      clearForm();                    // ✅ 入力初期化
      router.replace('/tasks');      // ✅ 一覧画面に戻る
    },
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
        <Text style={styles.draftsButtonText}>{t('add_task.drafts')}</Text>
      </TouchableOpacity>
    </View>

    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <View
        style={{
          backgroundColor: isDark ? '#222' : '#F5F5F5',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {/* タイトル */}
        <View style={{ padding: 16 }}>
          <TitleField
            label={t('add_task.input_title')}
            value={title}
            onChangeText={setTitle}
            placeholder={t('add_task.input_title_placeholder')}
            placeholderTextColor={isDark ? DARK_PLACEHOLDER : LIGHT_PLACEHOLDER}
            labelStyle={[styles.label, { color: subColor }]}
            inputStyle={[styles.input, { minHeight: 40 }]}
          />
        </View>

        <View style={{ height: 1, backgroundColor: isDark ? '#444' : '#DDD' }} />

        {/* メモ */}
        <View style={{ padding: 16 }}>
          <MemoField
            label={t('add_task.memo')}
            value={memo}
            onChangeText={setMemo}
            placeholder={t('add_task.memo_placeholder')}
            placeholderTextColor={isDark ? DARK_PLACEHOLDER : LIGHT_PLACEHOLDER}
            onContentSizeChange={(e) =>
              setMemoHeight(e.nativeEvent.contentSize.height)
            }
            height={memoHeight}
            labelStyle={[styles.label, { color: subColor }]}
            inputStyle={[styles.input, { height: Math.max(40, memoHeight) }]}
          />
        </View>

        <View style={{ height: 1, backgroundColor: isDark ? '#444' : '#DDD' }} />

        {/* 写真 */}
        <TouchableOpacity onPress={pickImages} style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.label, { color: subColor }]}>
              {t('add_task.photo')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                color: isDark ? '#FFF' : '#000',
                fontSize: fontSizes[fsKey],
                fontWeight: '400',
              }}>
                {imageUris.length > 0
                  ? t('add_task.photo_selected', { count: imageUris.length })
                  : t('add_task.select_photo')}
              </Text>
              <Ionicons name="chevron-forward" size={fontSizes[fsKey]} color={subColor} />
            </View>
          </View>
        </TouchableOpacity>

{/* 写真プレビュー */}
{imageUris.length > 0 && (
  <ScrollView
    horizontal
    style={{ paddingHorizontal: 16, marginBottom: 12 }}
    contentContainerStyle={{ gap: 8 }}
    showsHorizontalScrollIndicator={false}
  >
    {imageUris.map((uri, index) => (
      <View key={index} style={{ position: 'relative' }}>
        {/* 拡大表示用Touchable */}
        <Pressable onPress={() => setPreviewUri(uri)}>
          <Image
            source={{ uri }}
            style={{ width: 80, height: 80, borderRadius: 8 }}
          />
        </Pressable>
        {/* 削除ボタン */}
        <TouchableOpacity
          onPress={() => removeImage(uri)}
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            backgroundColor: '#FFF',
            borderRadius: 12,
          }}
        >
          <Ionicons name="close-circle" size={24} color="#999" />
        </TouchableOpacity>

      </View>
    ))}
  </ScrollView>
)}


        <View style={{ height: 1, backgroundColor: isDark ? '#444' : '#DDD' }} />

        {/* フォルダー */}
        <TouchableOpacity onPress={() => setShowFolderModal(true)} style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.label, { color: subColor }]}>
              {t('add_task.folder')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                color: isDark ? '#FFF' : '#000',
                fontSize: fontSizes[fsKey],
                fontWeight: '400',
              }}>
                {folder || t('add_task.no_folder')}
              </Text>
              <Ionicons name="chevron-forward" size={fontSizes[fsKey]} color={subColor} />
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: 1, backgroundColor: isDark ? '#444' : '#DDD' }} />

        {/* 期限 */}
        <TouchableOpacity
          onPress={() => deadlineEnabled && showDatePicker()}
          style={{ padding: 16 }}
          activeOpacity={deadlineEnabled ? 0.7 : 1}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.label, { color: subColor }]}>
              {t('add_task.deadline')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                color: deadlineEnabled ? (isDark ? '#FFF' : '#000') : (isDark ? '#AAA' : '#888'),
                fontSize: fontSizes[fsKey],
                fontWeight: '400',
              }}>
                {deadlineEnabled
                  ? `${deadline.toLocaleDateString()} ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : t('add_task.no_deadline')}
              </Text>
              <Ionicons name="chevron-forward" size={fontSizes[fsKey]} color={subColor} />
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: 1, backgroundColor: isDark ? '#444' : '#DDD' }} />

        {/* 通知 */}
        <TouchableOpacity
          onPress={() => notifyEnabled && setShowWheelModal(true)}
          style={{ padding: 16 }}
          activeOpacity={notifyEnabled ? 0.7 : 1}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.label, { color: subColor }]}>
              {t('add_task.notification')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                color: notifyEnabled ? (isDark ? '#FFF' : '#000') : (isDark ? '#AAA' : '#888'),
                fontSize: fontSizes[fsKey],
                fontWeight: '400',
              }}>
                {notifyEnabled
                  ? `${customAmount} ${t(`add_task.${customUnit}_before`)}`
                  : t('add_task.no_notification')}
              </Text>
              <Ionicons name="chevron-forward" size={fontSizes[fsKey]} color={subColor} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* モーダル */}
      <FolderSelectorModal
        visible={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSubmit={(name) => setFolder(name)}
        folders={folders}
      />
      <WheelPickerModal
        visible={showWheelModal}
        initialAmount={customAmount}
        initialUnit={customUnit}
        onConfirm={(amount, unit) => {
          setCustomAmount(amount);
          setCustomUnit(unit);
          setShowWheelModal(false);
        }}
        onCancel={() => setShowWheelModal(false)}
      />
      <Modal visible={!!previewUri} transparent={true} animationType="fade">
  <Pressable
    style={{
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    }}
    onPress={() => setPreviewUri(null)}
  >
    {previewUri && (
      <Image
        source={{ uri: previewUri }}
        style={{
          width: '90%',
          height: '70%',
          resizeMode: 'contain',
          borderRadius: 8,
        }}
      />
    )}
  </Pressable>
</Modal>


      {/* ボタン */}
      <ActionButtons
        onSave={saveTask}
        onSaveDraft={saveDraft}
        saveText={t('add_task.add_task_button')}
        draftText={t('add_task.save_draft_button')}
        styles={styles}
      />
    </ScrollView>
  </SafeAreaView>
)};
