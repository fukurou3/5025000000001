// app/features/add/index.tsx

import React, { useState, useEffect, useCallback, useContext } from 'react'
import { useWindowDimensions } from 'react-native'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Pressable,
  Image,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useUnsavedStore } from '@/hooks/useUnsavedStore'
import { useAppTheme } from '@/hooks/ThemeContext'
import { useTranslation } from 'react-i18next'
import { FontSizeContext } from '@/context/FontSizeContext'
import { fontSizes } from '@/constants/fontSizes'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NotificationToggle } from './components/NotificationToggle'
import DateTimePicker from '@react-native-community/datetimepicker'


import type { AddTaskStyles } from './types'
import { createStyles } from './styles'
import { useFolders } from './hooks/useFolders'
import { useSaveTask } from './hooks/useSaveTask'
import { TitleField } from './components/TitleField'
import { MemoField } from './components/MemoField'
import { PhotoPicker } from './components/PhotoPicker'
import { ActionButtons } from './components/ActionButtons'
import { FolderSelectorModal } from './components/FolderSelectorModal'
import { WheelPickerModal } from './components/WheelPickerModal'
import {
  LIGHT_PLACEHOLDER,
  DARK_PLACEHOLDER,
} from './constants'

type TabParamList = {
  calendar: undefined
  tasks: undefined
  add: undefined
  settings: undefined
}

export default function AddTaskScreen() {
  const [deadlineEnabled, setDeadlineEnabled] = useState(true)
  const { colorScheme, subColor } = useAppTheme()
  const isDark = colorScheme === 'dark'
  const { fontSizeKey } = useContext(FontSizeContext)
  const fsKey = fontSizeKey
  const { t } = useTranslation()
  const navigation =
    useNavigation<BottomTabNavigationProp<TabParamList>>()
  const router = useRouter()
  const { draftId } = useLocalSearchParams<{ draftId?: string }>()
  const { reset: resetUnsaved } = useUnsavedStore()
  const styles = createStyles(isDark, subColor, fsKey)

const { width: screenWidth, height: screenHeight } = useWindowDimensions()
const isLandscape = screenWidth > screenHeight
const isTablet = screenWidth >= 768
// ② 向きやデバイスごとに、最低列数を設定
//    スマホ縦：3列、スマホ横：4列、タブレット：5列 などお好みで調整可
const previewCount = isTablet ? 5 : isLandscape ? 4 : 3
const H_PADDING = 16 * 2 
const ITEM_MARGIN = 8
const previewSize =(screenWidth - H_PADDING - ITEM_MARGIN * (previewCount - 1)) / previewCount

  // PhotoPicker 用 state
  const [selectedUris, setSelectedUris] = useState<string[]>([])
  const [pickerVisible, setPickerVisible] = useState(false)

  const [currentDraftId, setCurrentDraftId] = useState<string | null>(
    draftId ?? null,
  )
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [memoHeight, setMemoHeight] = useState(40)
  const [notifyEnabled, setNotifyEnabled] = useState(true)
  const [customUnit, setCustomUnit] = useState<
    'minutes' | 'hours' | 'days'
  >('hours')
  const [customAmount, setCustomAmount] = useState(1)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [folders, setFolders] = useState<string[]>([])
  const [folder, setFolder] = useState('')
  const [showWheelModal, setShowWheelModal] = useState(false)
  const [previewUri, setPreviewUri] = useState<string | null>(null)

  const clearForm = useCallback(() => {
    setCurrentDraftId(null)
    setTitle('')
    setMemo('')
    setMemoHeight(40)
    setNotifyEnabled(true)
    setCustomUnit('hours')
    setCustomAmount(1)
    setFolder('')
    setSelectedUris([])     // 画像リセット
    resetUnsaved()
  }, [resetUnsaved])
const deadline = new Date()

  useEffect(() => {
    const unsub = navigation.addListener(
      'beforeRemove',
      (e: any) => {
        if (!title && !memo && selectedUris.length === 0)
          return
        e.preventDefault()
        Alert.alert(
          t('add_task.alert_discard_changes_title'),
          t('add_task.alert_discard_changes_message'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('add_task.alert_discard'),
              style: 'destructive',
              onPress: () => {
                clearForm()
                if (e.data?.action)
                  navigation.dispatch(e.data.action)
              },
            },
          ],
        )
      },
    )
    return unsub
  }, [navigation, title, memo, selectedUris, clearForm, t])

  const getRange = useCallback(
    (unit: 'minutes' | 'hours' | 'days') => {
      const max =
        unit === 'minutes'
          ? 60
          : unit === 'hours'
          ? 48
          : 31
      return Array.from({ length: max }, (_, i) => i + 1)
    },
    [],
  )

  const existingFolders = useFolders(showFolderModal)
  useEffect(() => {
    if (showFolderModal) {
      setFolders(existingFolders)
    }
  }, [showFolderModal, existingFolders])

  const { saveTask, saveDraft } = useSaveTask({
    title,
    memo,
    deadline,
    imageUris: selectedUris,
    notifyEnabled,
    customUnit,
    customAmount,
    folder,
    currentDraftId,
    clearForm: () => {
      clearForm()
      router.replace('/tasks')
    },
    t,
  })

  return (
    <SafeAreaView style={styles.container}>
      {/* アプリバー */}
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
            size={fontSizes[fsKey]}
            color={subColor}
          />
          <Text style={styles.draftsButtonText}>
            {t('add_task.drafts')}
          </Text>
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
              placeholder={t(
                'add_task.input_title_placeholder',
              )}
              placeholderTextColor={
                isDark ? DARK_PLACEHOLDER : LIGHT_PLACEHOLDER
              }
              labelStyle={[styles.label, { color: subColor }]}
              inputStyle={[
                styles.input,
                { minHeight: 40 },
              ]}
            />
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: isDark ? '#444' : '#DDD',
            }}
          />

          {/* メモ */}
          <View style={{ padding: 16 }}>
            <MemoField
              label={t('add_task.memo')}
              value={memo}
              onChangeText={setMemo}
              placeholder={t('add_task.memo_placeholder')}
              placeholderTextColor={
                isDark ? DARK_PLACEHOLDER : LIGHT_PLACEHOLDER
              }
              onContentSizeChange={e =>
                setMemoHeight(
                  e.nativeEvent.contentSize.height,
                )
              }
              height={memoHeight}
              labelStyle={[styles.label, { color: subColor }]}
              inputStyle={[
                styles.input,
                { height: Math.max(40, memoHeight) },
              ]}
            />
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: isDark ? '#444' : '#DDD',
            }}
          />

          {/* 写真 */}
          <TouchableOpacity
            onPress={() => setPickerVisible(true)}
            style={{ padding: 16 }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={[styles.label, { color: subColor }]}
              >
                {t('add_task.photo')}
              </Text>
              <View
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Text
                  style={{
                    color: isDark ? '#FFF' : '#000',
                    fontSize: fontSizes[fsKey],
                    fontWeight: '400',
                  }}
                >
                  {selectedUris.length > 0
                    ? t('add_task.photo_selected', {
                        count: selectedUris.length,
                      })
                    : t('add_task.select_photo')}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={fontSizes[fsKey]}
                  color={subColor}
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* 写真プレビュー */}
          {selectedUris.length > 0 && (
            <ScrollView
              style={{ marginBottom: 12 }}
              contentContainerStyle={{
                paddingHorizontal: 16,
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'flex-start',
              }}
              showsVerticalScrollIndicator={false}
            >
              {selectedUris.map(uri => (
                <View
                  key={uri}
                  style={{ position: 'relative', marginRight: 8 }}
                >
                  <Pressable
                    onPress={() => setPreviewUri(uri)}
                  >
                    <Image
                      source={{ uri }}
                      style={{
                        width: previewSize,
                        height: previewSize,
                        borderRadius: 8,
                      }}
                    />
                  </Pressable>
                  <TouchableOpacity
                    onPress={() =>
                      setSelectedUris(prev =>
                        prev.filter(u => u !== uri),
                      )
                    }
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      backgroundColor: '#FFF',
                      borderRadius: 12,
                    }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* 自前ギャラリーモーダル */}
          <PhotoPicker
            visible={pickerVisible}
            defaultSelected={selectedUris}
            onCancel={() => setPickerVisible(false)}
            onDone={uris => {
              setSelectedUris(uris)
              setPickerVisible(false)
            }}
          />

          <View style={{ height: 1, backgroundColor: isDark ? '#444' : '#DDD', }}/>

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

        
        {/* 期限：見た目だけ */}
        <TouchableOpacity style={{ padding: 16 }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <Text style={[styles.label, { color: subColor }]}>
              {t('add_task.deadline')}
            </Text>
            <Ionicons name="chevron-forward" size={fontSizes[fsKey]} color={subColor} />
          </View>
        </TouchableOpacity>


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
     

          {/* モーダル群 */}
          <FolderSelectorModal
            visible={showFolderModal}
            onClose={() => setShowFolderModal(false)}
            onSubmit={name => setFolder(name)}
            folders={folders}
          />
          <WheelPickerModal
            visible={showWheelModal}
            initialAmount={customAmount}
            initialUnit={customUnit}
            onConfirm={(amount, unit) => {
              setCustomAmount(amount)
              setCustomUnit(unit)
              setShowWheelModal(false)
            }}
            onCancel={() => setShowWheelModal(false)}
          />
          <Modal
            visible={!!previewUri}
            transparent
            animationType="fade"
          >
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
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
