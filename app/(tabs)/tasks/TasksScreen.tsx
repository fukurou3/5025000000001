// app/(tabs)/TasksScreen.tsx

import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '@/hooks/ThemeContext';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { fontSizes } from '@/constants/fontSizes';
import { FontSizeContext } from '@/context/FontSizeContext';
import { createStyles } from '../../lib/tasks/taskStyles';
import { Task } from '../../lib/tasks/taskTypes';
import { getTimeText, getTimeColor } from '../../lib/tasks/taskUtils';

import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/ja';

dayjs.locale('ja');
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrBefore);

const STORAGE_KEY = 'TASKS';

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

  const navigateToAdd = () => router.push('/add_edit/add');

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
      <View style={styles.appBar}>
        <Text style={styles.title}>{t('task_list.title')}</Text>
      </View>

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
          renderItem={({ item, drag, isActive }: RenderItemParams<Task>) => (
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
                  style={[styles.taskTime, { color: getTimeColor(item.deadline, isDark) }]}
                >
                  {getTimeText(item.deadline, t)}
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
                  router.push({ pathname: '/task-detail/task-detail', params: { id: item.id } })
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
                    style={[styles.taskTime, { color: getTimeColor(item.deadline, isDark) }]}
                  >
                    {getTimeText(item.deadline, t)}
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

      <TouchableOpacity style={styles.fab} onPress={navigateToAdd}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

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
