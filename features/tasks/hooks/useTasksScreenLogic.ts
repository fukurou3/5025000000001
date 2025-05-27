// app/features/tasks/hooks/useTasksScreenLogic.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert, Dimensions, Animated, Platform, ScrollView } from 'react-native'; // ScrollView をインポート
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import PagerView, { type PagerViewOnPageScrollEvent, type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';

import type { Task, FolderOrder, SelectableItem, DisplayTaskOriginal, DisplayableTaskItem } from '@/features/tasks/types';
import { calculateNextDisplayInstanceDate, calculateActualDueDate } from '@/features/tasks/utils';
import { useSelection } from '@/features/tasks/context';
import { STORAGE_KEY, FOLDER_ORDER_KEY, SELECTION_BAR_HEIGHT, FOLDER_TABS_CONTAINER_PADDING_HORIZONTAL, TAB_MARGIN_RIGHT } from '@/features/tasks/constants';
import i18n from '@/lib/i18n';

const windowWidth = Dimensions.get('window').width;

export type SortMode = 'deadline' | 'custom' | 'priority';
export type ActiveTab = 'incomplete' | 'completed';
export type FolderTab = { name: string; label: string };
export type FolderTabLayout = { x: number; width: number; index: number };
export type AccentLineStyle = { width: number; transform: [{ translateX: number }] };
export type PageScrollData = { position: number; offset: number };

export const useTasksScreenLogic = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const selectionHook = useSelection();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [folderOrder, setFolderOrder] = useState<FolderOrder>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('incomplete');
  const [selectedFolderTabName, setSelectedFolderTabName] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('deadline');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isReordering, setIsReordering] = useState(false);
  const [draggingFolder, setDraggingFolder] = useState<string | null>(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);

  const [selectionAnim] = useState(new Animated.Value(SELECTION_BAR_HEIGHT));
  const pagerRef = useRef<PagerView>(null);
  const folderTabsScrollViewRef = useRef<ScrollView>(null); // 修正: Animated.ScrollView -> ScrollView
  const [folderTabLayouts, setFolderTabLayouts] = useState<Record<string, FolderTabLayout>>({});
  const [currentContentPage, setCurrentContentPage] = useState(0);
  const [pageScrollData, setPageScrollData] = useState<PageScrollData>({ position: 0, offset: 0 });
  const [accentLineStyle, setAccentLineStyle] = useState<AccentLineStyle>({ width: 0, transform: [{ translateX: 0 }] });

  const noFolderName = useMemo(() => t('common.no_folder_name', 'フォルダなし'), [t]);

  const folderTabs: FolderTab[] = useMemo(() => {
    const tabsArr: FolderTab[] = [{ name: 'all', label: t('folder_tabs.all', 'すべて') }];
    const uniqueFoldersFromTasks = Array.from(new Set(tasks.map(task => task.folder || noFolderName)));
    
    if (uniqueFoldersFromTasks.includes(noFolderName)) {
      if (!tabsArr.some(tab => tab.name === noFolderName)) {
        tabsArr.push({ name: noFolderName, label: noFolderName });
      }
    }
    
    const orderedActualFolders = folderOrder.filter(name => name !== noFolderName && uniqueFoldersFromTasks.includes(name));
    const unorderedActualFolders = uniqueFoldersFromTasks.filter(name => name !== noFolderName && !orderedActualFolders.includes(name) && name !== 'all').sort((a, b) => a.localeCompare(b));
    
    [...orderedActualFolders, ...unorderedActualFolders].forEach(folderName => {
      if (!tabsArr.some(tab => tab.name === folderName)) {
        tabsArr.push({ name: folderName, label: folderName });
      }
    });
    return tabsArr;
  }, [tasks, folderOrder, noFolderName, t]);

  useEffect(() => {
    const initialIndex = folderTabs.findIndex(ft => ft.name === selectedFolderTabName);
    if (initialIndex !== -1 && currentContentPage !== initialIndex) {
      setCurrentContentPage(initialIndex);
    }
  }, [folderTabs, selectedFolderTabName, currentContentPage]);

  useEffect(() => {
    if (pagerRef.current && pageScrollData.position === currentContentPage && pageScrollData.offset === 0) {
        // Make sure PagerView is on the correct page without animation if it's not already.
        // This can happen if currentContentPage was set directly.
        // However, directly calling setPageWithoutAnimation here might conflict with user swipes.
        // It's safer to let onPageSelected handle the final state.
    }
  
    if (folderTabLayouts && folderTabs.length > 0 && currentContentPage < folderTabs.length) {
      const currentTabInfo = folderTabLayouts[folderTabs[currentContentPage]?.name];
      if (currentTabInfo) {
        setAccentLineStyle({
          width: currentTabInfo.width,
          transform: [{ translateX: currentTabInfo.x }],
        });
         if (folderTabsScrollViewRef.current && windowWidth > 0) {
            const screenCenter = windowWidth / 2;
            let targetScrollXForTabs = currentTabInfo.x + currentTabInfo.width / 2 - screenCenter;
            targetScrollXForTabs = Math.max(0, targetScrollXForTabs);
            
            let totalFolderTabsContentWidth = 0;
            folderTabs.forEach((ft, idx) => {
                const layout = folderTabLayouts[ft.name];
                if (layout) {
                    totalFolderTabsContentWidth += layout.width;
                    if (idx < folderTabs.length - 1) {
                         totalFolderTabsContentWidth += TAB_MARGIN_RIGHT;
                    }
                }
            });
            totalFolderTabsContentWidth += FOLDER_TABS_CONTAINER_PADDING_HORIZONTAL * 2;

            const maxScrollX = Math.max(0, totalFolderTabsContentWidth - windowWidth);
            targetScrollXForTabs = Math.min(targetScrollXForTabs, maxScrollX);
            
            folderTabsScrollViewRef.current.scrollTo({ x: targetScrollXForTabs, animated: true });
        }
      } else if (folderTabs.length > 0 && folderTabLayouts[folderTabs[0]?.name]) { // Fallback to first tab
        const firstTabInfo = folderTabLayouts[folderTabs[0].name];
        setAccentLineStyle({
          width: firstTabInfo.width,
          transform: [{ translateX: firstTabInfo.x }],
        });
      }
    }
  }, [currentContentPage, folderTabLayouts, folderTabs, pageScrollData.offset, pageScrollData.position]);


  useEffect(() => {
    Animated.timing(selectionAnim, {
      toValue: selectionHook.isSelecting ? 0 : SELECTION_BAR_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [selectionHook.isSelecting, selectionAnim]);

  const loadTasksAndFolders = useCallback(async () => {
    try {
      const rawTasksData = await AsyncStorage.getItem(STORAGE_KEY);
      setTasks(rawTasksData ? JSON.parse(rawTasksData) : []);
      const rawOrderData = await AsyncStorage.getItem(FOLDER_ORDER_KEY);
      setFolderOrder(rawOrderData ? JSON.parse(rawOrderData) : []);
    } catch (e) {
      console.error('Failed to load tasks or folder order:', e);
      setTasks([]);
      setFolderOrder([]);
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
  
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadTasksAndFolders().finally(() => setLoading(false));
      const langForDayjs = i18n.language.split('-')[0];
      if (dayjs.Ls[langForDayjs]) { dayjs.locale(langForDayjs); } else { dayjs.locale('en'); }
      return () => { /* cleanup if needed */ };
    }, [loadTasksAndFolders, i18n.language])
  );

  const toggleTaskDone = useCallback(async (id: string, instanceDateStr?: string) => {
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
  }, [tasks, saveTasks]);

  const toggleFolderCollapse = useCallback((name: string) => {
    setCollapsedFolders(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const moveFolderOrder = useCallback((folderName: string, direction: 'up' | 'down') => {
    setFolderOrder(prevOrder => {
      const idx = prevOrder.indexOf(folderName);
      if (idx < 0) return prevOrder;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prevOrder.length) return prevOrder;
      
      const newOrder = [...prevOrder];
      [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
      saveFolderOrder(newOrder);
      return newOrder;
    });
  }, [saveFolderOrder]);

  const onLongPressSelectItem = useCallback((type: 'task' | 'folder', id: string) => {
    selectionHook.startSelecting();
    selectionHook.toggleItem({ id, type });
  }, [selectionHook]);

  const cancelSelectionMode = useCallback(() => {
    selectionHook.clearSelection();
  }, [selectionHook]);

  const stopReordering = useCallback(() => {
      setIsReordering(false);
      setDraggingFolder(null);
  }, []);

  const baseProcessedTasks: DisplayTaskOriginal[] = useMemo(() => {
    return tasks.map(task => {
      const displayDateUtc = task.deadlineDetails?.repeatFrequency && task.deadlineDetails.repeatStartDate
        ? calculateNextDisplayInstanceDate(task)
        : calculateActualDueDate(task);
      let isTaskFullyCompleted = false;
      if (task.deadlineDetails?.repeatFrequency) {
        const nextInstanceIsNull = displayDateUtc === null;
        let repeatEndsPassed = false;
        const repeatEnds = task.deadlineDetails.repeatEnds;
        if (repeatEnds) {
          switch (repeatEnds.type) {
            case 'on_date': if (typeof repeatEnds.date === 'string') { repeatEndsPassed = dayjs.utc(repeatEnds.date).endOf('day').isBefore(dayjs().utc()); } break;
            case 'count': if (typeof repeatEnds.count === 'number') { if ((task.completedInstanceDates?.length || 0) >= repeatEnds.count) { repeatEndsPassed = true; } } break;
          }
        }
        isTaskFullyCompleted = nextInstanceIsNull || repeatEndsPassed;
      } else { isTaskFullyCompleted = !!task.completedAt; }
      return { ...task, displaySortDate: displayDateUtc, isTaskFullyCompleted };
    });
  }, [tasks]);

  const getTasksToDisplayForPage = useCallback((pageFolderName: string): DisplayableTaskItem[] => {
    let filteredTasks = baseProcessedTasks;
    if (pageFolderName !== 'all') {
      filteredTasks = filteredTasks.filter(task => (task.folder || noFolderName) === pageFolderName);
    }

    if (activeTab === 'completed') {
      const completedDisplayItems: DisplayableTaskItem[] = [];
      filteredTasks.forEach(task => {
        if (task.isTaskFullyCompleted && !task.deadlineDetails?.repeatFrequency) {
          completedDisplayItems.push({ ...task, keyId: task.id, displaySortDate: task.completedAt ? dayjs.utc(task.completedAt) : null });
        } else if (task.deadlineDetails?.repeatFrequency && task.completedInstanceDates && task.completedInstanceDates.length > 0) {
          task.completedInstanceDates.forEach(instanceDate => {
            completedDisplayItems.push({ ...task, keyId: `${task.id}-${instanceDate}`, displaySortDate: dayjs.utc(instanceDate), isCompletedInstance: true, instanceDate: instanceDate });
          });
        }
      });
      return completedDisplayItems.sort((a, b) => (b.displaySortDate?.unix() || 0) - (a.displaySortDate?.unix() || 0));
    } else {
      const todayStartOfDayUtc = dayjs.utc().startOf('day');
      return filteredTasks
        .filter(task => {
          if (task.isTaskFullyCompleted) return false;
          if (task.deadlineDetails?.repeatFrequency && (task.deadlineDetails as any)?.isPeriodSettingEnabled && (task.deadlineDetails as any)?.periodStartDate) {
            const periodStartDateUtc = dayjs.utc((task.deadlineDetails as any).periodStartDate).startOf('day');
            if (periodStartDateUtc.isAfter(todayStartOfDayUtc)) return false;
          }
          return true;
        })
        .map(task => ({ ...task, keyId: task.id }));
    }
  }, [baseProcessedTasks, activeTab, noFolderName]);

  const handleFolderTabPress = useCallback((_folderName: string, index: number) => {
    if (pagerRef.current && currentContentPage !== index) {
        pagerRef.current.setPage(index);
    }
  }, [currentContentPage]);

  const handlePageScroll = useCallback((event: PagerViewOnPageScrollEvent) => {
    const { position, offset } = event.nativeEvent;
    setPageScrollData({ position, offset });

    if (folderTabLayouts && folderTabs.length > 0 && position < folderTabs.length) {
        const currentTabInfo = folderTabLayouts[folderTabs[position]?.name];
        const nextTabInfo = (position + 1 < folderTabs.length) ? folderTabLayouts[folderTabs[position + 1]?.name] : null;

        if (currentTabInfo) {
            let targetWidth = currentTabInfo.width;
            let targetTranslateX = currentTabInfo.x;

            if (nextTabInfo && offset > 0) {
                targetWidth = currentTabInfo.width + (nextTabInfo.width - currentTabInfo.width) * offset;
                targetTranslateX = currentTabInfo.x + (nextTabInfo.x - currentTabInfo.x) * offset;
            }
            setAccentLineStyle({
                width: targetWidth,
                transform: [{ translateX: targetTranslateX }],
            });
        }
    }

    if (folderTabsScrollViewRef.current && folderTabLayouts && folderTabs.length > 0 && position < folderTabs.length && windowWidth > 0) {
        const currentTabLayout = folderTabLayouts[folderTabs[position]?.name];
        const nextTabLayout = (position + 1 < folderTabs.length) ? folderTabLayouts[folderTabs[position + 1]?.name] : null;

        if (currentTabLayout) {
            const screenCenter = windowWidth / 2;
            let targetScrollXForTabs = 0;
            const currentTabCenter = currentTabLayout.x + currentTabLayout.width / 2;

            if (nextTabLayout && offset > 0) {
                const nextTabCenter = nextTabLayout.x + nextTabLayout.width / 2;
                const interpolatedTabCenter = currentTabCenter + (nextTabCenter - currentTabCenter) * offset;
                targetScrollXForTabs = interpolatedTabCenter - screenCenter;
            } else {
                targetScrollXForTabs = currentTabCenter - screenCenter;
            }
            
            targetScrollXForTabs = Math.max(0, targetScrollXForTabs);
            
            let totalFolderTabsContentWidth = 0;
            folderTabs.forEach((ft, idx) => {
                const layout = folderTabLayouts[ft.name];
                if (layout) {
                    totalFolderTabsContentWidth += layout.width;
                    if (idx < folderTabs.length - 1) {
                         totalFolderTabsContentWidth += TAB_MARGIN_RIGHT;
                    }
                }
            });
            totalFolderTabsContentWidth += FOLDER_TABS_CONTAINER_PADDING_HORIZONTAL * 2;

            const maxScrollX = Math.max(0, totalFolderTabsContentWidth - windowWidth);
            targetScrollXForTabs = Math.min(targetScrollXForTabs, maxScrollX);
            
            folderTabsScrollViewRef.current.scrollTo({ x: targetScrollXForTabs, animated: false });
        }
    }
  }, [folderTabs, folderTabLayouts]);

  const handlePageSelected = useCallback((event: PagerViewOnPageSelectedEvent) => {
    const newPageIndex = event.nativeEvent.position;
    if (newPageIndex >= 0 && newPageIndex < folderTabs.length ) {
      if (currentContentPage !== newPageIndex) {
        const newSelectedFolder = folderTabs[newPageIndex].name;
        setCurrentContentPage(newPageIndex);
        setSelectedFolderTabName(newSelectedFolder);
        selectionHook.clearSelection();
        setCollapsedFolders({});
      }
    }
     setPageScrollData({position: newPageIndex, offset: 0});
  }, [folderTabs, currentContentPage, selectionHook]);


  const handleSelectAll = useCallback(() => {
    const itemsToSelect: SelectableItem[] = [];
    const activeFolderTabName = folderTabs[currentContentPage]?.name || 'all';
    const currentTasksForPage = getTasksToDisplayForPage(activeFolderTabName);

    if (activeFolderTabName === 'all') {
        currentTasksForPage.forEach(task => {
            itemsToSelect.push({ type: 'task', id: task.keyId });
        });
        folderTabs.forEach(ft => {
            if (ft.name !== 'all' && ft.name !== noFolderName) {
                 const hasTasksInThisFolder = baseProcessedTasks.some(bt => (bt.folder || noFolderName) === ft.name);
                 const isInOrder = folderOrder.includes(ft.name);
                 if (hasTasksInThisFolder || isInOrder) {
                    itemsToSelect.push({ type: 'folder', id: ft.name });
                }
            }
        });
    } else {
        currentTasksForPage.forEach(task => itemsToSelect.push({ type: 'task', id: task.keyId }));
        if (activeFolderTabName !== noFolderName) {
            itemsToSelect.push({ type: 'folder', id: activeFolderTabName });
        }
    }
    selectionHook.setAllItems(itemsToSelect);
  }, [selectionHook, folderTabs, currentContentPage, getTasksToDisplayForPage, noFolderName, baseProcessedTasks, folderOrder]);

  const confirmDelete = useCallback((mode: 'delete_all' | 'only_folder' | 'delete_tasks_only') => {
    let updatedTasks = [...tasks];
    let updatedFolderOrder = [...folderOrder];
    const folderBeingDeleted = selectionHook.selectedItems.find(item => item.type === 'folder')?.id;

    const selectedTaskRootIds = new Set<string>();
    const selectedTaskInstances = new Map<string, Set<string>>();

    selectionHook.selectedItems.forEach(item => {
        if (item.type === 'task') {
            const parts = item.id.split('-');
            selectedTaskRootIds.add(parts[0]);
            if (parts.length > 1) {
                if (!selectedTaskInstances.has(parts[0])) {
                    selectedTaskInstances.set(parts[0], new Set());
                }
                selectedTaskInstances.get(parts[0])!.add(parts[1]);
            }
        }
    });

    if (mode === 'delete_all' && folderBeingDeleted) {
        updatedTasks = tasks.filter(task => {
            const taskFolder = task.folder || noFolderName;
            if (taskFolder === folderBeingDeleted) return false;
            return !selectedTaskRootIds.has(task.id);
        });
        updatedFolderOrder = folderOrder.filter(name => name !== folderBeingDeleted);
    } else if (mode === 'only_folder' && folderBeingDeleted) {
        updatedTasks = tasks.map(task => {
            if ((task.folder || noFolderName) === folderBeingDeleted) {
                return { ...task, folder: undefined };
            }
            return task;
        });
        updatedTasks = updatedTasks.filter(task => {
            if (selectedTaskRootIds.has(task.id)) {
                if (task.deadlineDetails?.repeatFrequency && selectedTaskInstances.has(task.id)) {
                    return true;
                }
                return false;
            }
            return true;
        });
        updatedFolderOrder = folderOrder.filter(name => name !== folderBeingDeleted);
    } else {
         updatedTasks = tasks.filter(task => {
            if (selectedTaskRootIds.has(task.id)) {
                 if (task.deadlineDetails?.repeatFrequency && selectedTaskInstances.has(task.id)) {
                    return true;
                }
                return false;
            }
            return true;
         });
    }
    
    updatedTasks = updatedTasks.map(task => {
        if (task.deadlineDetails?.repeatFrequency && selectedTaskInstances.has(task.id) && task.completedInstanceDates) {
            const instancesToDeleteForThisTask = selectedTaskInstances.get(task.id)!;
            const newCompletedDates = task.completedInstanceDates.filter(date => !instancesToDeleteForThisTask.has(date));
            return { ...task, completedInstanceDates: newCompletedDates };
        }
        return task;
    });


    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    if (JSON.stringify(folderOrder) !== JSON.stringify(updatedFolderOrder)) {
        saveFolderOrder(updatedFolderOrder);
    }
    selectionHook.clearSelection();
  }, [tasks, folderOrder, selectionHook, noFolderName, saveTasks, saveFolderOrder]);


  const handleDeleteSelected = useCallback(() => {
    const folderToDelete = selectionHook.selectedItems.find(item => item.type === 'folder');
    if (folderToDelete && folderToDelete.id !== noFolderName) {
        Alert.alert(
            t('task_list.delete_folder_title', { folderName: folderToDelete.id }),
            t('task_list.delete_folder_confirmation'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('task_list.delete_folder_and_tasks'), onPress: () => confirmDelete('delete_all'), style: 'destructive' },
                { text: t('task_list.delete_folder_only'), onPress: () => confirmDelete('only_folder') }
            ],
            { cancelable: true }
        );
    } else {
         Alert.alert(
            t('task_list.delete_tasks_title', {count: selectionHook.selectedItems.filter(i => i.type === 'task').length}),
            t('task_list.delete_tasks_confirmation', {count: selectionHook.selectedItems.filter(i => i.type === 'task').length}),
            [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.delete'), onPress: () => confirmDelete('delete_tasks_only'), style: 'destructive' }
            ],
            {cancelable: true}
        );
    }
  }, [selectionHook, noFolderName, t, confirmDelete]);

  const handleRenameFolderSubmit = useCallback(async (newName: string) => {
    if (!renameTarget || newName.trim() === renameTarget) {
      setRenameModalVisible(false);
      setRenameTarget(null);
      selectionHook.clearSelection();
      return;
    }
    const trimmedNewName = newName.trim();

    const newTasks = tasks.map(task => {
      if ((task.folder || noFolderName) === renameTarget) {
        return { ...task, folder: trimmedNewName === noFolderName ? undefined : trimmedNewName };
      }
      return task;
    });
    const newFolderOrder = folderOrder.map(name => (name === renameTarget ? trimmedNewName : name));

    setTasks(newTasks);
    await saveTasks(newTasks);
    await saveFolderOrder(newFolderOrder);

    setRenameModalVisible(false);
    setRenameTarget(null);
    selectionHook.clearSelection();
    setSelectedFolderTabName(trimmedNewName);
  }, [tasks, folderOrder, renameTarget, noFolderName, selectionHook, saveTasks, saveFolderOrder]);

  const handleReorderSelectedFolder = useCallback(() => {
    if (selectionHook.selectedItems.length === 1 && selectionHook.selectedItems[0].type === 'folder' && selectionHook.selectedItems[0].id !== noFolderName) {
      setIsReordering(true);
      setDraggingFolder(selectionHook.selectedItems[0].id);
      selectionHook.clearSelection();
    }
  }, [selectionHook, noFolderName]);
  
  const openRenameModalForSelectedFolder = useCallback(() => {
    if (selectionHook.selectedItems.length === 1 && selectionHook.selectedItems[0].type === 'folder' && selectionHook.selectedItems[0].id !== noFolderName) {
      setRenameTarget(selectionHook.selectedItems[0].id);
      setRenameModalVisible(true);
    }
  }, [selectionHook, noFolderName]);


  return {
    tasks, folderOrder, loading, activeTab, selectedFolderTabName, sortMode, sortModalVisible,
    collapsedFolders, isReordering, draggingFolder, renameModalVisible, renameTarget,
    selectionAnim, folderTabLayouts, currentContentPage, pageScrollData, accentLineStyle,
    noFolderName, folderTabs,
    pagerRef, folderTabsScrollViewRef,
    isSelecting: selectionHook.isSelecting,
    selectedItems: selectionHook.selectedItems,
    setActiveTab, setSelectedFolderTabName, setSortMode, setSortModalVisible,
    setCollapsedFolders, setIsReordering, setDraggingFolder, setRenameModalVisible, setRenameTarget,
    setFolderTabLayouts, 
    loadTasksAndFolders, saveTasks, saveFolderOrder, toggleTaskDone, toggleFolderCollapse, moveFolderOrder, stopReordering,
    onLongPressSelectItem, cancelSelectionMode,
    getTasksToDisplayForPage,
    handleFolderTabPress, handlePageScroll, handlePageSelected,
    handleSelectAll, handleDeleteSelected, confirmDelete, 
    handleRenameFolderSubmit, handleReorderSelectedFolder, openRenameModalForSelectedFolder,
    router, t,
  };
};