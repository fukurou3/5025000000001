// app/(tabs)/tasks.tsx

import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/ja';
import { fontSizes } from '@/constants/fontSizes';
import { FontSizeContext } from '@/context/FontSizeContext';

dayjs.locale('ja');
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrBefore);

const STORAGE_KEY = 'TASKS';

type Task = {
  id: string;
  title: string;
  memo: string;
  deadline: string;
  imageUris: string[];
  notifyEnabled: boolean;
  customUnit: 'minutes' | 'hours' | 'days';
  customAmount: number;
  done?: boolean;
  completedAt?: string;
};

const createStyles = (
  isDark: boolean,
  subColor: string,
  fsKey: keyof typeof fontSizes
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#ffffff' },
    appBar: { height: 56, justifyContent: 'center', alignItems: 'center' },
    title: {
      fontSize: fontSizes[fsKey] + 6,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      paddingHorizontal: 16,
      zIndex: 2,
    },
    tabs: { flexDirection: 'row' },
    tabButton: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      height: 36,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#aaa',
      marginRight: 8,
      backgroundColor: '#eee',
      justifyContent: 'center',
    },
    tabSelected: { backgroundColor: subColor, borderColor: subColor },
    tabText: {
      fontSize: fontSizes[fsKey],
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
    },
    tabSelectedText: { color: '#fff' },
    sortIconButton: { padding: 6 },
    sortLabel: {
      fontSize: fontSizes[fsKey],
      color: '#666',
      marginLeft: 4,
    },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyText: {
      fontSize: fontSizes[fsKey],
      color: '#aaa',
      fontStyle: 'italic',
      textAlign: 'center',
    },
    sectionHeader: {
      fontSize: fontSizes[fsKey] + 2,
      fontWeight: 'bold',
      color: subColor,
      marginTop: 24,
      marginBottom: 8,
      paddingHorizontal: 16,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e1e1e' : '#f4f4f4',
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      padding: 16,
      elevation: 3,
    },
    checkboxContainer: { marginRight: 12 },
    taskCenter: { flex: 1 },
    taskTitle: {
      fontSize: fontSizes[fsKey] + 2,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    taskMemo: {
      fontSize: fontSizes[fsKey],
      color: isDark ? '#ccc' : '#555',
      marginTop: 2,
    },
    taskRight: { alignItems: 'flex-end', marginLeft: 8 },
    taskTime: {
      fontSize: fontSizes[fsKey] + 2,
      fontWeight: 'bold',
    },
    taskDateText: {
      fontSize: fontSizes[fsKey] - 2,
      color: '#888',
      marginTop: 2,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 30,
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: subColor,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    modalBlur: { ...StyleSheet.absoluteFillObject },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: 12,
      paddingVertical: 24,
      paddingHorizontal: 32,
      alignItems: 'stretch',
      width: '80%',
    },
    modalOption: {
      fontSize: fontSizes[fsKey] + 2,
      marginVertical: 10,
      textAlign: 'center',
    },
    reorderToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    reorderToggleText: {
      marginLeft: 8,
      fontSize: fontSizes[fsKey],
      color: subColor,
    },
    reorderItem: { opacity: 0.8 },
    activeReorderItem: { opacity: 1.0 },
  });

export default function TasksScreen() {
  const router = useRouter();
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const { fontSizeKey } = useContext(FontSizeContext);
  const styles = createStyles(isDark, subColor, fontSizeKey);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'incomplete' | 'completed'>('incomplete');
  const [sortMode, setSortMode] = useState<'deadline' | 'custom' | 'priority'>('deadline');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setTasks(parsed);
    } catch (err) {
      console.error('読み込み失敗:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks, tab, sortMode, fontSizeKey]);

  const saveTasks = async (newTasks: Task[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
    setTasks(newTasks);
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

  const navigateToAdd = () => router.push('/add');

  const getTimeText = (deadline: string) => {
    const now = dayjs();
    const due = dayjs(deadline);
    const diff = due.diff(now, 'minute');
    if (diff < 0) {
      const past = now.diff(due, 'minute');
      if (past < 60) return t('time.minutesAgo', { count: past });
      if (past < 1440) return t('time.hoursAgo', { count: Math.floor(past / 60) });
      return t('time.daysAgo', { count: Math.floor(past / 1440) });
    } else {
      if (diff < 60) return t('time.remainingMinutes', { count: diff });
      if (diff < 1440) return t('time.remainingHours', { count: Math.floor(diff / 60) });
      return t('time.remainingDays', { count: Math.floor(diff / 1440) });
    }
  };

  const getTimeColor = (deadline: string) => {
    const now = dayjs();
    const due = dayjs(deadline);
    if (due.isBefore(now)) return isDark ? '#ff6b6b' : '#d32f2f';
    if (due.isSame(now, 'day')) return isDark ? '#ffd93d' : '#ff9800';
    return isDark ? '#fff' : '#000';
  };

  const filtered = tasks.filter((t) => (tab === 'completed' ? t.done : !t.done));
  const sections =
    sortMode !== 'custom'
      ? [
          {
            title: t('section.expired'),
            data: filtered.filter((t) => dayjs(t.deadline).isBefore(dayjs())),
          },
          {
            title: t('section.today'),
            data: filtered.filter((t) => dayjs(t.deadline).isSame(dayjs(), 'day')),
          },
          {
            title: t('section.tomorrow'),
            data: filtered.filter((t) =>
              dayjs(t.deadline).isSame(dayjs().add(1, 'day'), 'day')
            ),
          },
          {
            title: t('section.week'),
            data: filtered.filter(
              (t) =>
                dayjs(t.deadline).isAfter(dayjs().add(1, 'day')) &&
                dayjs(t.deadline).isBefore(dayjs().add(7, 'day'))
            ),
          },
          {
            title: t('section.later'),
            data: filtered.filter((t) =>
              dayjs(t.deadline).isAfter(dayjs().add(7, 'day'))
            ),
          },
        ].filter((sec) => sec.data.length > 0)
      : [];
  const customData = sortMode === 'custom' ? filtered : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* タイトル */}
      <View style={styles.appBar}>
        <Text style={styles.title}>{t('task_list.title')}</Text>
      </View>

      {/* タブ & 並べ替え */}
      <View style={styles.topRow}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              tab === 'incomplete' && styles.tabSelected,
            ]}
            onPress={() => {
              setTab('incomplete');
              setIsReordering(false);
            }}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'incomplete' && styles.tabSelectedText,
              ]}
            >
              {t('tab.incomplete')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              tab === 'completed' && styles.tabSelected,
            ]}
            onPress={() => {
              setTab('completed');
              setIsReordering(false);
            }}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'completed' && styles.tabSelectedText,
              ]}
            >
              {t('tab.completed')}
            </Text>
          </TouchableOpacity>
        </View>

        {tab !== 'completed' && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.sortLabel}>
              {sortMode === 'deadline'
                ? t('sort.date')
                : sortMode === 'custom'
                ? t('sort.custom')
                : t('sort.priority')}
            </Text>
            <TouchableOpacity
              style={styles.sortIconButton}
              onPress={() => setSortModalVisible(true)}
            >
              <Ionicons
                name="swap-vertical-outline"
                size={24}
                color={subColor}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* カスタム並べ替えモード切替 */}
      {sortMode === 'custom' && tab !== 'completed' && (
        <TouchableOpacity
          style={styles.reorderToggle}
          onPress={() => setIsReordering((prev) => !prev)}
        >
          <Ionicons
            name={
              isReordering
                ? 'checkmark-done-outline'
                : 'swap-vertical-outline'
            }
            size={24}
            color={subColor}
          />
          <Text style={styles.reorderToggleText}>
            {isReordering ? t('common.save') : t('label.sorting')}
          </Text>
        </TouchableOpacity>
      )}

      {/* タスク一覧 */}
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : sortMode === 'custom' && tab !== 'completed' ? (
        <DraggableFlatList
          data={customData}
          keyExtractor={(item) => item.id}
          onDragEnd={({ data }) => {
            saveTasks(data);
            setIsReordering(false);
          }}
          activationDistance={isReordering ? 10 : 1000}
          renderItem={({
            item,
            drag,
            isActive,
          }: RenderItemParams<Task>) => (
            <TouchableOpacity
              onLongPress={isReordering ? drag : undefined}
              disabled={!isReordering}
              style={[
                styles.taskItem,
                isReordering && styles.reorderItem,
                isActive && styles.activeReorderItem,
              ]}
            >
              <TouchableOpacity
                onPress={() => toggleTaskDone(item.id)}
                style={styles.checkboxContainer}
              >
                <Ionicons
                  name={item.done ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={subColor}
                />
              </TouchableOpacity>
              <View style={styles.taskCenter}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.memo && (
                  <Text style={styles.taskMemo} numberOfLines={2}>
                    {item.memo}
                  </Text>
                )}
              </View>
              <View style={styles.taskRight}>
                <Text
                  style={[styles.taskTime, { color: getTimeColor(item.deadline) }]}
                >
                  {getTimeText(item.deadline)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section: { title } }) =>
            title ? <Text style={styles.sectionHeader}>── {title} ──</Text> : null
          }
          renderItem={({ item }) => (
            <View style={styles.taskItem}>
              <TouchableOpacity
                onPress={() => toggleTaskDone(item.id)}
                style={styles.checkboxContainer}
              >
                <Ionicons
                  name={item.done ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={subColor}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.taskCenter}
                onPress={() =>
                  router.push({ pathname: '/task-detail', params: { id: item.id } })
                }
              >
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.memo && (
                  <Text style={styles.taskMemo} numberOfLines={2}>
                    {item.memo}
                  </Text>
                )}
                {tab === 'completed' && (
                  <>
                    <Text style={styles.taskDateText}>
                      {t('label.deadline')}: {dayjs(item.deadline).format('YYYY/MM/DD')}
                    </Text>
                    <Text style={styles.taskDateText}>
                      {t('label.completed')}: {dayjs(item.completedAt).format('YYYY/MM/DD HH:mm')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {tab === 'incomplete' && (
                <View style={styles.taskRight}>
                  <Text
                    style={[styles.taskTime, { color: getTimeColor(item.deadline) }]}
                  >
                    {getTimeText(item.deadline)}
                  </Text>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={{
            paddingTop: tab === 'completed' ? 32 : 20,
            paddingBottom: 120,
          }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={navigateToAdd}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* 並べ替えモーダル */}
      <Modal
        visible={sortModalVisible}
        transparent
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
