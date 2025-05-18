// app/features/add/index.tsx

import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
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

// AddTaskScreen 固有の型とスタイルをインポート
import type { AddTaskStyles, Task } from './types'; // これは OK (app/features/add/types.ts を指す)
import { createStyles } from './styles'; // これも OK (app/features/add/styles.ts を指す)

// AddTaskScreen で使用するカスタムフックとコンポーネントをインポート
import { useFolders } from './hooks/useFolders';
import { useSaveTask } from './hooks/useSaveTask';
import { TitleField } from './components/TitleField';
import { MemoField } from './components/MemoField';
import { PhotoPicker } from './components/PhotoPicker';
import { ActionButtons } from './components/ActionButtons';
import { FolderSelectorModal } from './components/FolderSelectorModal';
import { WheelPickerModal } from './components/WheelPickerModal';
import { LIGHT_PLACEHOLDER, DARK_PLACEHOLDER } from './constants';

// DeadlineSettingModal コンポーネントと、それに関連する型を正しいパスからインポート
import { DeadlineSettingModal } from './components/DeadlineSettingModal'; // モーダル本体
import type {
    DeadlineSettings,
    DeadlineTime,
    RepeatFrequency,
    // DurationUnit, // formatDeadlineForDisplay で直接使わないなら不要になる可能性も
} from './components/DeadlineSettingModal/types'; // モーダルとのやり取りに必要な型

type NotificationUnit = 'minutes' | 'hours' | 'days';

type TabParamList = {
  calendar: undefined;
  tasks: undefined;
  add: undefined;
  settings: undefined;
};

const INITIAL_INPUT_HEIGHT = 60;

const formatDateForDisplayInternal = (dateString: string | undefined, t: Function, i18nLanguage: string): string => {
    if (!dateString) return '';
    try {
        const [year, month, day] = dateString.split('-').map(Number);
        return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    } catch (e) {
        return dateString;
    }
};

const formatTimeForDisplayInternal = (time: DeadlineTime, t: Function): string => {
    const hour12 = time.hour % 12 === 0 ? 12 : time.hour % 12;
    const ampmKey = (time.hour < 12 || time.hour === 24 || time.hour === 0) ? 'am' : 'pm';
    const ampm = t(`common.${ampmKey}`);
    return `${ampm} ${hour12}:${String(time.minute).padStart(2, '0')}`;
};

const formatDeadlineForDisplay = (settings: DeadlineSettings | undefined, t: Function, i18nLanguage: string): string => {
    if (!settings) {
      return t('add_task.no_deadline_set', '期限未設定');
    }

    const {
        date,
        isTimeEnabled,
        time,
        periodStartDate,
        periodEndDate,
        repeatFrequency,
    } = settings;

    if (repeatFrequency) {
        const frequencyKeyMap: Record<RepeatFrequency, string> = {
            daily: 'deadline_modal.daily',
            weekly: 'deadline_modal.weekly',
            monthly: 'deadline_modal.monthly',
            yearly: 'deadline_modal.yearly',
            custom: 'deadline_modal.custom',
        };
        const frequencyText = t(frequencyKeyMap[repeatFrequency]);
        return frequencyText;
    } else if (periodStartDate) {
        let startDateText = formatDateForDisplayInternal(periodStartDate, t, i18nLanguage);
        let endDateText = periodEndDate ? formatDateForDisplayInternal(periodEndDate, t, i18nLanguage) : null;

        if (endDateText && startDateText !== endDateText) {
            return `${startDateText} ${t('common.to', '～')} ${endDateText}`;
        } else {
            return startDateText;
        }
    } else if (date) {
        let mainDisplay = formatDateForDisplayInternal(date, t, i18nLanguage);
        if (isTimeEnabled && time) {
            mainDisplay += ` ${formatTimeForDisplayInternal(time, t)}`;
        } else {
            mainDisplay += ` ${t('common.all_day', '終日')}`;
        }
        return mainDisplay;
    }

    return t('add_task.no_deadline_set', '期限未設定');
};


export default function AddTaskScreen() {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { fontSizeKey } = useContext(FontSizeContext);
  const fsKey = fontSizeKey;
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const router = useRouter();
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();

  const unsaved = useUnsavedStore((state) => state.unsaved);
  const setUnsaved = useUnsavedStore((state) => state.setUnsaved);
  const resetUnsaved = useUnsavedStore((state) => state.reset);

  const styles = createStyles(isDark, subColor, fsKey); // AddTaskScreen 用のスタイル

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const isTablet = screenWidth >= 768;
  const previewCount = isTablet ? 5 : isLandscape ? 4 : 3;

  const H_PADDING_CONTENT_AREA = 8 * 2;
  const ITEM_MARGIN = 8;
  const previewSize = (screenWidth - 16 - H_PADDING_CONTENT_AREA - ITEM_MARGIN * (previewCount - 1)) / previewCount;

  const initialFormState = useMemo(() => ({
    title: '',
    memo: '',
    selectedUris: [] as string[],
    folder: '',
    currentDeadlineSettings: undefined as DeadlineSettings | undefined,
    notificationActive: false,
    customAmount: 1,
    customUnit: 'hours' as NotificationUnit,
  }), []);


  const [selectedUris, setSelectedUris] = useState<string[]>(initialFormState.selectedUris);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId ?? null);
  const [title, setTitle] = useState(initialFormState.title);
  const [memo, setMemo] = useState(initialFormState.memo);

  const [notificationActive, setNotificationActive] = useState(initialFormState.notificationActive);
  const [customUnit, setCustomUnit] = useState<NotificationUnit>(initialFormState.customUnit);
  const [customAmount, setCustomAmount] = useState(initialFormState.customAmount);
  const [showWheelModal, setShowWheelModal] = useState(false);

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [folder, setFolder] = useState(initialFormState.folder);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [currentDeadlineSettings, setCurrentDeadlineSettings] = useState<DeadlineSettings | undefined>(initialFormState.currentDeadlineSettings);

  const clearForm = useCallback(() => {
    setCurrentDraftId(null);
    setTitle(initialFormState.title);
    setMemo(initialFormState.memo);
    setNotificationActive(initialFormState.notificationActive);
    setCustomUnit(initialFormState.customUnit);
    setCustomAmount(initialFormState.customAmount);
    setFolder(initialFormState.folder);
    setSelectedUris(initialFormState.selectedUris);
    setCurrentDeadlineSettings(initialFormState.currentDeadlineSettings);
    resetUnsaved();
  }, [resetUnsaved, initialFormState]);

  useEffect(() => {
    let formChanged = false;
    // この比較ロジックは、下書き読み込み時の値との比較など、より詳細なものが必要になる場合があります
    if (currentDraftId) {
         formChanged =
            title !== initialFormState.title || // 仮: 実際は読み込んだ下書きの値と比較
            memo !== initialFormState.memo || // 仮
            !selectedUris.every((uri, index) => uri === (initialFormState.selectedUris[index])) || selectedUris.length !== initialFormState.selectedUris.length || // 仮
            folder !== initialFormState.folder || // 仮
            JSON.stringify(currentDeadlineSettings) !== JSON.stringify(initialFormState.currentDeadlineSettings) || // 仮
            notificationActive !== initialFormState.notificationActive || // 仮
            customAmount !== initialFormState.customAmount || // 仮
            customUnit !== initialFormState.customUnit; // 仮
    } else {
      formChanged =
        title !== initialFormState.title ||
        memo !== initialFormState.memo ||
        !selectedUris.every((uri, index) => uri === (initialFormState.selectedUris[index])) || selectedUris.length !== initialFormState.selectedUris.length ||
        folder !== initialFormState.folder ||
        JSON.stringify(currentDeadlineSettings) !== JSON.stringify(initialFormState.currentDeadlineSettings) ||
        notificationActive !== initialFormState.notificationActive ||
        (notificationActive &&
          (customAmount !== initialFormState.customAmount ||
           customUnit !== initialFormState.customUnit)
        );
    }
    setUnsaved(formChanged);
  }, [
    title, memo, selectedUris, folder, currentDeadlineSettings,
    notificationActive, customAmount, customUnit,
    initialFormState, currentDraftId, setUnsaved
  ]);


  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (!unsaved) {
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
  }, [navigation, clearForm, t, unsaved, router]);

  const existingFolders = useFolders(showFolderModal);
  useEffect(() => {
    if (showFolderModal) {
      setFolders(existingFolders);
    }
  }, [showFolderModal, existingFolders]);

  const { saveTask, saveDraft } = useSaveTask({
    title,
    memo,
    imageUris: selectedUris,
    notifyEnabled: notificationActive,
    customUnit: notificationActive ? customUnit : undefined,
    customAmount: notificationActive ? customAmount : undefined,
    folder,
    currentDraftId,
    clearForm: () => {
      clearForm();
    },
    t,
    deadlineDetails: currentDeadlineSettings,
  });

  useEffect(() => {
    const loadDraft = async () => {
      if (draftId) {
        try {
          const storedDrafts = await AsyncStorage.getItem('TASK_DRAFTS');
          if (storedDrafts) {
            const draftsArray: Task[] = JSON.parse(storedDrafts);
            const draftToLoad = draftsArray.find(d => d.id === draftId);
            if (draftToLoad) {
              setCurrentDraftId(draftToLoad.id);
              setTitle(draftToLoad.title || initialFormState.title);
              setMemo(draftToLoad.memo || initialFormState.memo);
              setCurrentDeadlineSettings(draftToLoad.deadlineDetails || initialFormState.currentDeadlineSettings);
              setSelectedUris(draftToLoad.imageUris || initialFormState.selectedUris);
              setNotificationActive(draftToLoad.notifyEnabled !== undefined ? draftToLoad.notifyEnabled : initialFormState.notificationActive);
              setCustomUnit(draftToLoad.customUnit || initialFormState.customUnit);
              setCustomAmount(draftToLoad.customAmount || initialFormState.customAmount);
              setFolder(draftToLoad.folder || initialFormState.folder);

              setTimeout(() => {
                setUnsaved(false); // 下書き読み込み直後は未保存状態ではない
              }, 0);
            } else {
              clearForm();
            }
          } else {
            clearForm();
          }
        } catch (error) {
          console.error("Failed to load draft:", error);
          clearForm();
        }
      } else {
        clearForm();
      }
    };
    loadDraft();
  }, [draftId, clearForm, initialFormState, setUnsaved]);


  const handleSetNoNotificationInModal = () => {
    setNotificationActive(false);
    setCustomAmount(initialFormState.customAmount);
    setCustomUnit(initialFormState.customUnit);
    setShowWheelModal(false);
  };

  const handleConfirmNotificationInModal = (amount: number, unit: NotificationUnit) => {
    setNotificationActive(true);
    setCustomAmount(amount);
    setCustomUnit(unit);
    setShowWheelModal(false);
  };

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
        contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            backgroundColor: isDark ? '#121212' : '#FFFFFF',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          <View style={{ paddingHorizontal: 8, paddingTop: 12, paddingBottom: 12 }}>
            <TitleField
              label={t('add_task.input_title')}
              value={title}
              onChangeText={setTitle}
              placeholder={t('add_task.input_title_placeholder')}
              placeholderTextColor={isDark ? DARK_PLACEHOLDER : LIGHT_PLACEHOLDER}
              labelStyle={[styles.label, { color: subColor }]}
              inputStyle={[styles.input, { minHeight: INITIAL_INPUT_HEIGHT, backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0' }]}
            />
          </View>
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#444' : '#DDD', marginHorizontal: 8 }} />

          <View style={{ paddingHorizontal: 8, paddingTop: 12, paddingBottom: 12 }}>
            <MemoField
              label={t('add_task.memo')}
              value={memo}
              onChangeText={setMemo}
              placeholder={t('add_task.memo_placeholder')}
              placeholderTextColor={isDark ? DARK_PLACEHOLDER : LIGHT_PLACEHOLDER}
              labelStyle={[styles.label, { color: subColor }]}
              inputStyle={[styles.input, { minHeight: INITIAL_INPUT_HEIGHT, backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0', textAlignVertical: 'top' }]}
            />
          </View>
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#444' : '#DDD', marginHorizontal: 8 }} />

          <TouchableOpacity onPress={() => setPickerVisible(true)} style={{ paddingVertical: 14, paddingHorizontal: 8 }}>
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
            <View style={{ paddingHorizontal: 8, paddingBottom: 12 }}>
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
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#444' : '#DDD', marginHorizontal: 8 }} />

          <TouchableOpacity onPress={() => setShowFolderModal(true)} style={{ paddingVertical: 14, paddingHorizontal: 8 }}>
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
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#444' : '#DDD', marginHorizontal: 8 }} />

          <TouchableOpacity onPress={() => setShowDeadlineModal(true)} style={{ paddingVertical: 14, paddingHorizontal: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.label, { color: subColor, marginBottom: 0 }]}>{t('add_task.deadline')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                <Text style={{ color: isDark ? '#FFF' : '#000', fontSize: fontSizes[fsKey], fontWeight: '400', marginRight: 4, textAlign: 'right' }} numberOfLines={1} ellipsizeMode="tail">
                  {formatDeadlineForDisplay(currentDeadlineSettings, t, i18n.language)}
                </Text>
                <Ionicons name="chevron-forward" size={fontSizes[fsKey]} color={isDark ? '#A0A0A0' : '#555555'} />
              </View>
            </View>
          </TouchableOpacity>
           <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#444' : '#DDD', marginHorizontal: 8 }} />

          <TouchableOpacity
            onPress={() => setShowWheelModal(true)}
            style={{ paddingVertical: 14, paddingHorizontal: 8 }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
               <Text style={[styles.label, { color: subColor, marginBottom: 0 }]}>{t('add_task.notification')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{
                        color: isDark ? '#FFF' : '#000',
                        fontSize: fontSizes[fsKey],
                        fontWeight: '400',
                        marginRight: 4,
                        maxWidth: screenWidth * 0.55
                    }} numberOfLines={1} ellipsizeMode="tail">
                        {notificationActive
                            ? `${customAmount} ${t(`add_task.${customUnit}_before` as const, { count: customAmount })}`
                            : t('add_task.no_notification_display', '通知なし')
                        }
                    </Text>
                    <Ionicons name="chevron-forward" size={fontSizes[fsKey]} color={isDark ? '#A0A0A0' : '#555555'} />
                </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 8 }}>
            <ActionButtons
            onSave={saveTask}
            onSaveDraft={saveDraft}
            saveText={t('add_task.add_task_button')}
            draftText={t('add_task.save_draft_button')}
            styles={styles}
            />
        </View>

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
            setShowFolderModal(false);
          }}
          folders={folders}
        />
        <WheelPickerModal
          visible={showWheelModal}
          initialAmount={customAmount}
          initialUnit={customUnit}
          onConfirm={handleConfirmNotificationInModal}
          onClose={() => setShowWheelModal(false)}
          onSetNoNotification={handleSetNoNotificationInModal}
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