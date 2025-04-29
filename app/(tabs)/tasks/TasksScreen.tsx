// /app/(tabs)/tasks/TasksScreen.tsx

import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
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
import { useAppTheme } from '@/hooks/ThemeContext';
import { useSelection } from '../SelectionContext';
import { useTranslation } from 'react-i18next';
import { FontSizeContext } from '@/context/FontSizeContext';
import { fontSizes } from '@/constants/fontSizes';
import { createStyles } from '../../lib/tasks/taskStyles';
import { Task, FolderOrder, SelectableItem } from '../../lib/tasks/taskTypes';
import { TaskFolder } from './TaskFolder';

dayjs.locale('ja');
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrBefore);

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
  const { isSelecting, setIsSelecting } = useSelection();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [folderOrder, setFolderOrder] = useState<FolderOrder>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'incomplete' | 'completed'>('incomplete');
  const [sortMode, setSortMode] = useState<'deadline' | 'custom' | 'priority'>('deadline');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [selectedItems, setSelectedItems] = useState<SelectableItem[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [draggingFolder, setDraggingFolder] = useState<string | null>(null);

  const [selectionAnim] = useState(new Animated.Value(-TAB_HEIGHT));
  useEffect(() => {
    Animated.timing(selectionAnim, {
      toValue: isSelecting ? 0 : -TAB_HEIGHT,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isSelecting]);

  const fontSizeMap: Record<string, number> = {
    small: 10,
    medium: 12,
    large: 14,
  };

  const inactiveColor = isDark ? '#cccccc' : '#000000';

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

  useEffect(() => {
    loadTasks();
  }, [tab, sortMode, fontSizeKey]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const saveTasks = async (newTasks: Task[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
    setTasks(newTasks);
  };

  const saveFolderOrder = async (order: FolderOrder) => {
    await AsyncStorage.setItem(FOLDER_ORDER_KEY, JSON.stringify(order));
    setFolderOrder(order);
  };
  const toggleTaskDone = (id: string) => {
    const updated = tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            done: !task.done,
            completedAt: !task.done ? new Date().toISOString() : undefined,
          }
        : task
    );
    saveTasks(updated);
  };

  const toggleFolder = (name: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const moveFolder = (folderName: string, direction: 'up' | 'down') => {
    setFolderOrder((prev) => {
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
    if (!isSelecting) {
      setIsSelecting(true);
    }
  
    setSelectedItems((prev) => {
      const alreadySelected = prev.some((it) => it.type === type && it.id === id);
  
      if (type === 'folder') {
        const folderTasks = tasks.filter((t) => (t.folder ?? '') === id);
        if (alreadySelected) {
          // フォルダー選択解除 → フォルダー＋中身すべて解除
          return prev.filter(
            (it) =>
              !(it.id === id && it.type === 'folder') &&
              !folderTasks.some((task) => task.id === it.id && it.type === 'task')
          );
        } else {
          // フォルダー選択 → フォルダー＋中身すべて追加
          const folderItems: SelectableItem[] = folderTasks.map((t) => ({
            id: t.id,
            type: 'task',
          }));
          return [...prev, { id, type: 'folder' }, ...folderItems];
        }
      } else {
        if (alreadySelected) {
          return prev.filter((it) => !(it.id === id && it.type === type));
        } else {
          return [...prev, { id, type }];
        }
      }
    });
  };
  

  useEffect(() => {
    if (isSelecting && selectedItems.length === 0) {
      setIsSelecting(false);
    }
  }, [selectedItems, isSelecting, setIsSelecting]);

  const cancelSelecting = () => {
    setSelectedItems([]);
    setIsSelecting(false);
  };

  const handleSelectAll = () => {
    const visible = tasks.filter((t) => (tab === 'completed' ? t.done : !t.done));
    const taskItems = visible.map((t) => ({ id: t.id, type: 'task' } as SelectableItem));
    const folderNames = Array.from(new Set(visible.map((t) => t.folder ?? '')));
    const folderItems = folderNames.map((f) => ({ id: f, type: 'folder' } as SelectableItem));
    setSelectedItems([...taskItems, ...folderItems]);
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      t('common.confirm'),
      t('task_list.confirm_delete_selected'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const updated = tasks.filter((task) => {
              const byTask = selectedItems.some((it) => it.type === 'task' && it.id === task.id);
              const byFolder = selectedItems.some(
                (it) => it.type === 'folder' && (task.folder ?? '') === it.id
              );
              return !byTask && !byFolder;
            });
            await saveTasks(updated);
            cancelSelecting();
          },
        },
      ]
    );
  };

  const filtered = tasks.filter((t) => (tab === 'completed' ? t.done : !t.done));
  const allFolders = Array.from(new Set(filtered.map((t) => t.folder ?? '')));
  const sortedFolders = folderOrder.length
    ? folderOrder
        .filter((n) => allFolders.includes(n))
        .concat(allFolders.filter((n) => !folderOrder.includes(n)))
    : allFolders;
    return (
      <SafeAreaView style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.appBar}>
          <Text style={styles.title}>{t('task_list.title')}</Text>
        </View>
  
        {/* タブ切り替え＋並び替え */}
        <View style={styles.topRow}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tabButton, tab === 'incomplete' && styles.tabSelected]}
              onPress={() => setTab('incomplete')}
            >
              <Text style={[styles.tabText, tab === 'incomplete' && styles.tabSelectedText]}>
                {t('tab.incomplete')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, tab === 'completed' && styles.tabSelected]}
              onPress={() => setTab('completed')}
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
  
        {/* タスクリスト */}
        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }}>
            {sortedFolders.map((folder) => {
              const folderTasks = filtered
                .filter((t) => (t.folder ?? '') === folder)
                .sort((a, b) => {
                  if (sortMode === 'deadline')
                    return dayjs(a.deadline).unix() - dayjs(b.deadline).unix();
                  if (sortMode === 'custom')
                    return (a.customOrder ?? 0) - (b.customOrder ?? 0);
                  return (b.priority ?? 0) - (a.priority ?? 0);
                });
              if (!folderTasks.length) return null;
              return (
                <TaskFolder
                  key={folder || 'none'}
                  folderName={folder}
                  tasks={folderTasks}
                  isCollapsed={collapsedFolders[folder]}
                  toggleFolder={toggleFolder}
                  onToggleTaskDone={toggleTaskDone}
                  sortMode={sortMode}
                  onRefreshTasks={loadTasks}
                  isReordering={isReordering}
                  setDraggingFolder={setDraggingFolder}
                  draggingFolder={draggingFolder}
                  moveFolder={moveFolder}
                  stopReordering={() => {
                    setIsReordering(false);
                    setDraggingFolder(null);
                  }}
                  isSelecting={isSelecting}
                  selectedIds={selectedItems.map((it) => it.id)}
                  onLongPressSelect={onLongPressSelect}
                />
              );
            })}
          </ScrollView>
        )}
  
        {/* FAB */}
        {!isSelecting && (
          <TouchableOpacity style={styles.fab} onPress={() => router.push('/add_edit/add')}>
            <Ionicons name="add" size={32} color="#fff" />
          </TouchableOpacity>
        )}
  
        {/* 選択モードタブバー */}
        {isSelecting && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                right: 0,
                height: TAB_HEIGHT,
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
                backgroundColor: isDark ? '#121212' : '#fff',
                borderTopWidth: 1,
                borderColor: isDark ? '#555' : '#ccc',
                paddingTop: 0,
                paddingBottom: 0,
              },
              { bottom: selectionAnim },
            ]}
          >
            <TouchableOpacity onPress={handleSelectAll} style={{ alignItems: 'center' }}>
              <Ionicons name="checkmark-done-outline" size={26} color={subColor} />
              <Text
                style={{
                  fontSize: fontSizeMap[fontSizeKey] ?? 12,
                  color: subColor,
                  textAlign: 'center',
                  marginTop: 2,
                }}
              >
                {t('common.select_all')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteSelected} style={{ alignItems: 'center' }}>
              <Ionicons name="trash-outline" size={26} color={subColor} />
              <Text
                style={{
                  fontSize: fontSizeMap[fontSizeKey] ?? 12,
                  color: subColor,
                  textAlign: 'center',
                  marginTop: 2,
                }}
              >
                {t('common.delete')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelSelecting} style={{ alignItems: 'center' }}>
              <Ionicons name="close-outline" size={26} color={subColor} />
              <Text
                style={{
                  fontSize: fontSizeMap[fontSizeKey] ?? 12,
                  color: subColor,
                  textAlign: 'center',
                  marginTop: 2,
                }}
              >
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
  
        {/* 並べ替えモーダル */}
        <Modal
          transparent
          visible={sortModalVisible}
          animationType="fade"
          onRequestClose={() => setSortModalVisible(false)}
        >
          <BlurView intensity={80} style={styles.modalBlur}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  onPress={() => {
                    setSortMode('deadline');
                    setSortModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOption}>{t('sort.date')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setSortMode('custom');
                    setSortModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOption}>{t('sort.custom')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setSortMode('priority');
                    setSortModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOption}>{t('sort.priority')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSortModalVisible(false)}
                  style={{ marginTop: 16 }}
                >
                  <Text style={styles.modalOption}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>
      </SafeAreaView>
    );
  }
  