// app/features/tasks/TasksScreen.tsx
import React, { useEffect, useState, useCallback, useContext, useMemo, useRef } from 'react';
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
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
import { FontSizeContext } from '@/context/FontSizeContext';
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
const windowWidth = Dimensions.get('window').width;

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
    toggleItem,
    setAllItems,
    clearSelection,
  } = useSelection();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [folderOrder, setFolderOrder] = useState<FolderOrder>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'incomplete' | 'completed'>('incomplete');
  const [selectedFolderTab, setSelectedFolderTab] = useState<string>('all');
  const [sortMode, setSortMode] = useState<'deadline' | 'custom' | 'priority'>('deadline');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isReordering, setIsReordering] = useState(false);
  const [draggingFolder, setDraggingFolder] = useState<string | null>(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);

  const [selectionAnim] = useState(new Animated.Value(-SELECTION_BAR_HEIGHT));

  const folderTabsScrollViewRef = useRef<ScrollView>(null);
  const mainContentScrollViewRef = useRef<ScrollView>(null);
  const [folderTabLayouts, setFolderTabLayouts] = useState<Record<string, { x: number; width: number; index: number }>>({});
  const [currentContentPage, setCurrentContentPage] = useState(0);
  const isTabPressScrolling = useRef(false); // Tabタップによるスクロール中フラグ

  const noFolderName = useMemo(() => t('common.no_folder_name', 'フォルダなし'), [t]);

  useEffect(() => {
    Animated.timing(selectionAnim, {
      toValue: isSelecting ? 0 : -SELECTION_BAR_HEIGHT,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isSelecting, selectionAnim]);

  const loadTasks = useCallback(async () => {
    // setLoading(true) は useFocusEffect 内で管理
    try {
      const rawTasks = await AsyncStorage.getItem(STORAGE_KEY);
      setTasks(rawTasks ? JSON.parse(rawTasks) : []);
      const rawOrder = await AsyncStorage.getItem(FOLDER_ORDER_KEY);
      setFolderOrder(rawOrder ? JSON.parse(rawOrder) : []);
    } catch (e) {
      console.error('Failed to load tasks or folder order:', e);
      setTasks([]);
      setFolderOrder([]);
    } finally {
      // setLoading(false) は useFocusEffect 内で管理
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
          return { ...task, completedAt: task.completedAt ? undefined : dayjs.utc().toISOString() };
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

  const cancelSelecting = () => { clearSelection(); };

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
            case 'on_date': if (typeof repeatEnds.date === 'string') { repeatEndsPassed = dayjs.utc(repeatEnds.date).endOf('day').isBefore(nowLocal.utc()); } break;
            case 'count': if (typeof repeatEnds.count === 'number') { if ((task.completedInstanceDates?.length || 0) >= repeatEnds.count) { repeatEndsPassed = true; } } break;
          }
        }
        isTaskFullyCompleted = nextInstanceIsNull || repeatEndsPassed;
      } else { isTaskFullyCompleted = !!task.completedAt; }
      return { ...task, displaySortDate: displayDateUtc, isTaskFullyCompleted };
    });
  }, [tasks]);

  const folderTabs = useMemo(() => {
    const tabsArr: { name: string; label: string }[] = [{ name: 'all', label: t('folder_tabs.all', 'すべて') }];
    const uniqueFoldersFromTasks = Array.from(new Set(tasks.map(task => task.folder || noFolderName)));
    if (uniqueFoldersFromTasks.includes(noFolderName)) { tabsArr.push({ name: noFolderName, label: noFolderName }); }
    const orderedActualFolders = folderOrder.filter(name => name !== noFolderName && uniqueFoldersFromTasks.includes(name));
    const unorderedActualFolders = uniqueFoldersFromTasks.filter(name => name !== noFolderName && !orderedActualFolders.includes(name) && name !== 'all').sort((a, b) => a.localeCompare(b));
    [...orderedActualFolders, ...unorderedActualFolders].forEach(folderName => { if (!tabsArr.some(tab => tab.name === folderName)) { tabsArr.push({ name: folderName, label: folderName }); } });
    return tabsArr;
  }, [tasks, folderOrder, noFolderName, t]);

  const tasksToDisplayByPage = useCallback((pageFolderName: string): DisplayableTaskItem[] => {
    let filteredTasks = baseProcessedTasks;
    if (pageFolderName !== 'all') { filteredTasks = filteredTasks.filter(task => (task.folder || noFolderName) === pageFolderName); }
    if (tab === 'completed') {
      const completedDisplayItems: DisplayableTaskItem[] = [];
      filteredTasks.forEach(task => {
        if (task.isTaskFullyCompleted && !task.deadlineDetails?.repeatFrequency) { completedDisplayItems.push({ ...task, keyId: task.id, displaySortDate: task.completedAt ? dayjs.utc(task.completedAt) : null });
        } else if (task.deadlineDetails?.repeatFrequency && task.completedInstanceDates && task.completedInstanceDates.length > 0) {
          task.completedInstanceDates.forEach(instanceDate => { completedDisplayItems.push({ ...task, keyId: `${task.id}-${instanceDate}`, displaySortDate: dayjs.utc(instanceDate), isCompletedInstance: true, instanceDate: instanceDate }); });
        }
      });
      return completedDisplayItems.sort((a, b) => (b.displaySortDate?.unix() || 0) - (a.displaySortDate?.unix() || 0));
    } else {
      const todayStartOfDayUtc = dayjs.utc().startOf('day');
      return filteredTasks.filter(task => {
        if (task.isTaskFullyCompleted) return false;
        if (task.deadlineDetails?.repeatFrequency && (task.deadlineDetails as any)?.isPeriodSettingEnabled && (task.deadlineDetails as any)?.periodStartDate) {
          const periodStartDateUtc = dayjs.utc((task.deadlineDetails as any).periodStartDate).startOf('day');
          if (periodStartDateUtc.isAfter(todayStartOfDayUtc)) return false;
        }
        return true;
      }).map(task => ({ ...task, keyId: task.id }));
    }
  }, [baseProcessedTasks, tab, noFolderName]);

  const handleFolderTabPress = useCallback((folderName: string, index: number) => {
    if (selectedFolderTab === folderName && currentContentPage === index) return;
    isTabPressScrolling.current = true;
    setSelectedFolderTab(folderName);
    setCurrentContentPage(index);
    clearSelection();
    setCollapsedFolders({});
    mainContentScrollViewRef.current?.scrollTo({ x: windowWidth * index, animated: true });
    setTimeout(() => { isTabPressScrolling.current = false; }, 500); // アニメーション時間より少し長めに
  }, [selectedFolderTab, currentContentPage, windowWidth]);

  const onMainContentScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isTabPressScrolling.current || windowWidth <= 0 || isNaN(windowWidth)) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    const newPageIndex = Math.round(offsetX / windowWidth);
    // 状態更新は onMomentumScrollEnd で行い、ここでは行わない
  }, [windowWidth]);

  const onMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isTabPressScrolling.current || windowWidth <= 0 || isNaN(windowWidth)) {
      isTabPressScrolling.current = false; // スクロール終了時にリセット
      return;
    }
    const offsetX = event.nativeEvent.contentOffset.x;
    const finalPageIndex = Math.round(offsetX / windowWidth);
    if (finalPageIndex >= 0 && finalPageIndex < folderTabs.length && currentContentPage !== finalPageIndex) {
      const newSelectedFolder = folderTabs[finalPageIndex].name;
      setCurrentContentPage(finalPageIndex);
      setSelectedFolderTab(newSelectedFolder);
      clearSelection();
    }
  }, [folderTabs, currentContentPage, windowWidth]);

  // Sync tab scroll and main content scroll when selectedFolderTab or folderTabs change
  useEffect(() => {
    const targetIndex = folderTabs.findIndex(ft => ft.name === selectedFolderTab);
    if (targetIndex !== -1) {
      if (currentContentPage !== targetIndex) {
        setCurrentContentPage(targetIndex);
        if (mainContentScrollViewRef.current && !isTabPressScrolling.current) {
          mainContentScrollViewRef.current.scrollTo({ x: windowWidth * targetIndex, animated: false }); // アニメーションなしで即時反映
        }
      }
      const layout = folderTabLayouts[selectedFolderTab];
      if (layout && folderTabsScrollViewRef.current) {
        const screenCenter = windowWidth / 2;
        const tabCenter = layout.x + layout.width / 2;
        let scrollToX = tabCenter - screenCenter;
        scrollToX = Math.max(0, scrollToX);
        const folderTabsContentWidth = Object.values(folderTabLayouts).reduce((sum, l) => sum + l.width, 0) + (folderTabs.length > 1 ? (folderTabs.length -1) * 8 : 0);
        const maxScrollX = Math.max(0, folderTabsContentWidth - windowWidth);
        scrollToX = Math.min(scrollToX, maxScrollX);
        folderTabsScrollViewRef.current.scrollTo({ x: scrollToX, animated: true });
      }
    }
  }, [selectedFolderTab, folderTabs, folderTabLayouts, windowWidth]); // currentContentPage を削除

  const handleSelectAll = () => { /* ... (前回と同様) ... */ };
  const handleDeleteSelected = () => { /* ... (前回と同様) ... */ };
  const handleRenameFolder = async (newName: string) => { /* ... (前回と同様、ただしsetSelectedFolderTab後の処理はuseEffectに依存) ... */ };
  const handleReorderFolder = () => { /* ... (前回と同様) ... */ };

  useFocusEffect(
    useCallback(() => {
      setLoading(true); // データロード開始
      loadTasks().finally(() => setLoading(false)); // loadTasks完了後にローディング解除

      const langForDayjs = i18n.language.split('-')[0];
      if (dayjs.Ls[langForDayjs]) { dayjs.locale(langForDayjs); } else { dayjs.locale('en'); }
      return () => { /* cleanup */ };
    }, [loadTasks, i18n.language]) // 依存はloadTasksとi18n.languageのみ
  );

  // Initialize currentContentPage when folderTabs or selectedFolderTab changes (e.g. on initial load or after rename)
  useEffect(() => {
    const initialIndex = folderTabs.findIndex(ft => ft.name === selectedFolderTab);
    if (initialIndex !== -1 && currentContentPage !== initialIndex) {
      setCurrentContentPage(initialIndex);
      if (mainContentScrollViewRef.current && !isTabPressScrolling.current) { // Avoid scrolling if tab press is handling it
         mainContentScrollViewRef.current.scrollTo({ x: windowWidth * initialIndex, animated: false });
      }
    }
  }, [folderTabs, selectedFolderTab]); // currentContentPage を削除


  const renderPage = (pageFolderName: string, pageIndex: number) => {
    const tasksForPage = tasksToDisplayByPage(pageFolderName);
    const allFolderNamesInTasks = Array.from(new Set(tasksForPage.map(t => t.folder || noFolderName)));
    const ordered = folderOrder.filter(name => allFolderNamesInTasks.includes(name));
    const unordered = allFolderNamesInTasks.filter(name => !ordered.includes(name) && name !== noFolderName && allFolderNamesInTasks.includes(name));
    let actualSortedFolders: string[];
    const noFolderIdxInAll = allFolderNamesInTasks.indexOf(noFolderName);
    if (noFolderIdxInAll > -1) { actualSortedFolders = [...ordered, ...unordered.sort((a,b) => a.localeCompare(b)), noFolderName]; }
    else { actualSortedFolders = [...ordered, ...unordered.sort((a,b) => a.localeCompare(b))]; }
    actualSortedFolders = actualSortedFolders.filter((item, pos) => actualSortedFolders.indexOf(item) === pos);

    return (
      <View key={`page-${pageFolderName}-${pageIndex}`} style={{ width: windowWidth, flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: isSelecting ? SELECTION_BAR_HEIGHT + 20 : 100, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {actualSortedFolders.map(folderName => {
            if (pageFolderName !== 'all' && folderName !== pageFolderName) return null;
            const folderTasks = tasksForPage.filter(t => (t.folder || noFolderName) === folderName)
              .sort((a, b) => { /* ... (ソートロジックは前回と同様) ... */ 
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
                  if (categoryA !== categoryB) return categoryA - categoryB;
                  if (categoryA === 3) return a.title.localeCompare(b.title);
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
                    if (priorityA !== priorityB) return priorityB - priorityA;
                }
                return a.title.localeCompare(b.title);
            });

            let shouldRenderFolder = folderTasks.length > 0 || (folderName !== noFolderName && pageFolderName === 'all');
            if (folderName === noFolderName && folderTasks.length === 0 && actualSortedFolders.length > 1 && pageFolderName !== noFolderName ) { shouldRenderFolder = false; }
            if (isReordering && draggingFolder !== folderName && pageFolderName === 'all') { shouldRenderFolder = true; }
            if (!shouldRenderFolder && tab === 'completed' && folderTasks.length === 0) return null;
            if (!shouldRenderFolder && folderName !== noFolderName && folderTasks.length === 0 && !isReordering && !isSelecting) {
                 const hasOriginalTaskInThisFolder = tasks.some(t => (t.folder || noFolderName) === folderName);
                 if (!hasOriginalTaskInThisFolder && pageFolderName === 'all') { shouldRenderFolder = false;
                 } else if (!hasOriginalTaskInThisFolder && pageFolderName === folderName) { shouldRenderFolder = true;
                 } else if (!hasOriginalTaskInThisFolder) { return null; }
            }
            if (pageFolderName !== 'all' && folderName !== pageFolderName) return null;
            if (!shouldRenderFolder && !(pageFolderName !== 'all' && folderName === pageFolderName && folderTasks.length === 0)) return null;

            const taskFolderProps: TaskFolderProps = {
                folderName, tasks: folderTasks, isCollapsed: !!collapsedFolders[folderName] && folderTasks.length > 0,
                toggleFolder, onToggleTaskDone: toggleTaskDone, onRefreshTasks: loadTasks,
                isReordering: isReordering && draggingFolder === folderName && folderName !== noFolderName && pageFolderName === 'all',
                setDraggingFolder, draggingFolder, moveFolder, stopReordering: () => { setIsReordering(false); setDraggingFolder(null); },
                isSelecting, selectedIds: selectedItems.map(it => it.id), onLongPressSelect, currentTab: tab,
            };
            return ( <TaskFolder key={`${pageFolderName}-${folderName}-${pageIndex}`} {...taskFolderProps} /> ); // Ensure unique key
          })}
          {tasksForPage.length === 0 && !loading && (
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>
                 {tab === 'incomplete' ? t('task_list.empty') : t('task_list.no_tasks_completed', '完了したタスクはありません')}
               </Text>
             </View>
           )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.appBar}><Text style={styles.title}>{t('task_list.title')}</Text></View>
      <View style={styles.folderTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} ref={folderTabsScrollViewRef} contentContainerStyle={{ alignItems: 'flex-end', paddingRight: 12 }}>
          {folderTabs.map((folder, index) => (
            <TouchableOpacity
              key={folder.name}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                if (!folderTabLayouts[folder.name] || folderTabLayouts[folder.name].x !== x || folderTabLayouts[folder.name].width !== width || folderTabLayouts[folder.name].index !== index) {
                    setFolderTabLayouts(prev => ({ ...prev, [folder.name]: { x, width, index } }));
                }
              }}
              style={[styles.folderTabButton, selectedFolderTab === folder.name && styles.folderTabSelected]}
              onPress={() => handleFolderTabPress(folder.name, index)}
              activeOpacity={0.7}
            >
              <Text style={[styles.folderTabText, selectedFolderTab === folder.name && styles.folderTabSelectedText]} numberOfLines={1}>{folder.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.topRow}>
        <View style={styles.segmentedControlContainer}>
          <TouchableOpacity style={[ styles.segmentedControlButton, tab === 'incomplete' && styles.segmentedControlButtonSelected ]} onPress={() => { setTab('incomplete'); clearSelection(); }} activeOpacity={0.7}>
            <Text style={[ styles.segmentedControlButtonText, tab === 'incomplete' && (isDark ? styles.segmentedControlButtonTextSelectedDark : styles.segmentedControlButtonTextSelectedLight) ]}>{t('tab.incomplete')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ styles.segmentedControlButton, tab === 'completed' && styles.segmentedControlButtonSelected ]} onPress={() => { setTab('completed'); clearSelection(); }} activeOpacity={0.7}>
            <Text style={[ styles.segmentedControlButtonText, tab === 'completed' && (isDark ? styles.segmentedControlButtonTextSelectedDark : styles.segmentedControlButtonTextSelectedLight) ]}>{t('tab.completed')}</Text>
          </TouchableOpacity>
        </View>
        {!isSelecting && tab === 'incomplete' && (
          <TouchableOpacity style={styles.sortButton} onPress={() => setSortModalVisible(true)} activeOpacity={0.7}>
            <Text style={styles.sortLabel}>{sortMode === 'deadline' ? t('sort.date') : sortMode === 'custom' ? t('sort.custom') : t('sort.priority')}</Text>
            <Ionicons name="swap-vertical" size={22} color={subColor} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={subColor} />
      ) : (
        <ScrollView
            ref={mainContentScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onMainContentScroll}
            onMomentumScrollEnd={onMomentumScrollEnd}
            scrollEventThrottle={16} // Increased frequency for onScroll
            style={{ flex: 1 }}
            // key={folderTabs.map(f => f.name).join('-')} // Removed to prevent unnecessary re-mounts
        >
            {folderTabs.map((folder, index) => renderPage(folder.name, index))}
        </ScrollView>
      )}
      {!isSelecting && !isReordering && (
        <TouchableOpacity style={[styles.fab, { bottom: Platform.OS === 'ios' ? 16 : 16 }]} onPress={() => router.push('/add/')}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      {isSelecting && (
        <Animated.View style={[ styles.selectionBar, { transform: [{ translateY: selectionAnim }] }, Platform.OS === 'ios' && { paddingBottom: 20 } ]}>
          <TouchableOpacity onPress={handleSelectAll} style={styles.selectionActionContainer} activeOpacity={0.7}><Ionicons name="checkmark-done-outline" size={28} color={subColor} /><Text style={styles.selectionActionText}>{t('common.select_all')}</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteSelected} style={styles.selectionActionContainer} activeOpacity={0.7}><Ionicons name="trash-outline" size={28} color={subColor} /><Text style={styles.selectionActionText}>{t('common.delete')}</Text></TouchableOpacity>
          <TouchableOpacity
            disabled={!(selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName)}
            onPress={() => { if (selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName) { setRenameTarget(selectedItems[0].id); setRenameModalVisible(true); } }}
            style={[styles.selectionActionContainer, { opacity: (selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName) ? 1 : 0.4 }]} activeOpacity={0.7}
          ><Ionicons name="create-outline" size={28} color={subColor} /><Text style={styles.selectionActionText}>{t('common.rename')}</Text></TouchableOpacity>
          <TouchableOpacity
            disabled={!(selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName && folderOrder.filter(f => f !== noFolderName).length > 1 && selectedFolderTab === 'all')}
            onPress={handleReorderFolder}
            style={[styles.selectionActionContainer, { opacity: (selectedItems.length === 1 && selectedItems[0].type === 'folder' && selectedItems[0].id !== noFolderName && folderOrder.filter(f => f !== noFolderName).length > 1 && selectedFolderTab === 'all') ? 1 : 0.4 }]} activeOpacity={0.7}
          ><Ionicons name="swap-vertical" size={28} color={subColor} /><Text style={styles.selectionActionText}>{t('common.reorder')}</Text></TouchableOpacity>
          <TouchableOpacity onPress={cancelSelecting} style={styles.selectionActionContainer} activeOpacity={0.7}><Ionicons name="close-circle-outline" size={28} color={subColor} /><Text style={styles.selectionActionText}>{t('common.cancel')}</Text></TouchableOpacity>
        </Animated.View>
      )}
      <RenameFolderModal visible={renameModalVisible} onClose={() => { setRenameModalVisible(false); setRenameTarget(null); clearSelection(); }} initialName={renameTarget || ''} onSubmit={handleRenameFolder} />
      <Modal transparent visible={sortModalVisible} animationType="fade" onRequestClose={() => setSortModalVisible(false)}>
        <BlurView intensity={isDark ? 20 : 70} tint={isDark ? 'dark' : 'light'} style={styles.modalBlur}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSortModalVisible(false)} />
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, {width: '80%', maxWidth: 300}]}>
                <Text style={styles.modalTitle}>{t('sort.title')}</Text>
              <TouchableOpacity onPress={() => { setSortMode('deadline'); setSortModalVisible(false); }} activeOpacity={0.7}><Text style={[styles.modalOption, {color: sortMode === 'deadline' ? subColor : (isDark ? '#E0E0E0' : '#222222'), fontWeight: sortMode === 'deadline' ? '600' : '400'}]}>{t('sort.date')}</Text></TouchableOpacity>
              <View style={{height: StyleSheet.hairlineWidth, backgroundColor: isDark? '#444': '#DDD'}}/>
              <TouchableOpacity onPress={() => { setSortMode('custom'); setSortModalVisible(false); }} activeOpacity={0.7}><Text style={[styles.modalOption, {color: sortMode === 'custom' ? subColor : (isDark ? '#E0E0E0' : '#222222'), fontWeight: sortMode === 'custom' ? '600' : '400'}]}>{t('sort.custom')}</Text></TouchableOpacity>
               <View style={{height: StyleSheet.hairlineWidth, backgroundColor: isDark? '#444': '#DDD'}}/>
              <TouchableOpacity onPress={() => { setSortMode('priority'); setSortModalVisible(false); }} activeOpacity={0.7}><Text style={[styles.modalOption, {color: sortMode === 'priority' ? subColor : (isDark ? '#E0E0E0' : '#222222'), fontWeight: sortMode === 'priority' ? '600' : '400'}]}>{t('sort.priority')}</Text></TouchableOpacity>
              <View style={{height: StyleSheet.hairlineWidth, backgroundColor: isDark? '#444': '#DDD', marginTop: 10, marginBottom: 0 }}/>
              <TouchableOpacity onPress={() => setSortModalVisible(false)} style={{ marginTop: 0 }} activeOpacity={0.7}><Text style={[styles.modalOption, {color: isDark ? '#CCCCCC' : '#555555', fontSize: appFontSizes[fontSizeKey]}]}>{t('common.cancel')}</Text></TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}