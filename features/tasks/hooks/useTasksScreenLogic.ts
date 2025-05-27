// app/features/tasks/hooks/useTasksScreenLogic.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert, Dimensions, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import PagerView, { type PagerViewOnPageScrollEvent, type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import { useSharedValue } from 'react-native-reanimated';

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


export const useTasksScreenLogic = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const selectionHook = useSelection();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [folderOrder, setFolderOrder] = useState<FolderOrder>([]);
  const [loading, setLoading] = useState(true);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('incomplete');
  const [selectedFolderTabName, setSelectedFolderTabName] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('deadline');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isReordering, setIsReordering] = useState(false);
  const [draggingFolder, setDraggingFolder] = useState<string | null>(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);

  const selectionAnim = useSharedValue(SELECTION_BAR_HEIGHT);
  const pagerRef = useRef<PagerView>(null);
  const folderTabsScrollViewRef = useRef<ScrollView>(null);
  const [folderTabLayouts, setFolderTabLayouts] = useState<Record<number, FolderTabLayout>>({});
  const [currentContentPage, setCurrentContentPage] = useState(0);

  const pageScrollPosition = useSharedValue(0);
  const pageScrollOffset = useSharedValue(0);

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
    const initializeData = async () => {
      try {
        const rawTasksData = await AsyncStorage.getItem(STORAGE_KEY);
        setTasks(rawTasksData ? JSON.parse(rawTasksData) : []);

        const rawOrderData = await AsyncStorage.getItem(FOLDER_ORDER_KEY);
        setFolderOrder(rawOrderData ? JSON.parse(rawOrderData) : []);

        setIsDataInitialized(true);
      } catch (e) {
        console.error('Failed to initialize data from AsyncStorage:', e);
        setTasks([]);
        setFolderOrder([]);
        setIsDataInitialized(true);
      } finally {
        setLoading(false);
      }
    };

    if (!isDataInitialized) {
      initializeData();
    }
  }, [isDataInitialized]);

  useFocusEffect(
    useCallback(() => {
      const langForDayjs = i18n.language.split('-')[0];
      if (dayjs.Ls[langForDayjs]) { dayjs.locale(langForDayjs); } else { dayjs.locale('en'); }
      return () => { /* cleanup if needed */ };
    }, [i18n.language])
  );

  useEffect(() => {
    const initialIndex = folderTabs.findIndex(ft => ft.name === selectedFolderTabName);
    if (initialIndex !== -1 && currentContentPage !== initialIndex) {
      setCurrentContentPage(initialIndex);
      pageScrollPosition.value = initialIndex;
    }
  }, [folderTabs, selectedFolderTabName]);


  const scrollFolderTabsToCenter = useCallback((pageIndex: number) => {
    const tabInfo = folderTabLayouts[pageIndex];
    if (tabInfo && folderTabsScrollViewRef.current && windowWidth > 0 && folderTabs.length > 0 && pageIndex < folderTabs.length) {
        const screenCenter = windowWidth / 2;
        let targetScrollXForTabs = tabInfo.x + tabInfo.width / 2 - screenCenter;
        targetScrollXForTabs = Math.max(0, targetScrollXForTabs);

        let totalFolderTabsContentWidth = 0;
        folderTabs.forEach((_ft, idx) => {
            const layout = folderTabLayouts[idx];
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
  }, [folderTabLayouts, folderTabs]);

  useEffect(() => {
    selectionAnim.value = selectionHook.isSelecting ? 0 : SELECTION_BAR_HEIGHT;
  }, [selectionHook.isSelecting, selectionAnim]);


  useEffect(() => {
    scrollFolderTabsToCenter(currentContentPage);
  }, [currentContentPage, folderTabLayouts, scrollFolderTabsToCenter]);


  const saveTasksToStorage = async (tasksToSave: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
    } catch (e) {
      console.error('Failed to save tasks to storage:', e);
    }
  };

  const saveFolderOrderToStorage = async (orderToSave: FolderOrder) => {
    try {
      await AsyncStorage.setItem(FOLDER_ORDER_KEY, JSON.stringify(orderToSave));
    } catch (e) {
      console.error('Failed to save folder order to storage:', e);
    }
  };

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
    await saveTasksToStorage(newTasks);
  }, [tasks]);

  const toggleFolderCollapse = useCallback((name: string) => {
    setCollapsedFolders(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const moveFolderOrder = useCallback(async (folderName: string, direction: 'up' | 'down') => {
    const idx = folderOrder.indexOf(folderName);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= folderOrder.length) return;

    const newOrder = [...folderOrder];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setFolderOrder(newOrder);
    await saveFolderOrderToStorage(newOrder);
  }, [folderOrder]);

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
    pageScrollPosition.value = position;
    pageScrollOffset.value = offset;
  }, [pageScrollPosition, pageScrollOffset]);

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
      scrollFolderTabsToCenter(newPageIndex);
    }
    pageScrollPosition.value = newPageIndex;
    pageScrollOffset.value = 0;
  }, [folderTabs, currentContentPage, selectionHook, pageScrollPosition, pageScrollOffset, scrollFolderTabsToCenter]);


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

  const confirmDelete = useCallback(async (mode: 'delete_all' | 'only_folder' | 'delete_tasks_only') => {
    let finalTasks = [...tasks];
    let finalFolderOrder = [...folderOrder];
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
                selectedTaskInstances.get(parts[0])!.add(item.id); // Store full keyId for instance
            }
        }
    });

    if (mode === 'delete_all' && folderBeingDeleted) {
        finalTasks = tasks.filter(task => {
            const taskFolder = task.folder || noFolderName;
            if (taskFolder === folderBeingDeleted) return false; // Delete all tasks in this folder
            return !selectedTaskRootIds.has(task.id); // Delete selected tasks outside this folder
        });
        finalFolderOrder = folderOrder.filter(name => name !== folderBeingDeleted);
    } else if (mode === 'only_folder' && folderBeingDeleted) {
        finalTasks = tasks.map(task => {
            if ((task.folder || noFolderName) === folderBeingDeleted) {
                return { ...task, folder: undefined }; // Unassign folder
            }
            return task;
        });
        // Filter out tasks that were explicitly selected for deletion (even if they were in the folder being unassigned)
        finalTasks = finalTasks.filter(task => {
            if (selectedTaskRootIds.has(task.id)) {
                 // If it's a repeating task and specific instances were selected, keep the task but update instances later
                if (task.deadlineDetails?.repeatFrequency && selectedTaskInstances.has(task.id)) {
                    return true;
                }
                return false; // Delete non-repeating selected task or root of repeating task if no specific instances selected for deletion
            }
            return true;
        });
        finalFolderOrder = folderOrder.filter(name => name !== folderBeingDeleted);
    } else { // 'delete_tasks_only' or folder not involved
         finalTasks = tasks.filter(task => {
            if (selectedTaskRootIds.has(task.id)) {
                if (task.deadlineDetails?.repeatFrequency && selectedTaskInstances.has(task.id) && (selectedTaskInstances.get(task.id)?.size || 0) > 0) {
                    return true; // Keep repeating task if specific instances are to be deleted, handle instance deletion below
                }
                return false; // Delete non-repeating or entire repeating task
            }
            return true;
         });
    }

    // Handle deletion of specific instances for repeating tasks
    finalTasks = finalTasks.map(task => {
        if (task.deadlineDetails?.repeatFrequency && selectedTaskInstances.has(task.id) && task.completedInstanceDates) {
            const instancesToDeleteForThisTask = selectedTaskInstances.get(task.id)!; // Set of full keyIds like "taskid-YYYY-MM-DD"
            // Extract the date part from the keyId for matching with completedInstanceDates
            const datesToDelete = new Set<string>();
            instancesToDeleteForThisTask.forEach(instanceKeyId => {
                const parts = instanceKeyId.split('-');
                if (parts.length > 1) { // Ensure it's an instance keyId
                    // Assuming the date part is the rest of the string after the first hyphen,
                    // or more robustly, if keyId format is known like "taskid-YYYY-MM-DD"
                    // For "taskid-YYYY-MM-DD", the date is parts[1]+'-'+parts[2]+'-'+parts[3] if task.id itself contains no hyphens.
                    // Or if keyId is "task.id-instanceDateString"
                    const datePart = instanceKeyId.substring(task.id.length + 1);
                    datesToDelete.add(datePart);
                }
            });

            if (datesToDelete.size > 0) {
                const newCompletedDates = task.completedInstanceDates.filter(date => !datesToDelete.has(date));
                return { ...task, completedInstanceDates: newCompletedDates };
            }
        }
        return task;
    });


    setTasks(finalTasks);
    const folderOrderActuallyChanged = JSON.stringify(folderOrder) !== JSON.stringify(finalFolderOrder);
    if (folderOrderActuallyChanged) {
      setFolderOrder(finalFolderOrder);
    }

    const savePromises = [saveTasksToStorage(finalTasks)];
    if (folderOrderActuallyChanged) {
      savePromises.push(saveFolderOrderToStorage(finalFolderOrder));
    }
    await Promise.all(savePromises);

    selectionHook.clearSelection();
  }, [tasks, folderOrder, selectionHook, noFolderName]);


  const handleDeleteSelected = useCallback(() => {
    const folderToDelete = selectionHook.selectedItems.find(item => item.type === 'folder');
    const selectedTasksCount = selectionHook.selectedItems.filter(i => i.type === 'task').length;

    if (folderToDelete && folderToDelete.id !== noFolderName) {
        // If a folder is selected, always show folder deletion options
        // The title can mention if tasks are also selected
        let title = t('task_list.delete_folder_title', { folderName: folderToDelete.id });
        if (selectedTasksCount > 0) {
            title = t('task_list.delete_folder_and_selected_tasks_title', {folderName: folderToDelete.id, count: selectedTasksCount});
        }

        Alert.alert(
            title,
            t('task_list.delete_folder_confirmation'), // Confirmation message might need to be more generic or conditional
            [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('task_list.delete_folder_and_tasks'), onPress: () => confirmDelete('delete_all'), style: 'destructive' },
                { text: t('task_list.delete_folder_only'), onPress: () => confirmDelete('only_folder') }
            ],
            { cancelable: true }
        );
    } else if (selectedTasksCount > 0) { // Only tasks are selected
         Alert.alert(
            t('task_list.delete_tasks_title', {count: selectedTasksCount}),
            t('task_list.delete_tasks_confirmation', {count: selectedTasksCount}),
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
    setFolderOrder(newFolderOrder);

    await Promise.all([
        saveTasksToStorage(newTasks),
        saveFolderOrderToStorage(newFolderOrder)
    ]);

    setRenameModalVisible(false);
    setRenameTarget(null);
    selectionHook.clearSelection();
    // If the renamed folder was the currently selected tab, update selectedFolderTabName
    // and navigate PagerView to the new tab name if it exists and its index changed.
    if (selectedFolderTabName === renameTarget) {
        setSelectedFolderTabName(trimmedNewName);
        const newIndex = folderTabs.findIndex(ft => ft.name === trimmedNewName);
        if (newIndex !== -1 && pagerRef.current) {
            // setCurrentContentPage(newIndex); // This will be handled by PagerView's onPageSelected or key change
            pagerRef.current.setPage(newIndex);
        }
    }

  }, [tasks, folderOrder, renameTarget, noFolderName, selectionHook, selectedFolderTabName, folderTabs]);

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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const rawTasksData = await AsyncStorage.getItem(STORAGE_KEY);
      setTasks(rawTasksData ? JSON.parse(rawTasksData) : []);

      const rawOrderData = await AsyncStorage.getItem(FOLDER_ORDER_KEY);
      setFolderOrder(rawOrderData ? JSON.parse(rawOrderData) : []);
    } catch (e) {
      console.error('Failed to refresh data from AsyncStorage:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);


  return {
    tasks, folderOrder, loading, activeTab, selectedFolderTabName, sortMode, sortModalVisible,
    collapsedFolders, isReordering, draggingFolder, renameModalVisible, renameTarget,
    selectionAnim, folderTabLayouts, currentContentPage,
    pageScrollPosition, pageScrollOffset,
    noFolderName, folderTabs,
    pagerRef, folderTabsScrollViewRef,
    isSelecting: selectionHook.isSelecting,
    selectedItems: selectionHook.selectedItems,
    isRefreshing,
    setActiveTab, setSelectedFolderTabName, setSortMode, setSortModalVisible,
    setCollapsedFolders, setIsReordering, setDraggingFolder, setRenameModalVisible, setRenameTarget,
    setFolderTabLayouts,
    toggleTaskDone, toggleFolderCollapse, moveFolderOrder, stopReordering,
    onLongPressSelectItem, cancelSelectionMode,
    getTasksToDisplayForPage,
    handleFolderTabPress, handlePageScroll, handlePageSelected,
    handleSelectAll, handleDeleteSelected, confirmDelete,
    handleRenameFolderSubmit, handleReorderSelectedFolder, openRenameModalForSelectedFolder,
    handleRefresh,
    router, t,
  };
};