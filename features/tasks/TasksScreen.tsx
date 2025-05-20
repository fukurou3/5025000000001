//C:\Users\fukur\task-app\app\features\tasks\TasksScreen.tsx
import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Animated,
  Alert,
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
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'; // 追加
import { useAppTheme } from '@/hooks/ThemeContext';
import { useSelection } from '@/features/tasks/context'; // context パスを修正
import { useTranslation } from 'react-i18next';
import { FontSizeContext } from '@/context/FontSizeContext';
import { createStyles } from '@/features/tasks/styles';
import { Task, FolderOrder, SelectableItem } from '@/features/tasks/types';
import { TaskFolder } from '@/features/tasks/components/TaskFolder';
import { RenameFolderModal } from '@/features/tasks/components/RenameFolderModal'; // RenameFolderModal パスを修正

dayjs.locale('ja');
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter); // 追加

const STORAGE_KEY = 'TASKS';
const FOLDER_ORDER_KEY = 'FOLDER_ORDER';
const TAB_HEIGHT = 56;

export default function TasksScreen() {
  const router = useRouter();
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
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
  }, [isSelecting, selectionAnim]); // selectionAnim を依存配列に追加

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

  const toggleTaskDone = async (id: string) => {
    const newTasks = tasks.map(task =>
      task.id === id
        ? {
            ...task,
            done: !task.done,
            completedAt: !task.done ? new Date().toISOString() : undefined,
          }
        : task
    );
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
      saveFolderOrder(arr); // saveFolderOrder を呼び出す
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

  const handleSelectAll = () => {
    // 表示されているタスクとフォルダのみを選択対象とする
    const nowForFilter = dayjs();
    const visibleTasks = tasks.filter(t => {
        const isCorrectTab = tab === 'completed' ? t.done : !t.done;
        if (!isCorrectTab) return false;
        if (tab === 'incomplete' && t.deadline) {
            const taskActiveTime = dayjs(t.deadline);
            if (taskActiveTime.isAfter(nowForFilter)) {
                return false;
            }
        }
        return true;
    });

    const taskItems: SelectableItem[] = visibleTasks.map(t => ({ id: t.id, type: 'task' }));
    const folderNames = Array.from(new Set(visibleTasks.map(t => t.folder ?? '')));
    // フォルダは現在表示されているタスクが含まれるフォルダのみを対象にする
    const folderItems: SelectableItem[] = folderNames
                                            .filter(name => sortedFolders.includes(name)) // 画面に表示されているフォルダのみ
                                            .map(f => ({ id: f, type: 'folder' }));
    setAllItems([...taskItems, ...folderItems]);
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      t('common.delete'), // タイトルを "削除" に変更 (翻訳キーがあればそちらを使用)
      t('task_list.delete_confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const updatedTasks = tasks.filter(task => {
              const byTask = selectedItems.some(it => it.type === 'task' && it.id === task.id);
              const byFolder = selectedItems.some(
                it => it.type === 'folder' && (task.folder ?? '') === it.id
              );
              return !byTask && !byFolder;
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
    // setFolderOrder(newFolderOrder); // saveFolderOrder 内で呼ばれる
    await saveTasks(newTasks);
    await saveFolderOrder(newFolderOrder);
    setRenameModalVisible(false);
    setRenameTarget(null); // renameTarget をクリア
    clearSelection();
  };


  const handleReorderFolder = () => {
    if (selectedItems.length === 1 && selectedItems[0].type === 'folder') {
      setIsReordering(true);
      // clearSelection(); // ここでは選択解除しない方が操作性が良いかもしれない
    }
  };

  useEffect(() => {
    loadTasks();
  }, [fontSizeKey, loadTasks]); // loadTasks を依存配列に追加

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  // --- ここからフィルタリングロジックの修正 ---
  const nowForFilter = dayjs();
  const tasksToProcess = tasks.filter(t => {
    const isCorrectTab = tab === 'completed' ? t.done : !t.done;
    if (!isCorrectTab) return false;

    // 未完了タブの場合のみ、開始時刻前のタスクをフィルタリング
    // task.deadline には、繰り返しタスクの場合「最初のインスタンスの開始日時」が、
    // 単発タスクの場合は「期限」または「実行日時」が入っている想定。
    // いずれにしても、この日時が未来であれば、タスクはまだアクティブではない。
    if (tab === 'incomplete' && t.deadline) {
      const taskActiveTime = dayjs(t.deadline);
      if (taskActiveTime.isAfter(nowForFilter)) {
        return false; // 開始時刻/実行日時が未来なら表示しない
      }
    }
    return true;
  });
  // --- フィルタリングロジックの修正ここまで ---


  const allFolders = Array.from(new Set(tasksToProcess.map(t => t.folder ?? ''))); // tasksToProcess を使用

  const sortedFolders = folderOrder.length
    ? folderOrder
        .filter(n => allFolders.includes(n))
        .concat(allFolders.filter(n => !folderOrder.includes(n)))
    : allFolders;

  const fontSizeMap: Record<string, number> = {
    small: 10,
    medium: 12,
    large: 14,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.title}>{t('task_list.title')}</Text>
      </View>

      <View style={styles.topRow}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'incomplete' && styles.tabSelected]}
            onPress={() => { setTab('incomplete'); clearSelection(); }} // タブ変更時に選択解除
          >
            <Text style={[styles.tabText, tab === 'incomplete' && styles.tabSelectedText]}>
              {t('tab.incomplete')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'completed' && styles.tabSelected]}
            onPress={() => { setTab('completed'); clearSelection(); }} // タブ変更時に選択解除
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
          {sortedFolders.map(folder => {
            const folderTasks = tasksToProcess // tasksToProcess を使用
              .filter(t => (t.folder ?? '') === folder)
              .sort((a, b) => {
                if (sortMode === 'deadline') {
                  const aHasDeadline = !!a.deadline;
                  const bHasDeadline = !!b.deadline;

                  if (aHasDeadline && bHasDeadline) {
                    return dayjs(a.deadline).unix() - dayjs(b.deadline).unix();
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
            if (!folderTasks.length) return null; // フィルタリング後にタスクがなければフォルダも表示しない
            return (
              <TaskFolder
                key={folder || 'none'}
                folderName={folder}
                tasks={folderTasks}
                isCollapsed={!!collapsedFolders[folder]}
                toggleFolder={toggleFolder}
                onToggleTaskDone={toggleTaskDone}
                sortMode={sortMode}
                onRefreshTasks={loadTasks}
                isReordering={isReordering && draggingFolder === folder} // 修正: selectedItemsの条件を削除
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
          {tasksToProcess.length === 0 && !loading && ( // tasksToProcess を使用
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>
                 {tab === 'incomplete' ? t('task_list.empty') : t('task_list.no_tasks_completed', '完了したタスクはありません')}
               </Text>
             </View>
           )}
        </ScrollView>
      )}
      {!isSelecting && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('../add')}>
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
            <Text style={[styles.selectionAction, {fontSize: fontSizeMap[fontSizeKey] ?? 12, color: subColor, marginTop: 2}]}>
              {t('common.select_all')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDeleteSelected} style={{ alignItems: 'center' }}>
            <Ionicons name="trash-outline" size={26} color={subColor} />
            <Text style={[styles.selectionAction, {fontSize: fontSizeMap[fontSizeKey] ?? 12, color: subColor, marginTop: 2}]}>
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
            <Text style={[styles.selectionAction, {fontSize: fontSizeMap[fontSizeKey] ?? 12, color: subColor, marginTop: 2}]}>
              {t('common.rename')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!(selectedItems.length === 1 && selectedItems[0].type === 'folder')}
            onPress={handleReorderFolder}
            style={{ alignItems: 'center', opacity: (selectedItems.length === 1 && selectedItems[0].type === 'folder') ? 1 : 0.4 }}
          >
            <Ionicons name="swap-vertical-outline" size={26} color={subColor} />
            <Text style={[styles.selectionAction, {fontSize: fontSizeMap[fontSizeKey] ?? 12, color: subColor, marginTop: 2}]}>
              {t('common.reorder')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={cancelSelecting} style={{ alignItems: 'center' }}>
            <Ionicons name="close-outline" size={26} color={subColor} />
            <Text style={[styles.selectionAction, {fontSize: fontSizeMap[fontSizeKey] ?? 12, color: subColor, marginTop: 2}]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <RenameFolderModal
        visible={renameModalVisible}
        onClose={() => { setRenameModalVisible(false); setRenameTarget(null); }} // renameTarget もクリア
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