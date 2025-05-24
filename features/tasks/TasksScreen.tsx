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
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import 'dayjs/locale/ja';

import { useAppTheme } from '@/hooks/ThemeContext';
import { useSelection } from '@/features/tasks/context';
import { useTranslation } from 'react-i18next';
import { FontSizeContext, FontSizeKey } from '@/context/FontSizeContext';
import { fontSizes as appFontSizes } from '@/constants/fontSizes';
import { createStyles } from '@/features/tasks/styles';
import { Task, FolderOrder, SelectableItem, DisplayTaskOriginal, DisplayableTaskItem } from '@/features/tasks/types';
import { TaskFolder, Props as TaskFolderProps } from '@/features/tasks/components/TaskFolder';
import { RenameFolderModal } from '@/features/tasks/components/RenameFolderModal';
import { calculateNextDisplayInstanceDate, calculateActualDueDate } from '@/features/tasks/utils';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);


const STORAGE_KEY = 'TASKS';
const FOLDER_ORDER_KEY = 'FOLDER_ORDER';
const TAB_HEIGHT = 56;

export default function TasksScreen() {
  const router = useRouter();
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { t, i18n } = useTranslation();
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

  const noFolderName = useMemo(() => t('common.no_folder_name', 'フォルダなし'), [t]);

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
      console.error('Failed to load tasks or folder order:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    } catch (e) {
      console.error('Failed to save tasks:', e);
    }
  };

  const saveFolderOrder = async (order: FolderOrder) => {
    try {
      await AsyncStorage.setItem(FOLDER_ORDER_KEY, JSON.stringify(order));
      setFolderOrder(order);
    } catch (e) {
      console.error('Failed to save folder order:', e);
    }
  };

  const toggleTaskDone = async (id: string, instanceDateStr?: string) => {
    const newTasks = tasks.map(task => {
      if (task.id === id) {
        if (task.deadlineDetails?.repeatFrequency) {
          let newCompletedDates = task.completedInstanceDates ? [...task.completedInstanceDates] : [];
          if (instanceDateStr) {
            const exists = newCompletedDates.includes(instanceDateStr);
            if (exists) {
              newCompletedDates = newCompletedDates.filter(d => d !== instanceDateStr);
            } else {
              newCompletedDates.push(instanceDateStr);
            }
          }
          return { ...task, completedInstanceDates: newCompletedDates };
        } else {
          return {
            ...task,
            completedAt: task.completedAt ? undefined : dayjs.utc().toISOString(),
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

  const baseProcessedTasks: DisplayTaskOriginal[] = useMemo(() => {
    const nowLocal = dayjs();
    return tasks.map(task => {
      const displayDateUtc = task.deadlineDetails?.repeatFrequency && task.deadlineDetails.repeatStartDate
        ? calculateNextDisplayInstanceDate(task, nowLocal)
        : calculateActualDueDate(task);

      let isTaskFullyCompleted = false;
      if (task.deadlineDetails?.repeatFrequency) {
        const nextInstanceIsNull = displayDateUtc === null;
        let repeatEndsPassed = false;
        const repeatEnds = task.deadlineDetails.repeatEnds;

        if (repeatEnds) {
          switch (repeatEnds.type) {
            case 'on_date':
              if (typeof repeatEnds.date === 'string') {
                repeatEndsPassed = dayjs.utc(repeatEnds.date).isBefore(nowLocal.utc());
              }
              break;
            case 'count':
              if (typeof repeatEnds.count === 'number') {
                if ((task.completedInstanceDates?.length || 0) >= repeatEnds.count) {
                  repeatEndsPassed = true;
                }
              }
              break;
          }
        }
        isTaskFullyCompleted = nextInstanceIsNull || repeatEndsPassed;
      } else {
        isTaskFullyCompleted = !!task.completedAt;
      }
      return { ...task, displaySortDate: displayDateUtc, isTaskFullyCompleted };
    });
  }, [tasks]);


  const tasksToProcess: DisplayableTaskItem[] = useMemo(() => {
    if (tab === 'completed') {
      const completedDisplayItems: DisplayableTaskItem[] = [];
      baseProcessedTasks.forEach(task => {
        if (task.isTaskFullyCompleted && !task.deadlineDetails?.repeatFrequency) {
          completedDisplayItems.push({ ...task, keyId: task.id });
        } else if (task.deadlineDetails?.repeatFrequency && task.completedInstanceDates && task.completedInstanceDates.length > 0) {
          task.completedInstanceDates.forEach(instanceDate => {
            completedDisplayItems.push({
              ...task,
              keyId: `${task.id}-${instanceDate}`,
              displaySortDate: dayjs.utc(instanceDate),
              isCompletedInstance: true,
              instanceDate: instanceDate,
            });
          });
          // The following block was causing the error and was determined to be redundant.
          // If a repeating task is fully completed (isTaskFullyCompleted = true),
          // all its relevant completed instances are already added above via completedInstanceDates.
          // There's no need to add the "parent" task object again in this completed view
          // if all its instances are being displayed.
        }
      });
      return completedDisplayItems.sort((a, b) => (b.displaySortDate?.unix() || 0) - (a.displaySortDate?.unix() || 0));
    } else { // 'incomplete' tab
      const todayUtc = dayjs.utc();
      return baseProcessedTasks
        .filter(task => {
          if (task.isTaskFullyCompleted) {
            return false;
          }
          if (task.deadlineDetails?.repeatFrequency) {
            return task.displaySortDate && task.displaySortDate.isSameOrBefore(todayUtc, 'day');
          }
          return true;
        })
        .map(task => ({ ...task, keyId: task.id }));
    }
  }, [baseProcessedTasks, tab]);


  const allFolders = useMemo(() => {
    const folderNameSet = new Set<string>();
    tasksToProcess.forEach(t => {
        folderNameSet.add(t.folder || noFolderName);
    });
    return Array.from(folderNameSet);
  }, [tasksToProcess, noFolderName]);

  const sortedFolders = useMemo(() => {
    const ordered = folderOrder.filter(name => allFolders.includes(name));
    const unordered = allFolders.filter(name => !folderOrder.includes(name));

    const noFolderIndexInUnordered = unordered.indexOf(noFolderName);
    if (noFolderIndexInUnordered !== -1) {
        unordered.splice(noFolderIndexInUnordered, 1);
         return [...ordered, ...unordered, noFolderName];
    }
    return [...ordered, ...unordered];
  }, [folderOrder, allFolders, noFolderName]);

  const handleSelectAll = () => {
    const itemsToSelect: SelectableItem[] = tasksToProcess.map(t => ({
      id: t.keyId,
      type: 'task'
    }));

    const folderNameSetForSelection = new Set<string>();
     tasksToProcess.forEach(t => {
        if (!t.isCompletedInstance || (t.isCompletedInstance && t.folder)) {
             folderNameSetForSelection.add(t.folder || noFolderName);
        } else if (t.isCompletedInstance && !t.folder) {
            folderNameSetForSelection.add(noFolderName);
        }
    });


    const folderItems: SelectableItem[] = Array.from(folderNameSetForSelection)
        .map(f => ({ id: f, type: 'folder' }));

    setAllItems([...itemsToSelect, ...folderItems]);
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
            let updatedTasksState = [...tasks];
            const taskItemsToDelete = new Set(selectedItems.filter(it => it.type === 'task').map(it => it.id));
            const foldersToDelete = new Set(selectedItems.filter(it => it.type === 'folder').map(it => it.id));

            updatedTasksState = updatedTasksState.map(task => {
              if (task.deadlineDetails?.repeatFrequency) {
                let newCompletedInstanceDates = task.completedInstanceDates ? [...task.completedInstanceDates] : [];
                let wasModified = false;

                const originalInstanceCount = newCompletedInstanceDates.length;
                newCompletedInstanceDates = newCompletedInstanceDates.filter(instanceDate => {
                  if (taskItemsToDelete.has(`${task.id}-${instanceDate}`)) {
                    wasModified = true;
                    return false;
                  }
                  if (foldersToDelete.has(task.folder || noFolderName)) {
                    wasModified = true;
                    return false;
                  }
                  return true;
                });

                if (wasModified) {
                  return { ...task, completedInstanceDates: newCompletedInstanceDates };
                }
              }
              return task;
            }).filter(task => { // Chain filter directly
                if (foldersToDelete.has(task.folder || noFolderName)) return false;
                if (task.deadlineDetails?.repeatFrequency && taskItemsToDelete.has(task.id)) return false;
                if (!task.deadlineDetails?.repeatFrequency && taskItemsToDelete.has(task.id)) return false;
                return true;
            });

            setTasks(updatedTasksState);
            await saveTasks(updatedTasksState);
            clearSelection();
          },
        },
      ]
    );
  };

  const handleRenameFolder = async (newName: string) => {
    if (!renameTarget || renameTarget === noFolderName) return;
    const newTasks = tasks.map(task =>
        (task.folder || noFolderName) === renameTarget ? { ...task, folder: newName === noFolderName ? '' : newName } : task
    );
    setTasks(newTasks);
    const newFolderOrder = folderOrder.map(name => (name === renameTarget ? (newName === noFolderName ? '' : newName) : name));
    await saveTasks(newTasks);
    await saveFolderOrder(newFolderOrder);
    setRenameModalVisible(false);
    setRenameTarget(null);
    clearSelection();
  };


  const handleReorderFolder = () => {
    if (selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName) {
      setIsReordering(true);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [fontSizeKey, loadTasks]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
      const langForDayjs = i18n.language.split('-')[0];
      if (dayjs.Ls[langForDayjs]) {
        dayjs.locale(langForDayjs);
      } else {
        dayjs.locale('en');
      }
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
              .filter(t => (t.folder || noFolderName) === folderName)
              .sort((a, b) => {
                if (tab === 'completed' || sortMode === 'deadline') {
                    const dateA = a.displaySortDate || dayjs.utc(0);
                    const dateB = b.displaySortDate || dayjs.utc(0);
                    let comp = dateA.unix() - dateB.unix();
                    if (tab === 'completed') comp = dateB.unix() - dateA.unix();
                    if (comp !== 0) return comp;
                }
                if (sortMode === 'custom' && tab === 'incomplete') {
                    const orderA = a.customOrder ?? Infinity;
                    const orderB = b.customOrder ?? Infinity;
                    if (orderA !== Infinity || orderB !== Infinity) {
                        if (orderA === Infinity) return 1;
                        if (orderB === Infinity) return -1;
                        return orderA - orderB;
                    }
                }
                if (sortMode === 'priority' && tab === 'incomplete') {
                    const priorityA = a.priority ?? 0;
                    const priorityB = b.priority ?? 0;
                    if (priorityA !== priorityB) {
                        return priorityB - priorityA;
                    }
                }
                return a.title.localeCompare(b.title);
              });

            let shouldRenderFolder = folderTasks.length > 0;
            if (folderName === noFolderName && folderTasks.length === 0 && tasksToProcess.every(t => !!t.folder && !t.isCompletedInstance)) {
                 shouldRenderFolder = false;
            }
            if (!shouldRenderFolder && folderName !== noFolderName && folderTasks.length === 0) {
                 shouldRenderFolder = false;
            }


            if (!shouldRenderFolder) return null;


            const taskFolderProps: TaskFolderProps = {
                folderName,
                tasks: folderTasks,
                isCollapsed: !!collapsedFolders[folderName],
                toggleFolder,
                onToggleTaskDone: toggleTaskDone,
                onRefreshTasks: loadTasks,
                isReordering: isReordering && draggingFolder === folderName && folderName !== noFolderName,
                setDraggingFolder,
                draggingFolder,
                moveFolder,
                stopReordering: () => {
                  setIsReordering(false);
                  setDraggingFolder(null);
                },
                isSelecting,
                selectedIds: selectedItems.map(it => it.id),
                onLongPressSelect,
                currentTab: tab,
            };
            return (
              <TaskFolder
                key={folderName}
                {...taskFolderProps}
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
            { bottom: selectionAnim, height: TAB_HEIGHT },
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
            disabled={!(selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName)}
            onPress={() => {
                 if (selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName) {
                    setRenameTarget(selectedItems[0].id);
                    setRenameModalVisible(true);
                }
            }}
            style={{ alignItems: 'center', opacity: (selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName) ? 1 : 0.4 }}
          >
            <Ionicons name="create-outline" size={26} color={subColor} />
            <Text style={[styles.selectionAction, {fontSize: baseFontSize -2, color: subColor, marginTop: 2}]}>
              {t('common.rename')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!(selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName)}
            onPress={handleReorderFolder}
            style={{ alignItems: 'center', opacity: (selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName) ? 1 : 0.4 }}
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