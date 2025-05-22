// app/features/tasks/components/TaskFolder.tsx
import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createStyles } from '@/features/tasks/styles';
import { useAppTheme } from '@/hooks/ThemeContext';
import { FontSizeContext } from '@/context/FontSizeContext';
import { Task } from '@/features/tasks/types';
import { TaskItem } from '@/features/tasks/components/TaskItem';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

// TasksScreenから渡される displaySortDate を含む型定義
// ★★★ この型定義が重要です: displaySortDate は Dayjs 型または null です ★★★
type DisplayTaskInFolder = Task & { displaySortDate: dayjs.Dayjs | null };

type Props = {
  folderName: string;
  tasks: DisplayTaskInFolder[]; // ★ 型を DisplayTaskInFolder[] に変更
  isCollapsed: boolean;
  toggleFolder: (folderName: string) => void;
  onToggleTaskDone: (id: string, instanceDate?: string) => void;
  onRefreshTasks: () => void;
  isReordering: boolean;
  setDraggingFolder: (folder: string | null) => void;
  draggingFolder: string | null;
  moveFolder: (folderName: string, direction: 'up' | 'down') => void;
  stopReordering: () => void;
  isSelecting: boolean;
  selectedIds: string[];
  onLongPressSelect: (type: 'folder' | 'task', id: string) => void;
};

export function TaskFolder({
  folderName,
  tasks,
  isCollapsed,
  toggleFolder,
  onToggleTaskDone,
  isReordering,
  setDraggingFolder,
  draggingFolder,
  moveFolder,
  stopReordering,
  isSelecting,
  selectedIds,
  onLongPressSelect,
}: Props) {
  const { colorScheme, subColor } = useAppTheme();
  const isDark = colorScheme === 'dark';
  const { fontSizeKey } = useContext(FontSizeContext);
  const { t } = useTranslation();
  const styles = createStyles(isDark, subColor, fontSizeKey);

  const folderLabel = folderName || t('task_list.no_folder');
  const isSelected = selectedIds.includes(folderName);

  const deadlineTasks: DisplayTaskInFolder[] = [];
  const noDeadlineTasks: DisplayTaskInFolder[] = [];

  tasks.forEach((task) => {
    if (task.displaySortDate) { // displaySortDate が null でないことをチェック
      deadlineTasks.push(task);
    } else {
      noDeadlineTasks.push(task);
    }
  });

  const handleFolderPress = () => {
    if (isSelecting) {
      onLongPressSelect('folder', folderName);
    } else {
      toggleFolder(folderName);
    }
  };

  return (
    <View
      style={[
        styles.folderContainer,
        {
          borderWidth: draggingFolder === folderName ? 2 : 0,
          borderColor:
            draggingFolder === folderName
              ? isDark
                ? '#fff'
                : '#000'
              : 'transparent',
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleFolderPress}
        onLongPress={() => onLongPressSelect('folder', folderName)}
        style={styles.folderHeader}
      >
        <View style={styles.folderTitleRow}>
          {isSelecting && (
            <Ionicons
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={subColor}
              style={{ marginRight: 8 }}
            />
          )}
          <Ionicons name="folder-outline" size={24} color={subColor} />
          <Text style={styles.folderTitleText}>{folderLabel}</Text>
        </View>

        {isReordering && (
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => moveFolder(folderName, 'up')}>
              <Ionicons name="arrow-up-outline" size={20} color={subColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => moveFolder(folderName, 'down')}>
              <Ionicons name="arrow-down-outline" size={20} color={subColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={stopReordering}>
              <Ionicons name="checkmark-outline" size={20} color={subColor} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>

      {!isCollapsed && (
        <View>
          {deadlineTasks.map((item) => (
            <TaskItem
              key={item.id + (item.displaySortDate?.valueOf() || '')}
              task={item} // item は DisplayTaskInFolder 型
              onToggle={onToggleTaskDone}
              isSelecting={isSelecting}
              selectedIds={selectedIds}
              onLongPressSelect={(id) => onLongPressSelect('task', id)}
            />
          ))}

          {noDeadlineTasks.length > 0 && (
            <View>
              <Text style={styles.sectionHeader}>
                {t('section.noDeadline')}
              </Text>
              {noDeadlineTasks.map((item) => (
                <TaskItem
                  key={item.id + '-no_deadline'}
                  task={item} // item は DisplayTaskInFolder 型
                  onToggle={onToggleTaskDone}
                  isSelecting={isSelecting}
                  selectedIds={selectedIds}
                  onLongPressSelect={(id) => onLongPressSelect('task', id)}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}