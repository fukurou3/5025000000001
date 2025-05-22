// app/features/tasks/TasksScreen.tsx
import React, { useEffect, useState, useCallback, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Animated,
  Alert,
  StyleSheet, // StyleSheet をインポート
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import 'dayjs/locale/ja';

import { useAppTheme } from '@/hooks/ThemeContext';
import { useSelection } from '@/features/tasks/context';
import { useTranslation } from 'react-i18next';
import { FontSizeContext, FontSizeKey } from '@/context/FontSizeContext'; // FontSizeKey をインポート
import { fontSizes as appFontSizes } from '@/constants/fontSizes'; // appFontSizes をインポート
import { createStyles } from '@/features/tasks/styles';
import { Task, FolderOrder, SelectableItem } from '@/features/tasks/types';
import { TaskFolder } from '@/features/tasks/components/TaskFolder';
import { RenameFolderModal } from '@/features/tasks/components/RenameFolderModal';
import { calculateNextDisplayInstanceDate } from '@/features/tasks/utils';

dayjs.locale('ja');
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const STORAGE_KEY = 'TASKS';
const FOLDER_ORDER_KEY = 'FOLDER_ORDER';
const TAB_HEIGHT = 56;

// 表示用に拡張されたTask型
export type DisplayTask = Task & {
  displaySortDate: dayjs.Dayjs | null;
};

export default function TasksScreen() {
  const router = useRouter();
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { t, i18n } = useTranslation(); // i18n を追加
  const { fontSizeKey } = useContext(FontSizeContext);
  const styles = createStyles(isDark, subColor, fontSizeKey);

  const {
    isSelecting,
    selectedItems,
    startSelecting,
    stopSelecting,
    toggleItem,
    setAllItems,
    clearSelection,
  } = useSelection();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [folderOrder, setFolderOrder] = useState<FolderOrder>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'incomplete' | 'completed'>('incomplete');
  const [sortMode, setSortMode] = useState<'deadline' | 'custom' | 'priority'>('deadline');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isReordering, setIsReordering] = useState(false);
  const [draggingFolder, setDraggingFolder] = useState<string | null>(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);

  const [selectionAnim] = useState(new Animated.Value(-TAB_HEIGHT));

  useEffect(() => {
    Animated.timing(selectionAnim, {
      toValue: isSelecting ? 0 : -TAB_HEIGHT,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isSelecting, selectionAnim]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setTasks(raw ? JSON.parse(raw) : []);
      const orderRaw = await AsyncStorage.getItem(FOLDER_ORDER_KEY);
      setFolderOrder(orderRaw ? JSON.parse(orderRaw) : []);
    } catch (e) {
      console.error('読み込み失敗:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    } catch (e) {
      console.error('保存失敗:', e);
    }
  };

  const saveFolderOrder = async (order: FolderOrder) => {
    try {
      await AsyncStorage.setItem(FOLDER_ORDER_KEY, JSON.stringify(order));
      setFolderOrder(order);
    } catch (e) {
      console.error('保存失敗:', e);
    }
  };

  const toggleTaskDone = async (id: string, instanceDateStr?: string) => {
    const newTasks = tasks.map(task => {
      if (task.id === id) {
        if (task.deadlineDetails?.repeatFrequency && instanceDateStr) {
          const completedDates = task.completedInstanceDates ? [...task.completedInstanceDates] : [];
          const isAlreadyCompleted = completedDates.includes(instanceDateStr);
          let newCompletedDates: string[];
          let newDoneStatusForInstance: boolean;

          if (isAlreadyCompleted) {
            newCompletedDates = completedDates.filter(d => d !== instanceDateStr);
            newDoneStatusForInstance = false;
          } else {
            newCompletedDates = [...completedDates, instanceDateStr];
            newDoneStatusForInstance = true;
          }
          // 親タスクの `done` は、ここでは表示中のインスタンスの状態を反映させる
          // (すべてのインスタンスの完了を追跡するなら、より複雑なロジックが必要)
          return { ...task, completedInstanceDates: newCompletedDates, done: newDoneStatusForInstance };
        } else {
          return {
            ...task,
            done: !task.done,
            completedAt: !task.done ? dayjs().toISOString() : undefined,
          };
        }
      }
      return task;
    });
    setTasks(newTasks);
    await saveTasks(newTasks);
  };

  const toggleFolder = (name: string) => {
    setCollapsedFolders(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const moveFolder = (folderName: string, direction: 'up' | 'down') => {
    setFolderOrder(prev => {
      const idx = prev.indexOf(folderName);
      if (idx < 0) return prev;
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
      saveFolderOrder(arr);
      return arr;
    });
  };

  const onLongPressSelect = (type: 'task' | 'folder', id: string) => {
    startSelecting();
    toggleItem({ id, type });
  };

  const cancelSelecting = () => {
    clearSelection();
  };

  const processedTasks: DisplayTask[] = useMemo(() => {
    return tasks.map(task => {
      const displayDate = task.deadlineDetails?.repeatFrequency && task.deadlineDetails.repeatStartDate
        ? calculateNextDisplayInstanceDate(task, dayjs())
        : task.deadline ? dayjs(task.deadline) : null;
      return { ...task, displaySortDate: displayDate };
    });
  }, [tasks]);


  const tasksToProcess = useMemo(() => {
    return processedTasks.filter(task => {
      if (tab === 'completed') {
        if (task.deadlineDetails?.repeatFrequency) {
          if (task.done && task.displaySortDate === null && task.deadlineDetails.repeatEnds?.date && dayjs(task.deadlineDetails.repeatEnds.date).isBefore(dayjs(),'day')) {
             // 繰り返しが終了し、親がdoneなら完了扱い (全てのインスタンスが完了したとみなす)
            return true;
          }
          const instanceDateStr = task.displaySortDate?.format('YYYY-MM-DD');
          return !!(instanceDateStr && task.completedInstanceDates?.includes(instanceDateStr));
        }
        return task.done;
      } else { // 未完了タブ
        if (task.deadlineDetails?.repeatFrequency) {
          const instanceDateStr = task.displaySortDate?.format('YYYY-MM-DD');
          if (instanceDateStr) { // 表示すべき次のインスタンスがある
            return !task.completedInstanceDates?.includes(instanceDateStr);
          }
          // 表示すべき次のインスタンスがない (繰り返しが終了したか、全て完了済みで次がない)
          return false;
        }
        return !task.done;
      }
    });
  }, [processedTasks, tab]);


  const allFolders = useMemo(() => Array.from(new Set(tasksToProcess.map(t => t.folder ?? ''))), [tasksToProcess]);

  const sortedFolders = useMemo(() => folderOrder.length
    ? folderOrder
        .filter(name => allFolders.includes(name))
        .concat(allFolders.filter(name => !folderOrder.includes(name)))
    : allFolders, [folderOrder, allFolders]);

  const handleSelectAll = () => {
    const taskItems: SelectableItem[] = tasksToProcess.map(t => ({ id: t.id, type: 'task' }));
    const folderItems: SelectableItem[] = sortedFolders.map(f => ({ id: f, type: 'folder' }));
    setAllItems([...taskItems, ...folderItems]);
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      t('common.delete'),
      t('task_list.delete_confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const updatedTasks = tasks.filter(task => {
              const isTaskSelected = selectedItems.some(it => it.type === 'task' && it.id === task.id);
              const isTaskInSelectedFolder = selectedItems.some(
                it => it.type === 'folder' && (task.folder ?? '') === it.id
              );
              return !isTaskSelected && !isTaskInSelectedFolder;
            });
            setTasks(updatedTasks);
            await saveTasks(updatedTasks);
            clearSelection();
          },
        },
      ]
    );
  };

  const handleRenameFolder = async (newName: string) => {
    if (!renameTarget) return;
    const newTasks = tasks.map(task =>
        (task.folder ?? '') === renameTarget ? { ...task, folder: newName } : task
    );
    setTasks(newTasks);
    const newFolderOrder = folderOrder.map(name => (name === renameTarget ? newName : name));
    await saveTasks(newTasks);
    await saveFolderOrder(newFolderOrder);
    setRenameModalVisible(false);
    setRenameTarget(null);
    clearSelection();
  };


  const handleReorderFolder = () => {
    if (selectedItems.length === 1 && selectedItems[0].type === 'folder') {
      setIsReordering(true);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [fontSizeKey, loadTasks]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
      dayjs.locale(i18n.language);
    }, [loadTasks, i18n.language])
  );

  const baseFontSize = appFontSizes[fontSizeKey];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.title}>{t('task_list.title')}</Text>
      </View>

      <View style={styles.topRow}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'incomplete' && styles.tabSelected]}
            onPress={() => { setTab('incomplete'); clearSelection(); }}
          >
            <Text style={[styles.tabText, tab === 'incomplete' && styles.tabSelectedText]}>
              {t('tab.incomplete')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'completed' && styles.tabSelected]}
            onPress={() => { setTab('completed'); clearSelection(); }}
          >
            <Text style={[styles.tabText, tab === 'completed' && styles.tabSelectedText]}>
              {t('tab.completed')}
            </Text>
          </TouchableOpacity>
        </View>

        {!isSelecting && tab !== 'completed' && (
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => setSortModalVisible(true)}
          >
            <Text style={styles.sortLabel}>
              {sortMode === 'deadline'
                ? t('sort.date')
                : sortMode === 'custom'
                ? t('sort.custom')
                : t('sort.priority')}
            </Text>
            <Ionicons name="swap-vertical-outline" size={24} color={subColor} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: isSelecting ? TAB_HEIGHT + 20 : 120, paddingTop: 8 }}>
          {sortedFolders.map(folderName => {
            const folderTasks = tasksToProcess
              .filter(t => (t.folder ?? '') === folderName)
              .sort((a, b) => {
                if (sortMode === 'deadline') {
                  const aHasDeadline = !!a.displaySortDate;
                  const bHasDeadline = !!b.displaySortDate;

                  if (aHasDeadline && bHasDeadline) {
                    return a.displaySortDate!.unix() - b.displaySortDate!.unix();
                  } else if (aHasDeadline && !bHasDeadline) {
                    return -1;
                  } else if (!aHasDeadline && bHasDeadline) {
                    return 1;
                  }
                  return a.title.localeCompare(b.title);
                }
                if (sortMode === 'custom') {
                    const orderA = a.customOrder ?? Infinity;
                    const orderB = b.customOrder ?? Infinity;
                    if (orderA === Infinity && orderB === Infinity) {
                        return a.title.localeCompare(b.title);
                    }
                    return orderA - orderB;
                }
                const priorityA = a.priority ?? 0;
                const priorityB = b.priority ?? 0;
                if (priorityB === priorityA) {
                    return a.title.localeCompare(b.title);
                }
                return priorityB - priorityA;
              });
            if (!folderTasks.length) return null;
            return (
              <TaskFolder
                key={folderName || 'none'}
                folderName={folderName}
                tasks={folderTasks} // folderTasks は DisplayTask[] 型
                isCollapsed={!!collapsedFolders[folderName]}
                toggleFolder={toggleFolder}
                onToggleTaskDone={toggleTaskDone}
                onRefreshTasks={loadTasks}
                isReordering={isReordering && draggingFolder === folderName}
                setDraggingFolder={setDraggingFolder}
                draggingFolder={draggingFolder}
                moveFolder={moveFolder}
                stopReordering={() => {
                  setIsReordering(false);
                  setDraggingFolder(null);
                }}
                isSelecting={isSelecting}
                selectedIds={selectedItems.map(it => it.id)}
                onLongPressSelect={onLongPressSelect}
              />
            );
          })}
          {tasksToProcess.length === 0 && !loading && (
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>
                 {tab === 'incomplete' ? t('task_list.empty') : t('task_list.no_tasks_completed', '完了したタスクはありません')}
               </Text>
             </View>
           )}
        </ScrollView>
      )}
      {!isSelecting && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/add/')}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      {isSelecting && (
        <Animated.View
          style={[
            styles.selectionBar,
            { bottom: selectionAnim },
          ]}
        >
          <TouchableOpacity onPress={handleSelectAll} style={{ alignItems: 'center' }}>
            <Ionicons name="checkmark-done-outline" size={26} color={subColor} />
            <Text style={[styles.selectionAction, {fontSize: baseFontSize -2 , color: subColor, marginTop: 2}]}>
              {t('common.select_all')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDeleteSelected} style={{ alignItems: 'center' }}>
            <Ionicons name="trash-outline" size={26} color={subColor} />
            <Text style={[styles.selectionAction, {fontSize: baseFontSize -2, color: subColor, marginTop: 2}]}>
              {t('common.delete')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!(selectedItems.length === 1 && selectedItems[0].type === 'folder')}
            onPress={() => {
                 if (selectedItems.length === 1 && selectedItems[0].type === 'folder') {
                    setRenameTarget(selectedItems[0].id);
                    setRenameModalVisible(true);
                }
            }}
            style={{ alignItems: 'center', opacity: (selectedItems.length === 1 && selectedItems[0].type === 'folder') ? 1 : 0.4 }}
          >
            <Ionicons name="create-outline" size={26} color={subColor} />
            <Text style={[styles.selectionAction, {fontSize: baseFontSize -2, color: subColor, marginTop: 2}]}>
              {t('common.rename')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!(selectedItems.length === 1 && selectedItems[0].type === 'folder')}
            onPress={handleReorderFolder}
            style={{ alignItems: 'center', opacity: (selectedItems.length === 1 && selectedItems[0].type === 'folder') ? 1 : 0.4 }}
          >
            <Ionicons name="swap-vertical-outline" size={26} color={subColor} />
            <Text style={[styles.selectionAction, {fontSize: baseFontSize -2, color: subColor, marginTop: 2}]}>
              {t('common.reorder')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={cancelSelecting} style={{ alignItems: 'center' }}>
            <Ionicons name="close-outline" size={26} color={subColor} />
            <Text style={[styles.selectionAction, {fontSize: baseFontSize -2, color: subColor, marginTop: 2}]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <RenameFolderModal
        visible={renameModalVisible}
        onClose={() => { setRenameModalVisible(false); setRenameTarget(null); }}
        initialName={renameTarget || ''}
        onSubmit={handleRenameFolder}
      />

      <Modal
        transparent
        visible={sortModalVisible}
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <BlurView intensity={isDark ? 30 : 80} tint={isDark ? 'dark' : 'light'} style={styles.modalBlur}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity onPress={() => { setSortMode('deadline'); setSortModalVisible(false); }}>
                <Text style={[styles.modalOption, {color: isDark ? '#fff': '#000'}]}>{t('sort.date')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSortMode('custom'); setSortModalVisible(false); }}>
                <Text style={[styles.modalOption, {color: isDark ? '#fff': '#000'}]}>{t('sort.custom')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSortMode('priority'); setSortModalVisible(false); }}>
                <Text style={[styles.modalOption, {color: isDark ? '#fff': '#000'}]}>{t('sort.priority')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSortModalVisible(false)} style={{ marginTop: 16 }}>
                <Text style={[styles.modalOption, {color: isDark ? '#fff': '#000'}]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}