// app/features/tasks/components/TaskViewPager.tsx
import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import PagerView, { type PagerViewOnPageScrollEvent, type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import type { TaskScreenStyles } from '@/features/tasks/styles';
import type { DisplayableTaskItem, SelectableItem } from '@/features/tasks/types';
import { TaskFolder, type Props as TaskFolderProps } from '@/features/tasks/components/TaskFolder';
import type { SortMode, ActiveTab, FolderTab } from '@/features/tasks/hooks/useTasksScreenLogic';
import { SELECTION_BAR_HEIGHT } from '@/features/tasks/constants';
import dayjs from 'dayjs';

type TaskViewPagerProps = {
  styles: TaskScreenStyles;
  pagerRef: React.RefObject<PagerView>;
  folderTabs: FolderTab[];
  currentContentPage: number;
  handlePageScroll: (event: PagerViewOnPageScrollEvent) => void;
  handlePageSelected: (event: PagerViewOnPageSelectedEvent) => void;
  getTasksToDisplayForPage: (pageFolderName: string) => DisplayableTaskItem[];
  activeTab: ActiveTab;
  sortMode: SortMode;
  collapsedFolders: Record<string, boolean>;
  toggleFolderCollapse: (name: string) => void;
  toggleTaskDone: (id: string, instanceDate?: string) => void;
  loadTasksAndFolders: () => void;
  isReordering: boolean;
  draggingFolder: string | null;
  setDraggingFolder: (name: string | null) => void;
  moveFolderOrder: (folderName: string, direction: 'up' | 'down') => void;
  stopReordering: () => void;
  isSelecting: boolean;
  selectedItems: SelectableItem[];
  onLongPressSelectItem: (type: 'task' | 'folder', id: string) => void; // 修正: onLongPressSelect -> onLongPressSelectItem
  noFolderName: string;
  folderOrder: string[];
  t: (key: string, options?: any) => string;
  baseTasksCount: number;
};

const windowWidth = Dimensions.get('window').width;

export const TaskViewPager: React.FC<TaskViewPagerProps> = ({
  styles,
  pagerRef,
  folderTabs,
  currentContentPage,
  handlePageScroll,
  handlePageSelected,
  getTasksToDisplayForPage,
  activeTab,
  sortMode,
  collapsedFolders,
  toggleFolderCollapse,
  toggleTaskDone,
  loadTasksAndFolders,
  isReordering,
  draggingFolder,
  setDraggingFolder,
  moveFolderOrder,
  stopReordering,
  isSelecting,
  selectedItems,
  onLongPressSelectItem, // 修正: onLongPressSelect -> onLongPressSelectItem
  noFolderName,
  folderOrder,
  t,
  baseTasksCount,
}) => {

  const renderPageContent = (pageFolderName: string, pageIndex: number) => {
    const tasksForPage = getTasksToDisplayForPage(pageFolderName);
    let foldersToRenderOnThisPage: string[];
    if (pageFolderName === 'all') {
        const allFolderNamesInTasksOnPage = Array.from(new Set(tasksForPage.map(t => t.folder || noFolderName)));
        const combinedFolders = Array.from(new Set([...folderOrder, ...allFolderNamesInTasksOnPage]));
        const ordered = folderOrder.filter(name => combinedFolders.includes(name) && name !== noFolderName);
        const unordered = combinedFolders.filter(name => !ordered.includes(name) && name !== noFolderName && name !== 'all').sort((a, b) => a.localeCompare(b));
        foldersToRenderOnThisPage = [...ordered, ...unordered];
        if (combinedFolders.includes(noFolderName) && tasksForPage.some(t => (t.folder || noFolderName) === noFolderName)) {
            foldersToRenderOnThisPage.push(noFolderName);
        }
        if (activeTab === 'completed') {
            foldersToRenderOnThisPage = foldersToRenderOnThisPage.filter(folderName =>
                tasksForPage.some(task => (task.folder || noFolderName) === folderName)
            );
        }
    } else {
        foldersToRenderOnThisPage = [pageFolderName];
    }

    return (
      <View key={`page-${pageFolderName}-${pageIndex}`} style={{ width: windowWidth, flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: isSelecting ? SELECTION_BAR_HEIGHT + 20 : 100, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {foldersToRenderOnThisPage.map(folderName => {
            const tasksInThisFolder = tasksForPage.filter(t => (t.folder || noFolderName) === folderName);
            if (activeTab === 'completed' && pageFolderName === 'all' && tasksInThisFolder.length === 0 && folderName !== noFolderName) {
                 if (baseTasksCount > 0 && !tasksForPage.some(task => (task.folder || noFolderName) === noFolderName && folderName === noFolderName)) {
                    return null;
                 }
            }
            const sortedFolderTasks = [...tasksInThisFolder].sort((a, b) => {
                if (activeTab === 'incomplete' && sortMode === 'deadline') {
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
                } else if (activeTab === 'completed') {
                    const dateA = a.displaySortDate || dayjs.utc(0); 
                    const dateB = b.displaySortDate || dayjs.utc(0);
                    return dateB.unix() - dateA.unix(); 
                }
                if (sortMode === 'custom' && activeTab === 'incomplete') {
                    const orderA = a.customOrder ?? Infinity;
                    const orderB = b.customOrder ?? Infinity;
                    if (orderA !== Infinity || orderB !== Infinity) { 
                        if (orderA === Infinity) return 1; 
                        if (orderB === Infinity) return -1;
                        return orderA - orderB;
                    }
                }
                if (sortMode === 'priority' && activeTab === 'incomplete') {
                    const priorityA = a.priority ?? -1; 
                    const priorityB = b.priority ?? -1;
                    if (priorityA !== priorityB) return priorityB - priorityA; 
                }
                return a.title.localeCompare(b.title); 
            });
            
            const taskFolderProps: TaskFolderProps = {
              folderName,
              tasks: sortedFolderTasks,
              isCollapsed: !!collapsedFolders[folderName] && sortedFolderTasks.length > 0,
              toggleFolder: toggleFolderCollapse,
              onToggleTaskDone: toggleTaskDone,
              onRefreshTasks: loadTasksAndFolders,
              isReordering: isReordering && draggingFolder === folderName && folderName !== noFolderName && pageFolderName === 'all',
              setDraggingFolder,
              draggingFolder,
              moveFolder: moveFolderOrder,
              stopReordering,
              isSelecting,
              selectedIds: selectedItems.map(it => it.id),
              onLongPressSelect: onLongPressSelectItem, // 修正: onLongPressSelect -> onLongPressSelectItem
              currentTab: activeTab,
            };
            return <TaskFolder key={`${pageFolderName}-${folderName}-${pageIndex}`} {...taskFolderProps} />;
          })}
          {tasksForPage.length === 0 && (
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>
                 {activeTab === 'incomplete' ? t('task_list.empty') : t('task_list.no_tasks_completed', '完了したタスクはありません')}
               </Text>
             </View>
           )}
        </ScrollView>
      </View>
    );
  };

  return (
    <PagerView
      ref={pagerRef}
      style={{ flex: 1 }}
      initialPage={currentContentPage}
      onPageScroll={handlePageScroll}
      onPageSelected={handlePageSelected}
      key={folderTabs.map(f => f.name).join('-')}
    >
      {folderTabs.map((folder, index) => renderPageContent(folder.name, index))}
    </PagerView>
  );
};