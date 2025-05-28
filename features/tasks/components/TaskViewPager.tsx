// app/features/tasks/components/TaskViewPager.tsx
import React from 'react';
import { View, Text, ScrollView, Dimensions, RefreshControl } from 'react-native'; // ScrollView は内部では使用しないが、型定義のために残す場合がある
import PagerView, { type PagerViewOnPageScrollEvent, type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import type { TaskScreenStyles } from '@/features/tasks/styles';
import type { DisplayableTaskItem, SelectableItem } from '@/features/tasks/types';
import { TaskFolder, type Props as TaskFolderProps } from '@/features/tasks/components/TaskFolder'; // TaskFolder の Props 型もインポート
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
  // collapsedFolders: Record<string, boolean>; // ← フォルダ開閉機能廃止のため削除
  // toggleFolderCollapse: (name: string) => void; // ← フォルダ開閉機能廃止のため削除
  toggleTaskDone: (id: string, instanceDate?: string) => void;
  onRefreshTasks: () => void; 
  isReordering: boolean;
  draggingFolder: string | null;
  setDraggingFolder: (name: string | null) => void;
  moveFolderOrder: (folderName: string, direction: 'up' | 'down') => void;
  stopReordering: () => void;
  isSelecting: boolean;
  selectedItems: SelectableItem[];
  onLongPressSelectItem: (type: 'task' | 'folder', id: string) => void;
  noFolderName: string;
  folderOrder: string[];
  t: (key: string, options?: any) => string;
  baseTasksCount: number;
  isRefreshing: boolean;
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
  // collapsedFolders, // ← 削除
  // toggleFolderCollapse, // ← 削除
  toggleTaskDone,
  onRefreshTasks, 
  isReordering,
  draggingFolder,
  setDraggingFolder,
  moveFolderOrder,
  stopReordering,
  isSelecting,
  selectedItems,
  onLongPressSelectItem,
  noFolderName,
  folderOrder,
  t,
  baseTasksCount,
  isRefreshing,
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

    // ScrollView を削除し、直接 View でラップ。paddingTop は View に移動。
    // RefreshControl は各 TaskFolder 内の FlatList に移すか、ページ全体を単一の FlatList/SectionList にする必要があるため、ここでは一旦削除。
    return (
      <View key={`page-${pageFolderName}-${pageIndex}`} style={{ width: windowWidth, flex: 1, paddingTop: 8, paddingBottom: isSelecting ? SELECTION_BAR_HEIGHT + 20 : 100 }}>
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
                    if (!date) return 3; // 期限なしは最後
                    if (date.isBefore(today, 'day')) return 0; // 期限切れは最優先
                    if (date.isSame(today, 'day')) return 1; // 今日が期限
                    return 2; // 未来の期限
                  };
                  const categoryA = getCategory(a);
                  const categoryB = getCategory(b);
                  if (categoryA !== categoryB) return categoryA - categoryB;
                  
                  // 同じカテゴリ内でのソート
                  if (categoryA === 3) return a.title.localeCompare(b.title); // 期限なしはタイトル順
                  
                  const dateAVal = a.displaySortDate!;
                  const dateBVal = b.displaySortDate!;

                  if (dateAVal.isSame(dateBVal, 'day')) { // 同じ日の場合
                      const timeEnabledA = a.deadlineDetails?.isTaskDeadlineTimeEnabled === true && !a.deadlineDetails?.repeatFrequency;
                      const timeEnabledB = b.deadlineDetails?.isTaskDeadlineTimeEnabled === true && !b.deadlineDetails?.repeatFrequency;
                      if (timeEnabledA && !timeEnabledB) return -1; // 時間指定ありが先
                      if (!timeEnabledA && timeEnabledB) return 1; // 時間指定なしが後
                  }
                  return dateAVal.unix() - dateBVal.unix(); // 日付順
                } else if (activeTab === 'completed') { // 完了タブ
                    const dateA = a.displaySortDate || dayjs.utc(0); // displaySortDate (完了日) で降順
                    const dateB = b.displaySortDate || dayjs.utc(0);
                    return dateB.unix() - dateA.unix();
                }

                // カスタムソートと優先度ソートのロジック
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
                    const priorityA = a.priority ?? -1; // 優先度が高い (数値が大きい) 方が先
                    const priorityB = b.priority ?? -1;
                    if (priorityA !== priorityB) return priorityB - priorityA;
                }
                return a.title.localeCompare(b.title); // デフォルトはタイトル順
            });

            // TaskFolder に渡す Props から isCollapsed と toggleFolder を削除
            const taskFolderProps: Omit<TaskFolderProps, 'isCollapsed' | 'toggleFolder' | 'onRefreshTasks'> = { // onRefreshTasks も TaskFolder の Props から削除されていれば
              folderName,
              tasks: sortedFolderTasks,
              // isCollapsed は渡さない
              // toggleFolder は渡さない
              onToggleTaskDone: toggleTaskDone,
              isReordering: isReordering && draggingFolder === folderName && folderName !== noFolderName && pageFolderName === 'all',
              setDraggingFolder,
              draggingFolder,
              moveFolder: moveFolderOrder,
              stopReordering,
              isSelecting,
              selectedIds: selectedItems.map(it => it.id),
              onLongPressSelect: onLongPressSelectItem,
              currentTab: activeTab,
            };
            // @ts-ignore TypeScript が isCollapsed, toggleFolder の不足を検知するかもしれないが、TaskFolder側で削除済みなら問題ない
            return <TaskFolder key={`${pageFolderName}-${folderName}-${pageIndex}`} {...taskFolderProps} />;
          })}
          {tasksForPage.length === 0 && (
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>
                 {activeTab === 'incomplete' ? t('task_list.empty') : t('task_list.no_tasks_completed', '完了したタスクはありません')}
               </Text>
             </View>
           )}
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
      key={folderTabs.map(f => f.name).join('-')} // キーはタブ構成が変わったときに再マウントするため
    >
      {folderTabs.map((folder, index) => renderPageContent(folder.name, index))}
    </PagerView>
  );
};