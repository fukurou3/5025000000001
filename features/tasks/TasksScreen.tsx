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
  Platform,
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
const SELECTION_BAR_HEIGHT = 60;

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

  const [selectionAnim] = useState(new Animated.Value(-SELECTION_BAR_HEIGHT));

  const noFolderName = useMemo(() => t('common.no_folder_name', 'フォルダなし'), [t]);

  useEffect(() => {
    Animated.timing(selectionAnim, {
      toValue: isSelecting ? 0 : -SELECTION_BAR_HEIGHT,
      duration: 250,
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
                repeatEndsPassed = dayjs.utc(repeatEnds.date).endOf('day').isBefore(nowLocal.utc());
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
          completedDisplayItems.push({ ...task, keyId: task.id, displaySortDate: task.completedAt ? dayjs.utc(task.completedAt) : null });
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
        }
      });
      return completedDisplayItems.sort((a, b) => (b.displaySortDate?.unix() || 0) - (a.displaySortDate?.unix() || 0));
    } else {
       const todayStartOfDayUtc = dayjs.utc().startOf('day');
      return baseProcessedTasks
        .filter(task => {
          if (task.isTaskFullyCompleted) {
            return false;
          }
          if (task.deadlineDetails?.repeatFrequency &&
              (task.deadlineDetails as any)?.isPeriodSettingEnabled && // Fixed
              (task.deadlineDetails as any)?.periodStartDate) { // Fixed
                const periodStartDateUtc = dayjs.utc((task.deadlineDetails as any).periodStartDate).startOf('day'); // Fixed
                if (periodStartDateUtc.isAfter(todayStartOfDayUtc)) {
                    return false;
                }
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
    tasks.forEach(t => {
        folderNameSet.add(t.folder || noFolderName);
    })
    return Array.from(folderNameSet);
  }, [tasksToProcess, tasks, noFolderName]);

  const sortedFolders = useMemo(() => {
    const ordered = folderOrder.filter(name => allFolders.includes(name));
    const unordered = allFolders.filter(name => !folderOrder.includes(name));

    const noFolderIndexInUnordered = unordered.indexOf(noFolderName);
    if (noFolderIndexInUnordered !== -1) {
        unordered.splice(noFolderIndexInUnordered, 1);
         return [...ordered, ...unordered.sort((a,b) => a.localeCompare(b)), noFolderName];
    }
    return [...ordered, ...unordered.sort((a,b) => a.localeCompare(b))];
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
            }).filter(task => {
                if (foldersToDelete.has(task.folder || noFolderName)) return false;
                if (task.deadlineDetails?.repeatFrequency && taskItemsToDelete.has(task.id) && task.completedInstanceDates?.length === 0) return false;
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
    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
        Alert.alert(t('task_list.rename_folder_error_empty_name_title'), t('task_list.rename_folder_error_empty_name_message'));
        return;
    }
    if (folderOrder.includes(trimmedNewName) && trimmedNewName !== renameTarget) {
        Alert.alert(t('task_list.rename_folder_error_exists_title'), t('task_list.rename_folder_error_exists_message'));
        return;
    }

    const newTasks = tasks.map(task =>
        (task.folder || noFolderName) === renameTarget ? { ...task, folder: trimmedNewName === noFolderName ? '' : trimmedNewName } : task
    );
    setTasks(newTasks);
    const newFolderOrder = folderOrder.map(name => (name === renameTarget ? (trimmedNewName === noFolderName ? '' : trimmedNewName) : name));
    await saveTasks(newTasks);
    await saveFolderOrder(newFolderOrder);
    setRenameModalVisible(false);
    setRenameTarget(null);
    clearSelection();
  };


  const handleReorderFolder = () => {
    if (selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName) {
      setIsReordering(true);
      setDraggingFolder(selectedItems[0].id);
      clearSelection();
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.appBar}>
        <Text style={styles.title}>{t('task_list.title')}</Text>
      </View>

      <View style={styles.topRow}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'incomplete' && styles.tabSelected]}
            onPress={() => { setTab('incomplete'); clearSelection(); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === 'incomplete' && styles.tabSelectedText]}>
              {t('tab.incomplete')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'completed' && styles.tabSelected]}
            onPress={() => { setTab('completed'); clearSelection(); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === 'completed' && styles.tabSelectedText]}>
              {t('tab.completed')}
            </Text>
          </TouchableOpacity>
        </View>

        {!isSelecting && tab === 'incomplete' && (
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.sortLabel}>
              {sortMode === 'deadline'
                ? t('sort.date')
                : sortMode === 'custom'
                ? t('sort.custom')
                : t('sort.priority')}
            </Text>
            <Ionicons name="swap-vertical" size={22} color={subColor} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={subColor} />
      ) : (
        <ScrollView
            contentContainerStyle={{
                paddingBottom: isSelecting ? SELECTION_BAR_HEIGHT + 20 : 100,
                paddingTop: 8
            }}
            keyboardShouldPersistTaps="handled"
        >
          {sortedFolders.map(folderName => {
            const folderTasks = tasksToProcess
              .filter(t => (t.folder || noFolderName) === folderName)
              .sort((a, b) => {
                if (tab === 'incomplete' && sortMode === 'deadline') {
                  const today = dayjs.utc().startOf('day');
                  const getCategory = (task: DisplayableTaskItem): number => {
                    const date = task.displaySortDate;
                    if (!date) return 3;
                    if (date.isBefore(today, 'day')) return 0;
                    if (date.isSame(today, 'day')) return 1;
                    return 2;
                  };

                  const categoryA = getCategory(a);
                  const categoryB = getCategory(b);

                  if (categoryA !== categoryB) {
                    return categoryA - categoryB;
                  }

                  if (categoryA === 3) {
                     return a.title.localeCompare(b.title);
                  }

                  const dateAVal = a.displaySortDate!;
                  const dateBVal = b.displaySortDate!;

                  if (dateAVal.isSame(dateBVal, 'day')) {
                      const timeEnabledA = a.deadlineDetails?.isTaskDeadlineTimeEnabled === true && !a.deadlineDetails?.repeatFrequency;
                      const timeEnabledB = b.deadlineDetails?.isTaskDeadlineTimeEnabled === true && !b.deadlineDetails?.repeatFrequency;

                      if (timeEnabledA && !timeEnabledB) return -1;
                      if (!timeEnabledA && timeEnabledB) return 1;
                  }
                  return dateAVal.unix() - dateBVal.unix();

                } else if (tab === 'completed') {
                    const dateA = a.displaySortDate || dayjs.utc(0);
                    const dateB = b.displaySortDate || dayjs.utc(0);
                    return dateB.unix() - dateA.unix();
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
                    const priorityA = a.priority ?? -1;
                    const priorityB = b.priority ?? -1;
                    if (priorityA !== priorityB) {
                        return priorityB - priorityA;
                    }
                }
                return a.title.localeCompare(b.title);
              });

            let shouldRenderFolder = folderTasks.length > 0 || folderName !== noFolderName;
            if (folderName === noFolderName && folderTasks.length === 0 && sortedFolders.length > 1) {
                 shouldRenderFolder = false;
            }
             if (isReordering && draggingFolder !== folderName) {
                 shouldRenderFolder = true;
            }


            if (!shouldRenderFolder && tab === 'completed') return null;


            if (!shouldRenderFolder && folderName !== noFolderName && folderTasks.length === 0 && !isReordering && !isSelecting) {
                 const hasOriginalTaskInThisFolder = tasks.some(t => (t.folder || noFolderName) === folderName);
                 if (!hasOriginalTaskInThisFolder) return null;
            }


            const taskFolderProps: TaskFolderProps = {
                folderName,
                tasks: folderTasks,
                isCollapsed: !!collapsedFolders[folderName] && folderTasks.length > 0,
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
      {!isSelecting && !isReordering && (
        <TouchableOpacity style={[styles.fab, { bottom: Platform.OS === 'ios' ? 16 : 16 }]} onPress={() => router.push('/add/')}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      {isSelecting && (
        <Animated.View
          style={[
            styles.selectionBar,
            { transform: [{ translateY: selectionAnim }] },
            Platform.OS === 'ios' && { paddingBottom: 20 }
          ]}
        >
          <TouchableOpacity onPress={handleSelectAll} style={styles.selectionActionContainer} activeOpacity={0.7}>
            <Ionicons name="checkmark-done-outline" size={28} color={subColor} />
            <Text style={styles.selectionActionText}>
              {t('common.select_all')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDeleteSelected} style={styles.selectionActionContainer} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={28} color={subColor} />
            <Text style={styles.selectionActionText}>
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
            style={[styles.selectionActionContainer, { opacity: (selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName) ? 1 : 0.4 }]}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={28} color={subColor} />
            <Text style={styles.selectionActionText}>
              {t('common.rename')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!(selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName && folderOrder.filter(f => f !== noFolderName).length > 1)}
            onPress={handleReorderFolder}
            style={[styles.selectionActionContainer, { opacity: (selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName && folderOrder.filter(f => f !== noFolderName).length > 1) ? 1 : 0.4 }]}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-vertical" size={28} color={subColor} />
            <Text style={styles.selectionActionText}>
              {t('common.reorder')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={cancelSelecting} style={styles.selectionActionContainer} activeOpacity={0.7}>
            <Ionicons name="close-circle-outline" size={28} color={subColor} />
            <Text style={styles.selectionActionText}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <RenameFolderModal
        visible={renameModalVisible}
        onClose={() => { setRenameModalVisible(false); setRenameTarget(null); clearSelection(); }}
        initialName={renameTarget || ''}
        onSubmit={handleRenameFolder}
      />

      <Modal
        transparent
        visible={sortModalVisible}
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <BlurView intensity={isDark ? 20 : 70} tint={isDark ? 'dark' : 'light'} style={styles.modalBlur}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSortModalVisible(false)} />
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, {width: '80%', maxWidth: 300}]}>
                <Text style={styles.modalTitle}>{t('sort.title')}</Text>
              <TouchableOpacity onPress={() => { setSortMode('deadline'); setSortModalVisible(false); }} activeOpacity={0.7}>
                <Text style={[styles.modalOption, {color: sortMode === 'deadline' ? subColor : (isDark ? '#E0E0E0' : '#222222'), fontWeight: sortMode === 'deadline' ? '600' : '400'}]}>{t('sort.date')}</Text>
              </TouchableOpacity>
              <View style={{height: StyleSheet.hairlineWidth, backgroundColor: isDark? '#444': '#DDD'}}/>
              <TouchableOpacity onPress={() => { setSortMode('custom'); setSortModalVisible(false); }} activeOpacity={0.7}>
                <Text style={[styles.modalOption, {color: sortMode === 'custom' ? subColor : (isDark ? '#E0E0E0' : '#222222'), fontWeight: sortMode === 'custom' ? '600' : '400'}]}>{t('sort.custom')}</Text>
              </TouchableOpacity>
               <View style={{height: StyleSheet.hairlineWidth, backgroundColor: isDark? '#444': '#DDD'}}/>
              <TouchableOpacity onPress={() => { setSortMode('priority'); setSortModalVisible(false); }} activeOpacity={0.7}>
                <Text style={[styles.modalOption, {color: sortMode === 'priority' ? subColor : (isDark ? '#E0E0E0' : '#222222'), fontWeight: sortMode === 'priority' ? '600' : '400'}]}>{t('sort.priority')}</Text>
              </TouchableOpacity>
              <View style={{height: StyleSheet.hairlineWidth, backgroundColor: isDark? '#444': '#DDD', marginTop: 10, marginBottom: 0 }}/>
              <TouchableOpacity onPress={() => setSortModalVisible(false)} style={{ marginTop: 0 }} activeOpacity={0.7}>
                <Text style={[styles.modalOption, {color: isDark ? '#CCCCCC' : '#555555', fontSize: appFontSizes[fontSizeKey]}]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}