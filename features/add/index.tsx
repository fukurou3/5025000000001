// app/features/add/index.tsx

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useWindowDimensions, View, Text, ScrollView, TouchableOpacity, Alert, Pressable, Image, Modal, Platform, StyleSheet } from 'react-native';
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
// import { NotificationToggle } from './components/NotificationToggle'; // NotificationToggleのimportを削除

import type { AddTaskStyles, Task } from './types';
import { createStyles } from './styles';
import { useFolders } from './hooks/useFolders';
import { useSaveTask } from './hooks/useSaveTask';
import { TitleField } from './components/TitleField';
import { MemoField } from './components/MemoField';
import { PhotoPicker } from './components/PhotoPicker';
import { ActionButtons } from './components/ActionButtons';
import { FolderSelectorModal } from './components/FolderSelectorModal';
import { WheelPickerModal } from './components/WheelPickerModal';
import { LIGHT_PLACEHOLDER, DARK_PLACEHOLDER } from './constants';

import { DeadlineSettingModal } from './components/DeadlineSettingModal';
import type { DeadlineSettings } from './components/DeadlineSettingModal/types';

type TabParamList = {
  calendar: undefined;
  tasks: undefined;
  add: undefined;
  settings: undefined;
};

const getDeadlineForSaveTask = (settings?: DeadlineSettings): Date | undefined => {
  if (!settings?.date) {
    return undefined;
  }
  const datePart = settings.date;
  const [year, month, day] = datePart.split('-').map(Number);

  if (settings.isTimeEnabled && settings.time) {
    return new Date(year, month - 1, day, settings.time.hour, settings.time.minute);
  } else {
    return new Date(year, month - 1, day);
  }
};

const formatDeadlineForDisplay = (settings: DeadlineSettings | undefined, t: Function): string => {
    if (!settings || (!settings.date && !settings.periodStartDate)) {
      return t('add_task.no_deadline_set', '期限未設定');
    }

    let displayDate = '';
    let displayTime = '';
    let isPeriod = false;

    if (settings.periodStartDate) {
      isPeriod = true;
      displayDate = settings.periodStartDate;
      if (settings.periodEndDate && settings.periodStartDate !== settings.periodEndDate) {
        displayDate += ` ${t('common.to', '～')} ${settings.periodEndDate}`;
      }
    } else if (settings.date) {
      displayDate = settings.date;
    }

    if (!isPeriod && settings.isTimeEnabled && settings.time && settings.date) {
      const hour12 = settings.time.hour % 12 === 0 ? 12 : settings.time.hour % 12;
      const ampmKey = (settings.time.hour < 12 || settings.time.hour === 24) ? 'am' : 'pm';
      const ampm = t(`common.${ampmKey}`, ampmKey.toUpperCase());
      displayTime = ` ${ampm} ${hour12}:${String(settings.time.minute).padStart(2, '0')}`;
    } else if (!isPeriod && settings.date && !settings.isTimeEnabled) {
      displayTime = ` ${t('common.all_day', '終日')}`;
    }
    return `${displayDate}${displayTime}`;
  };


export default function AddTaskScreen() {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { fontSizeKey } = useContext(FontSizeContext);
  const fsKey = fontSizeKey;
  const { t } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const router = useRouter();
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();

  const unsaved = useUnsavedStore((state) => state.unsaved);
  const setUnsaved = useUnsavedStore((state) => state.setUnsaved);
  const resetUnsaved = useUnsavedStore((state) => state.reset);

  const styles = createStyles(isDark, subColor, fsKey);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const isTablet = screenWidth >= 768;
  const previewCount = isTablet ? 5 : isLandscape ? 4 : 3;
  const H_PADDING = 16 * 2;
  const ITEM_MARGIN = 8;
  const previewSize = (screenWidth - H_PADDING - ITEM_MARGIN * (previewCount - 1)) / previewCount;

  const [selectedUris, setSelectedUris] = useState<string[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId ?? null);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [memoHeight, setMemoHeight] = useState(40);
  // const [notifyEnabled, setNotifyEnabled] = useState(true); // notifyEnabled stateを削除
  const [customUnit, setCustomUnit] = useState<'minutes' | 'hours' | 'days'>('hours');
  const [customAmount, setCustomAmount] = useState(1);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [folder, setFolder] = useState('');
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [currentDeadlineSettings, setCurrentDeadlineSettings] = useState<DeadlineSettings | undefined>(undefined);

  const isFormConsideredEmpty = useCallback(() => {
    return !title && !memo && selectedUris.length === 0 && !folder && !currentDeadlineSettings?.date && !currentDeadlineSettings?.periodStartDate;
  }, [title, memo, selectedUris, folder, currentDeadlineSettings]);

  const clearForm = useCallback(() => {
    setCurrentDraftId(null);
    setTitle('');
    setMemo('');
    setMemoHeight(40);
    // setNotifyEnabled(true); // notifyEnabledに関する処理を削除
    setCustomUnit('hours');
    setCustomAmount(1);
    setFolder('');
    setSelectedUris([]);
    setCurrentDeadlineSettings(undefined);
    resetUnsaved();
  }, [resetUnsaved]);


  useEffect(() => {
    if (!isFormConsideredEmpty()) {
        setUnsaved(true);
    } else {
        setUnsaved(false);
    }
  }, [title, memo, selectedUris, folder, currentDeadlineSettings, isFormConsideredEmpty, setUnsaved]);


  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (isFormConsideredEmpty() || !unsaved) {
        resetUnsaved();
        return;
      }
      e.preventDefault();
      Alert.alert(
        t('add_task.alert_discard_changes_title'),
        t('add_task.alert_discard_changes_message'),
        [
          { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
          {
            text: t('add_task.alert_discard'),
            style: 'destructive',
            onPress: () => {
              clearForm();
              if (e.data?.action) navigation.dispatch(e.data.action);
              else router.back();
            },
          },
        ],
      );
    });
    return unsub;
  }, [navigation, clearForm, t, isFormConsideredEmpty, unsaved, resetUnsaved, router]);

  const existingFolders = useFolders(showFolderModal);
  useEffect(() => {
    if (showFolderModal) {
      setFolders(existingFolders);
    }
  }, [showFolderModal, existingFolders]);

  const { saveTask, saveDraft } = useSaveTask({
    title,
    memo,
    deadline: getDeadlineForSaveTask(currentDeadlineSettings),
    imageUris: selectedUris,
    notifyEnabled: true, // notifyEnabledをtrueに固定
    customUnit,
    customAmount,
    folder,
    currentDraftId,
    clearForm: () => {
      clearForm();
      router.replace('/(tabs)/tasks');
    },
    t,
  });

  useEffect(() => {
    const loadDraft = async () => {
      if (draftId) {
        try {
          const storedDrafts = await AsyncStorage.getItem('TASK_DRAFTS');
          if (storedDrafts) {
            const draftsArray: Task[] = JSON.parse(storedDrafts);
            const draftToLoad = draftsArray.find(d => d.id === draftId) as (Task & { deadlineDetails?: DeadlineSettings });
            if (draftToLoad) {
              setCurrentDraftId(draftToLoad.id);
              setTitle(draftToLoad.title || '');
              setMemo(draftToLoad.memo || '');
              setCurrentDeadlineSettings(draftToLoad.deadlineDetails || undefined);
              setSelectedUris(draftToLoad.imageUris || []);
              // setNotifyEnabled(draftToLoad.notifyEnabled !== undefined ? draftToLoad.notifyEnabled : true); // notifyEnabledに関する処理を削除
              setCustomUnit(draftToLoad.customUnit || 'hours');
              setCustomAmount(draftToLoad.customAmount || 1);
              setFolder(draftToLoad.folder || '');
            }
          }
        } catch (error) {
          console.error("Failed to load draft:", error);
        }
      }
    };
    loadDraft();
  }, [draftId]);

  // handleToggleNotify関数を削除
  // const handleToggleNotify = useCallback(() => {
  //   setNotifyEnabled(prev => !prev);
  // }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>{t('add_task.title')}</Text>
        <TouchableOpacity
          style={styles.draftsButton}
          onPress={() => router.push('/(tabs)/drafts')}
        >
          <Ionicons name="document-text-outline" size={fontSizes[fsKey]} color={subColor} />
          <Text style={styles.draftsButtonText}>{t('add_task.drafts')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
            <TitleField
              label={t('add_task.input_title')}
              value={title}
              onChangeText={setTitle}
              placeholder={t('add_task.input_title_placeholder')}
              placeholderTextColor={isDark ? DARK_PLACEHOLDER : LIGHT_PLACEHOLDER}
              labelStyle={[styles.label, { color: subColor }]}
              inputStyle={[styles.input, { minHeight: 40, backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}
            />
          </View>

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#444' : '#DDD', marginHorizontal: 16 }} />

          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
            <MemoField
              label={t('add_task.memo')}
              value={memo}
              onChangeText={setMemo}
              placeholder={t('add_task.memo_placeholder')}
              placeholderTextColor={isDark ? DARK_PLACEHOLDER : LIGHT_PLACEHOLDER}
              onContentSizeChange={e => setMemoHeight(e.nativeEvent.contentSize.height)}
              height={memoHeight}
              labelStyle={[styles.label, { color: subColor }]}
              inputStyle={[styles.input, { height: Math.max(40, memoHeight), backgroundColor: isDark ? '#1C1C1E' : '#F0F0F0' }]}
            />
          </View>

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#444' : '#DDD', marginHorizontal: 16 }} />

          <TouchableOpacity onPress={() => setPickerVisible(true)} style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.label, { color: subColor, marginBottom: 0 }]}>{t('add_task.photo')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: isDark ? '#FFF' : '#000', fontSize: fontSizes[fsKey], fontWeight: '400', marginRight: 4 }}>
                  {selectedUris.length > 0 ? t('add_task.photo_selected', { count: selectedUris.length }) : t('add_task.select_photo')}
                </Text>
                <Ionicons name="chevron-forward" size={fontSizes[fsKey]} color={isDark ? '#A0A0A0' : '#555555'} />
              </View>
            </View>
          </TouchableOpacity>

          {selectedUris.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8 }}>
                {selectedUris.map(uri => (
                  <View key={uri} style={{ position: 'relative', marginRight: ITEM_MARGIN, marginBottom: ITEM_MARGIN }}>
                    <Pressable onPress={() => setPreviewUri(uri)}>
                      <Image source={{ uri }} style={{ width: previewSize, height: previewSize, borderRadius: 8 }} />
                    </Pressable>
                    <TouchableOpacity
                      onPress={() => setSelectedUris(prev => prev.filter(u => u !== uri))}
                      style={{ position: 'absolute', top: -8, right: -8, backgroundColor: isDark ? '#333' :'#FFF', borderRadius: 12, padding:2 }}
                    >
                      <Ionicons name="close-circle" size={22} color={isDark ? '#AAA' :"#888"} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#444' : '#DDD', marginHorizontal: 16 }} />

          <TouchableOpacity onPress={() => setShowFolderModal(true)} style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.label, { color: subColor, marginBottom: 0 }]}>{t('add_task.folder')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: isDark ? '#FFF' : '#000', fontSize: fontSizes[fsKey], fontWeight: '400', marginRight: 4 }}>
                  {folder || t('add_task.no_folder')}
                </Text>
                <Ionicons name="chevron-forward" size={fontSizes[fsKey]} color={isDark ? '#A0A0A0' : '#555555'} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#444' : '#DDD', marginHorizontal: 16 }} />

          <TouchableOpacity onPress={() => setShowDeadlineModal(true)} style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.label, { color: subColor, marginBottom: 0 }]}>{t('add_task.deadline')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: isDark ? '#FFF' : '#000', fontSize: fontSizes[fsKey], fontWeight: '400', marginRight: 4, maxWidth: screenWidth * 0.5 }} numberOfLines={1} ellipsizeMode="tail">
                  {formatDeadlineForDisplay(currentDeadlineSettings, t)}
                </Text>
                <Ionicons name="chevron-forward" size={fontSizes[fsKey]} color={isDark ? '#A0A0A0' : '#555555'} />
              </View>
            </View>
          </TouchableOpacity>

           <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#444' : '#DDD', marginHorizontal: 16 }} />

          {/* === 通知設定の変更箇所 === */}
          <TouchableOpacity
            onPress={() => setShowWheelModal(true)} // 常にWheelPickerModalを開く
            style={{ paddingVertical: 14, paddingHorizontal: 16 }}
            activeOpacity={0.7} // activeOpacityを0.7に固定 (または削除してデフォルト動作)
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
               <Text style={[styles.label, { color: subColor, marginBottom: 0 }]}>{t('add_task.notification')}</Text>
               {/* NotificationToggleを削除 */}
               {/* 右側の通知時間表示部分は常に表示 */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{
                        color: isDark ? '#FFF' : '#000',
                        fontSize: fontSizes[fsKey],
                        fontWeight: '400',
                        marginRight: 4,
                    }}>
                        {`${customAmount} ${t(`add_task.${customUnit}_before` as const)}`}
                    </Text>
                    <Ionicons name="chevron-forward" size={fontSizes[fsKey]} color={isDark ? '#A0A0A0' : '#555555'} />
                </View>
               {/* notifyEnabledがfalseの場合の表示を削除 */}
            </View>
          </TouchableOpacity>
          {/* === 通知設定の変更箇所ここまで === */}
        </View>

        <ActionButtons
          onSave={saveTask}
          onSaveDraft={saveDraft}
          saveText={t('add_task.add_task_button')}
          draftText={t('add_task.save_draft_button')}
          styles={styles}
        />

        <PhotoPicker
          visible={pickerVisible}
          defaultSelected={selectedUris}
          onCancel={() => setPickerVisible(false)}
          onDone={uris => {
            setSelectedUris(uris);
            setPickerVisible(false);
          }}
        />
        <FolderSelectorModal
          visible={showFolderModal}
          onClose={() => setShowFolderModal(false)}
          onSubmit={(name) => {
            setFolder(name);
          }}
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
        <DeadlineSettingModal
          visible={showDeadlineModal}
          onClose={() => setShowDeadlineModal(false)}
          onSave={(newSettings) => {
            setCurrentDeadlineSettings(newSettings);
            setShowDeadlineModal(false);
          }}
          initialSettings={currentDeadlineSettings}
        />
        <Modal visible={!!previewUri} transparent animationType="fade">
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setPreviewUri(null)}
          >
            {previewUri && (
              <Image source={{ uri: previewUri }} style={{ width: '95%', height: '80%', resizeMode: 'contain', borderRadius: 8 }} />
            )}
             <TouchableOpacity
                style={{ position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, right: 20, padding: 10 }}
                onPress={() => setPreviewUri(null)}
            >
                <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}